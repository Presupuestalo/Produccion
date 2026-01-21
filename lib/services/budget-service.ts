import type { Budget, BudgetLineItem, BudgetWithLineItems } from "@/lib/types/budget"
import { BudgetGenerator } from "./budget-generator"
import type { CalculatorData } from "@/lib/types/calculator"
import type { SupabaseClient } from "@supabase/supabase-js"

export class BudgetService {
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

    // Obtener el siguiente número de versión
    const { data: existingBudgets } = await supabase
      .from("budgets")
      .select("version_number")
      .eq("project_id", projectId)
      .order("version_number", { ascending: false })
      .limit(1)

    const versionNumber = existingBudgets && existingBudgets.length > 0 ? existingBudgets[0].version_number + 1 : 1
    console.log("[v0] Next version number:", versionNumber)

    console.log("[v0] About to insert budget with data:", {
      project_id: projectId,
      user_id: userId,
      version_number: versionNumber,
      subtotal,
      tax_amount: subtotal * 0.21,
      total: subtotal * 1.21,
    })

    // Crear el presupuesto
    console.log("[v0] Inserting budget into database...")
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .insert({
        project_id: projectId,
        user_id: userId,
        version_number: versionNumber,
        name: name || `Presupuesto v${versionNumber}`,
        is_original: true,
        status: "draft",
        subtotal,
        tax_rate: 21.0,
        tax_amount: subtotal * 0.21,
        total: subtotal * 1.21,
      })
      .select()
      .single()

    if (budgetError) {
      console.error("[v0] Error creating budget:", budgetError)
      console.error("[v0] Budget error details:", {
        message: budgetError.message,
        details: budgetError.details,
        hint: budgetError.hint,
        code: budgetError.code,
      })
      throw new Error("Error al crear el presupuesto: " + budgetError.message)
    }

    console.log("[v0] Budget created with ID:", budget.id)

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
      }
    })

    console.log("[v0] Inserting", lineItemsToInsert.length, "line items...")
    if (lineItemsToInsert.length > 0) {
      console.log("[v0] Sample line item to insert:", JSON.stringify(lineItemsToInsert[0], null, 2))
      console.log("[v0] base_price_id validation:", {
        original: lineItems[0].base_price_id,
        cleaned: lineItemsToInsert[0].base_price_id,
        isValid: lineItemsToInsert[0].base_price_id !== null,
      })
    }

    const { error: lineItemsError } = await supabase.from("budget_line_items").insert(lineItemsToInsert)

    if (lineItemsError) {
      console.error("[v0] Error creating line items:", lineItemsError)
      console.error("[v0] Line items error details:", {
        message: lineItemsError.message,
        details: lineItemsError.details,
        hint: lineItemsError.hint,
        code: lineItemsError.code,
      })
      await supabase.from("budgets").delete().eq("id", budget.id)
      throw new Error("Error al crear las partidas del presupuesto: " + lineItemsError.message)
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

    const budgetName = name || `Presupuesto v${versionNumber}`

    // Crear la copia del presupuesto
    const { data: newBudget, error: budgetError } = await supabase
      .from("budgets")
      .insert({
        project_id: originalBudget.project_id,
        user_id: originalBudget.user_id,
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
      code: item.concept_code,
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
      price_type: item.price_type || "master",
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
    updates: Partial<Pick<BudgetLineItem, "quantity" | "unit_price" | "description" | "color" | "brand" | "model">>,
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
      ? `PROP-${lineItemWithoutOwnerFlag.code || "CUSTOM"}-${Date.now()}`
      : lineItemWithoutOwnerFlag.code || `CUSTOM-${Date.now()}`

    const finalCategory = lineItemWithoutOwnerFlag.category || "OTROS"

    console.log("[v0] BudgetService.addCustomLineItem - budgetId:", budgetId)
    console.log("[v0] BudgetService.addCustomLineItem - finalCode:", finalCode)
    console.log("[v0] BudgetService.addCustomLineItem - finalCategory:", finalCategory)
    console.log("[v0] BudgetService.addCustomLineItem - added_by_owner:", added_by_owner)

    const insertData = {
      budget_id: budgetId,
      category: finalCategory,
      concept_code: finalCode, // Changed from 'code' to 'concept_code'
      concept: lineItemWithoutOwnerFlag.concept,
      description: lineItemWithoutOwnerFlag.description || null,
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
        const acceptedData = {
          status,
          accepted_at: new Date().toISOString(),
          accepted_amount_without_vat: budget.subtotal,
          accepted_amount_with_vat: budget.total,
          accepted_vat_rate: budget.tax_rate,
          accepted_vat_amount: budget.tax_amount,
          accepted_includes_vat: true, // Assuming VAT is always included by default
        }

        const { error } = await supabase.from("budgets").update(acceptedData).eq("id", budgetId)

        if (error) {
          console.error("[BudgetService] Error updating budget status with accepted data:", error)
          throw new Error("Error al actualizar el estado del presupuesto")
        }
        return
      }
    }

    const { error } = await supabase.from("budgets").update({ status }).eq("id", budgetId)

    if (error) {
      console.error("[BudgetService] Error updating budget status:", error)
      throw new Error("Error al actualizar el estado del presupuesto")
    }
  }

  /**
   * Elimina un presupuesto y todas sus partidas
   */
  static async deleteBudget(budgetId: string, supabaseClient: SupabaseClient): Promise<void> {
    const supabase = supabaseClient

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
