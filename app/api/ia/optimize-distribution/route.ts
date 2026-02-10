export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { groqProvider, VISION_GROQ_MODEL, FAST_GROQ_MODEL } from "@/lib/ia/groq"
import * as fal from "@fal-ai/serverless-client"

// Configure FAL client
fal.config({
  credentials: process.env.FAL_KEY,
})

async function analyzePlanWithGroq(base64: string, mimeType: string, preferencias: string): Promise<string> {
  try {
    console.log("[v0] Analyzing plan with Groq Vision")
    const { text } = await generateText({
      model: groqProvider(VISION_GROQ_MODEL),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: `data:${mimeType};base64,${base64}`,
            },
            {
              type: "text",
              text: `Analiza este plano arquitectónico. Describe detalladamente la distribución de las habitaciones, indicando dónde están los dormitorios, baños, cocina y salón.
              
              Luego, basado en esta distribución y en estas preferencias del usuario: "${preferencias || "Estilo moderno y funcional"}", genera un prompt detallado en inglés para crear una versión OPTIMIZADA y AMUEBLADA de este mismo plano visto desde arriba.
              
              IMPORTANTE: El prompt debe ser específico para una IA de generación de imágenes (como Flux o Stable Diffusion). El plano resultante debe ser limpio, profesional, sin cotas ni medidas, con mobiliario realista insertado en cada espacio.
              
              Responde ÚNICAMENTE con el prompt en inglés.`,
            },
          ],
        },
      ],
    })

    return text.trim()
  } catch (error) {
    console.error("[v0] Groq Vision analysis error:", error)
    throw error
  }
}

async function generateOptimizedImageWithFal(originalImageUrl: string, prompt: string): Promise<string> {
  try {
    console.log("[v0] Generating optimized image with FAL (Image-to-Image)")

    // Using Flux Dev Image-to-Image for maintaining structure while adding furniture/clean look
    const result: any = await fal.subscribe("fal-ai/flux/dev/image-to-image", {
      input: {
        image_url: originalImageUrl,
        prompt: `Professional architectural floor plan, top-down view, high quality: ${prompt}. Clean black lines, white background, realistic furniture placement, 4k, architectural visualization style.`,
        strength: 0.65, // Maintain structure but allow significant internal changes (furniture, cleaning)
        num_inference_steps: 28,
        guidance_scale: 3.5,
      },
      logs: true,
    })

    const images = result?.images || result?.data?.images
    if (!images || images.length === 0) {
      throw new Error("FAL did not return any images")
    }

    return images[0].url
  } catch (error) {
    console.error("[v0] FAL Image-to-Image error:", error)
    throw error
  }
}

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
    const file = formData.get("file") as File
    const preferencias = formData.get("preferencias") as string

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const mimeType = file.type || "image/png"
    const originalImageUrl = `data:${mimeType};base64,${base64}`

    console.log("[v0] Optimización de plano iniciada (Groq + FAL)")

    // Step 1: Analyze original plan and generate prompt
    const imagePrompt = await analyzePlanWithGroq(base64, mimeType, preferencias)
    console.log("[v0] Groq generated image prompt:", imagePrompt.substring(0, 100) + "...")

    // Step 2: Generate 3 optimized versions
    const distributions: string[] = []

    // We'll generate 2-3 versions with slightly different prompts or strengths if needed
    // For now, let's generate 2 distinct versions
    const variations = [
      "Traditional layout with professional furnishing",
      "Modern open-space concept with minimalist furnishing",
    ]

    for (let i = 0; i < 2; i++) {
      console.log(`[v0] Generating variation ${i + 1}/2`)
      try {
        const finalPrompt = `${imagePrompt}. ${variations[i]}`
        const optimizedUrl = await generateOptimizedImageWithFal(originalImageUrl, finalPrompt)
        distributions.push(optimizedUrl)

        if (i < 1) await new Promise(r => setTimeout(r, 2000))
      } catch (err) {
        console.error(`[v0] Error generating variation ${i + 1}:`, err)
      }
    }

    if (distributions.length === 0) {
      throw new Error("No se pudo generar ninguna optimización")
    }

    console.log("[v0] Distribuciones optimizadas generadas exitosamente:", distributions.length)

    return NextResponse.json({ distributions })
  } catch (error) {
    console.error("[v0] Error optimizando distribución:", error)

    let errorMessage = "Error desconocido"
    if (error instanceof Error) {
      errorMessage = error.message
      if (errorMessage.includes("rate limit")) errorMessage = "Límite de peticiones alcanzado. Espera un momento."
      if (errorMessage.includes("credentials")) errorMessage = "Error de API key. Verifica la configuración."
    }

    return NextResponse.json(
      { error: `Error al optimizar distribución: ${errorMessage}` },
      { status: 500 },
    )
  }
}
