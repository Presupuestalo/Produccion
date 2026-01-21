export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt es requerido" }, { status: 400 })
    }

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Eres un experto en construcciÃ³n y reformas. Genera una partida de presupuesto basada en esta descripciÃ³n: "${prompt}"

Responde SOLO con un objeto JSON vÃ¡lido con esta estructura exacta:
{
  "category": "01. DERRIBOS" | "02. ALBAÃ‘ILERÃA" | "03. FONTANERÃA" | "04. CARPINTERÃA" | "05. ELECTRICIDAD" | "06. CALEFACCIÃ“N" | "07. LIMPIEZA" | "08. MATERIALES" | "09. OTROS",
  "code": "cÃ³digo alfanumÃ©rico corto (ej: ELE-001)",
  "concept": "NOMBRE CORTO DE LA PARTIDA EN MAYÃšSCULAS (mÃ¡ximo 80 caracteres)",
  "description": "descripciÃ³n detallada de la partida incluyendo materiales y mano de obra",
  "unit": "Ud" | "mÂ²" | "ml" | "mÂ³" | "H" | "PA",
  "quantity": nÃºmero (cantidad estimada razonable),
  "unit_price": nÃºmero (precio unitario estimado en euros, realista para EspaÃ±a)
}

Importante:
- El concepto DEBE estar completamente en MAYÃšSCULAS
- El precio debe ser realista para el mercado espaÃ±ol de reformas
- La descripciÃ³n debe ser tÃ©cnica y completa
- Elige la categorÃ­a mÃ¡s apropiada
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

