export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { generateText } from "ai"
import { groqProvider, FAST_GROQ_MODEL } from "@/lib/ia/groq"

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt es requerido" }, { status: 400 })
    }

    const { text } = await generateText({
      model: groqProvider(FAST_GROQ_MODEL),
      prompt: `Eres un experto en construcción y reformas. Genera una partida de presupuesto basada en esta descripción: "${prompt}"

Responde SOLO con un objeto JSON válido con esta estructura exacta:
{
  "category": "01. DERRIBOS" | "02. ALBAí‘ILERíA" | "03. FONTANERíA" | "04. CARPINTERíA" | "05. ELECTRICIDAD" | "06. CALEFACCIí“N" | "07. LIMPIEZA" | "08. MATERIALES" | "09. OTROS",
  "code": "código alfanumérico corto (ej: ELE-001)",
  "concept": "NOMBRE CORTO DE LA PARTIDA EN MAYíšSCULAS (máximo 80 caracteres)",
  "description": "descripción detallada de la partida incluyendo materiales y mano de obra",
  "unit": "Ud" | "mÂ²" | "ml" | "mÂ³" | "H" | "PA",
  "quantity": número (cantidad estimada razonable),
  "unit_price": número (precio unitario estimado en euros, realista para España)
}

Importante:
- El concepto DEBE estar completamente en MAYíšSCULAS
- El precio debe ser realista para el mercado español de reformas
- La descripción debe ser técnica y completa
- Elige la categoría más apropiada
- NO incluyas explicaciones adicionales, SOLO el JSON`,
    })

    // Limpiar el texto para extraer solo el JSON
    let jsonText = text.trim()

    // Intentar extraer JSON si viene con texto adicional
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }

    const lineItem = JSON.parse(jsonText)

    if (lineItem.concept) {
      lineItem.concept = lineItem.concept.toUpperCase()
    }

    return NextResponse.json(lineItem)
  } catch (error) {
    console.error("[generate-line-item] Error:", error)
    return NextResponse.json({ error: "Error al generar la partida" }, { status: 500 })
  }
}

