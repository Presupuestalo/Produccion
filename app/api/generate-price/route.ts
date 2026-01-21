export const dynamic = "force-dynamic"
import { generateObject } from "ai"
import { NextResponse } from "next/server"
import { z } from "zod"

const priceSchema = z.object({
  category: z.string().describe("La categorÃ­a mÃ¡s apropiada para este trabajo"),
  subcategory: z.string().describe("Un concepto corto y descriptivo en mayÃºsculas"),
  description: z.string().describe("Una descripciÃ³n detallada del trabajo a realizar"),
  unit: z.enum(["Ud", "mÂ²", "ml", "mÂ³", "kg", "H"]).describe("La unidad de medida mÃ¡s apropiada"),
  final_price: z.number().describe("Un precio aproximado en euros basado en el mercado espaÃ±ol"),
  color: z.string().optional().describe("Color del material si aplica"),
  brand: z.string().optional().describe("Marca sugerida si aplica"),
  model: z.string().optional().describe("Modelo sugerido si aplica"),
})

export async function POST(request: Request) {
  try {
    const { prompt, categories } = await request.json()

    if (!prompt || !categories) {
      return NextResponse.json({ error: "Prompt y categorÃ­as son requeridos" }, { status: 400 })
    }

    const categoryList = categories.map((c: { id: string; name: string }) => `${c.id}: ${c.name}`).join(", ")

    const { object } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: priceSchema,
      prompt: `Eres un experto en presupuestos de reformas y construcciÃ³n en EspaÃ±a. 

El usuario quiere crear un precio para: "${prompt}"

CategorÃ­as disponibles: ${categoryList}

Genera un precio detallado con:
1. La categorÃ­a mÃ¡s apropiada (usa el ID exacto de las categorÃ­as disponibles)
2. Un concepto corto y descriptivo en MAYÃšSCULAS
3. Una descripciÃ³n detallada del trabajo
4. La unidad de medida mÃ¡s apropiada
5. Un precio aproximado realista para el mercado espaÃ±ol de reformas
6. Si es un material, incluye color, marca y modelo sugeridos

SÃ© especÃ­fico y profesional. Los precios deben ser realistas para el mercado espaÃ±ol de reformas.`,
    })

    return NextResponse.json(object)
  } catch (error) {
    console.error("Error generating price with AI:", error)
    return NextResponse.json({ error: "Error al generar el precio con IA" }, { status: 500 })
  }
}

