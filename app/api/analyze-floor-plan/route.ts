export const dynamic = "force-dynamic"
import { generateObject } from "ai"
import { z } from "zod"
import { groq, VISION_GROQ_MODEL } from "@/lib/ia/groq"

export const maxDuration = 60

const VISION_MODEL = groq(VISION_GROQ_MODEL)

const analysisSchema = z.object({
  isValid: z.boolean().describe("Si la imagen es un plano válido"),
  totalArea: z.number().describe("írea total estimada en metros cuadrados"),
  totalPerimeter: z.number().describe("Perímetro total de la vivienda en metros lineales"),
  rooms: z
    .array(
      z.object({
        name: z
          .string()
          .describe(
            "Nombre de la habitación EN ESPAí‘OL (ej: Salón, Dormitorio 1, Cocina, Cocina Americana, Baño Principal)",
          ),
        type: z
          .enum([
            "dormitorio",
            "bano",
            "cocina",
            "cocina_americana",
            "cocina_abierta",
            "salon",
            "salon_comedor",
            "comedor",
            "pasillo",
            "terraza",
            "trastero",
            "otro",
          ])
          .describe("Tipo de habitación en español"),
        area: z.number().describe("írea en metros cuadrados"),
        perimeter: z.number().describe("Perímetro de la habitación en metros lineales (2*ancho + 2*largo)"),
        width: z.number().describe("Ancho estimado en metros"),
        length: z.number().describe("Largo estimado en metros"),
        features: z
          .array(z.string())
          .optional()
          .describe("Características en español (ventana, balcón, armario empotrado, etc.)"),
      }),
    )
    .describe("Lista de habitaciones detectadas"),
  summary: z.string().describe("Resumen del análisis en español"),
  confidence: z.number().min(0).max(100).describe("Nivel de confianza del análisis"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { imageUrl, skipValidation } = body

    if (!imageUrl) {
      return Response.json({ error: "Se requiere la URL de la imagen" }, { status: 400 })
    }

    console.log("[v0] Iniciando análisis de plano...")
    console.log("[v0] URL de imagen:", imageUrl)
    console.log("[v0] Modelo:", VISION_MODEL)

    const result = await generateObject({
      model: VISION_MODEL,
      schema: analysisSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Eres un experto arquitecto español analizando planos de viviendas. Analiza este plano con MíXIMA PRECISIí“N.

IMPORTANTE: TODA TU RESPUESTA DEBE ESTAR EN ESPAí‘OL.

=== ABREVIACIONES COMUNES EN PLANOS ESPAí‘OLES (MUY IMPORTANTE) ===

Debes reconocer estas abreviaciones típicas en planos de arquitectura españoles:

COMBINACIONES DE ESPACIOS (COCINA AMERICANA):
- "SC" = Salón-Cocina = COCINA AMERICANA (espacio único que integra salón y cocina)
- "S-C" = Salón-Cocina = COCINA AMERICANA
- "S/C" = Salón/Cocina = COCINA AMERICANA
- "SK" = Salón-Kitchen = COCINA AMERICANA
- "L-K" = Living-Kitchen = COCINA AMERICANA
- "SALON-COCINA" = COCINA AMERICANA
- "ESTAR-COCINA" = COCINA AMERICANA

Cuando veas "SC" o cualquier combinación de Salón+Cocina:
  â†’ Detecta como UNA SOLA habitación tipo "cocina_americana"
  â†’ Nombre: "Cocina Americana" (NO crear salón separado)
  â†’ El área indicada es el total del espacio combinado

ABREVIACIONES INDIVIDUALES:
- "S" = Salón / Sala de estar â†’ tipo: "salon", nombre: "Salón"
- "C" = Cocina â†’ tipo: "cocina", nombre: "Cocina"
- "B" = Baño â†’ tipo: "bano", nombre: "Baño"
- "H1", "H2", "H3" = Habitación/Dormitorio 1, 2, 3 â†’ tipo: "dormitorio"
- "D1", "D2" = Dormitorio 1, 2 â†’ tipo: "dormitorio"
- "HAB" = Habitación â†’ tipo: "dormitorio"
- "DORM" = Dormitorio â†’ tipo: "dormitorio"
- "P" = Pasillo â†’ tipo: "pasillo", nombre: "Pasillo"
- "T" = Terraza â†’ tipo: "terraza", nombre: "Terraza"
- "TR" = Trastero â†’ tipo: "trastero", nombre: "Trastero"
- "V" = Vestidor â†’ tipo: "otro", nombre: "Vestidor"
- "L" = Lavadero â†’ tipo: "otro", nombre: "Lavadero"
- "SD" o "S-D" = Salón-Comedor â†’ tipo: "salon_comedor", nombre: "Salón-Comedor"
- "E" = Entrada/Recibidor â†’ tipo: "pasillo", nombre: "Recibidor"
- "ASEO" = Baño pequeño â†’ tipo: "bano", nombre: "Aseo"
- "WC" = Baño/Aseo â†’ tipo: "bano"

=== REGLA CRíTICA DE COHERENCIA ===

Si el plano de ANTES tenía una cocina separada y el plano de DESPUí‰S muestra "SC":
  â†’ La cocina se ha UNIDO al salón
  â†’ El resultado es una COCINA AMERICANA
  â†’ NO puede desaparecer la cocina, se ha integrado

Una vivienda SIEMPRE debe tener cocina (ya sea separada o americana).
Si no detectas cocina separada, busca si está integrada en otro espacio (SC, salón-cocina, etc.)

=== INSTRUCCIONES DE ANíLISIS ===

1. Identifica TODAS las habitaciones visibles en el plano
2. Interpreta las abreviaciones según la tabla de arriba
3. Para cada habitación, estima sus dimensiones (ancho y largo)
4. CALCULA EL PERíMETRO: perimeter = 2 * width + 2 * length
5. Si hay medidas/cotas visibles, úsalas. Si no, estima basándote en proporciones típicas

CíLCULOS OBLIGATORIOS:
- Para cada habitación: perimeter = (2 í— ancho) + (2 í— largo)
- Ejemplo: habitación de 4m í— 3m â†’ perímetro = (2í—4) + (2í—3) = 14 metros lineales
- totalPerimeter = suma de todos los perímetros

=== REGLAS DE NOMENCLATURA ===

1. NUNCA NUMERAR estas habitaciones (solo hay una):
   - "Cocina", "Cocina Americana", "Cocina Abierta"
   - "Salón", "Salón-Comedor"
   - "Comedor", "Pasillo", "Recibidor"

2. SIEMPRE NUMERAR cuando hay más de una:
   - "Dormitorio 1", "Dormitorio 2", "Dormitorio 3"
   - "Baño 1", "Baño 2" o "Baño", "Aseo"

3. TIPOS DE COCINA:
   - "cocina_americana": Cocina INTEGRADA con el salón (SC, salón-cocina, espacio abierto)
   - "cocina_abierta": Cocina AMPLIADA pero separada del salón
   - "cocina": Cocina tradicional separada por paredes

4. CORRELACIí“N CON ETIQUETAS:
   - "H1", "H2", "H3" â†’ "Dormitorio 1", "Dormitorio 2", "Dormitorio 3"
   - "SC" â†’ "Cocina Americana" (tipo: cocina_americana)
   - "B" â†’ "Baño"
   - "S" â†’ "Salón"

=== TIPOS DE HABITACIí“N ===

Usa exactamente estos valores:
- dormitorio, bano, cocina, cocina_americana, cocina_abierta
- salon, salon_comedor, comedor, pasillo, terraza, trastero, otro

=== CARACTERíSTICAS (en español) ===
"ventana", "balcón", "armario empotrado", "puerta corredera", "bañera", "ducha", "bidé"

Si la imagen NO es un plano de vivienda, marca isValid como false.

TODO EN ESPAí‘OL, SIN EXCEPCIí“N.`,
            },
            {
              type: "image",
              image: imageUrl,
            },
          ],
        },
      ],
    })

    console.log("[v0] Análisis completado:", JSON.stringify(result.object, null, 2))

    return Response.json({
      success: true,
      analysis: result.object,
    })
  } catch (error) {
    console.error("[v0] Error en análisis de plano:", error)
    return Response.json(
      {
        error: "Error al analizar el plano",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

