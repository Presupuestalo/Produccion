export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateText } from "ai"
import { extractText } from "unpdf"
import { groqProvider, DEFAULT_GROQ_MODEL } from "@/lib/ia/groq"
import { getUserPriceTableByCountry, getNextPriceCode } from "@/lib/services/price-service"

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

    console.log("[v0] País del usuario:", userCountry)
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
      model: groqProvider(DEFAULT_GROQ_MODEL),
      prompt: `Analiza este presupuesto de reformas y extrae TODOS los precios en formato JSON.

Devuelve un array JSON con esta estructura exacta:
[
  {
    "code": "código si existe o null",
    "category": "DERRIBOS|ALBAÑILERÍA|FONTANERÍA|CARPINTERÍA|ELECTRICIDAD|CALEFACCIÓN|PINTURA|LIMPIEZA|MATERIALES",
    "subcategory": "CONCEPTO EN MAYÚSCULAS",
    "description": "Descripción detallada",
    "unit": "m²|ml|ud|etc",
    "labor_cost": número,
    "material_cost": número,
    "equipment_cost": número,
    "other_cost": número,
    "final_price": número
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
        throw new Error("No se encontró JSON en la respuesta")
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

    const pricesToInsert = []
    for (const price of prices) {
      const totalCost =
        (price.labor_cost || 0) + (price.material_cost || 0) + (price.equipment_cost || 0) + (price.other_cost || 0)
      const basePrice = totalCost
      const finalPrice = price.final_price || totalCost

      const categoryId = categoryMap.get(price.category.toUpperCase()) || null
      const categoryName = price.category.toUpperCase()

      // Generar código estructurado secuencialmente
      const generatedCode = price.code || await getNextPriceCode(
        categoryId || "general",
        categoryName,
        "imported"
      )

      pricesToInsert.push({
        user_id: user.id,
        base_price_id: null,
        code: generatedCode,
        category_id: categoryId,
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
      })
    }

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
