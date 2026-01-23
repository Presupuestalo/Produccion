import { createClient } from "@supabase/supabase-js"

async function debugLastLead() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("--- Last 3 Lead Requests ---")
    const { data: leads, error: leadError } = await supabase
        .from('lead_requests')
        .select('id, client_name, province, country_code, status, created_at')
        .order('created_at', { ascending: false })
        .limit(3)

    if (leadError) console.error("Lead Error:", leadError)
    console.log(JSON.stringify(leads, null, 2))

    console.log("\n--- Professional Profile (Specific) ---")
    const { data: profs } = await supabase
        .from('profiles')
        .select('id, email, user_type, country, address_province')
        .eq('email', 'presupuestaloficial@gmail.com')

    console.log(JSON.stringify(profs, null, 2))
}

debugLastLead()
