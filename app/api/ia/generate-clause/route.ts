export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { generateText } from "ai"
import { groqProvider, FAST_GROQ_MODEL } from "@/lib/ia/groq"

export async function POST(request: Request) {
    try {
        const { prompt } = await request.json()

        if (!prompt) {
            return NextResponse.json({ error: "Prompt es requerido" }, { status: 400 })
        }

        const { text } = await generateText({
            model: groqProvider(FAST_GROQ_MODEL),
            prompt: `Genera una cláusula de contrato de reforma de obra basada en la siguiente descripción: "${prompt}". 
      
La cláusula debe ser profesional, clara y en español. No incluyas numeración, solo el texto de la cláusula.`,
        })

        return NextResponse.json({ text: text.trim() })
    } catch (error) {
        console.error("[generate-clause] Error:", error)
        return NextResponse.json({ error: "Error al generar la cláusula" }, { status: 500 })
    }
}
