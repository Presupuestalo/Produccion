import { createGroq } from "@ai-sdk/groq"

export const groqProvider = createGroq({
    apiKey: process.env.GROQ_API_KEY,
})

export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
export const FAST_GROQ_MODEL = "llama-3.1-8b-instant"
// Llama 4 Scout: Official replacement for deprecated llama-3.2 vision models (April 14, 2025)
// Multimodal model with exceptional performance for image analysis
export const VISION_GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
