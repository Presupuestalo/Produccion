import { createClient } from "@supabase/supabase-js"
import fetch from "node-fetch"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const RESEND_API_URL = "https://api.resend.com/emails"
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"

async function sendEmail(options: any) {
    console.log(`Sending email to ${options.to}...`)
    const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: FROM_EMAIL,
            to: options.to,
            subject: options.subject,
            html: options.html,
        }),
    })
    const data = await response.json()
    console.log(`Response for ${options.to}:`, JSON.stringify(data, null, 2))
    return { ok: response.ok, data }
}

async function fullSimulation() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test data
    const reformProvince = "Madrid"
    const reformCountry = "ES" // As it might come from the lead
    const reformCity = "Madrid"
    const estimatedBudget = 15000
    const creditsCost = 15

    console.log("--- START FULL SIMULATION ---")

    // 1. Convert country logic
    const currentCountry = reformCountry === "ES" ? "España" : (reformCountry === "Spain" ? "España" : reformCountry)
    console.log(`Search criteria: user_type=professional, province=${reformProvince}, country=${currentCountry}`)

    // 2. Query professionals
    const { data: professionals, error: profsError } = await supabase
        .from("profiles")
        .select("id, full_name, email, user_type, country, address_province")
        .eq("user_type", "professional")
        .ilike("address_province", reformProvince)
        .eq("country", currentCountry)
        .not("email", "is", null)

    if (profsError) {
        console.error("Query Error:", profsError)
        return
    }

    console.log(`Professionals found: ${professionals?.length || 0}`)

    if (professionals && professionals.length > 0) {
        const target = professionals.find(p => p.email === "presupuestaloficial@gmail.com")
        if (target) {
            console.log("✅ target PROFESSIONAL FOUND!")

            // 3. Send email simulation
            const profEmailHtml = `<p>Test Lead Notification</p><p>Ubicación: ${reformCity}, ${reformProvince}</p>`
            await sendEmail({
                to: target.email,
                subject: `🚀 Nuevo proyecto en ${reformCity}`,
                html: profEmailHtml
            })
        } else {
            console.log("❌ Target professional NOT in the results.")
            console.log("Found emails:", professionals.map(p => p.email))
        }
    }
}

fullSimulation()
