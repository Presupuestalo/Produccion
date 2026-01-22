export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"

fal.config({
  credentials: process.env.FAL_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const floorPlan = formData.get("floorPlan") as File
    const style = formData.get("style") as string

    if (!floorPlan) {
      return NextResponse.json({ error: "No floor plan provided" }, { status: 400 })
    }

    // Convertir el archivo a base64
    const bytes = await floorPlan.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const imageUrl = `data:${floorPlan.type};base64,${base64}`

    // Prompts según el estilo seleccionado
    const stylePrompts: Record<string, string> = {
      moderno:
        "modern minimalist interior design, clean lines, neutral colors, contemporary furniture, top-down view, architectural floor plan with realistic furniture placement",
      escandinavo:
        "scandinavian interior design, bright and airy, natural wood, cozy textiles, hygge style, top-down view, architectural floor plan with realistic furniture placement",
      industrial:
        "industrial loft interior design, exposed brick, metal fixtures, raw materials, urban style, top-down view, architectural floor plan with realistic furniture placement",
      clasico:
        "classic elegant interior design, traditional furniture, refined details, timeless style, top-down view, architectural floor plan with realistic furniture placement",
    }

    const prompt = `${stylePrompts[style] || stylePrompts.moderno}. Transform this architectural floor plan into a fully furnished realistic top-down view with appropriate furniture, decorations, and textures for each room. Maintain the original layout and structure.`

    // Usar fal.ai para generar la imagen amueblada
    const result = await fal.subscribe("fal-ai/flux/dev/image-to-image", {
      input: {
        image_url: imageUrl,
        prompt: prompt,
        strength: 0.75,
        num_inference_steps: 28,
        guidance_scale: 3.5,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(
            "[v0] Generating furnished plan:",
            update.logs?.map((log) => log.message),
          )
        }
      },
    })

    const furnishedImageUrl = (result as any).images[0].url

    return NextResponse.json({
      furnishedImageUrl,
      style,
    })
  } catch (error) {
    console.error("[v0] Error furnishing plan:", error)
    return NextResponse.json(
      { error: `Error furnishing plan: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}

