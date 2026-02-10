import { NextResponse } from "next/server"
import { createGroq } from "@ai-sdk/groq"
import { generateText } from "ai"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const diagnostics = {
            environment: {
                hasGroqKey: !!process.env.GROQ_API_KEY,
                groqKeyLength: process.env.GROQ_API_KEY?.length || 0,
                groqKeyPrefix: process.env.GROQ_API_KEY?.substring(0, 7) || "N/A",
                hasFalKey: !!process.env.FAL_KEY,
                falKeyLength: process.env.FAL_KEY?.length || 0,
                nodeEnv: process.env.NODE_ENV,
            },
            tests: [] as any[],
        }

        // Test 1: Check if Groq API key exists
        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json(
                {
                    error: "GROQ_API_KEY not found in environment variables",
                    diagnostics,
                    fix: "Add GROQ_API_KEY to your .env.local file and restart the server",
                },
                { status: 500 }
            )
        }

        // Test 2: Try to create Groq provider
        let groq
        try {
            groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
            diagnostics.tests.push({
                name: "Create Groq Provider",
                status: "✅ Success",
            })
        } catch (error) {
            diagnostics.tests.push({
                name: "Create Groq Provider",
                status: "❌ Failed",
                error: error instanceof Error ? error.message : String(error),
            })
            return NextResponse.json({ error: "Failed to create Groq provider", diagnostics }, { status: 500 })
        }

        // Test 3: Test with fast model (llama-3.1-8b-instant)
        try {
            const { text } = await generateText({
                model: groq("llama-3.1-8b-instant"),
                prompt: "Responde solo con: SI",
                maxTokens: 5,
            })

            diagnostics.tests.push({
                name: "Test llama-3.1-8b-instant",
                status: "✅ Success",
                response: text,
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            diagnostics.tests.push({
                name: "Test llama-3.1-8b-instant",
                status: "❌ Failed",
                error: errorMessage,
            })

            // Provide specific guidance based on error
            let fix = "Unknown error"
            if (errorMessage.includes("API key")) {
                fix = "Invalid API key. Get a new one from https://console.groq.com/keys"
            } else if (errorMessage.includes("rate")) {
                fix = "Rate limit exceeded. Wait a few minutes or check https://console.groq.com/settings/billing"
            } else if (errorMessage.includes("model")) {
                fix = "Model not available. Try a different model or check Groq documentation"
            } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
                fix = "Network error. Check your internet connection"
            }

            return NextResponse.json(
                {
                    error: "AI API test failed",
                    diagnostics,
                    fix,
                    errorDetails: errorMessage,
                },
                { status: 500 }
            )
        }

        // Test 4: Test with full model (llama-3.3-70b-versatile)
        try {
            const { text } = await generateText({
                model: groq("llama-3.3-70b-versatile"),
                prompt: "Responde solo con: OK",
                maxTokens: 5,
            })

            diagnostics.tests.push({
                name: "Test llama-3.3-70b-versatile",
                status: "✅ Success",
                response: text,
            })
        } catch (error) {
            diagnostics.tests.push({
                name: "Test llama-3.3-70b-versatile",
                status: "⚠️ Failed (fast model works, this is optional)",
                error: error instanceof Error ? error.message : String(error),
            })
        }

        return NextResponse.json({
            message: "✅ AI APIs are working correctly",
            diagnostics,
            recommendation: "All tests passed! Your AI tools should work normally.",
        })
    } catch (error) {
        console.error("[AI Diagnostic] Unexpected error:", error)
        return NextResponse.json(
            {
                error: "Unexpected error during diagnostics",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
