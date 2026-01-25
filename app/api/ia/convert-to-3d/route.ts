export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { groq, VISION_GROQ_MODEL } from "@/lib/ia/groq"

const floorPlanSchema = z.object({
  rooms: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      dimensions: z.object({
        width: z.number(),
        length: z.number(),
        height: z.number(),
      }),
      position: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }),
      walls: z.array(
        z.object({
          start: z.object({ x: z.number(), y: z.number() }),
          end: z.object({ x: z.number(), y: z.number() }),
        }),
      ),
      doors: z.array(
        z.object({
          position: z.object({ x: z.number(), y: z.number() }),
          width: z.number(),
        }),
      ),
      windows: z.array(
        z.object({
          position: z.object({ x: z.number(), y: z.number() }),
          width: z.number(),
          height: z.number(),
        }),
      ),
    }),
  ),
})

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

    const formData = await request.formData()
    const floorPlan = formData.get("floorPlan") as File

    if (!floorPlan) {
      return NextResponse.json({ error: "Plano es requerido" }, { status: 400 })
    }

    const fileExt = floorPlan.name.split(".").pop()
    const fileName = `${session.user.id}/${Date.now()}-${floorPlan.name.split(".")[0]}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage.from("pdfs").upload(fileName, floorPlan, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("[v0] Error uploading floor plan:", uploadError)
      return NextResponse.json({ error: "Error al subir el plano" }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("pdfs").getPublicUrl(fileName)

    // Descargar imagen antes de enviarla a Groq
    let imageContent: string | Buffer
    try {
      const imageResponse = await fetch(publicUrl)
      if (!imageResponse.ok) throw new Error(`Status ${imageResponse.status}`)
      const arrayBuffer = await imageResponse.arrayBuffer()
      imageContent = Buffer.from(arrayBuffer)
      console.log("[v0] Imagen para 3D descargada correctamente")
    } catch (err) {
      console.warn("[v0] No se pudo descargar imagen para 3D, usando URL:", err)
      imageContent = publicUrl
    }

    const { object } = await generateObject({
      model: groq(VISION_GROQ_MODEL),
      schema: floorPlanSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analiza este plano arquitectónico 2D y extrae la información de las habitaciones, paredes, puertas y ventanas para convertirlo a un modelo 3D.
              
Proporciona la información con la siguiente estructura:
- rooms: array de habitaciones, cada una con:
  - id: identificador único (ej: "room-1", "room-2")
  - type: tipo de habitación (ej: "living-room", "bedroom", "kitchen", "bathroom")
  - dimensions: ancho (width), largo (length) y altura (height) en metros
  - position: posición x, y, z en el espacio 3D
  - walls: array de paredes con puntos de inicio y fin { x, y }
  - doors: array de puertas con posición { x, y } y ancho
  - windows: array de ventanas con posición { x, y }, ancho y altura`,
            },
            {
              type: "image",
              image: imageContent,
            },
          ],
        },
      ],
    })

    console.log("[v0] Floor plan analysis result:", object)

    // Guardar en base de datos
    await supabase.from("floor_plans_3d").insert({
      user_id: session.user.id,
      original_plan_url: publicUrl,
      rooms_data: object.rooms,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ rooms: object.rooms })
  } catch (error) {
    console.error("[v0] Error converting to 3D:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al convertir plano" },
      { status: 500 },
    )
  }
}

