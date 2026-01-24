export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"

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
      model: "openai/gpt-4o",
      prompt: `Analiza las siguientes paredes, puertas y ventanas de un plano arquitectónico y detecta las habitaciones.

Paredes: ${JSON.stringify(walls)}
Puertas: ${JSON.stringify(doors)}
Ventanas: ${JSON.stringify(windows)}

Proporciona la información en formato JSON:
{
  "rooms": [
    {
      "id": "room-1",
      "name": "Salón",
      "walls": ["wall-id-1", "wall-id-2"],
      "area": 25.5
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

