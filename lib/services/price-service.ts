import { supabase } from "@/lib/supabase/client"
import { getUserCountryFromProfile } from "./currency-service"

export interface PriceCategory {
  id: string
  name: string
  description: string | null
  icon: string | null
  display_order: number
  created_at: string
  updated_at: string
  user_id?: string | null
}

export interface PriceMaster {
  id: string
  code: string
  category_id: string
  subcategory: string | null
  description: string
  long_description: string | null
  unit: string
  labor_cost: number
  material_cost: number
  equipment_cost: number
  other_cost: number
  base_price: number
  margin_percentage: number
  final_price: number
  is_active: boolean
  is_custom: boolean
  is_imported: boolean
  user_id: string | null
  notes: string | null
  color: string | null
  brand: string | null
  model: string | null
  created_at: string
  updated_at: string
}

export interface UserPrice {
  id: string
  user_id: string
  base_price_id: string | null
  code: string
  category_id: string
  subcategory: string | null
  description: string
  long_description: string | null
  unit: string
  labor_cost: number
  material_cost: number
  equipment_cost: number
  other_cost: number
  base_price: number
  margin_percentage: number
  final_price: number
  is_active: boolean
  is_imported: boolean
  notes: string | null
  color: string | null
  brand: string | null
  model: string | null
  created_at: string
  updated_at: string
}

export interface PriceWithCategory extends PriceMaster {
  category: PriceCategory
}

// Obtener todas las categorías
export async function getPriceCategories(): Promise<PriceCategory[]> {
  const { data, error } = await supabase
    .from("price_categories")
    .select("*")
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching price categories:", error)
    throw error
  }

  return data || []
}

export async function createCategory(name: string, description?: string): Promise<PriceCategory> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Usuario no autenticado")

  // Obtener el orden máximo para añadir al final
  const { data: maxOrderData } = await supabase
    .from("price_categories")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (maxOrderData?.display_order || 0) + 1

  const { data, error } = await supabase
    .from("price_categories")
    .insert({
      name,
      description,
      display_order: nextOrder,
      user_id: user.id,
      is_active: true,
      icon: "📦", // Icono por defecto
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating category:", error)
    throw error
  }

  return data
}

export async function updateCategory(id: string, updates: Partial<PriceCategory>): Promise<PriceCategory> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Usuario no autenticado")

  const { data, error } = await supabase
    .from("price_categories")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id) // Asegurar que solo edita las suyas
    .select()
    .single()

  if (error) {
    console.error("Error updating category:", error)
    throw error
  }

  return data
}

export async function deleteCategory(id: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Usuario no autenticado")

  const { error } = await supabase
    .from("price_categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id) // Asegurar que solo borra las suyas

  if (error) {
    console.error("Error deleting category:", error)
    throw error
  }
}

function getUserPriceTableByCountry(countryCode: string): string {
  const countryTables: Record<string, string> = {
    ES: "user_prices", // España
    PE: "user_prices_peru",
    BO: "user_prices_bolivia",
    VE: "user_prices_venezuela",
    MX: "user_prices_mexico",
    CO: "user_prices_colombia",
    AR: "user_prices_argentina",
    CL: "user_prices_chile",
    EC: "user_prices_ecuador",
    GT: "user_prices_guatemala",
    CU: "user_prices_cuba",
    DO: "user_prices_dominicana",
    HN: "user_prices_honduras",
    PY: "user_prices_paraguay",
    NI: "user_prices_nicaragua",
    SV: "user_prices_salvador",
    CR: "user_prices_costarica",
    PA: "user_prices_panama",
    UY: "user_prices_uruguay",
    GQ: "user_prices_guinea",
    US: "user_prices_usa",
    GB: "user_prices",
  }

  return countryTables[countryCode] || "user_prices"
}

function getPriceTableByCountry(countryCode: string): string {
  const countryTables: Record<string, string> = {
    ES: "price_master", // España
    PE: "price_master_peru", // Perú
    BO: "price_master_bolivia", // Bolivia
    VE: "price_master_venezuela", // Venezuela
    MX: "price_master_mexico", // México
    CO: "price_master_colombia", // Colombia
    AR: "price_master_argentina", // Argentina
    CL: "price_master_chile", // Chile
    EC: "price_master_ecuador", // Ecuador
    GT: "price_master_guatemala", // Guatemala
    CU: "price_master_cuba", // Cuba
    DO: "price_master_dominicana", // República Dominicana
    HN: "price_master_honduras", // Honduras
    PY: "price_master_paraguay", // Paraguay
    NI: "price_master_nicaragua", // Nicaragua
    SV: "price_master_salvador", // El Salvador
    CR: "price_master_costarica", // Costa Rica
    PA: "price_master_panama", // Panamá
    UY: "price_master_uruguay", // Uruguay
    GQ: "price_master_guinea", // Guinea Ecuatorial
    US: "price_master_usa", // Estados Unidos
    GB: "price_master", // Reino Unido (usar tabla base por ahora)
  }

  const tableName = countryTables[countryCode] || "price_master"
  console.log("[v0] País:", countryCode, "-> Tabla:", tableName)
  return tableName
}

function mergeMasterAndUserPrices(masterPrices: PriceMaster[], userPrices: UserPrice[]): PriceMaster[] {
  console.log("[v0] Combinando precios maestros y de usuario")
  console.log("[v0] Precios maestros:", masterPrices.length)
  console.log("[v0] Precios de usuario:", userPrices.length)

  const priceMap = new Map<string, PriceMaster>()

  // Primero agregar todos los precios maestros
  masterPrices.forEach((price: PriceMaster) => {
    priceMap.set(price.code, {
      ...price,
      is_custom: false,
      is_imported: false,
    })
  })

  // Luego sobrescribir con precios de usuario (tienen prioridad)
  userPrices.forEach((userPrice: UserPrice) => {
    // Si tiene base_price_id, es una modificación de un precio maestro
    // Usar el código base para reemplazarlo
    const key = userPrice.base_price_id || userPrice.code

    priceMap.set(key, {
      id: userPrice.id,
      code: userPrice.code,
      category_id: userPrice.category_id,
      subcategory: userPrice.subcategory,
      description: userPrice.description,
      long_description: userPrice.long_description,
      unit: userPrice.unit,
      labor_cost: userPrice.labor_cost,
      material_cost: userPrice.material_cost,
      equipment_cost: userPrice.equipment_cost,
      other_cost: userPrice.other_cost,
      base_price: userPrice.base_price,
      margin_percentage: userPrice.margin_percentage,
      final_price: userPrice.final_price,
      is_active: userPrice.is_active,
      is_custom: true,
      is_imported: userPrice.is_imported,
      user_id: userPrice.user_id,
      notes: userPrice.notes,
      color: userPrice.color,
      brand: userPrice.brand,
      model: userPrice.model,
      created_at: userPrice.created_at,
      updated_at: userPrice.updated_at,
    })
  })

  const result = Array.from(priceMap.values())
  console.log("[v0] Precios combinados:", result.length)
  return result
}

export async function getPricesByCategory(categoryId: string): Promise<PriceMaster[]> {
  try {
    console.log("[v0] getPricesByCategory iniciado para categoría:", categoryId)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("[v0] Usuario no autenticado")
      throw new Error("Usuario no autenticado")
    }

    console.log("[v0] Usuario autenticado:", user.id)

    const userCountry = await getUserCountryFromProfile()
    console.log("[v0] País del usuario desde perfil:", userCountry.code)

    const masterTable = getPriceTableByCountry(userCountry.code)
    const userTable = getUserPriceTableByCountry(userCountry.code)

    console.log("[v0] Tabla maestra:", masterTable)
    console.log("[v0] Tabla de usuario:", userTable)

    const { data: masterPrices, error: masterError } = await supabase
      .from(masterTable)
      .select("*")
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .is("user_id", null)
      .order("code", { ascending: true })

    if (masterError) {
      console.error("[v0] Error obteniendo precios maestros:", masterError)
      throw masterError
    }

    const { data: userPrices, error: userError } = await supabase
      .from(userTable)
      .select("*")
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .eq("user_id", user.id)
      .order("code", { ascending: true })

    if (userError) {
      console.error("[v0] Error obteniendo precios de usuario:", userError)
      throw userError
    }

    console.log("[v0] Precios maestros obtenidos:", masterPrices?.length || 0)
    console.log("[v0] Precios de usuario obtenidos:", userPrices?.length || 0)

    const combinedPrices = mergeMasterAndUserPrices(masterPrices || [], userPrices || [])

    return combinedPrices
  } catch (error) {
    console.error("[v0] Error general en getPricesByCategory:", error)
    throw error
  }
}

export async function getAllPricesWithCategories(): Promise<PriceWithCategory[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Usuario no autenticado")
  }

  const userCountry = await getUserCountryFromProfile()
  const masterTable = getPriceTableByCountry(userCountry.code)
  const userTable = getUserPriceTableByCountry(userCountry.code)

  console.log("[v0] Obteniendo todos los precios")

  const { data: masterPrices, error: masterError } = await supabase
    .from(masterTable)
    .select(`
      *,
      category:price_categories(*)
    `)
    .eq("is_active", true)
    .is("user_id", null)
    .order("code", { ascending: true })

  if (masterError) {
    console.error("Error fetching master prices:", masterError)
    throw masterError
  }

  const { data: userPrices, error: userError } = await supabase
    .from(userTable)
    .select(`
      *,
      category:price_categories(*)
    `)
    .eq("is_active", true)
    .eq("user_id", user.id)
    .order("code", { ascending: true })

  if (userError) {
    console.error("Error fetching user prices:", userError)
    throw userError
  }

  return mergeMasterAndUserPrices(masterPrices || [], userPrices || []) as PriceWithCategory[]
}

export async function updatePrice(priceId: string, updates: Partial<PriceMaster>): Promise<PriceMaster> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Usuario no autenticado")
  }

  const userCountry = await getUserCountryFromProfile()
  const masterTable = getPriceTableByCountry(userCountry.code)
  const userTable = getUserPriceTableByCountry(userCountry.code)

  console.log("[v0] Actualizando precio:", priceId)

  const { data: existingUserPrice, error: userCheckError } = await supabase
    .from(userTable)
    .select("*")
    .eq("id", priceId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (userCheckError) {
    console.error("Error checking user price:", userCheckError)
    throw userCheckError
  }

  // Si existe en user_prices, actualizarlo directamente
  if (existingUserPrice) {
    console.log("[v0] Actualizando precio de usuario existente")

    const totalCost =
      (updates.labor_cost ?? existingUserPrice.labor_cost) +
      (updates.material_cost ?? existingUserPrice.material_cost) +
      (updates.equipment_cost ?? existingUserPrice.equipment_cost) +
      (updates.other_cost ?? existingUserPrice.other_cost)

    const basePrice = totalCost
    const marginPercentage = updates.margin_percentage ?? existingUserPrice.margin_percentage
    const finalPrice = basePrice * (1 + marginPercentage / 100)

    const { data, error } = await supabase
      .from(userTable)
      .update({
        description: updates.description ?? existingUserPrice.description,
        long_description: updates.long_description ?? existingUserPrice.long_description,
        labor_cost: updates.labor_cost ?? existingUserPrice.labor_cost,
        material_cost: updates.material_cost ?? existingUserPrice.material_cost,
        equipment_cost: updates.equipment_cost ?? existingUserPrice.equipment_cost,
        other_cost: updates.other_cost ?? existingUserPrice.other_cost,
        base_price: basePrice,
        margin_percentage: marginPercentage,
        final_price: finalPrice,
        notes: updates.notes ?? existingUserPrice.notes,
        color: updates.color ?? existingUserPrice.color,
        brand: updates.brand ?? existingUserPrice.brand,
        model: updates.model ?? existingUserPrice.model,
        is_imported: updates.is_imported ?? existingUserPrice.is_imported,
      })
      .eq("id", priceId)
      .select()
      .single()

    if (error) {
      console.error("Error updating user price:", error)
      throw error
    }

    return data as PriceMaster
  }

  // Crear una copia en user_prices
  console.log("[v0] Precio maestro detectado, creando copia personalizada")

  const { data: masterPrice, error: masterError } = await supabase
    .from(masterTable)
    .select("*")
    .eq("id", priceId)
    .single()

  if (masterError) {
    console.error("Error fetching master price:", masterError)
    throw masterError
  }

  const totalCost =
    (updates.labor_cost ?? masterPrice.labor_cost) +
    (updates.material_cost ?? masterPrice.material_cost) +
    (updates.equipment_cost ?? masterPrice.equipment_cost) +
    (updates.other_cost ?? masterPrice.other_cost)

  const basePrice = totalCost
  const marginPercentage = updates.margin_percentage ?? masterPrice.margin_percentage
  const finalPrice = basePrice * (1 + marginPercentage / 100)

  const { data: newUserPrice, error: createError } = await supabase
    .from(userTable)
    .insert({
      user_id: user.id,
      base_price_id: masterPrice.code,
      code: masterPrice.code,
      category_id: masterPrice.category_id,
      subcategory: masterPrice.subcategory,
      description: updates.description ?? masterPrice.description,
      long_description: updates.long_description ?? masterPrice.long_description,
      unit: masterPrice.unit,
      labor_cost: updates.labor_cost ?? masterPrice.labor_cost,
      material_cost: updates.material_cost ?? masterPrice.material_cost,
      equipment_cost: updates.equipment_cost ?? masterPrice.equipment_cost,
      other_cost: updates.other_cost ?? masterPrice.other_cost,
      base_price: basePrice,
      margin_percentage: marginPercentage,
      final_price: finalPrice,
      is_active: true,
      is_imported: updates.is_imported ?? false,
      notes: updates.notes ?? masterPrice.notes,
      color: updates.color ?? masterPrice.color,
      brand: updates.brand ?? masterPrice.brand,
      model: updates.model ?? masterPrice.model,
    })
    .select()
    .single()

  if (createError) {
    console.error("Error creating user price:", createError)
    throw createError
  }

  console.log("[v0] Precio personalizado creado exitosamente")
  return newUserPrice as PriceMaster
}

export async function createCustomPrice(
  price: Omit<
    PriceMaster,
    "id" | "created_at" | "updated_at" | "base_price" | "final_price" | "created_by" | "updated_by" | "user_id"
  >,
): Promise<PriceMaster> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Usuario no autenticado")
  }

  const userCountry = await getUserCountryFromProfile()
  const userTable = getUserPriceTableByCountry(userCountry.code)

  const totalCost = price.labor_cost + price.material_cost + price.equipment_cost + price.other_cost
  const basePrice = totalCost
  const finalPrice = basePrice * (1 + price.margin_percentage / 100)

  const customCode = `CUSTOM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  const { data, error } = await supabase
    .from(userTable)
    .insert({
      user_id: user.id,
      base_price_id: null,
      code: customCode,
      category_id: price.category_id,
      subcategory: price.subcategory,
      description: price.description,
      long_description: price.long_description,
      unit: price.unit,
      labor_cost: price.labor_cost,
      material_cost: price.material_cost,
      equipment_cost: price.equipment_cost,
      other_cost: price.other_cost,
      base_price: basePrice,
      margin_percentage: price.margin_percentage,
      final_price: finalPrice,
      is_active: true,
      is_custom: true,
      is_imported: price.is_imported || false,
      notes: price.notes,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating custom price:", error)
    throw error
  }

  return data as PriceMaster
}

export async function deleteCustomPrice(priceId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Usuario no autenticado")
  }

  const userCountry = await getUserCountryFromProfile()
  const userTable = getUserPriceTableByCountry(userCountry.code)

  const { error } = await supabase.from(userTable).delete().eq("id", priceId).eq("user_id", user.id)

  if (error) {
    console.error("Error deleting custom price:", error)
    throw error
  }
}

export async function searchPrices(query: string): Promise<PriceWithCategory[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Usuario no autenticado")
  }

  const userCountry = await getUserCountryFromProfile()
  const masterTable = getPriceTableByCountry(userCountry.code)
  const userTable = getUserPriceTableByCountry(userCountry.code)

  const searchTerm = `%${query.trim()}%`

  console.log("[v0] Buscando precios en BD con término:", searchTerm, "Query original:", query)

  // Buscar en precios master con filtro en BD
  const { data: masterPrices, error: masterError } = await supabase
    .from(masterTable)
    .select(`
      *,
      category:price_categories(*)
    `)
    .eq("is_active", true)
    .is("user_id", null)
    .or(`description.ilike.${searchTerm},subcategory.ilike.${searchTerm},code.ilike.${searchTerm}`)
    .order("code", { ascending: true })
    .limit(500)

  if (masterError) {
    console.error("Error searching master prices:", masterError)
    throw masterError
  }

  console.log(
    "[v0] Precios master encontrados:",
    masterPrices?.length,
    masterPrices?.map((p: PriceMaster) => ({ code: p.code, sub: p.subcategory, desc: p.description })),
  )

  // Buscar en precios de usuario con filtro en BD
  const { data: userPrices, error: userError } = await supabase
    .from(userTable)
    .select(`
      *,
      category:price_categories(*)
    `)
    .eq("is_active", true)
    .eq("user_id", user.id)
    .or(`description.ilike.${searchTerm},subcategory.ilike.${searchTerm},code.ilike.${searchTerm}`)
    .order("code", { ascending: true })
    .limit(500)

  if (userError) {
    console.error("Error searching user prices:", userError)
    throw userError
  }

  console.log(
    "[v0] Precios de usuario encontrados:",
    userPrices?.length,
    userPrices?.map((p: UserPrice) => ({ code: p.code, sub: p.subcategory, desc: p.description })),
  )

  const allPrices = mergeMasterAndUserPrices(masterPrices || [], userPrices || [])

  console.log("[v0] Total resultados combinados:", allPrices.length)

  return allPrices as PriceWithCategory[]
}

export async function increaseAllPrices(percentage: number): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Usuario no autenticado")
  }

  const userCountry = await getUserCountryFromProfile()
  const masterTable = getPriceTableByCountry(userCountry.code)
  const userTable = getUserPriceTableByCountry(userCountry.code)

  console.log("[v0] AUMENTADOR GLOBAL: Iniciando aumento del", percentage, "%")
  console.log("[v0] AUMENTADOR GLOBAL: Usuario:", user.id)
  console.log("[v0] AUMENTADOR GLOBAL: País:", userCountry.code)
  console.log("[v0] AUMENTADOR GLOBAL: Tabla maestra:", masterTable)
  console.log("[v0] AUMENTADOR GLOBAL: Tabla usuario:", userTable)

  // Get all master prices
  const { data: masterPrices, error: masterError } = await supabase
    .from(masterTable)
    .select("*")
    .eq("is_active", true)
    .is("user_id", null)

  if (masterError) {
    console.error("[v0] AUMENTADOR GLOBAL: Error obteniendo precios maestros:", masterError)
    throw masterError
  }

  console.log("[v0] AUMENTADOR GLOBAL: Precios maestros encontrados:", masterPrices?.length || 0)

  // Get existing user prices
  const { data: existingUserPrices, error: userError } = await supabase
    .from(userTable)
    .select("*")
    .eq("is_active", true)
    .eq("user_id", user.id)

  if (userError) {
    console.error("[v0] AUMENTADOR GLOBAL: Error obteniendo precios de usuario:", userError)
    throw userError
  }

  console.log("[v0] AUMENTADOR GLOBAL: Precios de usuario existentes:", existingUserPrices?.length || 0)

  const multiplier = 1 + percentage / 100
  const userPriceMap = new Map(existingUserPrices?.map((p: any) => [p.base_price_id || p.code, p]) || [])

  const validMasterPrices = (masterPrices || []).filter((mp: PriceMaster) => {
    if (!mp.category_id) {
      console.warn("[v0] AUMENTADOR GLOBAL: Saltando precio sin category_id:", mp.code)
      return false
    }
    return !userPriceMap.has(mp.code)
  })

  // Prices to create (master prices that don't have user copies)
  const pricesToCreate = validMasterPrices.map((mp: PriceMaster) => ({
    user_id: user.id,
    base_price_id: mp.code,
    code: mp.code,
    category_id: mp.category_id,
    subcategory: mp.subcategory,
    description: mp.description,
    long_description: mp.long_description,
    unit: mp.unit,
    labor_cost: mp.labor_cost,
    material_cost: mp.material_cost,
    equipment_cost: mp.equipment_cost,
    other_cost: mp.other_cost,
    base_price: mp.base_price,
    margin_percentage: mp.margin_percentage,
    final_price: mp.final_price * multiplier,
    is_active: true,
    is_imported: false,
    notes: mp.notes,
    color: mp.color,
    brand: mp.brand,
    model: mp.model,
  }))

  // Prices to update (existing user prices)
  const pricesToUpdate = (existingUserPrices || []).map((p: any) => ({
    id: p.id,
    final_price: p.final_price * multiplier,
  }))

  console.log("[v0] AUMENTADOR GLOBAL: Precios maestros a copiar:", pricesToCreate.length)
  console.log("[v0] AUMENTADOR GLOBAL: Precios de usuario a actualizar:", pricesToUpdate.length)

  let createdCount = 0
  let updatedCount = 0

  // Create new user prices in batches
  const createBatchSize = 100
  for (let i = 0; i < pricesToCreate.length; i += createBatchSize) {
    const batch = pricesToCreate.slice(i, i + createBatchSize)
    console.log(
      "[v0] AUMENTADOR GLOBAL: Insertando batch",
      Math.floor(i / createBatchSize) + 1,
      "de",
      Math.ceil(pricesToCreate.length / createBatchSize),
    )

    const { error } = await supabase.from(userTable).insert(batch)

    if (error) {
      console.error("[v0] AUMENTADOR GLOBAL: Error creando batch de precios:", error.message)
      throw error
    }

    createdCount += batch.length
    console.log("[v0] AUMENTADOR GLOBAL: Creados hasta ahora:", createdCount)
  }

  // Update existing user prices in batches
  const updateBatchSize = 100
  for (let i = 0; i < pricesToUpdate.length; i += updateBatchSize) {
    const batch = pricesToUpdate.slice(i, i + updateBatchSize)
    console.log(
      "[v0] AUMENTADOR GLOBAL: Actualizando batch",
      Math.floor(i / updateBatchSize) + 1,
      "de",
      Math.ceil(pricesToUpdate.length / updateBatchSize),
    )

    const results = await Promise.all(
      batch.map((price: any) => supabase.from(userTable).update({ final_price: price.final_price }).eq("id", price.id)),
    )

    const errors = results.filter((r) => r.error)
    if (errors.length > 0) {
      console.error("[v0] AUMENTADOR GLOBAL: Errores actualizando precios:", errors)
    }

    updatedCount += batch.length
    console.log("[v0] AUMENTADOR GLOBAL: Actualizados hasta ahora:", updatedCount)
  }

  const totalAffected = createdCount + updatedCount
  console.log("[v0] AUMENTADOR GLOBAL: ✅ Completado!")
  console.log("[v0] AUMENTADOR GLOBAL: Total creados:", createdCount)
  console.log("[v0] AUMENTADOR GLOBAL: Total actualizados:", updatedCount)
  console.log("[v0] AUMENTADOR GLOBAL: Total afectados:", totalAffected)

  return totalAffected
}

export async function increasePricesByCategory(categoryId: string, percentage: number): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Usuario no autenticado")
  }

  const userCountry = await getUserCountryFromProfile()
  const masterTable = getPriceTableByCountry(userCountry.code)
  const userTable = getUserPriceTableByCountry(userCountry.code)

  console.log("[v0] Aumentando precios de categoría", categoryId, "en", percentage, "%")

  // Get all master prices for this category
  const { data: masterPrices, error: masterError } = await supabase
    .from(masterTable)
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .is("user_id", null)

  if (masterError) {
    console.error("Error fetching master prices:", masterError)
    throw masterError
  }

  // Get existing user prices for this category
  const { data: existingUserPrices, error: userError } = await supabase
    .from(userTable)
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .eq("user_id", user.id)

  if (userError) {
    console.error("Error fetching user prices:", userError)
    throw userError
  }

  const multiplier = 1 + percentage / 100
  const userPriceMap = new Map(existingUserPrices?.map((p: any) => [p.base_price_id || p.code, p]) || [])

  // Prices to create (master prices that don't have user copies)
  const pricesToCreate = (masterPrices || [])
    .filter((mp: PriceMaster) => !userPriceMap.has(mp.code))
    .map((mp: PriceMaster) => ({
      user_id: user.id,
      base_price_id: mp.code,
      code: mp.code,
      category_id: mp.category_id,
      subcategory: mp.subcategory,
      description: mp.description,
      long_description: mp.long_description,
      unit: mp.unit,
      labor_cost: mp.labor_cost,
      material_cost: mp.material_cost,
      equipment_cost: mp.equipment_cost,
      other_cost: mp.other_cost,
      base_price: mp.base_price,
      margin_percentage: mp.margin_percentage,
      final_price: mp.final_price * multiplier,
      is_active: true,
      is_imported: false,
      notes: mp.notes,
      color: mp.color,
      brand: mp.brand,
      model: mp.model,
    }))

  // Prices to update (existing user prices)
  const pricesToUpdate = (existingUserPrices || []).map((p: any) => ({
    id: p.id,
    final_price: p.final_price * multiplier,
  }))

  console.log("[v0] Creando", pricesToCreate.length, "copias de precios maestros")
  console.log("[v0] Actualizando", pricesToUpdate.length, "precios de usuario existentes")

  // Create new user prices in batches
  const createBatchSize = 50
  for (let i = 0; i < pricesToCreate.length; i += createBatchSize) {
    const batch = pricesToCreate.slice(i, i + createBatchSize)
    const { error } = await supabase.from(userTable).insert(batch)
    if (error) {
      console.error("Error creating user prices batch:", error)
      throw error
    }
  }

  // Update existing user prices in batches
  const updateBatchSize = 50
  for (let i = 0; i < pricesToUpdate.length; i += updateBatchSize) {
    const batch = pricesToUpdate.slice(i, i + updateBatchSize)
    await Promise.all(
      batch.map((price: any) => supabase.from(userTable).update({ final_price: price.final_price }).eq("id", price.id)),
    )
  }

  const totalAffected = pricesToCreate.length + pricesToUpdate.length
  console.log("[v0] Total de precios afectados:", totalAffected)
  return totalAffected
}

export async function increasePriceById(priceId: string, percentage: number): Promise<PriceMaster> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Usuario no autenticado")
  }

  const userCountry = await getUserCountryFromProfile()
  const masterTable = getPriceTableByCountry(userCountry.code)
  const userTable = getUserPriceTableByCountry(userCountry.code)

  console.log("[v0] Aumentando precio", priceId, "en", percentage, "%")

  // Check if it's a user price first
  const { data: userPrice, error: userCheckError } = await supabase
    .from(userTable)
    .select("*")
    .eq("id", priceId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (userCheckError) {
    console.error("Error checking user price:", userCheckError)
    throw userCheckError
  }

  const multiplier = 1 + percentage / 100

  // If it's already a user price, just update it
  if (userPrice) {
    console.log("[v0] Actualizando precio de usuario existente")
    const newFinalPrice = userPrice.final_price * multiplier

    const { data, error } = await supabase
      .from(userTable)
      .update({ final_price: newFinalPrice })
      .eq("id", priceId)
      .select()
      .single()

    if (error) {
      console.error("Error updating user price:", error)
      throw error
    }

    return data as PriceMaster
  }

  // It's a master price, create a copy with the increase applied
  console.log("[v0] Precio maestro detectado, creando copia personalizada con aumento")

  const { data: masterPrice, error: masterError } = await supabase
    .from(masterTable)
    .select("*")
    .eq("id", priceId)
    .single()

  if (masterError) {
    console.error("Error fetching master price:", masterError)
    throw masterError
  }

  const newFinalPrice = masterPrice.final_price * multiplier

  const { data: newUserPrice, error: createError } = await supabase
    .from(userTable)
    .insert({
      user_id: user.id,
      base_price_id: masterPrice.code,
      code: masterPrice.code,
      category_id: masterPrice.category_id,
      subcategory: masterPrice.subcategory,
      description: masterPrice.description,
      long_description: masterPrice.long_description,
      unit: masterPrice.unit,
      labor_cost: masterPrice.labor_cost,
      material_cost: masterPrice.material_cost,
      equipment_cost: masterPrice.equipment_cost,
      other_cost: masterPrice.other_cost,
      base_price: masterPrice.base_price,
      margin_percentage: masterPrice.margin_percentage,
      final_price: newFinalPrice,
      is_active: true,
      is_custom: true,
      is_imported: false,
      notes: masterPrice.notes,
      color: masterPrice.color,
      brand: masterPrice.brand,
      model: masterPrice.model,
    })
    .select()
    .single()

  if (createError) {
    console.error("Error creating user price:", createError)
    throw createError
  }

  console.log("[v0] Precio personalizado creado exitosamente con aumento aplicado")
  return newUserPrice as PriceMaster
}

export async function copyMasterPricesToUser(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc("copy_master_prices_to_user", {
    target_user_id: userId,
  })

  if (error) {
    console.error("Error copying master prices:", error)
    throw error
  }

  return data || 0
}

export async function getPricesByCountry(priceId: string, countryCode?: string): Promise<number> {
  try {
    const country = countryCode || (await getUserCountryFromProfile()).code

    const { data, error } = await supabase
      .from("price_master_by_country")
      .select("price")
      .eq("price_master_id", priceId)
      .eq("country_code", country)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error obteniendo precio por país:", error)
      return 0
    }

    return data?.price || 0
  } catch (error) {
    console.error("[v0] Error en getPricesByCountry:", error)
    return 0
  }
}

export async function getPricesByCategoryWithCountry(categoryId: string): Promise<PriceMaster[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Usuario no autenticado")
  }

  const userCountry = await getUserCountryFromProfile()
  console.log("[v0] País del usuario:", userCountry.code)

  const masterTable = getPriceTableByCountry(userCountry.code)
  const userTable = getUserPriceTableByCountry(userCountry.code)

  const { data: masterPrices, error: masterError } = await supabase
    .from(masterTable)
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .is("user_id", null)
    .order("code", { ascending: true })

  if (masterError) {
    console.error("Error fetching master prices:", masterError)
    throw masterError
  }

  const { data: userPrices, error: userError } = await supabase
    .from(userTable)
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .eq("user_id", user.id)
    .order("code", { ascending: true })

  if (userError) {
    console.error("Error fetching user prices:", userError)
    throw userError
  }

  const combinedPrices = mergeMasterAndUserPrices(masterPrices || [], userPrices || [])

  const pricesWithCountryPrices = await Promise.all(
    combinedPrices.map(async (price) => {
      const countryPrice = await getPricesByCountry(price.id, userCountry.code)
      return {
        ...price,
        final_price: countryPrice > 0 ? countryPrice : price.final_price,
      }
    }),
  )

  return pricesWithCountryPrices
}
