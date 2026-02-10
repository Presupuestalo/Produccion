// Diagnostic script for AI tools
import { createGroq } from "@ai-sdk/groq"
import { generateText } from "ai"

async function testGroqConnection() {
    console.log("=== GROQ API DIAGNOSTIC ===")
    console.log("")

    // Check environment variable
    const apiKey = process.env.GROQ_API_KEY
    console.log("1. Environment Variable Check:")
    console.log("   GROQ_API_KEY exists:", !!apiKey)
    console.log("   GROQ_API_KEY length:", apiKey?.length || 0)
    console.log("   GROQ_API_KEY starts with:", apiKey?.substring(0, 10) || "N/A")
    console.log("")

    if (!apiKey) {
        console.error("❌ ERROR: GROQ_API_KEY not found in environment variables")
        console.log("\nPlease check:")
        console.log("1. .env.local file exists")
        console.log("2. GROQ_API_KEY is defined in .env.local")
        console.log("3. Restart your dev server after adding the key")
        return
    }

    // Test API connection
    console.log("2. Testing API Connection:")
    try {
        const groq = createGroq({ apiKey })

        const { text } = await generateText({
            model: groq("llama-3.1-8b-instant"),
            prompt: "Responde solo con 'OK' si recibes este mensaje",
            maxTokens: 10,
        })

        console.log("   ✅ Successfully connected to Groq API")
        console.log("   Response:", text)
        console.log("")
        console.log("=== ALL TESTS PASSED ===")
    } catch (error) {
        console.error("   ❌ Failed to connect to Groq API")
        console.error("   Error:", error instanceof Error ? error.message : String(error))

        if (error instanceof Error) {
            // Check for specific error types
            if (error.message.includes("API key")) {
                console.log("\n💡 The API key might be invalid or expired")
                console.log("   Get a new key at: https://console.groq.com/keys")
            } else if (error.message.includes("rate limit")) {
                console.log("\n💡 Rate limit exceeded")
                console.log("   Wait a few minutes or upgrade your plan")
            } else if (error.message.includes("network") || error.message.includes("ENOTFOUND")) {
                console.log("\n💡 Network connection issue")
                console.log("   Check your internet connection")
            }
        }
    }
}

async function testFalConnection() {
    console.log("\n=== FAL AI DIAGNOSTIC ===")
    console.log("")

    const apiKey = process.env.FAL_KEY
    console.log("1. Environment Variable Check:")
    console.log("   FAL_KEY exists:", !!apiKey)
    console.log("   FAL_KEY length:", apiKey?.length || 0)
    console.log("")

    if (!apiKey) {
        console.error("❌ ERROR: FAL_KEY not found in environment variables")
        return
    }

    console.log("   ✅ FAL_KEY is configured")
}

// Run diagnostics
async function main() {
    await testGroqConnection()
    await testFalConnection()

    console.log("\n=== DIAGNOSTIC COMPLETE ===")
    console.log("\nIf you see errors above, please:")
    console.log("1. Verify your API keys in .env.local")
    console.log("2. Restart your development server")
    console.log("3. Check the API provider's console for any issues")
}

main().catch(console.error)
