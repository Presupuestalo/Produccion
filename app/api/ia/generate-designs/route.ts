export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { groqProvider, VISION_GROQ_MODEL, FAST_GROQ_MODEL } from "@/lib/ia/groq"
import * as fal from "@fal-ai/serverless-client"

// Configure FAL client
fal.config({
  credentials: process.env.FAL_KEY,
})

/**
 * KLING OMNI 3 ENGINE (v3)
 * - El motor más avanzado y consistente de Kling en FAL.
 * - Famoso por mantener la arquitectura perfecta mientras amuebla.
 */
async function generateStagingWithKling(originalImageUrl: string, roomType: string, style: string, details: string): Promise<string> {
  try {
    console.log(`[v0] Generating design with KLING OMNI 3 (v3) for ${roomType}`)

    // Mapeo de mobiliario para evitar "salones en cocinas"
    const furnitureMap: Record<string, string> = {
      "living room": "a luxury sectional sofa, coffee table, large wool rug, and indoor plants. No beds.",
      "kitchen": "modern kitchen cabinets, luxury marble island, high-end appliances, and clean countertops. NO SOFAS.",
      "bedroom": "a luxury king-size bed with elegant bedding, bedside tables, and a plush rug. No kitchen elements.",
      "bathroom": "modern marble vanity, designer mirror, and luxury fixtures.",
      "dining room": "a large designer wooden dining table with elegant chairs.",
      "office": "a professional wooden desk and ergonomic office chair.",
    }

    const furniture = furnitureMap[roomType.toLowerCase()] || "high-end furniture"

    // FIX: Kling Omni 3 usa 'image_urls' como un ARRAY de strings.
    // También requiere 'resolution' en minúsculas y parámetros limpios.
    const result: any = await fal.subscribe("fal-ai/kling-image/o3/image-to-image", {
      input: {
        prompt: `A high-end professional photorealistic interior design of a ${roomType} in ${style} style. 
                FULLY FURNISHED with: ${furniture}. 
                MAINTAIN EXACT ARCHITECTURE: Keep windows, walls, and ceiling exactly as they are in the reference image. 
                Photorealistic, 8k, professional interior photography, natural lighting. ${details || ""}`,
        image_urls: [originalImageUrl], // ESTE ERA EL ERROR: Debe ser un array
        num_images: 1,
        resolution: "1k",
        aspect_ratio: "4:3",
        output_format: "png",
      },
      logs: true,
    })

    const images = result?.images || result?.data?.images || result?.outputs
    if (!images || images.length === 0) throw new Error("Kling did not return any image")

    return images[0].url
  } catch (error: any) {
    console.error("[v0] Kling Engine error:", error)
    if (error.body) {
      console.error("[v0] FAL Payload Detail:", JSON.stringify(error.body))
    }
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) return NextResponse.json({ error: "Server config error" }, { status: 500 })

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await request.formData()
    const image = formData.get("image") as File
    const roomType = (formData.get("roomType") as string) || "living room"
    const style = (formData.get("style") as string) || "modern"
    const details = (formData.get("details") as string) || ""

    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const mimeType = image.type || "image/png"
    const imageUrl = `data:${mimeType};base64,${base64}`

    console.log(`[v0] Virtual Staging with Kling Omni 3: ${roomType} (${style})`)

    const roomTypeNames: Record<string, string> = {
      bedroom: "bedroom", living: "living room", kitchen: "kitchen",
      bathroom: "bathroom", dining: "dining room", office: "office",
    }
    const styleNames: Record<string, string> = {
      modern: "modern", industrial: "industrial", scandinavian: "scandinavian",
      rustic: "rustic", contemporary: "contemporary", minimalist: "minimalist",
    }

    const resolvedRoom = roomTypeNames[roomType] || roomType
    const resolvedStyle = styleNames[style] || style

    // Motor Kling Omni 3 Corregido
    const finalImageUrl = await generateStagingWithKling(
      imageUrl,
      resolvedRoom,
      resolvedStyle,
      details
    )

    return NextResponse.json({
      designs: [{
        id: Math.random().toString(36).substring(7),
        style: resolvedStyle,
        imageUrl: finalImageUrl,
        prompt: `${resolvedRoom} in style ${resolvedStyle}`,
      }]
    })
  } catch (error: any) {
    console.error("[v0] GLOBAL ERROR:", error)
    return NextResponse.json({ error: error.message || "Error al generar diseños" }, { status: 500 })
  }
}
