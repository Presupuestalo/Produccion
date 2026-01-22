export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"

async function optimizeWithRetry(base64: string, mimeType: string, prompt: string, retries = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
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
                image: `data:${mimeType};base64,${base64}`,
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
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
    const supabase = createClient()
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

    console.log("[v0] Optimizando plano con Nano Banana, preferencias:", preferencias)

    const prompts = [
      `Analiza este plano arquitectónico y realiza lo siguiente:
1. LIMPIA el plano: elimina todas las medidas, textos, anotaciones y cotas que veas
2. MANTí‰N INTACTOS: todas las paredes, puertas, ventanas y tabiques exactamente como están
3. IDENTIFICA cada habitación por su forma y ubicación (dormitorio, salón, cocina, baño, etc.)
4. Aí‘ADE mobiliario lógico y realista para cada tipo de habitación:
   - Dormitorios: cama, mesitas, armario
   - Salón: sofá, mesa de centro, TV, estanterías
   - Cocina: encimera, nevera, horno, mesa
   - Baño: lavabo, inodoro, ducha/bañera
   - Comedor: mesa con sillas
5. El resultado debe ser un plano arquitectónico limpio visto desde arriba con mobiliario dibujado de forma profesional
${preferencias ? `Consideraciones adicionales: ${preferencias}` : ""}`,

      `Toma este plano y haz lo siguiente paso a paso:
1. Elimina todos los textos, medidas y anotaciones del plano original
2. Conserva exactamente la estructura: paredes, puertas, ventanas y tabiques sin modificar nada
3. Analiza cada espacio para determinar su función (dormitorio, cocina, baño, salón, etc.)
4. Distribuye mobiliario apropiado en cada habitación según su uso:
   - Mobiliario de dormitorio en habitaciones
   - Mobiliario de cocina en la cocina
   - Sanitarios en baños
   - Mobiliario de salón en zonas de estar
5. Genera un plano arquitectónico profesional desde arriba con los muebles bien distribuidos
${preferencias ? `Preferencias: ${preferencias}` : ""}`,

      `Optimiza este plano siguiendo estos pasos:
1. LIMPIEZA: borra todas las medidas, textos y anotaciones del plano
2. ESTRUCTURA: no modifiques ni elimines ninguna pared, puerta, ventana o tabique
3. ANíLISIS: identifica el tipo de cada habitación por su ubicación y forma
4. AMUEBLADO: coloca mobiliario lógico y funcional en cada espacio:
   - Camas y armarios en dormitorios
   - Sofás y mesas en salones
   - Electrodomésticos y muebles de cocina
   - Sanitarios en baños
5. Resultado: plano arquitectónico limpio visto desde arriba con distribución de muebles optimizada
${preferencias ? `Requisitos adicionales: ${preferencias}` : ""}`,
    ]

    const distributions: string[] = []

    for (let i = 0; i < prompts.length; i++) {
      console.log(`[v0] Generando distribución ${i + 1} con Nano Banana`)

      const imageUrl = await optimizeWithRetry(base64, mimeType, prompts[i])
      distributions.push(imageUrl)

      console.log(`[v0] Distribución ${i + 1} generada exitosamente`)

      // Add delay between requests to avoid rate limits
      if (i < prompts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    console.log("[v0] Distribuciones optimizadas generadas con Nano Banana:", distributions.length)

    return NextResponse.json({ distributions })
  } catch (error) {
    console.error("[v0] Error optimizando distribución:", error)
    return NextResponse.json(
      { error: `Error al optimizar distribución: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}

