export const dynamic = "force-dynamic"
import { generateObject } from "ai"
import { z } from "zod"
import { groq, VISION_GROQ_MODEL } from "@/lib/ia/groq"
import { convertPdfToImage, isPdf } from "@/lib/utils/pdf-to-image"

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
            "hall",
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
  enclosures: z
    .array(
      z.object({
        type: z.string().describe("Tipo de habitáculo (ej: armario, despensa)"),
        area: z.number().describe("Área en m²"),
      }),
    )
    .optional()
    .describe("Pequeños habitáculos detectados que no son habitaciones completas (como armarios empotrados 'arm')"),
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

    // Descargar imagen y convertir si es PDF
    let imageContent: Buffer
    try {
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw new Error(`Error al obtener la imagen: ${imageResponse.statusText}`)
      }
      const arrayBuffer = await imageResponse.arrayBuffer()
      let buffer = Buffer.from(new Uint8Array(arrayBuffer))
      console.log("[v0] Archivo descargado correctamente, tamaño:", buffer.length, "bytes")

      // Si es PDF, convertir a imagen
      if (isPdf(buffer) || imageUrl.toLowerCase().endsWith(".pdf")) {
        console.log("[v0] Se detectó un PDF, convirtiendo a imagen...")
        buffer = await convertPdfToImage(buffer as any)
      }

      imageContent = buffer
    } catch (fetchError: any) {
      console.error("[v0] Error al procesar imagen:", fetchError)
      return Response.json(
        {
          error: "Error al procesar el archivo del plano",
          details: fetchError.message || "No se pudo descargar o convertir el archivo"
        },
        { status: 500 }
      )
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
- "HLL" = Hall / Recibidor → tipo: "hall", nombre: "Hall"
- "ASEO" = Baño pequeño → tipo: "baño", nombre: "Aseo"
- "WC" = Baño/Aseo → tipo: "baño"
- "arm", "A", "armario" = Armario empotrado → Repórtalo en el campo 'enclosures'.

=== REGLAS ESTRICTAS PARA HABITÁCULOS (ENCLOSURES) ===
1. SOLO considera 'enclosure' si tiene una etiqueta EXPLÍCITA escrita en el plano como "arm", "A" o "armario".
2. NO detectes huecos o espacios vacíos como armarios si no tienen la etiqueta, aunque parezcan serlo. En ese caso, su superficie debe formar parte de la habitación contigua.
3. NUNCA incluyas armarios como habitaciones independientes en la lista 'rooms'.

=== REGLA DE DETECCIÓN DE ENTRADA (MANDATORIA) ===

- La habitación más próxima a la puerta principal de la vivienda que no tenga un tipo claro, identifícala como "Hall" (tipo: hall).
- Si ves la etiqueta "HLL", es inequívocamente el "Hall".

=== REGLA PARA HABITACIONES DESCONOCIDAS ===
- Si detectas una habitación pero no puedes determinar su tipo según la lista, asígnale tipo: "otro" y pon el nombre que creas más descriptivo basado en las etiquetas del plano.

=== REGLA CRÍTICA DE COHERENCIA ===

Si el plano de ANTES tenía una cocina separada y el plano de DESPUÉS muestra "SC":
  → La cocina se ha UNIDO al salón
  → El resultado es una COCINA AMERICANA
  → NO puede desaparecer la cocina, se ha integrado

Una vivienda SIEMPRE debe tener cocina (ya sea separada o americana).
Si no detectas cocina separada, busca si está integrada en otro espacio (SC, salón-cocina, etc.)

=== INSTRUCCIONES DE ANÁLISIS ===

1. Identifica TODAS las habitaciones visibles en el plano.
2. Interpreta las abreviaciones según la tabla de arriba.
3. Para cada habitación, usa las MEDIDAS NUMÉRICAS (cotas) escritas en el plano (ej: 270, 330, 495).
   - Si el plano dice 270, significa 2.70 metros.
   - Si el plano dice 495, significa 4.95 metros.
4. REGLA DE ORO PARA EL PERÍMETRO:
   - Para habitaciones rectangulares: perimeter = 2 * (ancho + largo).
   - NUNCA sumes paredes laterales más de una vez.
   - Ejemplo: Si una Cocina mide 2.70 x 3.30, su perímetro es 12.00m. CUALQUIER OTRO RESULTADO ES UN ERROR.
5. Cuenta puertas y ventanas para cada habitación.
6. Si no hay medidas visibles, estima basándote en proporciones típicas del resto del plano.

CÁLCULOS OBLIGATORIOS:
- Para cada habitación: perimeter = (2 × ancho) + (2 × largo)
- Ejemplo: habitación de 4m × 3m → perímetro = (2×4) + (2×3) = 14 metros lineales
- totalPerimeter = suma de todos los perímetros

=== REGLAS DE NOMENCLATURA ===

1. NUNCA NUMERAR estas habitaciones (solo hay una):
   - "Cocina", "Cocina Americana", "Cocina Abierta"
   - "Salón", "Salón-Comedor"
   - "Comedor", "Pasillo", "Hall"

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
   - "HLL" → "Hall"

=== TIPOS DE HABITACIÓN ===

Usa exactamente estos valores:
- dormitorio, bano, cocina, cocina_americana, cocina_abierta
- salon, salon_comedor, comedor, pasillo, hall, terraza, trastero, otro

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
