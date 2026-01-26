export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { groqProvider, DEFAULT_GROQ_MODEL } from "@/lib/ia/groq"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { walls, doors, windows } = await request.json()

    // Usar IA para detectar habitaciones basándose en las paredes
    const { text } = await generateText({
      model: groqProvider(DEFAULT_GROQ_MODEL),
      prompt: `Eres un arquitecto experto. Tu tarea es analizar un conjunto de paredes (segmentos), puertas y ventanas para identificar las HABITACIONES (espacios cerrados).

DATOS DEL PLANO:
Paredes: ${JSON.stringify(walls)}
Puertas: ${JSON.stringify(doors)}
Ventanas: ${JSON.stringify(windows)}

INSTRUCCIONES:
1. Analiza cómo se conectan las paredes. 
2. Identifica ciclos cerrados o casi cerrados que formen una estancia.
3. Para cada habitación detectada:
   - "id": id único (hab-1, hab-2, etc.)
   - "name": Nombre sugerido (Cocina, Salón, Baño, Dormitorio...)
   - "polygon": Array de puntos {x, y} que definen el perímetro interior de la habitación.
   - "area": Área aproximada en m² (pista: 100 unidades = 1 metro).

REGLAS CRÍTICAS:
- Ignora paredes sueltas que no cierran un espacio.
- Si una habitación tiene paredes compartidas, úsalas correctamente en el polígono.
- Responde EXCLUSIVAMENTE con el JSON.

Formato esperado:
{
  "rooms": [
    {
      "id": "string",
      "name": "string",
      "polygon": [{ "x": number, "y": number }],
      "area": number
    }
  ]
}`,
    })

    const data = JSON.parse(text)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error detecting rooms:", error)
    return NextResponse.json({ error: "Error al detectar habitaciones" }, { status: 500 })
  }
}
