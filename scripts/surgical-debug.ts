import { createClient } from "@supabase/supabase-js"

async function surgicalDebug() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("--- Profile Comparison ---")
    const { data: p1 } = await supabase.from('profiles').select('email, user_type, country, address_province').eq('email', 'presupuestaloficial@gmail.com').single()
    console.log("Professional Profile:", JSON.stringify(p1, null, 2))

    const { data: p2 } = await supabase.from('profiles').select('id, email').eq('email', 'vascolreformas@gmail.com').single()
    console.log("Requester Profile:", JSON.stringify(p2, null, 2))

    if (p2) {
        console.log("\n--- Last Lead by Requester ---")
        const { data: leads } = await supabase.from('lead_requests')
            .select('id, province, country_code, lead_type, created_at')
            .eq('homeowner_id', p2.id)
            .order('created_at', { ascending: false })
            .limit(1)

        if (leads && leads.length > 0) {
            const l = leads[0]
            console.log("Lead Data:", JSON.stringify(l, null, 2))

            if (p1) {
                console.log("\n--- Match Simulation ---")
                console.log(`user_type='professional' matches? ${p1.user_type === 'professional'}`)
                console.log(`country matches? ${p1.country === (l.country_code === 'ES' ? 'España' : l.country_code)}`)
                console.log(`province matches (case-insensitive)? ${p1.address_province?.toLowerCase() === l.province?.toLowerCase()}`)
            }
        } else {
            console.log("No leads found for requester.")
        }
    }
}

surgicalDebug()
