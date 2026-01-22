export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { extractText } from "unpdf"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] === INICIO DE ANíLISIS DE PRESUPUESTOS ===")

    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.log("[v0] Error: Usuario no autenticado")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log(`[v0] Usuario autenticado: ${session.user.id}`)

    const { fileUrls } = await request.json()

    if (!fileUrls || fileUrls.length < 2 || fileUrls.length > 3) {
      console.log(`[v0] Error: Número incorrecto de archivos: ${fileUrls?.length}`)
      return NextResponse.json({ error: "Debes proporcionar entre 2 y 3 presupuestos" }, { status: 400 })
    }

    console.log(`[v0] Analizando ${fileUrls.length} presupuestos:`, fileUrls)

    console.log("[v0] Descargando y extrayendo texto de PDFs...")
    const pdfTexts = await Promise.all(
      fileUrls.map(async (url: string, index: number) => {
        console.log(`[v0] Procesando PDF ${index + 1}/${fileUrls.length}: ${url}`)
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`Error descargando PDF ${index + 1}: ${response.status}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        console.log(`[v0] PDF ${index + 1} descargado: ${buffer.byteLength} bytes`)
        console.log(`[v0] Extrayendo texto del PDF ${index + 1}...`)

        const { text } = await extractText(buffer, { mergePages: true })

        console.log(`[v0] Texto extraído del PDF ${index + 1}: ${text.length} caracteres`)

        const filename = url.split("/").pop() || `presupuesto_${index + 1}.pdf`

        return {
          filename,
          text,
        }
      }),
    )

    console.log("[v0] Todos los PDFs procesados exitosamente")
    console.log("[v0] Enviando al modelo GPT-4o...")

    const { object: analysis } = await generateObject({
      model: "openai/gpt-4o",
      schema: z.object({
        summary: z.string(),
        budgets: z.array(
          z.object({
            name: z.string(),
            company: z.string(),
            totalPrice: z.number(),
            totalPriceWithVAT: z.number(),
            vatIncluded: z.boolean(),
            vatPercentage: z.number(),
            presentationScore: z.number(),
            presentationNotes: z.string(),
            detailScore: z.number(),
            detailNotes: z.string(),
            pricePerSqm: z.number().optional(),
            warranties: z.string().optional(),
            paymentTerms: z.string().optional(),
            executionTime: z.string().optional(),
            uniqueFeatures: z.array(z.string()),
          }),
        ),
        lineItemsComparison: z.array(
          z.object({
            category: z.string(),
            description: z.string(),
            unit: z.string(),
            budgets: z.array(
              z.object({
                budgetIndex: z.number(),
                quantity: z.number().nullable(),
                unitPrice: z.number().nullable(),
                totalPrice: z.number().nullable(),
                notes: z.string().optional(),
              }),
            ),
            quantityDiscrepancy: z.object({
              hasDiscrepancy: z.boolean(),
              minQuantity: z.number().nullable(),
              maxQuantity: z.number().nullable(),
              variationPercentage: z.number().nullable(),
              suspiciousReason: z.string().optional(),
            }),
          }),
        ),
        quantityTraps: z.array(
          z.object({
            item: z.string(),
            description: z.string(),
            severity: z.enum(["critical", "high", "medium", "low"]),
            budgetQuantities: z.array(
              z.object({
                budgetIndex: z.number(),
                quantity: z.number().nullable(),
                unit: z.string(),
              }),
            ),
            fraudRisk: z.string(),
            recommendation: z.string(),
          }),
        ),
        missingItems: z.array(
          z.object({
            item: z.string(),
            description: z.string(),
            category: z.string(),
            presentInBudgets: z.array(z.number()),
            missingInBudgets: z.array(z.number()),
            estimatedImpact: z.string(),
            isCritical: z.boolean(),
          }),
        ),
        priceAnalysis: z.object({
          cheapest: z.number(),
          mostExpensive: z.number(),
          averagePrice: z.number(),
          priceVariation: z.string(),
          suspiciousItems: z.array(
            z.object({
              item: z.string(),
              reason: z.string(),
              budgetIndex: z.number(),
              priceComparison: z.string(),
            }),
          ),
        }),
        fraudWarnings: z.array(
          z.object({
            title: z.string(),
            description: z.string(),
            severity: z.enum(["critical", "high", "medium", "low"]),
            affectedBudgets: z.array(z.number()),
            whatToCheck: z.string(),
          }),
        ),
        recommendation: z.object({
          bestOption: z.number(),
          reasoning: z.string(),
          confidenceLevel: z.enum(["high", "medium", "low"]),
          pros: z.array(z.string()),
          cons: z.array(z.string()),
          redFlags: z.array(z.string()),
          questionsToAsk: z.array(z.string()),
        }),
      }),
      prompt: `Eres un experto detective de fraudes en presupuestos de reformas y construcción. Tu misión es proteger al cliente identificando TODAS las trampas, discrepancias y posibles estafas.

**ðŸš¨ OBJETIVO PRINCIPAL: DETECTAR TRAMPAS Y FRAUDES ðŸš¨**

**ANíLISIS EXHAUSTIVO REQUERIDO:**

**1. EXTRACCIí“N DE CANTIDADES Y MEDICIONES:**
   - Para CADA partida, extrae la cantidad exacta y su unidad (mÂ², ml, ud, etc.)
   - Compara las cantidades entre presupuestos
   - ALERTA si hay diferencias significativas (ej: 100mÂ² vs 200mÂ² de pintura)
   - Identifica si las mediciones son coherentes con el proyecto

**2. DETECCIí“N DE PARTIDAS FANTASMA:**
   - Lista partidas que aparecen en UN presupuesto pero NO en otros
   - Evalúa si son necesarias o son "relleno" para inflar precio
   - Marca como CRíTICO si falta algo esencial (ej: impermeabilización)

**3. ANíLISIS DE DISCREPANCIAS DE CANTIDAD:**
   - Compara cantidades de la MISMA partida entre presupuestos
   - Ejemplo: Si uno dice "2 puertas" y otro "5 puertas" â†’ TRAMPA POTENCIAL
   - Calcula % de variación y marca como sospechoso si >30%
   - Explica por qué la diferencia podría ser fraudulenta

**4. DETECCIí“N DE PRECIOS INFLADOS:**
   - Compara precios unitarios de partidas similares
   - Marca precios que sean >50% más caros que la media
   - Identifica "partidas escondidas" con precios excesivos

**5. ANíLISIS DE OMISIONES CRíTICAS:**
   - Identifica trabajos que DEBERíAN estar pero faltan
   - Ejemplo: Lucido de paredes en un presupuesto pero no en otro
   - Evalúa el impacto económico de lo que falta

**6. ADVERTENCIAS DE FRAUDE:**
   - Genera alertas específicas sobre posibles estafas
   - Clasifica por severidad: CRíTICO, ALTO, MEDIO, BAJO
   - Explica QUí‰ verificar con cada empresa

**7. COMPARATIVA DETALLADA:**
   - Crea tabla comparativa con TODAS las partidas
   - Muestra cantidad, precio unitario y total de cada presupuesto
   - Marca en ROJO las discrepancias sospechosas

**FORMATO DE RESPUESTA:**

Para cada partida en lineItemsComparison:
- Muestra cantidad de CADA presupuesto (null si no aparece)
- Calcula variación de cantidad entre presupuestos
- Marca si hay discrepancia sospechosa

Para quantityTraps:
- Lista TODAS las diferencias de cantidad sospechosas
- Explica por qué es una posible trampa
- Da recomendación específica

Para fraudWarnings:
- Genera alertas claras y accionables
- Explica qué preguntar a la empresa
- Prioriza por severidad

**EJEMPLOS DE TRAMPAS A DETECTAR:**
- "Presupuesto A: 50mÂ² de alicatado | Presupuesto B: 100mÂ² â†’ ¿Por qué el doble?"
- "Presupuesto A incluye impermeabilización | Presupuesto B NO â†’ FALTA CRíTICA"
- "Presupuesto A: 2 puertas a 300€/ud | Presupuesto B: 5 puertas a 150€/ud â†’ Verificar cantidad real"
- "Presupuesto A: Lucido de paredes incluido | Presupuesto B: NO incluido â†’ Coste oculto"

---

${pdfTexts.map((pdf, index) => `**PRESUPUESTO ${index + 1}: ${pdf.filename}**\n\n${pdf.text}\n\n---\n\n`).join("")}

**RECUERDA:** Tu trabajo es proteger al cliente. Sé exhaustivo, desconfía de todo, y marca TODAS las discrepancias sospechosas.`,
    })

    console.log("[v0] Análisis recibido exitosamente")

    // Guardar análisis en la base de datos
    const analysisId = Math.random().toString(36).substring(7)
    const { error } = await supabase.from("budget_comparisons").insert({
      id: analysisId,
      user_id: session.user.id,
      file_urls: fileUrls,
      analysis: analysis,
    })

    if (error) {
      console.error("[v0] Error guardando análisis:", error)
    }

    console.log("[v0] === ANíLISIS COMPLETADO EXITOSAMENTE ===")
    return NextResponse.json({ analysisId, analysis })
  } catch (error) {
    console.error("[v0] ERROR FATAL:", error)
    console.error("[v0] Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al analizar presupuestos" },
      { status: 500 },
    )
  }
}

