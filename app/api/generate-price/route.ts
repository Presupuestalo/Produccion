export const dynamic = "force-dynamic"
import { generateText } from "ai"
import { NextResponse } from "next/server"
import { groqProvider, DEFAULT_GROQ_MODEL } from "@/lib/ia/groq"

export async function POST(request: Request) {
  try {
    const { prompt, categories } = await request.json()

    if (!prompt || !categories) {
      return NextResponse.json({ error: "Prompt y categorías son requeridos" }, { status: 400 })
    }

    const categoryList = categories.map((c: { id: string; name: string }) => `ID: "${c.id}" - Nombre: "${c.name}"`).join("\n")

    const { text } = await generateText({
      model: groqProvider(DEFAULT_GROQ_MODEL),
      prompt: `Eres un experto en presupuestos de reformas y construcción en España con 20 años de experiencia.

El usuario quiere crear un precio para: "${prompt}"

Categorías disponibles para elegir:
${categoryList}

Genera un objeto JSON válido (SIN MARKDOWN, SIN BLOQUES DE CÓDIGO) con la siguiente estructura:
{
  "category": "ID exacto de la categoría seleccionada de la lista",
  "subcategory": "Un concepto corto y descriptivo en MAYÚSCULAS",
  "description": "Una descripción técnica detallada del trabajo y materiales incluidos",
  "unit": "La unidad de medida más apropiada (Ud, m², ml, m³, kg, H)",
  "final_price": 0.00 (Número: precio de venta al público en euros),
  "color": "Color sugerido (opcional)",
  "brand": "Marca sugerida (opcional)",
  "model": "Modelo sugerido (opcional)"
}

IMPORTANTE:
1. La categoría DEBE ser uno de los IDs proporcionados.
2. El precio debe ser realista para España.
3. Responde SOLAMENTE con el JSON.`,
    })

    // Limpiar el texto de posibles bloques de código markdown
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim()

    let object
    try {
      object = JSON.parse(cleanText)
    } catch (e) {
      console.error("Error parsing JSON:", e, "Text:", text)
      throw new Error("La IA no generó un JSON válido")
    }

    return NextResponse.json(object)
  } catch (error) {
    console.error("CRITICAL ERROR in /api/generate-price:", error)
    if (error && typeof error === 'object' && 'cause' in error) {
      console.error("Error cause:", (error as any).cause)
    }
    return NextResponse.json(
      {
        error: "Error interno al generar el precio",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
