import { createClient } from "@supabase/supabase-js"

async function deepDebug() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    const emails = ["vascolreformas@gmail.com", "presupuestaloficial@gmail.com"]

    console.log("--- Profiles Check ---")
    for (const email of emails) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('email', email)
        console.log(`Email: ${email}`)
        console.log(JSON.stringify(prof, null, 2))
    }

    console.log("\n--- Recent Leads by vascolreformas ---")
    const { data: requester } = await supabase.from('profiles').select('id').eq('email', 'vascolreformas@gmail.com').single()
    if (requester) {
        const { data: leads } = await supabase.from('lead_requests').select('*').eq('homeowner_id', requester.id).order('created_at', { ascending: false }).limit(5)
        console.log(JSON.stringify(leads, null, 2))
    }
}

deepDebug()
