export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateText } from "ai"
import { extractText } from "unpdf"

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
    console.log("[v0] Starting price import...")

    const { pdfUrl } = await request.json()

    if (!pdfUrl) {
      return NextResponse.json({ error: "URL del PDF no proporcionada" }, { status: 400 })
    }

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
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("country").eq("id", user.id).single()

    const userCountry = profile?.country || "ES"
    const userTable = getUserPriceTableByCountry(userCountry)

    console.log("[v0] PaÃ­s del usuario:", userCountry)
    console.log("[v0] Tabla de destino:", userTable)
    console.log("[v0] Downloading PDF from:", pdfUrl)

    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error("Error al descargar el PDF")
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log("[v0] Extracting text from PDF...")

    const { text } = await extractText(buffer, { mergePages: true })

    console.log("[v0] Extracted text length:", text.length)

    console.log("[v0] Analyzing prices with AI...")

    const { text: aiResponse } = await generateText({
      model: "openai/gpt-4o",
      prompt: `Analiza este presupuesto de reformas y extrae TODOS los precios en formato JSON.

Devuelve un array JSON con esta estructura exacta:
[
  {
    "code": "cÃ³digo si existe o null",
    "category": "DERRIBOS|ALBAÃ‘ILERÃA|FONTANERÃA|CARPINTERÃA|ELECTRICIDAD|CALEFACCIÃ“N|PINTURA|LIMPIEZA|MATERIALES",
    "subcategory": "CONCEPTO EN MAYÃšSCULAS",
    "description": "DescripciÃ³n detallada",
    "unit": "mÂ²|ml|ud|etc",
    "labor_cost": nÃºmero,
    "material_cost": nÃºmero,
    "equipment_cost": nÃºmero,
    "other_cost": nÃºmero,
    "final_price": nÃºmero
  }
]

Si no hay desglose de costes, estima:
- 60% materiales
- 40% mano de obra

IMPORTANTE: Responde SOLO con el array JSON, sin texto adicional.

PRESUPUESTO:
${text.slice(0, 15000)}`,
    })

    console.log("[v0] AI Response received, parsing...")

    let prices
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error("No se encontrÃ³ JSON en la respuesta")
      }
      prices = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error("[v0] Error parsing AI response:", parseError)
      console.error("[v0] AI Response:", aiResponse.slice(0, 500))
      throw new Error("Error al parsear la respuesta de la IA")
    }

    console.log("[v0] Extracted", prices.length, "prices")

    const { data: categories } = await supabase.from("price_categories").select("id, name")

    const categoryMap = new Map(categories?.map((c) => [c.name.toUpperCase(), c.id]) || [])

    const pricesToInsert = prices.map((price: any) => {
      const totalCost =
        (price.labor_cost || 0) + (price.material_cost || 0) + (price.equipment_cost || 0) + (price.other_cost || 0)
      const basePrice = totalCost
      const finalPrice = price.final_price || totalCost

      return {
        user_id: user.id,
        base_price_id: null,
        code: price.code || `IMPORT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        category_id: categoryMap.get(price.category.toUpperCase()) || null,
        subcategory: price.subcategory,
        description: price.description,
        unit: price.unit,
        labor_cost: price.labor_cost || 0,
        material_cost: price.material_cost || 0,
        equipment_cost: price.equipment_cost || 0,
        other_cost: price.other_cost || 0,
        base_price: basePrice,
        margin_percentage: 0,
        final_price: finalPrice,
        is_active: true,
        is_imported: true,
      }
    })

    console.log("[v0] Insertando en tabla:", userTable)

    const { data: insertedPrices, error: insertError } = await supabase.from(userTable).insert(pricesToInsert).select()

    if (insertError) {
      console.error("[v0] Error inserting prices:", insertError)
      throw new Error("Error al guardar los precios en la base de datos")
    }

    console.log("[v0] Successfully imported", insertedPrices.length, "prices")

    return NextResponse.json({
      success: true,
      importedCount: insertedPrices.length,
      prices: prices.map((p: any) => ({
        subcategory: p.subcategory,
        description: p.description,
        final_price: p.final_price,
      })),
    })
  } catch (error) {
    console.error("[v0] Error importing prices:", error)
    if (error instanceof Error) {
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error stack:", error.stack)
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al importar precios" },
      { status: 500 },
    )
  }
}

