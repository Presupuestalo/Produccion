import { createClient } from "@supabase/supabase-js"
import fetch from "node-fetch"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const RESEND_API_URL = "https://api.resend.com/emails"
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"

async function debugSpecificLead(leadId: string) {
    const supabaseUrl = process.env.SUPABASE_URL || "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, supabaseKey!)

    console.log(`--- Debugging Notification for Lead: ${leadId} ---`)

    const { data: lead, error: leadError } = await supabase
        .from('lead_requests')
        .select('*')
        .eq('id', leadId)
        .single()

    if (leadError || !lead) {
        console.error("Lead not found:", leadError)
        return
    }

    console.log("Lead Data:", JSON.stringify({
        province: lead.province,
        country_code: lead.country_code,
        status: lead.status
    }, null, 2))

    // Replication of publish/route.ts logic
    const reformCountry = lead.country_code
    const reformProvince = lead.province
    const currentCountry = reformCountry === "ES" ? "España" : (reformCountry === "Spain" ? "España" : reformCountry)

    console.log(`Search criteria -> country: "${currentCountry}", province: "${reformProvince}", user_type: "professional"`)

    const { data: professionals, error: profsError } = await supabase
        .from("profiles")
        .select("id, full_name, email, user_type, country, address_province")
        .eq("user_type", "professional")
        .ilike("address_province", reformProvince)
        .eq("country", currentCountry)
        .not("email", "is", null)

    if (profsError) {
        console.error("Profs Query Error:", profsError)
    }

    console.log(`Matched professionals count: ${professionals?.length || 0}`)
    if (professionals && professionals.length > 0) {
        console.log("Matched IDs:", professionals.map(p => p.id))
        console.log("Matched Emails:", professionals.map(p => p.email))

        const target = professionals.find(p => p.email === "presupuestaloficial@gmail.com")
        if (target) {
            console.log("✅ TARGET FOUND!")
        } else {
            console.log("❌ TARGET NOT FOUND in results.")

            // Debugging why not found
            const { data: prof } = await supabase.from('profiles').select('*').eq('email', 'presupuestaloficial@gmail.com').single()
            if (prof) {
                console.log("Target professional profile detail:")
                console.log(JSON.stringify({
                    id: prof.id,
                    user_type: prof.user_type,
                    country: prof.country,
                    address_province: prof.address_province,
                    country_hex: Buffer.from(prof.country || '').toString('hex'),
                    criteria_country_hex: Buffer.from(currentCountry).toString('hex')
                }, null, 2))
            }
        }
    } else {
        console.log("No professionals matched at all.")
    }
}

debugSpecificLead("b63c7885-30fa-4927-85d6-3a6cdbd59364")
