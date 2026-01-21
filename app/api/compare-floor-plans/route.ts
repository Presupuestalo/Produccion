export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"

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
    .describe("Habitaciones aÃ±adidas en el nuevo plano"),
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
    .describe("Habitaciones que cambiaron de tamaÃ±o"),
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
      hasChanged: z.boolean().describe("Si la cocina cambiÃ³ de tipo"),
      beforeType: z
        .enum(["cocina", "cocina_americana", "cocina_abierta", "no_existia"])
        .describe("Tipo de cocina en el plano ANTES"),
      afterType: z
        .enum(["cocina", "cocina_americana", "cocina_abierta", "eliminada"])
        .describe("Tipo de cocina en el plano DESPUÃ‰S"),
      description: z.string().describe("DescripciÃ³n del cambio en la cocina"),
    })
    .describe("TransformaciÃ³n de la cocina si aplica"),
  suggestAddPartitions: z.boolean().describe("Si se recomienda aÃ±adir tabiquerÃ­a"),
  totalWallsRemovedMeters: z.number().describe("Total metros lineales de tabiques eliminados"),
  totalWallsAddedMeters: z.number().describe("Total metros lineales de tabiques aÃ±adidos"),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    console.log("[v0] Starting floor plan comparison...")

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { beforeImageUrl, afterImageUrl } = await request.json()

    if (!beforeImageUrl || !afterImageUrl) {
      return NextResponse.json({ error: "Se requieren ambas imÃ¡genes (antes y despuÃ©s)" }, { status: 400 })
    }

    console.log("[v0] Comparando planos:")
    console.log("[v0] - Before:", beforeImageUrl)
    console.log("[v0] - After:", afterImageUrl)

    const result = await generateObject({
      model: "anthropic/claude-sonnet-4-20250514",
      schema: comparisonSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Eres un arquitecto espaÃ±ol experto en reformas. Compara estos dos planos arquitectÃ³nicos.

El PRIMER plano es el estado ACTUAL (ANTES de la reforma).
El SEGUNDO plano es el estado FUTURO (DESPUÃ‰S de la reforma).

ANALIZA DETALLADAMENTE:

1. **Habitaciones aÃ±adidas**: Nuevas en el plano "despuÃ©s"
2. **Habitaciones eliminadas**: ExistÃ­an "antes" pero no "despuÃ©s"
3. **Habitaciones modificadas**: Cambiaron de tamaÃ±o o forma
4. **Tabiques eliminados**: Paredes derribadas (estima metros lineales)
5. **Tabiques aÃ±adidos**: Nuevas paredes (estima metros lineales)

MUY IMPORTANTE - TRANSFORMACIÃ“N DE LA COCINA:

Detecta si la cocina cambiÃ³ de tipo entre el plano "antes" y "despuÃ©s":

- **cocina**: Cocina tradicional, cerrada, separada del resto por paredes
- **cocina_americana**: Cocina ABIERTA AL SALÃ“N, sin pared de separaciÃ³n entre cocina y salÃ³n. 
  Se detecta cuando en el plano "despuÃ©s" se eliminÃ³ la pared entre cocina y salÃ³n, 
  creando un espacio Ãºnico donde se ve cocina y salÃ³n conectados visualmente.
- **cocina_abierta**: Cocina AMPLIADA pero que sigue siendo independiente del salÃ³n.
  Se detecta cuando la cocina creciÃ³ (mÃ¡s metros cuadrados) pero mantiene paredes 
  que la separan del salÃ³n.

EJEMPLOS DE DETECCIÃ“N:

1. Si en "antes" la cocina tenÃ­a pared con el salÃ³n y en "despuÃ©s" no hay pared:
   â†’ beforeType: "cocina", afterType: "cocina_americana"
   
2. Si en "antes" la cocina era pequeÃ±a y en "despuÃ©s" es mÃ¡s grande pero sigue cerrada:
   â†’ beforeType: "cocina", afterType: "cocina_abierta"
   
3. Si en "antes" ya estaba abierta al salÃ³n y sigue igual:
   â†’ beforeType: "cocina_americana", afterType: "cocina_americana"

Calcula los metros totales de tabiques eliminados y aÃ±adidos.
TODO EN ESPAÃ‘OL.`,
            },
            {
              type: "image",
              image: beforeImageUrl,
            },
            {
              type: "image",
              image: afterImageUrl,
            },
          ],
        },
      ],
    })

    console.log("[v0] ComparaciÃ³n completada")
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

