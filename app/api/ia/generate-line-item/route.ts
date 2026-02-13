export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { generateText } from "ai"
import { groqProvider, DEFAULT_GROQ_MODEL } from "@/lib/ia/groq"

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt es requerido" }, { status: 400 })
    }

    const { text } = await generateText({
      model: groqProvider(DEFAULT_GROQ_MODEL),
      system: `Eres un experto Jefe de Obra y Presupuestador con 20 años de experiencia en reformas integrales en España. 
      Tu objetivo es generar partidas de presupuesto técnico, precisas y con precios de mercado realistas.
      El tono debe ser profesional y los detalles técnicos deben ser rigurosos.`,
      prompt: `Genera una partida de presupuesto detallada basada en esta descripción: "${prompt}"

Responde EXCLUSIVAMENTE con un objeto JSON válido con esta estructura:
{
  "category": "01. DERRIBOS" | "02. ALBAÑILERÍA" | "03. FONTANERÍA" | "04. CARPINTERÍA" | "05. ELECTRICIDAD" | "06. CALEFACCIÓN" | "07. LIMPIEZA" | "08. MATERIALES" | "09. OTROS",
  "code": "Código técnico (ej: DER-01, ALB-05)",
  "concept": "NOMBRE CORTO (MÁX 80 CARACTERES)",
  "description": "Descripción técnica detallada que incluya: tipo de material, gramajes/espesores si aplica, medios auxiliares y limpieza previa/posterior.",
  "unit": "Ud" | "m²" | "ml" | "m³" | "h" | "PA",
  "quantity": número (cantidad lógica para la descripción),
  "unit_price": número (precio unitario actual de mercado en España, incluyendo mano de obra y materiales)
}

Reglas críticas:
1. El "concept" SIEMPRE en MAYÚSCULAS.
2. La "description" debe sonar profesional, no genérica.
3. Los precios deben reflejar los costes actuales de 2024-2025 en España.
4. No añadas nada de texto fuera del JSON.`,
    })

    // Limpiar el texto para extraer solo el JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No se pudo extraer JSON de la respuesta de la IA")
    }

    const lineItem = JSON.parse(jsonMatch[0])

    if (lineItem.concept) {
      lineItem.concept = lineItem.concept.toUpperCase()
    }

    return NextResponse.json(lineItem)
  } catch (error) {
    console.error("[generate-line-item] Error:", error)
    return NextResponse.json({ error: "Error al generar la partida" }, { status: 500 })
  }
}
