const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

async function checkRecentLeads() {
    const supabaseUrl = process.env.SUPABASE_URL || "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`--- Checking 10 most recent leads in DB ---`)

    const { data: leads, error } = await supabase
        .from('lead_requests')
        .select('id, homeowner_id, client_email, status, created_at, province, country_code, lead_type')
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) {
        console.error("Error fetching leads:", error)
        return
    }

    console.log(`Found ${leads?.length || 0} leads.`)
    leads?.forEach((l, i) => {
        console.log(`Lead ${i + 1}: ID=${l.id}, Email=${l.client_email}, HomeownerId=${l.homeowner_id}, Status=${l.status}, Created=${l.created_at}, Province=${l.province}, country=${l.country_code}`)
    })

    console.log("\n--- Checking profile for vascolreformas ---")
    const { data: prof } = await supabase.from('profiles').select('id, email, user_type, created_at').eq('email', 'vascolreformas@gmail.com').maybeSingle()
    console.log("vascolreformas profile:", JSON.stringify(prof, null, 2))
}

checkRecentLeads()
