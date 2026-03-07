import type { Budget, BudgetLineItem, BudgetWithLineItems } from "@/lib/types/budget"
import { BudgetGenerator } from "./budget-generator"
import type { CalculatorData } from "@/lib/types/calculator"
import type { SupabaseClient } from "@supabase/supabase-js"

export class BudgetService {
  /**
   * Sincroniza el presupuesto V2 en tiempo real con los datos de la calculadora
   */
  static async syncRealtimeBudget(
    projectId: string,
    userId: string,
    calculatorData: CalculatorData,
    supabaseClient: SupabaseClient
  ): Promise<BudgetWithLineItems | null> {
    const supabase = supabaseClient

    let budgetId: string
    let userIdToUse: string = userId

    // 1. Buscar budgets existentes
    const { data, error: fetchError } = await supabase
      .from("budgets")
      .select("*")
      .eq("project_id", projectId)
      .order("version_number", { ascending: false })

    if (fetchError) throw new Error("Error fetching existing budgets: " + fetchError.message)
    const existingBudgets: Budget[] = data || []

    // Sincronización unificada: Buscamos el borrador más reciente del proyecto
    const targetBudget = existingBudgets.find((b: Budget) => b.status === "draft")

    if (!targetBudget) {
      // No hay borrador activo — no crear uno automáticamente.
      // La creación de nuevos presupuestos es responsabilidad del usuario.
      console.log("[v0] syncRealtimeBudget: No draft budget found, skipping auto-sync.")
      return null
    }

    console.log(`[v0] Syncing with latest draft budget: ${targetBudget.name} (v${targetBudget.version_number})`)
    budgetId = targetBudget.id
    userIdToUse = targetBudget.user_id


    // 2. Generar nuevas partidas desde la calculadora
    console.log("[v0] Syncing V2 budget, generating new items...")
    const generator = new BudgetGenerator(calculatorData, supabase)
    const generatedItems = await generator.generate()

    // 3. Obtener partidas personalizadas existentes para preservarlas
    const { data: existingItems } = await supabase
      .from("budget_line_items")
      .select("*")
      .eq("budget_id", budgetId)

    const customItems = existingItems?.filter(item => item.is_custom) || []

    // 4. Limpiar partidas NO personalizadas
    console.log(`[v0] Deleting unlocked non-custom items for budget ${budgetId}...`)
    const { data: itemsBeforeDelete } = await supabase.from("budget_line_items").select("id").eq("budget_id", budgetId).eq("is_custom", false).neq("is_locked", true)
    console.log(`[v0] Found ${itemsBeforeDelete?.length || 0} unlocked non-custom items before deletion`)

    const { error: deleteError } = await supabase
      .from("budget_line_items")
      .delete()
      .eq("budget_id", budgetId)
      .eq("is_custom", false)
      .neq("is_locked", true)

    if (deleteError) {
      console.error("[v0] Error cleaning V2 budget items:", deleteError)
      throw new Error("Error cleaning V2 budget items: " + deleteError.message)
    }
    console.log("[v0] Unlocked non-custom items deleted successfully")

    // Recuperar items bloqueados para evitar generarlos de nuevo
    const { data: lockedItemsData } = await supabase
      .from("budget_line_items")
      .select("concept_code")
      .eq("budget_id", budgetId)
      .eq("is_locked", true)

    const lockedConceptCodes = new Set(lockedItemsData?.filter(item => item.concept_code).map(item => item.concept_code))
    console.log(`[v0] Found ${lockedConceptCodes.size} locked items to preserve`)

    // 5. Insertar nuevas partidas generadas, filtrando las que ya están bloqueadas
    console.log(`[v0] Processing ${generatedItems.length} new generated items...`)
    const lineItemsToInsert = generatedItems
      .filter(item => !item.code || !lockedConceptCodes.has(item.code))
      .map((item) => {
        const isValidUUID =
          item.base_price_id &&
          typeof item.base_price_id === "string" &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.base_price_id)

        return {
          budget_id: budgetId,
          category: item.category,
          concept_code: item.code,
          concept: item.concept,
          description: item.description,
          color: item.color,
          brand: item.brand,
          model: item.model,
          unit: item.unit,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          is_custom: false,
          sort_order: item.sort_order,
          base_price_id: isValidUUID ? item.base_price_id : null,
          price_type: item.price_type || "master",
          notes: item.notes,
          waste_percentage: item.waste_percentage,
        }
      })

    if (lineItemsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("budget_line_items").insert(lineItemsToInsert)
      if (insertError) {
        console.error("[v0] Error inserting V2 line items:", insertError)
        throw new Error("Error inserting V2 line items: " + insertError.message)
      }
      console.log(`[v0] Successfully inserted ${lineItemsToInsert.length} items`)
    } else {
      console.log("[v0] No items to insert")
    }

    // 6. Recalcular totales (Generated + Custom + Locked)
    // Recuperar TODAS las partidas actuales del presupuesto para el cálculo total
    const { data: allCurrentItems } = await supabase
      .from("budget_line_items")
      .select("total_price")
      .eq("budget_id", budgetId)

    // Ya están insertados, así que `allCurrentItems` contiene TANTO los manuales/bloqueados COMO los recién generados
    const totalSubtotal = allCurrentItems?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0
    console.log(`[v0] Final totals for budget ${budgetId}: subtotal=${totalSubtotal}`)

    // Obtener configuración de IVA
    const { data: settings } = await supabase
      .from("budget_settings")
      .select("show_vat, vat_percentage")
      .eq("project_id", projectId)
      .maybeSingle()

    const showVat = settings?.show_vat ?? false
    const vatRate = showVat ? (settings?.vat_percentage ?? 21.0) : 0
    const taxAmount = totalSubtotal * (vatRate / 100)
    const total = totalSubtotal + taxAmount

    // 7. Actualizar presupuesto
    await supabase.from("budgets").update({
      subtotal: totalSubtotal,
      tax_rate: vatRate,
      tax_amount: taxAmount,
      total: total,
    }).eq("id", budgetId)

    return this.getBudgetById(budgetId, supabaseClient)
  }

  /**
   * Crea un nuevo presupuesto desde los datos de la calculadora
   */
  static async createBudgetFromCalculator(
    projectId: string,
    userId: string,
    calculatorData: CalculatorData,
    supabaseClient: SupabaseClient,
    name?: string,
  ): Promise<BudgetWithLineItems> {
    console.log("[v0] BudgetService.createBudgetFromCalculator called with:", { projectId, userId })
    console.log("[v0] Calculator data:", JSON.stringify(calculatorData, null, 2))

    const supabase = supabaseClient

    console.log("[v0] Creating BudgetGenerator...")
    const generator = new BudgetGenerator(calculatorData, supabase)

    console.log("[v0] Generating line items...")
    const lineItems = await generator.generate()

    console.log("[v0] Generated", lineItems.length, "line items")
    if (lineItems.length === 0) {
      console.error("[v0] ERROR: No line items were generated!")
      console.error("[v0] Calculator data that failed:", JSON.stringify(calculatorData, null, 2))
      throw new Error(
        "No se pudieron generar partidas del presupuesto. Verifica que hayas añadido datos en la calculadora.",
      )
    }

    if (lineItems.length > 0) {
      console.log("[v0] Sample line items (first 3):")
      lineItems.slice(0, 3).forEach((item, idx) => {
        console.log(`[v0]   ${idx + 1}.`, JSON.stringify(item, null, 2))
      })
    }

    // Calcular subtotal
    const subtotal = lineItems.reduce((sum, item) => sum + item.total_price, 0)
    console.log("[v0] Calculated subtotal:", subtotal)

    if (subtotal === 0) {
      console.warn("[v0] WARNING: Subtotal is 0. This means either no items were generated or all items have 0 price.")
      console.warn("[v0] Line items count:", lineItems.length)
      if (lineItems.length > 0) {
        console.warn("[v0] First generated item:", JSON.stringify(lineItems[0], null, 2))
      }
    }

    // Validaciones iniciales
    if (!projectId) throw new Error("PROJECT_ID_MISSING: No se puede crear un presupuesto sin un ID de proyecto.")
    if (!userId) throw new Error("USER_ID_MISSING: No se puede crear un presupuesto sin un ID de usuario.")

    let attempts = 0
    let budget: BudgetWithLineItems | null = null

    while (attempts < 3) {
      attempts++

      // 1. Obtener datos necesarios
      // Obtener presupuestos existentes para calcular el número de versión
      const { data: existingBudgets, error: fetchError } = await supabase
        .from("budgets")
        .select("version_number")
        .eq("project_id", projectId)
        .order("version_number", { ascending: false })

      if (fetchError) {
        console.error("[v0] Error fetching budgets for versioning:", fetchError)
        throw new Error("Error al consultar versiones anteriores: " + fetchError.message)
      }

      const versionNumber = existingBudgets && existingBudgets.length > 0 ? Number(existingBudgets[0].version_number) + 1 : 1
      console.log(`[v0] Create budget attempt ${attempts}, version number:`, versionNumber)

      // Obtener configuración de IVA del proyecto
      const { data: settings } = await supabase
        .from("budget_settings")
        .select("show_vat, vat_percentage")
        .eq("project_id", projectId)
        .maybeSingle()

      const showVat = settings?.show_vat ?? false
      const vatRate = showVat ? (settings?.vat_percentage ?? 21.0) : 0

      // Sanitización de subtotal (evitar NaN)
      const sanitizedSubtotal = isNaN(subtotal) ? 0 : subtotal
      const taxAmount = sanitizedSubtotal * (vatRate / 100)
      const sanitizedTaxAmount = isNaN(taxAmount) ? 0 : taxAmount
      const total = sanitizedSubtotal + sanitizedTaxAmount
      const sanitizedTotal = isNaN(total) ? 0 : total

      // Obtener el título del proyecto
      const { data: project } = await supabase
        .from("projects")
        .select("title")
        .eq("id", projectId)
        .single()
      const projectTitle = project?.title || "Presupuesto"

      console.log("[v0] Inserting budget with sanitized data:", {
        version: versionNumber,
        subtotal: sanitizedSubtotal,
        total: sanitizedTotal
      })

      // 2. Intentar inserción
      const { data: newBudget, error: budgetError } = await supabase
        .from("budgets")
        .insert({
          project_id: projectId,
          user_id: userId,
          version_number: versionNumber,
          name: name || `${projectTitle} v${versionNumber}`,
          is_original: !existingBudgets || existingBudgets.length === 0,
          status: "draft",
          subtotal: sanitizedSubtotal,
          tax_rate: vatRate,
          tax_amount: sanitizedTaxAmount,
          total: sanitizedTotal,
        })
        .select()
        .single()

      if (!budgetError) {
        budget = newBudget as BudgetWithLineItems
        console.log("[v0] Budget created successfully with ID:", budget.id)
        break
      }

      // 3. Manejar errores de colisión (Race Condition)
      const isUniqueViolation = budgetError.code === "23505" ||
        budgetError.message?.toLowerCase().includes("unique constraint") ||
        budgetError.message?.toLowerCase().includes("already exists")

      if (isUniqueViolation && attempts < 3) {
        console.warn(`[v0] Race condition in createBudgetFromCalculator (v${versionNumber}). Retrying in 500ms...`)
        await new Promise(resolve => setTimeout(resolve, 500))
        continue
      }

      // Si no es un error de unicidad o ya agotamos intentos, lanzamos error detallado
      console.error("[v0] CRITICAL: Error creating budget in creation flow:", {
        code: budgetError.code,
        message: budgetError.message,
        details: budgetError.details,
        hint: budgetError.hint,
        attempt: attempts
      })
      throw new Error(`Error al crear el presupuesto: ${budgetError.message || "Error desconocido"}`)
    }

    if (!budget) {
      throw new Error("No se pudo crear el presupuesto después de varios intentos.")
    }

    const lineItemsToInsert = lineItems.map((item) => {
      // Only include base_price_id if it's a valid UUID format
      const isValidUUID =
        item.base_price_id &&
        typeof item.base_price_id === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.base_price_id)

      return {
        budget_id: budget.id,
        category: item.category,
        concept_code: item.code,
        concept: item.concept,
        description: item.description,
        color: item.color,
        brand: item.brand,
        model: item.model,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        is_custom: item.is_custom,
        sort_order: item.sort_order,
        base_price_id: isValidUUID ? item.base_price_id : null,
        price_type: item.price_type || "master",
        notes: item.notes,
        waste_percentage: item.waste_percentage,
      }
    })

    console.log("[v0] Inserting", lineItemsToInsert.length, "line items...")
    if (lineItemsToInsert.length > 0) {
      console.log("[v0] Sample line item to insert:", JSON.stringify(lineItemsToInsert[0], null, 2))
      console.log("[v0] All line items keys:", Object.keys(lineItemsToInsert[0]))
      console.log("[v0] First item concept_code:", lineItemsToInsert[0].concept_code)
      // Log all items for debugging
      lineItemsToInsert.forEach((item, idx) => {
        const issues: string[] = []
        if (item.quantity === undefined || item.quantity === null || isNaN(item.quantity)) issues.push("invalid quantity")
        if (item.unit_price === undefined || item.unit_price === null || isNaN(item.unit_price)) issues.push("invalid unit_price")
        if (item.total_price === undefined || item.total_price === null || isNaN(item.total_price)) issues.push("invalid total_price")
        if (!item.category) issues.push("missing category")
        if (!item.concept) issues.push("missing concept")
        if (!item.unit) issues.push("missing unit")
        if (issues.length > 0) {
          console.error(`[v0] LINE ITEM ${idx} HAS ISSUES:`, issues.join(", "), JSON.stringify(item))
        }
      })
    }

    // Try inserting in batches to isolate failures
    let lineItemsError: any = null
    const BATCH_SIZE = 20
    for (let i = 0; i < lineItemsToInsert.length; i += BATCH_SIZE) {
      const batch = lineItemsToInsert.slice(i, i + BATCH_SIZE)
      console.log(`[v0] Inserting batch ${Math.floor(i / BATCH_SIZE) + 1} (items ${i}-${i + batch.length - 1})...`)
      const { error: batchError } = await supabase.from("budget_line_items").insert(batch)
      if (batchError) {
        console.error(`[v0] Error in batch ${Math.floor(i / BATCH_SIZE) + 1}:`, JSON.stringify(batchError))
        console.error("[v0] Failed batch items:", JSON.stringify(batch, null, 2))
        console.error("[v0] Error message:", batchError.message)
        console.error("[v0] Error code:", batchError.code)
        console.error("[v0] Error details:", batchError.details)
        console.error("[v0] Error hint:", batchError.hint)
        lineItemsError = batchError
        break
      }
    }

    if (lineItemsError) {
      console.error("[v0] Error creating line items (stringified):", JSON.stringify(lineItemsError))
      await supabase.from("budgets").delete().eq("id", budget.id)
      throw new Error("Error al crear las partidas del presupuesto: " + (lineItemsError.message || JSON.stringify(lineItemsError)))
    }

    console.log("[v0] Line items inserted successfully")

    const { data: verifyLineItems, error: verifyError } = await supabase
      .from("budget_line_items")
      .select("id")
      .eq("budget_id", budget.id)

    if (verifyError) {
      console.error("[v0] Error verifying line items:", verifyError)
    } else {
      console.log("[v0] Verified", verifyLineItems?.length || 0, "line items in database")
    }

    // Obtener el presupuesto completo con sus partidas
    return this.getBudgetById(budget.id, supabaseClient)
  }

  /**
   * Obtiene un presupuesto por ID con todas sus partidas
   */
  static async getBudgetById(budgetId: string, supabaseClient: SupabaseClient): Promise<BudgetWithLineItems> {
    const supabase = supabaseClient

    const { data: budget, error: budgetError } = await supabase.from("budgets").select("*").eq("id", budgetId).single()

    if (budgetError || !budget) {
      throw new Error("Presupuesto no encontrado")
    }

    const { data: lineItems, error: lineItemsError } = await supabase
      .from("budget_line_items")
      .select("*")
      .eq("budget_id", budgetId)
      .order("sort_order", { ascending: true })

    if (lineItemsError) {
      throw new Error("Error al obtener las partidas del presupuesto")
    }

    return {
      ...budget,
      line_items: lineItems || [],
    }
  }

  /**
   * Obtiene todos los presupuestos de un proyecto
   */
  static async getBudgetsByProject(projectId: string, supabaseClient: SupabaseClient): Promise<Budget[]> {
    const supabase = supabaseClient

    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("project_id", projectId)
      .order("version_number", { ascending: false })

    if (error) {
      console.error("[BudgetService] Error fetching budgets:", error)
      throw new Error("Error al obtener los presupuestos")
    }

    return data || []
  }

  /**
   * Crea una copia de un presupuesto (nueva versión editable)
   */
  static async createBudgetCopy(
    budgetId: string,
    supabaseClient: SupabaseClient,
    name?: string,
  ): Promise<BudgetWithLineItems> {
    const supabase = supabaseClient

    // Obtener el presupuesto original
    const originalBudget = await this.getBudgetById(budgetId, supabaseClient)

    // Obtener el siguiente número de versión
    const { data: existingBudgets } = await supabase
      .from("budgets")
      .select("version_number")
      .eq("project_id", originalBudget.project_id)
      .order("version_number", { ascending: false })
      .limit(1)

    const versionNumber = existingBudgets && existingBudgets.length > 0 ? existingBudgets[0].version_number + 1 : 1

    const { data: project } = await supabase
      .from("projects")
      .select("title")
      .eq("id", originalBudget.project_id)
      .single()
    const projectTitle = project?.title || "Presupuesto"

    const budgetName = name || `${projectTitle} v${versionNumber}`

    // Obtener el usuario actual para asignarle la propiedad de la copia
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("No hay usuario autenticado")
    }

    // Crear la copia del presupuesto
    const { data: newBudget, error: budgetError } = await supabase
      .from("budgets")
      .insert({
        project_id: originalBudget.project_id,
        user_id: user.id, // Asignar al usuario actual, no al original
        version_number: versionNumber,
        name: budgetName,
        description: originalBudget.description,
        is_original: false,
        parent_budget_id: budgetId,
        status: "draft",
        subtotal: originalBudget.subtotal,
        tax_rate: originalBudget.tax_rate,
        tax_amount: originalBudget.tax_amount,
        total: originalBudget.total,
        notes: originalBudget.notes,
        custom_introduction_text: originalBudget.custom_introduction_text,
        custom_additional_notes: originalBudget.custom_additional_notes,
      })
      .select()
      .single()

    if (budgetError) {
      console.error("[BudgetService] Error creating budget copy:", budgetError)
      throw new Error("Error al crear la copia del presupuesto")
    }

    const lineItemsToInsert = originalBudget.line_items.map((item) => ({
      budget_id: newBudget.id,
      category: item.category,
      concept_code: item.concept_code,
      concept: item.concept,
      description: item.description,
      color: item.color,
      brand: item.brand,
      model: item.model,
      unit: item.unit,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      is_custom: item.is_custom,
      base_price_id: item.base_price_id,
      price_type: item.price_type || "master",
      is_locked: item.is_locked,
      sort_order: item.sort_order,
    }))

    const { error: lineItemsError } = await supabase.from("budget_line_items").insert(lineItemsToInsert)

    if (lineItemsError) {
      console.error("[BudgetService] Error copying line items:", lineItemsError)
      throw new Error("Error al copiar las partidas del presupuesto")
    }

    return this.getBudgetById(newBudget.id, supabaseClient)
  }

  /**
   * Actualiza una partida del presupuesto
   */
  static async updateLineItem(
    lineItemId: string,
    updates: Partial<Pick<BudgetLineItem, "quantity" | "unit_price" | "description" | "color" | "brand" | "model" | "is_locked">>,
    supabaseClient: SupabaseClient,
  ): Promise<void> {
    const supabase = supabaseClient

    console.log("[v0] BudgetService.updateLineItem called:", { lineItemId, updates })

    if (!supabase) {
      console.error("[v0] BudgetService.updateLineItem - Supabase client is null!")
      throw new Error("Supabase no está disponible. Por favor, recarga la página.")
    }

    // Si se actualiza cantidad o precio unitario, recalcular total
    if (updates.quantity !== undefined || updates.unit_price !== undefined) {
      const { data: currentItem, error: fetchError } = await supabase
        .from("budget_line_items")
        .select("quantity, unit_price")
        .eq("id", lineItemId)
        .single()

      console.log("[v0] Current item:", currentItem, "Fetch error:", fetchError)

      if (currentItem) {
        const newQuantity = updates.quantity ?? currentItem.quantity
        const newUnitPrice = updates.unit_price ?? currentItem.unit_price
        updates = {
          ...updates,
          total_price: newQuantity * newUnitPrice,
        } as any
      }
    }

    // Automaticamente bloquear la partida si se edita manualmante (a no ser que pasen is_locked: false explícitamente)
    if (updates.is_locked === undefined) {
      updates.is_locked = true
    }

    console.log("[v0] Final updates to apply:", updates)

    const { error } = await supabase.from("budget_line_items").update(updates).eq("id", lineItemId)

    if (error) {
      console.error("[v0] Supabase error updating line item:", error)
      throw new Error("Error al actualizar la partida")
    }

    console.log("[v0] Line item updated successfully in database")
  }

  /**
   * Añade una partida personalizada al presupuesto
   */
  static async addCustomLineItem(
    budgetId: string,
    lineItem: Omit<BudgetLineItem, "id" | "budget_id" | "created_at" | "updated_at"> & { added_by_owner?: boolean },
    supabaseClient: SupabaseClient,
  ): Promise<void> {
    const supabase = supabaseClient

    const { added_by_owner, ...lineItemWithoutOwnerFlag } = lineItem

    const finalCode = added_by_owner
      ? `PROP-${lineItemWithoutOwnerFlag.concept_code || "CUSTOM"}-${Date.now()}`
      : lineItemWithoutOwnerFlag.concept_code || `CUSTOM-${Date.now()}`

    const finalCategory = lineItemWithoutOwnerFlag.category || "OTROS"

    console.log("[v0] BudgetService.addCustomLineItem - budgetId:", budgetId)
    console.log("[v0] BudgetService.addCustomLineItem - finalCode:", finalCode)
    console.log("[v0] BudgetService.addCustomLineItem - finalCategory:", finalCategory)
    console.log("[v0] BudgetService.addCustomLineItem - added_by_owner:", added_by_owner)

    const insertData = {
      budget_id: budgetId,
      category: finalCategory,
      concept_code: finalCode,
      concept: lineItemWithoutOwnerFlag.concept.toUpperCase(),
      description: lineItemWithoutOwnerFlag.description
        ? lineItemWithoutOwnerFlag.description.charAt(0).toUpperCase() + lineItemWithoutOwnerFlag.description.slice(1)
        : null,
      unit: lineItemWithoutOwnerFlag.unit,
      quantity: lineItemWithoutOwnerFlag.quantity,
      unit_price: added_by_owner ? 0 : lineItemWithoutOwnerFlag.unit_price,
      total_price: added_by_owner ? 0 : lineItemWithoutOwnerFlag.total_price,
      is_custom: true,
      price_type: "custom",

      sort_order: lineItemWithoutOwnerFlag.sort_order || 999,
    }

    console.log("[v0] BudgetService.addCustomLineItem - insertData:", insertData)

    const { error } = await supabase.from("budget_line_items").insert(insertData)

    if (error) {
      console.error("[BudgetService] Error adding custom line item:", error)
      throw new Error("Error al añadir la partida personalizada: " + error.message)
    }

    console.log("[v0] BudgetService.addCustomLineItem - SUCCESS")
  }

  /**
   * Elimina una partida del presupuesto
   */
  static async deleteLineItem(lineItemId: string, supabaseClient: SupabaseClient): Promise<void> {
    const supabase = supabaseClient

    console.log("[v0] BudgetService.deleteLineItem called:", lineItemId)

    if (!supabase) {
      console.error("[v0] BudgetService.deleteLineItem - Supabase client is null!")
      throw new Error("Supabase no está disponible. Por favor, recarga la página.")
    }

    const { error } = await supabase.from("budget_line_items").delete().eq("id", lineItemId)

    if (error) {
      console.error("[v0] Supabase error deleting line item:", error)
      throw new Error("Error al eliminar la partida")
    }

    console.log("[v0] Line item deleted successfully from database")
  }

  /**
   * Actualiza el estado del presupuesto
   */
  static async updateBudgetStatus(
    budgetId: string,
    status: "draft" | "sent" | "approved" | "rejected",
    supabaseClient: SupabaseClient,
  ): Promise<void> {
    const supabase = supabaseClient

    if (status === "approved") {
      // Get the current budget to save accepted amounts
      const { data: budget } = await supabase.from("budgets").select("*").eq("id", budgetId).single()

      if (budget) {
        // Get budget settings to check if VAT should be included
        const { data: settings } = await supabase
          .from("budget_settings")
          .select("show_vat")
          .eq("project_id", budget.project_id)
          .maybeSingle()

        const acceptedData = {
          status,
          accepted_at: new Date().toISOString(),
          accepted_amount_without_vat: budget.subtotal,
          accepted_amount_with_vat: budget.total,
          accepted_vat_rate: budget.tax_rate,
          accepted_vat_amount: budget.tax_amount,
          accepted_includes_vat: settings?.show_vat ?? budget.tax_rate > 0,
        }

        const { error } = await supabase.from("budgets").update(acceptedData).eq("id", budgetId)

        if (error) {
          console.error("[BudgetService] Error updating budget status with accepted data:", JSON.stringify(error, null, 2))
          console.error("[BudgetService] Error details:", error.message, error.hint, error.details)
          throw new Error("Error al actualizar el estado del presupuesto: " + (error.message || ""))
        }

        // Sincronizar estado del PROYECTO
        await supabase.from("projects").update({
          status: "Aceptado",
          progress: 50
        }).eq("id", budget.project_id)

        return
      }
    }

    const { error } = await supabase.from("budgets").update({ status }).eq("id", budgetId)

    if (error) {
      console.error("[BudgetService] Error updating budget status:", error)
      throw new Error("Error al actualizar el estado del presupuesto")
    }

    // Opcional: Sincronizar otros estados al proyecto
    if (status === "sent") {
      const { data: budget } = await supabase.from("budgets").select("project_id").eq("id", budgetId).single()
      if (budget) {
        await supabase.from("projects").update({
          status: "Entregado",
          progress: 25
        }).eq("id", budget.project_id)
      }
    }
  }

  /**
   * Elimina un presupuesto y todas sus partidas
   */
  static async deleteBudget(budgetId: string, supabaseClient: SupabaseClient): Promise<void> {
    const supabase = supabaseClient

    // Obtener project_id del presupuesto a eliminar
    const { data: budgetToDel } = await supabase.from("budgets").select("project_id").eq("id", budgetId).single()
    const projectId = budgetToDel?.project_id

    // Verificar si hay solicitudes activas en el marketplace
    const { data: activeLeads, error: leadCheckError } = await supabase
      .from("lead_requests")
      .select("id")
      .eq("budget_id", budgetId)
      .in("status", ["open", "active"])
      .limit(1)

    if (activeLeads && activeLeads.length > 0) {
      throw new Error(
        "No puedes eliminar este presupuesto porque tiene una solicitud activa en el marketplace. " +
        "Debes cancelar la solicitud primero.",
      )
    }

    // Primero eliminar todas las partidas del presupuesto
    const { error: lineItemsError } = await supabase.from("budget_line_items").delete().eq("budget_id", budgetId)

    if (lineItemsError) {
      console.error("[BudgetService] Error deleting line items:", lineItemsError)
      throw new Error("Error al eliminar las partidas del presupuesto")
    }

    // Luego eliminar el presupuesto
    const { error: budgetError } = await supabase.from("budgets").delete().eq("id", budgetId)

    if (budgetError) {
      console.error("[BudgetService] Error deleting budget:", budgetError)
      throw new Error("Error al eliminar el presupuesto")
    }

    // Si tenemos el projectId, comprobamos si quedan presupuestos
    if (projectId) {
      const { count, error: countErr } = await supabase
        .from("budgets")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId)

      if (!countErr && count === 0) {
        // Resetear estado del proyecto
        await supabase.from("projects").update({
          status: "Borrador",
          progress: 0
        }).eq("id", projectId)
      }
    }
  }

  /**
   * Elimina todos los presupuestos de un proyecto y todas sus partidas
   */
  static async deleteAllBudgets(projectId: string, supabaseClient: SupabaseClient): Promise<void> {
    const supabase = supabaseClient

    // Obtener todos los IDs de presupuestos del proyecto
    const { data: budgets, error: fetchError } = await supabase.from("budgets").select("id").eq("project_id", projectId)

    if (fetchError) {
      console.error("[BudgetService] Error fetching budgets:", fetchError)
      throw new Error("Error al obtener los presupuestos")
    }

    if (!budgets || budgets.length === 0) {
      return
    }

    const budgetIds = budgets.map((b) => b.id)

    // Verificar si alguno tiene solicitudes activas
    const { data: activeLeads, error: leadCheckError } = await supabase
      .from("lead_requests")
      .select("id")
      .in("budget_id", budgetIds)
      .in("status", ["open", "active"])
      .limit(1)

    if (activeLeads && activeLeads.length > 0) {
      throw new Error(
        "No puedes eliminar los presupuestos de este proyecto porque al menos uno tiene una solicitud activa en el marketplace.",
      )
    }

    // Eliminar todas las partidas de todos los presupuestos
    const { error: lineItemsError } = await supabase.from("budget_line_items").delete().in("budget_id", budgetIds)

    if (lineItemsError) {
      console.error("[BudgetService] Error deleting line items:", lineItemsError)
      throw new Error("Error al eliminar las partidas de los presupuestos")
    }

    // Eliminar todos los presupuestos
    const { error: budgetsError } = await supabase.from("budgets").delete().eq("project_id", projectId)

    if (budgetsError) {
      console.error("[BudgetService] Error deleting budgets:", budgetsError)
      throw new Error("Error al eliminar los presupuestos")
    }

    // Resetear estado del proyecto
    await supabase.from("projects").update({
      status: "Borrador",
      progress: 0
    }).eq("id", projectId)
  }

  /**
   * Obtiene todos los ajustes de un presupuesto
   */
  static async getBudgetAdjustments(budgetId: string, supabaseClient: SupabaseClient): Promise<any[]> {
    const supabase = supabaseClient

    const { data, error } = await supabase
      .from("budget_adjustments")
      .select("*")
      .eq("budget_id", budgetId)
      .order("adjustment_date", { ascending: true })

    if (error) {
      console.error("[BudgetService] Error fetching budget adjustments:", error)
      throw new Error("Error al obtener los ajustes del presupuesto")
    }

    return data || []
  }

  /**
   * Añade un ajuste al presupuesto
   */
  static async addBudgetAdjustment(
    adjustment: {
      budget_id: string
      type: "addition" | "subtraction"
      category: string
      concept_code?: string
      concept: string
      description?: string
      unit: string
      quantity: number
      unit_price: number
      adjustment_date: string
      notes?: string
    },
    supabaseClient: SupabaseClient,
  ): Promise<any> {
    const supabase = supabaseClient

    const total_price = adjustment.quantity * adjustment.unit_price

    const { data, error } = await supabase
      .from("budget_adjustments")
      .insert({
        ...adjustment,
        total_price,
      })
      .select()
      .single()

    if (error) {
      console.error("[BudgetService] Error adding budget adjustment:", error)
      throw new Error("Error al añadir el ajuste al presupuesto")
    }

    return data
  }

  /**
   * Actualiza un ajuste del presupuesto
   */
  static async updateBudgetAdjustment(
    adjustmentId: string,
    updates: {
      quantity?: number
      unit_price?: number
      description?: string
      adjustment_date?: string
      notes?: string
    },
    supabaseClient: SupabaseClient,
  ): Promise<void> {
    const supabase = supabaseClient

    // Si se actualiza cantidad o precio, recalcular total
    if (updates.quantity !== undefined || updates.unit_price !== undefined) {
      const { data: currentAdjustment } = await supabase
        .from("budget_adjustments")
        .select("quantity, unit_price")
        .eq("id", adjustmentId)
        .single()

      if (currentAdjustment) {
        const newQuantity = updates.quantity ?? currentAdjustment.quantity
        const newUnitPrice = updates.unit_price ?? currentAdjustment.unit_price
        updates = {
          ...updates,
          total_price: newQuantity * newUnitPrice,
        } as any
      }
    }

    const { error } = await supabase.from("budget_adjustments").update(updates).eq("id", adjustmentId)

    if (error) {
      console.error("[BudgetService] Error updating budget adjustment:", error)
      throw new Error("Error al actualizar el ajuste")
    }
  }

  /**
   * Elimina un ajuste del presupuesto
   */
  static async deleteBudgetAdjustment(adjustmentId: string, supabaseClient: SupabaseClient): Promise<void> {
    const supabase = supabaseClient

    const { error } = await supabase.from("budget_adjustments").delete().eq("id", adjustmentId)

    if (error) {
      console.error("[BudgetService] Error deleting budget adjustment:", error)
    }
  }
}
