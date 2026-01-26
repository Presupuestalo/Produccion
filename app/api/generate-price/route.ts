export const dynamic = "force-dynamic"
import { generateObject } from "ai"
import { NextResponse } from "next/server"
import { z } from "zod"
import { groqProvider, FAST_GROQ_MODEL } from "@/lib/ia/groq"

const priceSchema = z.object({
  category: z.string().describe("La categoría más apropiada para este trabajo"),
  subcategory: z.string().describe("Un concepto corto y descriptivo en mayúsculas"),
  description: z.string().describe("Una descripción detallada del trabajo a realizar"),
  unit: z.enum(["Ud", "mÂ²", "ml", "mÂ³", "kg", "H"]).describe("La unidad de medida más apropiada"),
  final_price: z.number().describe("Un precio aproximado en euros basado en el mercado español"),
  color: z.string().optional().describe("Color del material si aplica"),
  brand: z.string().optional().describe("Marca sugerida si aplica"),
  model: z.string().optional().describe("Modelo sugerido si aplica"),
})

export async function POST(request: Request) {
  try {
    const { prompt, categories } = await request.json()

    if (!prompt || !categories) {
      return NextResponse.json({ error: "Prompt y categorías son requeridos" }, { status: 400 })
    }

    const categoryList = categories.map((c: { id: string; name: string }) => `${c.id}: ${c.name}`).join(", ")

    const { object } = await generateObject({
      model: groqProvider(FAST_GROQ_MODEL),
      schema: priceSchema,
      prompt: `Eres un experto en presupuestos de reformas y construcción en España. 

El usuario quiere crear un precio para: "${prompt}"

Categorías disponibles: ${categoryList}

Genera un precio detallado con:
1. La categoría más apropiada (usa el ID exacto de las categorías disponibles)
2. Un concepto corto y descriptivo en MAYíšSCULAS
3. Una descripción detallada del trabajo
4. La unidad de medida más apropiada
5. Un precio aproximado realista para el mercado español de reformas
6. Si es un material, incluye color, marca y modelo sugeridos

Sé específico y profesional. Los precios deben ser realistas para el mercado español de reformas.`,
    })

    return NextResponse.json(object)
  } catch (error) {
    console.error("Error generating price with AI:", error)
    return NextResponse.json({ error: "Error al generar el precio con IA" }, { status: 500 })
  }
}

