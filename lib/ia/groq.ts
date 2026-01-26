import { createGroq } from "@ai-sdk/groq"

export const groqProvider = createGroq({
    apiKey: process.env.GROQ_API_KEY,
})

export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
export const FAST_GROQ_MODEL = "llama-3.1-8b-instant"
export const VISION_GROQ_MODEL = "llama-3.2-90b-vision-preview"
