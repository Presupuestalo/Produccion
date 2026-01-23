import { createClient } from "@supabase/supabase-js"

async function debug() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("--- Checking User Profile ---")
    const { data: profs } = await supabase.from('profiles').select('*').eq('email', 'presupuestaloficial@gmail.com')
    console.log(JSON.stringify(profs, null, 2))

    console.log("\n--- Checking Recent Leads ---")
    const { data: leads } = await supabase.from('lead_requests').select('*').order('created_at', { ascending: false }).limit(3)
    console.log(JSON.stringify(leads, null, 2))

    if (leads && leads.length > 0) {
        const lead = leads[0]
        const currentCountry = lead.country_code === "España" ? "ES" : (lead.country_code === "Spain" ? "ES" : lead.country_code)
        const province = lead.province

        console.log(`\n--- Attempting Match for Lead: ${lead.id} ---`)
        console.log(`Country: ${currentCountry}, Province: ${province}`)

        const { data: matches } = await supabase
            .from("profiles")
            .select("id, full_name, email, user_type, country, address_province")
            .eq("user_type", "profesional")
            .eq("address_province", province)
            .eq("country", currentCountry)

        console.log("Matches found:", matches?.length || 0)
        console.log(JSON.stringify(matches, null, 2))
    }
}

debug()
