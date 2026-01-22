export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"

async function generateWithRetry(prompt: string, retries = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await generateText({
        model: "google/gemini-2.5-flash-image-preview",
        providerOptions: {
          google: { responseModalities: ["IMAGE"] },
        },
        prompt,
      })

      const imageFiles = result.files?.filter((f) => f.mediaType?.startsWith("image/"))

      if (!imageFiles || imageFiles.length === 0) {
        throw new Error("No se generó ninguna imagen")
      }

      const imageBase64 = Buffer.from(imageFiles[0].uint8Array).toString("base64")
      const extension = imageFiles[0].mediaType?.split("/")[1] || "png"
      return `data:image/${extension};base64,${imageBase64}`
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      // If rate limited and we have retries left, wait and try again
      if (errorMessage.includes("rate limit") && attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff: 1s, 2s, 4s
        console.log(`[v0] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      throw error
    }
  }

  throw new Error("Failed after all retries")
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

    const { area, habitaciones, banos, preferencias } = await request.json()

    console.log("[v0] Generating distributions with Nano Banana:", { area, habitaciones, banos, preferencias })

    const distributions: string[] = []

    const layouts = [
      "distribución tradicional con pasillos",
      "distribución abierta tipo loft",
      "distribución con zonas bien definidas",
    ]

    for (let i = 0; i < 3; i++) {
      const prompt = `Genera un plano arquitectónico profesional visto desde arriba con las siguientes características:
- írea total: ${area}mÂ²
- ${habitaciones} dormitorios
- ${banos} baños
- Estilo de distribución: ${layouts[i]}
- ${preferencias || "Estilo moderno"}

El plano debe incluir:
1. Paredes, puertas y ventanas claramente definidas
2. Mobiliario apropiado en cada habitación (camas, sofás, mesas, etc.)
3. Etiquetas de habitaciones
4. Diseño limpio y profesional
5. Vista desde arriba (planta)

Genera un plano arquitectónico detallado y realista.`

      console.log(`[v0] Generating distribution ${i + 1} with Nano Banana`)

      const imageUrl = await generateWithRetry(prompt)
      distributions.push(imageUrl)

      console.log(`[v0] Distribution ${i + 1} generated successfully with Nano Banana`)

      // Add delay between requests to avoid rate limits
      if (i < 2) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    console.log("[v0] All distributions generated:", distributions.length)

    return NextResponse.json({
      distributions,
      message: "Distribuciones generadas exitosamente con Nano Banana",
    })
  } catch (error) {
    console.error("[v0] Error generating distributions:", error)
    return NextResponse.json(
      { error: `Error al generar distribuciones: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}

