export const dynamic = "force-dynamic"
import { generateObject } from "ai"
import { z } from "zod"

export const maxDuration = 60

const VISION_MODEL = "anthropic/claude-sonnet-4-20250514"

const analysisSchema = z.object({
  isValid: z.boolean().describe("Si la imagen es un plano vÃ¡lido"),
  totalArea: z.number().describe("Ãrea total estimada en metros cuadrados"),
  totalPerimeter: z.number().describe("PerÃ­metro total de la vivienda en metros lineales"),
  rooms: z
    .array(
      z.object({
        name: z
          .string()
          .describe(
            "Nombre de la habitaciÃ³n EN ESPAÃ‘OL (ej: SalÃ³n, Dormitorio 1, Cocina, Cocina Americana, BaÃ±o Principal)",
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
          .describe("Tipo de habitaciÃ³n en espaÃ±ol"),
        area: z.number().describe("Ãrea en metros cuadrados"),
        perimeter: z.number().describe("PerÃ­metro de la habitaciÃ³n en metros lineales (2*ancho + 2*largo)"),
        width: z.number().describe("Ancho estimado en metros"),
        length: z.number().describe("Largo estimado en metros"),
        features: z
          .array(z.string())
          .optional()
          .describe("CaracterÃ­sticas en espaÃ±ol (ventana, balcÃ³n, armario empotrado, etc.)"),
      }),
    )
    .describe("Lista de habitaciones detectadas"),
  summary: z.string().describe("Resumen del anÃ¡lisis en espaÃ±ol"),
  confidence: z.number().min(0).max(100).describe("Nivel de confianza del anÃ¡lisis"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { imageUrl, skipValidation } = body

    if (!imageUrl) {
      return Response.json({ error: "Se requiere la URL de la imagen" }, { status: 400 })
    }

    console.log("[v0] Iniciando anÃ¡lisis de plano...")
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
              text: `Eres un experto arquitecto espaÃ±ol analizando planos de viviendas. Analiza este plano con MÃXIMA PRECISIÃ“N.

IMPORTANTE: TODA TU RESPUESTA DEBE ESTAR EN ESPAÃ‘OL.

=== ABREVIACIONES COMUNES EN PLANOS ESPAÃ‘OLES (MUY IMPORTANTE) ===

Debes reconocer estas abreviaciones tÃ­picas en planos de arquitectura espaÃ±oles:

COMBINACIONES DE ESPACIOS (COCINA AMERICANA):
- "SC" = SalÃ³n-Cocina = COCINA AMERICANA (espacio Ãºnico que integra salÃ³n y cocina)
- "S-C" = SalÃ³n-Cocina = COCINA AMERICANA
- "S/C" = SalÃ³n/Cocina = COCINA AMERICANA
- "SK" = SalÃ³n-Kitchen = COCINA AMERICANA
- "L-K" = Living-Kitchen = COCINA AMERICANA
- "SALON-COCINA" = COCINA AMERICANA
- "ESTAR-COCINA" = COCINA AMERICANA

Cuando veas "SC" o cualquier combinaciÃ³n de SalÃ³n+Cocina:
  â†’ Detecta como UNA SOLA habitaciÃ³n tipo "cocina_americana"
  â†’ Nombre: "Cocina Americana" (NO crear salÃ³n separado)
  â†’ El Ã¡rea indicada es el total del espacio combinado

ABREVIACIONES INDIVIDUALES:
- "S" = SalÃ³n / Sala de estar â†’ tipo: "salon", nombre: "SalÃ³n"
- "C" = Cocina â†’ tipo: "cocina", nombre: "Cocina"
- "B" = BaÃ±o â†’ tipo: "bano", nombre: "BaÃ±o"
- "H1", "H2", "H3" = HabitaciÃ³n/Dormitorio 1, 2, 3 â†’ tipo: "dormitorio"
- "D1", "D2" = Dormitorio 1, 2 â†’ tipo: "dormitorio"
- "HAB" = HabitaciÃ³n â†’ tipo: "dormitorio"
- "DORM" = Dormitorio â†’ tipo: "dormitorio"
- "P" = Pasillo â†’ tipo: "pasillo", nombre: "Pasillo"
- "T" = Terraza â†’ tipo: "terraza", nombre: "Terraza"
- "TR" = Trastero â†’ tipo: "trastero", nombre: "Trastero"
- "V" = Vestidor â†’ tipo: "otro", nombre: "Vestidor"
- "L" = Lavadero â†’ tipo: "otro", nombre: "Lavadero"
- "SD" o "S-D" = SalÃ³n-Comedor â†’ tipo: "salon_comedor", nombre: "SalÃ³n-Comedor"
- "E" = Entrada/Recibidor â†’ tipo: "pasillo", nombre: "Recibidor"
- "ASEO" = BaÃ±o pequeÃ±o â†’ tipo: "bano", nombre: "Aseo"
- "WC" = BaÃ±o/Aseo â†’ tipo: "bano"

=== REGLA CRÃTICA DE COHERENCIA ===

Si el plano de ANTES tenÃ­a una cocina separada y el plano de DESPUÃ‰S muestra "SC":
  â†’ La cocina se ha UNIDO al salÃ³n
  â†’ El resultado es una COCINA AMERICANA
  â†’ NO puede desaparecer la cocina, se ha integrado

Una vivienda SIEMPRE debe tener cocina (ya sea separada o americana).
Si no detectas cocina separada, busca si estÃ¡ integrada en otro espacio (SC, salÃ³n-cocina, etc.)

=== INSTRUCCIONES DE ANÃLISIS ===

1. Identifica TODAS las habitaciones visibles en el plano
2. Interpreta las abreviaciones segÃºn la tabla de arriba
3. Para cada habitaciÃ³n, estima sus dimensiones (ancho y largo)
4. CALCULA EL PERÃMETRO: perimeter = 2 * width + 2 * length
5. Si hay medidas/cotas visibles, Ãºsalas. Si no, estima basÃ¡ndote en proporciones tÃ­picas

CÃLCULOS OBLIGATORIOS:
- Para cada habitaciÃ³n: perimeter = (2 Ã— ancho) + (2 Ã— largo)
- Ejemplo: habitaciÃ³n de 4m Ã— 3m â†’ perÃ­metro = (2Ã—4) + (2Ã—3) = 14 metros lineales
- totalPerimeter = suma de todos los perÃ­metros

=== REGLAS DE NOMENCLATURA ===

1. NUNCA NUMERAR estas habitaciones (solo hay una):
   - "Cocina", "Cocina Americana", "Cocina Abierta"
   - "SalÃ³n", "SalÃ³n-Comedor"
   - "Comedor", "Pasillo", "Recibidor"

2. SIEMPRE NUMERAR cuando hay mÃ¡s de una:
   - "Dormitorio 1", "Dormitorio 2", "Dormitorio 3"
   - "BaÃ±o 1", "BaÃ±o 2" o "BaÃ±o", "Aseo"

3. TIPOS DE COCINA:
   - "cocina_americana": Cocina INTEGRADA con el salÃ³n (SC, salÃ³n-cocina, espacio abierto)
   - "cocina_abierta": Cocina AMPLIADA pero separada del salÃ³n
   - "cocina": Cocina tradicional separada por paredes

4. CORRELACIÃ“N CON ETIQUETAS:
   - "H1", "H2", "H3" â†’ "Dormitorio 1", "Dormitorio 2", "Dormitorio 3"
   - "SC" â†’ "Cocina Americana" (tipo: cocina_americana)
   - "B" â†’ "BaÃ±o"
   - "S" â†’ "SalÃ³n"

=== TIPOS DE HABITACIÃ“N ===

Usa exactamente estos valores:
- dormitorio, bano, cocina, cocina_americana, cocina_abierta
- salon, salon_comedor, comedor, pasillo, terraza, trastero, otro

=== CARACTERÃSTICAS (en espaÃ±ol) ===
"ventana", "balcÃ³n", "armario empotrado", "puerta corredera", "baÃ±era", "ducha", "bidÃ©"

Si la imagen NO es un plano de vivienda, marca isValid como false.

TODO EN ESPAÃ‘OL, SIN EXCEPCIÃ“N.`,
            },
            {
              type: "image",
              image: imageUrl,
            },
          ],
        },
      ],
    })

    console.log("[v0] AnÃ¡lisis completado:", JSON.stringify(result.object, null, 2))

    return Response.json({
      success: true,
      analysis: result.object,
    })
  } catch (error) {
    console.error("[v0] Error en anÃ¡lisis de plano:", error)
    return Response.json(
      {
        error: "Error al analizar el plano",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

