export const dynamic = "force-dynamic"
import { generateObject } from "ai"
import { z } from "zod"
import { groq, VISION_GROQ_MODEL } from "@/lib/ia/groq"

export const maxDuration = 60

const VISION_MODEL = groq(VISION_GROQ_MODEL)

const analysisSchema = z.object({
  isValid: z.boolean().describe("Si la imagen es un plano válido"),
  totalArea: z.number().describe("Área total estimada en metros cuadrados"),
  totalPerimeter: z.number().describe("Perímetro total de la vivienda en metros lineales"),
  rooms: z
    .array(
      z.object({
        name: z
          .string()
          .describe(
            "Nombre de la habitación EN ESPAÑOL (ej: Salón, Dormitorio 1, Cocina, Cocina Americana, Baño Principal)",
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
        area: z.number().describe("Área en metros cuadrados"),
        perimeter: z.number().describe("Perímetro de la habitación en metros lineales (2*ancho + 2*largo)"),
        width: z.number().describe("Ancho estimado en metros"),
        length: z.number().describe("Largo estimado en metros"),
        doors: z.number().default(1).describe("Número de puertas detectadas"),
        windows: z.number().default(0).describe("Número de ventanas detectadas"),
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
    console.log("[v0] URL de imagen original:", imageUrl)

    // Convertir imagen a Base64 para asegurar que Groq pueda acceder a ella
    // Especialmente útil para desarrollo local si la URL es localhost
    let imageContent: string | Buffer
    try {
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw new Error(`Error al obtener la imagen: ${imageResponse.statusText}`)
      }
      const arrayBuffer = await imageResponse.arrayBuffer()
      imageContent = Buffer.from(arrayBuffer)
      console.log("[v0] Imagen descargada correctamente, tamaño:", imageContent.length)
    } catch (fetchError) {
      console.error("[v0] Error al descargar imagen, intentando usar URL directamente:", fetchError)
      imageContent = imageUrl
    }

    console.log("[v0] Usando modelo:", VISION_GROQ_MODEL)

    const result = await generateObject({
      model: groq(VISION_GROQ_MODEL),
      schema: analysisSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Eres un experto arquitecto español analizando planos de viviendas. Analiza este plano con MÁXIMA PRECISIÓN.

IMPORTANTE: TODA TU RESPUESTA DEBE ESTAR EN ESPAÑOL.

=== ABREVIACIONES COMUNES EN PLANOS ESPAÑOLES (MUY IMPORTANTE) ===

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
  → Detecta como UNA SOLA habitación tipo "cocina_americana"
  → Nombre: "Cocina Americana" (NO crear salón separado)
  → El área indicada es el total del espacio combinado

ABREVIACIONES INDIVIDUALES:
- "S" = Salón / Sala de estar → tipo: "salon", nombre: "Salón"
- "C" = Cocina → tipo: "cocina", nombre: "Cocina"
- "B" = Baño → tipo: "bano", nombre: "Baño"
- "H1", "H2", "H3" = Habitación/Dormitorio 1, 2, 3 → tipo: "dormitorio"
- "D1", "D2" = Dormitorio 1, 2 → tipo: "dormitorio"
- "HAB" = Habitación → tipo: "dormitorio"
- "DORM" = Dormitorio → tipo: "dormitorio"
- "P" = Pasillo → tipo: "pasillo", nombre: "Pasillo"
- "T" = Terraza → tipo: "terraza", nombre: "Terraza"
- "TR" = Trastero → tipo: "trastero", nombre: "Trastero"
- "V" = Vestidor → tipo: "otro", nombre: "Vestidor"
- "L" = Lavadero → tipo: "otro", nombre: "Lavadero"
- "SD" o "S-D" = Salón-Comedor → tipo: "salon_comedor", nombre: "Salón-Comedor"
- "E" = Entrada/Recibidor → tipo: "pasillo", nombre: "Recibidor"
- "ASEO" = Baño pequeño → tipo: "bano", nombre: "Aseo"
- "WC" = Baño/Aseo → tipo: "bano"

=== REGLA CRÍTICA DE COHERENCIA ===

Si el plano de ANTES tenía una cocina separada y el plano de DESPUÉS muestra "SC":
  → La cocina se ha UNIDO al salón
  → El resultado es una COCINA AMERICANA
  → NO puede desaparecer la cocina, se ha integrado

Una vivienda SIEMPRE debe tener cocina (ya sea separada o americana).
Si no detectas cocina separada, busca si está integrada en otro espacio (SC, salón-cocina, etc.)

=== INSTRUCCIONES DE ANÁLISIS ===

1. Identifica TODAS las habitaciones visibles en el plano
2. Interpreta las abreviaciones según la tabla de arriba
3. Para cada habitación, estima sus dimensiones (ancho y largo)
4. CALCULA EL PERÍMETRO: perimeter = 2 * width + 2 * length
5. Cuenta puertas y ventanas para cada habitación.
6. Si hay medidas/cotas visibles, úsalas. Si no, estima basándote en proporciones típicas

CÁLCULOS OBLIGATORIOS:
- Para cada habitación: perimeter = (2 × ancho) + (2 × largo)
- Ejemplo: habitación de 4m × 3m → perímetro = (2×4) + (2×3) = 14 metros lineales
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

4. CORRELACIÓN CON ETIQUETAS:
   - "H1", "H2", "H3" → "Dormitorio 1", "Dormitorio 2", "Dormitorio 3"
   - "SC" → "Cocina Americana" (tipo: cocina_americana)
   - "B" → "Baño"
   - "S" → "Salón"

=== TIPOS DE HABITACIÓN ===

Usa exactamente estos valores:
- dormitorio, bano, cocina, cocina_americana, cocina_abierta
- salon, salon_comedor, comedor, pasillo, terraza, trastero, otro

=== CARACTERÍSTICAS (en español) ===
"ventana", "balcón", "armario empotrado", "puerta corredera", "bañera", "ducha", "bidé"

Si la imagen NO es un plano de vivienda, marca isValid como false.

TODO EN ESPAÑOL, SIN EXCEPCIÓN.`,
            },
            {
              type: "image",
              image: imageContent,
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
