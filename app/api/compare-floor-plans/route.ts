export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import { groq, VISION_GROQ_MODEL } from "@/lib/ia/groq"
import { convertPdfToImage, isPdf } from "@/lib/utils/pdf-to-image"

export const maxDuration = 60

const comparisonSchema = z.object({
  summary: z.string().describe("Resumen de los cambios principales"),
  roomsAdded: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        area: z.number(),
        reason: z.string(),
      }),
    )
    .describe("Habitaciones añadidas en el nuevo plano"),
  roomsRemoved: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        area: z.number(),
        reason: z.string(),
      }),
    )
    .describe("Habitaciones eliminadas del plano original"),
  roomsModified: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        changeDescription: z.string(),
        areaBefore: z.number(),
        areaAfter: z.number(),
      }),
    )
    .describe("Habitaciones que cambiaron de tamaño"),
  wallsRemoved: z
    .array(
      z.object({
        location: z.string(),
        estimatedLength: z.number(),
        reason: z.string(),
      }),
    )
    .describe("Tabiques derribados"),
  wallsAdded: z
    .array(
      z.object({
        location: z.string(),
        estimatedLength: z.number(),
        reason: z.string(),
      }),
    )
    .describe("Tabiques nuevos"),
  kitchenTransformation: z
    .object({
      hasChanged: z.boolean().describe("Si la cocina cambió de tipo"),
      beforeType: z
        .enum(["cocina", "cocina_americana", "cocina_abierta", "no_existia"])
        .describe("Tipo de cocina en el plano ANTES"),
      afterType: z
        .enum(["cocina", "cocina_americana", "cocina_abierta", "eliminada"])
        .describe("Tipo de cocina en el plano DESPUí‰S"),
      description: z.string().describe("Descripción del cambio en la cocina"),
    })
    .describe("Transformación de la cocina si aplica"),
  suggestAddPartitions: z.boolean().describe("Si se recomienda añadir tabiquería"),
  totalWallsRemovedMeters: z.number().describe("Total metros lineales de tabiques eliminados"),
  totalWallsAddedMeters: z.number().describe("Total metros lineales de tabiques añadidos"),
})

export async function POST(request: Request) {
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

    const { beforeImageUrl, afterImageUrl } = await request.json()

    if (!beforeImageUrl || !afterImageUrl) {
      return NextResponse.json({ error: "Se requieren ambas imágenes (antes y después)" }, { status: 400 })
    }

    console.log("[v0] Comparando planos:")
    console.log("[v0] - Before:", beforeImageUrl)
    console.log("[v0] - After:", afterImageUrl)

    // Descargar imágenes antes de enviarlas a Groq
    async function fetchImage(url: string) {
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Status ${response.status}`)
        const arrayBuffer = await response.arrayBuffer()
        let buffer = Buffer.from(new Uint8Array(arrayBuffer))

        // Si es PDF, convertir a imagen
        if (isPdf(buffer) || url.toLowerCase().endsWith(".pdf")) {
          console.log(`[v0] Se detectó un PDF en ${url}, convirtiendo a imagen...`)
          buffer = await convertPdfToImage(buffer as any)
        }

        return buffer
      } catch (err) {
        console.warn(`[v0] No se pudo descargar o procesar imagen de ${url}, se enviará URL original:`, err)
        return url
      }
    }

    const [beforeContent, afterContent] = await Promise.all([
      fetchImage(beforeImageUrl),
      fetchImage(afterImageUrl)
    ])

    const result = await generateObject({
      model: groq(VISION_GROQ_MODEL),
      schema: comparisonSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Eres un arquitecto español experto en reformas. Compara estos dos planos arquitectónicos.

El PRIMER plano es el estado ACTUAL (ANTES de la reforma).
El SEGUNDO plano es el estado FUTURO (DESPUÉS de la reforma).

ANALIZA DETALLADAMENTE:

1. **Habitaciones añadidas**: Nuevas en el plano "después"
2. **Habitaciones eliminadas**: Existían "antes" pero no "después"
3. **Habitaciones modificadas**: Cambiaron de tamaño o forma
4. **Tabiques eliminados**: Paredes derribadas (estima metros lineales)
5. **Tabiques añadidos**: Nuevas paredes (estima metros lineales)

MUY IMPORTANTE - TRANSFORMACIÓN DE LA COCINA:

Detecta si la cocina cambió de tipo entre el plano "antes" y "después":

- **cocina**: Cocina tradicional, cerrada, separada del resto por paredes
- **cocina_americana**: Cocina ABIERTA AL SALÓN, sin pared de separación entre cocina y salón. 
  Se detecta cuando en el plano "después" se eliminó la pared entre cocina y salón, 
  creando un espacio único donde se ve cocina y salón conectados visualmente.
- **cocina_abierta**: Cocina AMPLIADA pero que sigue siendo independiente del salón.
  Se detecta cuando la cocina creció (más metros cuadrados) pero mantiene paredes 
  que la separan del salón.

EJEMPLOS DE DETECCIí“N:

1. Si en "antes" la cocina tenía pared con el salón y en "después" no hay pared:
   → beforeType: "cocina", afterType: "cocina_americana"
   
2. Si en "antes" la cocina era pequeña y en "después" es más grande pero sigue cerrada:
   → beforeType: "cocina", afterType: "cocina_abierta"
   
3. Si en "antes" ya estaba abierta al salón y sigue igual:
   → beforeType: "cocina_americana", afterType: "cocina_americana"

Calcula los metros totales de tabiques eliminados y añadidos.
MUY IMPORTANTE - CLASIFICACIÓN DE CAMBIOS ESTRUCTURALES:
- Un tabique es "eliminado" (remove) si aparece en el plano "antes" cerrando un espacio y ya no está en el plano "después".
- Un tabique es "añadido" (add) si aparece en el plano "después" creando nuevas divisiones que no existían en el "antes".
- CAMBIO DE TAMAÑO: Si una habitación cambia de metros cuadrados o proporciones, esto IMPLICA NECESARIAMENTE que el tabique que la delimitaba ha sido derribado y se ha construido uno nuevo en la nueva posición. ¡Asegúrate de reportar estos metros lineales!

USA LAS COTAS NUMÉRICAS DEL PLANO (ej: 270 es 2.70m). Si un tabique no tiene cota directa, estima su longitud en metros lineales usando la escala de las habitaciones contiguas.
REGLA MATEMÁTICA: El perímetro de un rectángulo es siempre 2 * (ancho + largo). No sumes paredes más de una vez.
TODO EN ESPAÑOL.`,
            },
            {
              type: "image",
              image: beforeContent,
            },
            {
              type: "image",
              image: afterContent,
            },
          ],
        },
      ],
    })

    console.log("[v0] Comparación completada")
    console.log("[v0] Kitchen transformation:", result.object.kitchenTransformation)

    return NextResponse.json({ success: true, comparison: result.object })
  } catch (error: any) {
    console.error("[v0] Error al comparar planos:", error)

    if (error.message?.includes("rate") || error.message?.includes("429")) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Por favor, espera un momento." }, { status: 429 })
    }

    return NextResponse.json({ error: error.message || "Error inesperado al comparar los planos" }, { status: 500 })
  }
}

