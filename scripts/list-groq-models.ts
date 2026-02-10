
import { createGroq } from "@ai-sdk/groq";

async function listModels() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error("GROQ_API_KEY not found");
        return;
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/models", {
            headers: {
                "Authorization": `Bearer ${apiKey}`
            }
        });
        const data = await response.json();
        console.log("Available models:");
        data.data.forEach((model: any) => {
            console.log(`- ${model.id}`);
        });
    } catch (error) {
        console.error("Error fetching models:", error);
    }
}

listModels();
