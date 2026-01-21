export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

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
    const imageFile = formData.get("image") as File
    const materialsStr = formData.get("materials") as string
    const style = formData.get("style") as string
    const details = formData.get("details") as string

    if (!imageFile) {
      return NextResponse.json({ error: "Imagen requerida" }, { status: 400 })
    }

    console.log("[v0] Processing uploaded image...")

    // Convert image to base64
    const imageBuffer = await imageFile.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString("base64")
    const imageMimeType = imageFile.type

    // Parse materials
    const materials = materialsStr ? JSON.parse(materialsStr) : []

    console.log("[v0] Generating photorealistic render...")

    let prompt = `Convierte este plano 2D en un RENDER FOTORREALISTA VISTO DESDE ARRIBA (VISTA CENITAL/BIRD'S EYE VIEW) de alta calidad profesional.

REQUISITOS CRÍTICOS DEL RENDER:
- Vista COMPLETAMENTE DESDE ARRIBA (top-down, cenital, bird's eye view) - NO isométrica, NO en ángulo
- La cámara debe estar perpendicular al suelo mirando directamente hacia abajo
- Calidad fotorrealista 8K con iluminación natural realista
- Añadir TODOS los muebles y elementos apropiados para cada estancia vistos desde arriba:
  * Cocina: muebles de cocina, electrodomésticos, encimera, mesa comedor, sillas
  * Dormitorios: camas con ropa de cama, mesitas, armarios, alfombras, decoración
  * Baños: sanitarios, lavabo, ducha/bañera, muebles, toallas
  * Salón: sofás, mesas, TV, estanterías, alfombras, plantas, decoración
  * Pasillos: elementos decorativos, plantas, cuadros en paredes
- Mostrar las paredes con grosor realista y en color gris/blanco
- Texturas realistas y detalladas en todos los materiales (suelos, muebles, textiles)
- Iluminación natural con sombras suaves proyectadas por los muebles
- Perspectiva que muestre claramente la distribución completa del espacio desde arriba
- Acabados de alta calidad en suelos, paredes y carpintería
- Ambiente acogedor, habitable y profesional
- Mantener EXACTAMENTE la distribución y medidas del plano original
- El resultado debe parecer una fotografía aérea profesional del interior amueblado`

    // Add materials if selected
    if (materials.length > 0) {
      prompt += `\n\nMATERIALES ESPECIFICADOS:`
      const materialNames = materials.map((id: string) => {
        const materialMap: Record<string, string> = {
          parquet: "Suelo de parquet",
          porcelanico: "Suelo porcelánico",
          marmol: "Suelo de mármol",
          microcemento: "Suelo de microcemento",
          "pintura-lisa": "Paredes con pintura lisa",
          gotele: "Paredes con gotele",
          "papel-pintado": "Paredes con papel pintado",
          madera: "Carpintería de madera",
          lacado: "Carpintería lacada",
        }
        return materialMap[id] || id
      })
      prompt += `\n- ${materialNames.join("\n- ")}`
    }

    // Add style if selected
    if (style) {
      const styleMap: Record<string, string> = {
        modern: "Estilo moderno con líneas limpias y minimalistas",
        industrial: "Estilo industrial urbano con materiales expuestos",
        scandinavian: "Estilo escandinavo luminoso y acogedor",
        rustic: "Estilo rústico cálido y natural",
        contemporary: "Estilo contemporáneo elegante y sofisticado",
        minimalist: "Estilo minimalista con simplicidad y funcionalidad",
      }
      prompt += `\n\nESTILO: ${styleMap[style] || style}`
    }

    // Add additional details
    if (details) {
      prompt += `\n\nDETALLES ADICIONALES:\n${details}`
    }

    prompt += `\n\nIMPORTANTE: El resultado debe ser un render fotorrealista VISTO DESDE ARRIBA (como una fotografía aérea del interior) perfecto para presentar al cliente, mostrando exactamente cómo quedará el espacio reformado con todos los muebles, materiales y acabados colocados. La vista debe ser completamente cenital, perpendicular al suelo, como una visualización arquitectónica profesional de planta amueblada.`

    const result = await generateText({
      model: "google/gemini-2.5-flash-image-preview",
      providerOptions: {
        google: { responseModalities: ["IMAGE"] },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: `data:${imageMimeType};base64,${imageBase64}`,
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    })

    console.log("[v0] Render generation response received")

    const imageFiles = result.files?.filter((f) => f.mediaType?.startsWith("image/"))

    if (!imageFiles || imageFiles.length === 0) {
      console.error("[v0] No image generated")
      throw new Error("No se generó ninguna imagen")
    }

    const generatedImage = imageFiles[0]
    const generatedImageBase64 = `data:${generatedImage.mediaType};base64,${Buffer.from(generatedImage.uint8Array).toString("base64")}`

    const render = {
      id: Math.random().toString(36).substring(7),
      imageUrl: generatedImageBase64,
      prompt: `Render fotorrealista profesional con ${materials.length > 0 ? "materiales personalizados" : "acabados de calidad"}${style ? ` en estilo ${style}` : ""}`,
      timestamp: new Date().toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }

    return NextResponse.json({ render })
  } catch (error) {
    console.error("[v0] Error generating render:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al generar render" },
      { status: 500 },
    )
  }
}

