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
  "category": "Nombre de categoría (ej: ALBAÑILERÍA, FONTANERÍA...)",
  "suggested_category": "Nombre sugerido para una NUEVA categoría (solo si no encaja en las habituales)",
  "code": "Código técnico (formato: 01-XXX-01, donde XXX son las 3 primeras letras de la categoría)",
  "concept": "NOMBRE CORTO (MÁX 80 CARACTERES)",
  "description": "Descripción técnica detallada. DEBE empezar con Mayúscula y seguir formato de oración profesional.",
  "unit": "Ud" | "m²" | "ml" | "m³" | "h" | "PA",
  "quantity": número (cantidad lógica),
  "unit_price": número (precio unitario incluyendo mano de obra y materiales)
}

Reglas críticas:
1. El "concept" SIEMPRE en MAYÚSCULAS.
2. La "description" debe empezar por Mayúscula, sonar técnica y profesional.
3. El "code" debe seguir el formato: 01-[TRES LETRAS CATEGORÍA]-01.
4. Si la partida es muy específica (ej: Domótica, Paisajismo) y no encaja en las clásicas, usa "suggested_category" para proponer el nombre de la nueva categoría.
5. No añadas texto fuera del JSON.`,
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

    if (lineItem.description) {
      lineItem.description = lineItem.description.charAt(0).toUpperCase() + lineItem.description.slice(1)
    }

    // Si hay una categoría sugerida y no hay categoría principal clara, usar la sugerida
    if (lineItem.suggested_category && (!lineItem.category || lineItem.category === "OTROS")) {
      lineItem.category = lineItem.suggested_category.toUpperCase()
    }

    return NextResponse.json(lineItem)
  } catch (error) {
    console.error("[generate-line-item] Error:", error)
    return NextResponse.json({ error: "Error al generar la partida" }, { status: 500 })
  }
}
