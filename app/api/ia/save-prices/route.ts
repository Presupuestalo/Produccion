export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function getUserPriceTableByCountry(countryCode: string): string {
  const countryTables: Record<string, string> = {
    ES: "user_prices",
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

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting price save...")

    let prices
    try {
      const body = await request.json()
      prices = body.prices
    } catch (parseError) {
      console.error("[v0] Error parsing request body:", parseError)
      return NextResponse.json({ error: "Cuerpo de solicitud invÃ¡lido" }, { status: 400 })
    }

    if (!prices || !Array.isArray(prices) || prices.length === 0) {
      console.error("[v0] No prices provided or invalid format")
      return NextResponse.json({ error: "No se proporcionaron precios para importar" }, { status: 400 })
    }

    console.log("[v0] Received", prices.length, "prices to save")

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("[v0] No authenticated user")
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", user.id)

    const { data: profile } = await supabase.from("profiles").select("country").eq("id", user.id).single()

    const userCountry = profile?.country || "ES"
    const userTable = getUserPriceTableByCountry(userCountry)

    console.log("[v0] PaÃ­s del usuario:", userCountry)
    console.log("[v0] Tabla de destino:", userTable)
    console.log("[v0] Fetching categories...")

    const { data: categories, error: categoriesError } = await supabase.from("price_categories").select("id, name")

    if (categoriesError) {
      console.error("[v0] Error fetching categories:", categoriesError)
      return NextResponse.json({ error: "Error al obtener categorÃ­as: " + categoriesError.message }, { status: 500 })
    }

    if (!categories || categories.length === 0) {
      console.error("[v0] No categories found in database")
      return NextResponse.json({ error: "No se encontraron categorÃ­as en la base de datos" }, { status: 500 })
    }

    console.log("[v0] Found", categories.length, "categories")

    const categoryMap = new Map(categories.map((c) => [c.name.toUpperCase(), c.id]))

    console.log("[v0] Preparing prices for insertion...")

    const pricesToInsert = prices.map((price: any, index: number) => {
      const laborCost = Number(price.labor_cost) || 0
      const materialCost = Number(price.material_cost) || 0
      const equipmentCost = Number(price.equipment_cost) || 0
      const otherCost = Number(price.other_cost) || 0

      const basePrice = laborCost + materialCost + equipmentCost + otherCost
      const finalPrice = Number(price.final_price) || basePrice

      // Generate unique code for imported prices
      const code = price.code || `IMP-${Date.now()}-${String(index).padStart(3, "0")}`

      const categoryId = categoryMap.get(price.category?.toUpperCase()) || categories[0].id

      return {
        user_id: user.id,
        base_price_id: null, // No base price for imported prices
        code,
        category_id: categoryId,
        subcategory: price.subcategory || "General",
        description: price.description || "Sin descripciÃ³n",
        long_description: null,
        unit: price.unit || "ud",
        labor_cost: laborCost,
        material_cost: materialCost,
        equipment_cost: equipmentCost,
        other_cost: otherCost,
        base_price: basePrice,
        margin_percentage: 0,
        final_price: finalPrice,
        is_active: true,
        is_imported: true, // Mark as imported
        notes: price.notes || null,
        color: null,
        brand: null,
        model: null,
      }
    })

    console.log("[v0] Prepared", pricesToInsert.length, "prices for", userTable)
    console.log("[v0] First prepared price:", JSON.stringify(pricesToInsert[0], null, 2))
    console.log("[v0] Inserting into", userTable, "...")

    const { data: insertedPrices, error: insertError } = await supabase.from(userTable).insert(pricesToInsert).select()

    if (insertError) {
      console.error("[v0] Supabase insert error:", JSON.stringify(insertError, null, 2))
      console.error("[v0] Error code:", insertError.code)
      console.error("[v0] Error message:", insertError.message)
      console.error("[v0] Error details:", insertError.details)
      console.error("[v0] Error hint:", insertError.hint)
      return NextResponse.json(
        {
          error: `Error de base de datos: ${insertError.message}${insertError.hint ? ` - ${insertError.hint}` : ""}`,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Successfully saved", insertedPrices?.length || 0, "imported prices")

    return NextResponse.json({
      success: true,
      importedCount: insertedPrices?.length || 0,
    })
  } catch (error) {
    console.error("[v0] Unexpected error in save-prices:", error)
    if (error instanceof Error) {
      console.error("[v0] Error name:", error.name)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error stack:", error.stack)
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error inesperado al guardar precios" },
      { status: 500 },
    )
  }
}

