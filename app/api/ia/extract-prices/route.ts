export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { extractText } from "unpdf"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting price extraction...")

    const { pdfUrl } = await request.json()

    if (!pdfUrl) {
      return NextResponse.json({ error: "URL del PDF no proporcionada" }, { status: 400 })
    }

    console.log("[v0] Downloading PDF from:", pdfUrl)

    // Download PDF
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error("Error al descargar el PDF")
    }

    const arrayBuffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    console.log("[v0] PDF downloaded:", uint8Array.byteLength, "bytes")
    console.log("[v0] Extracting text from PDF...")

    // Extract text from PDF
    const { text } = await extractText(uint8Array, { mergePages: true })

    console.log("[v0] Extracted text length:", text.length, "characters")
    console.log("[v0] First 500 chars:", text.slice(0, 500))
    console.log("[v0] Analyzing prices with AI...")

    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY || process.env.API_KEY_GROQ_API_KEY,
    })

    const { text: aiResponse } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `Eres un experto en anÃ¡lisis de presupuestos de reformas espaÃ±oles. Extrae TODOS los precios de este presupuesto.

**IMPORTANTE: Debes responder ÃšNICAMENTE con un objeto JSON vÃ¡lido, sin texto adicional antes o despuÃ©s.**

**FORMATO DE RESPUESTA (copia exactamente esta estructura):**
{
  "prices": [
    {
      "code": null,
      "category": "CATEGORÃA",
      "subcategory": "SUBCATEGORÃA O CONCEPTO",
      "description": "DescripciÃ³n detallada del trabajo",
      "notes": null,
      "unit": "mÂ²",
      "labor_cost": 0,
      "material_cost": 0,
      "equipment_cost": 0,
      "other_cost": 0,
      "final_price": 0
    }
  ]
}

**REGLAS:**
1. Responde SOLO con el JSON, sin explicaciones
2. Todos los nÃºmeros deben ser numÃ©ricos, no strings
3. Si no hay valor, usa null o 0
4. La categorÃ­a debe ser el tÃ­tulo de la secciÃ³n (ej: DEMOLICIONES, ALBAÃ‘ILERÃA)
5. El subcategory es el concepto especÃ­fico
6. El final_price es el precio unitario de la columna PRECIO

Analiza este presupuesto:

${text.slice(0, 15000)}`,
    })

    console.log("[v0] AI response received")
    console.log("[v0] Response length:", aiResponse.length)
    console.log("[v0] First 200 chars of response:", aiResponse.slice(0, 200))
    console.log("[v0] Last 200 chars of response:", aiResponse.slice(-200))

    let result
    try {
      let jsonString = aiResponse.trim()

      // Remove markdown code blocks if present
      jsonString = jsonString.replace(/```json\s*/g, "").replace(/```\s*/g, "")

      // Try to find JSON object in the response
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/s)
      if (jsonMatch) {
        jsonString = jsonMatch[0]
      }

      console.log("[v0] Attempting to parse JSON...")
      console.log("[v0] JSON string to parse (first 300 chars):", jsonString.slice(0, 300))

      result = JSON.parse(jsonString)

      if (!result.prices || !Array.isArray(result.prices)) {
        console.error("[v0] Invalid structure - missing prices array")
        throw new Error("La respuesta de la IA no tiene el formato esperado (falta array de precios)")
      }

      console.log("[v0] Successfully parsed JSON with", result.prices.length, "prices")
    } catch (parseError) {
      console.error("[v0] Error parsing JSON:", parseError)
      console.error("[v0] Full AI Response:", aiResponse)

      return NextResponse.json(
        {
          error: "Error al parsear la respuesta de la IA",
          details: parseError instanceof Error ? parseError.message : "Error desconocido",
          aiResponse: aiResponse.slice(0, 500), // Include first 500 chars for debugging
        },
        { status: 500 },
      )
    }

    console.log("[v0] AI analysis completed. Extracted", result.prices.length, "prices")

    return NextResponse.json({
      success: true,
      prices: result.prices,
    })
  } catch (error) {
    console.error("[v0] Error extracting prices:", error)

    if (error instanceof Error) {
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error stack:", error.stack)

      // Check if it's a rate limit error
      if (error.message.includes("rate_limit_exceeded") || error.message.includes("Rate limit")) {
        return NextResponse.json(
          {
            error:
              "Has alcanzado el lÃ­mite de uso de la IA. Por favor, espera unos minutos e intÃ©ntalo de nuevo, o actualiza tu plan en https://console.groq.com/settings/billing",
          },
          { status: 429 },
        )
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al extraer precios" },
      { status: 500 },
    )
  }
}

