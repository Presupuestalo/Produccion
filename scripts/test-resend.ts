import fetch from "node-fetch"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function testEmail() {
    const resendApiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
    const toEmail = "presupuestaloficial@gmail.com"

    console.log(`--- Resend Test ---`)
    console.log(`API Key: ${resendApiKey ? 'Configured' : 'MISSING'}`)
    console.log(`From: ${fromEmail}`)
    console.log(`To: ${toEmail}`)

    if (!resendApiKey) return

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
                from: fromEmail,
                to: toEmail,
                subject: "Test de Notificación - Presupuéstalo",
                html: "<h1>Este es un test de envío</h1><p>Si recibes esto, el servicio de email funciona para este destinatario.</p>",
            }),
        })

        const data = await response.json()
        console.log(`Response Status: ${response.status}`)
        console.log(`Response Data:`, JSON.stringify(data, null, 2))

        if (response.ok) {
            console.log("✅ Email sent successfully according to API!")
        } else {
            console.log("❌ Email FAILED!")
        }
    } catch (error) {
        console.error("Fetch Error:", error)
    }
}

testEmail()
