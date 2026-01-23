import { createClient } from "@supabase/supabase-js"

async function surgicalDebugV2() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("--- Professional Profiles Check ---")
    const { data: profs, error: profError } = await supabase.from('profiles').select('*').eq('email', 'presupuestaloficial@gmail.com')
    if (profError) console.error("Prof Error:", profError)
    console.log(`Count: ${profs?.length || 0}`)
    if (profs && profs.length > 0) {
        profs.forEach((p, i) => {
            console.log(`Profile ${i}:`, JSON.stringify({
                email: p.email,
                user_type: p.user_type,
                country: p.country,
                country_hex: p.country ? Buffer.from(p.country).toString('hex') : null,
                address_province: p.address_province
            }, null, 2))
        })
    }

    const { data: p2 } = await supabase.from('profiles').select('id, email').eq('email', 'vascolreformas@gmail.com').single()
    if (p2) {
        console.log("\n--- Last Lead by Requester ---")
        const { data: leads } = await supabase.from('lead_requests')
            .select('*')
            .eq('homeowner_id', p2.id)
            .order('created_at', { ascending: false })
            .limit(1)

        if (leads && leads.length > 0) {
            const l = leads[0]
            console.log("Lead Data:", JSON.stringify({
                id: l.id,
                province: l.province,
                country_code: l.country_code,
                country_code_hex: l.country_code ? Buffer.from(l.country_code).toString('hex') : null
            }, null, 2))

            if (profs && profs.length > 0) {
                const p = profs[0]
                const currentCountry = l.country_code === 'ES' ? 'España' : (l.country_code === 'Spain' ? 'España' : l.country_code)
                const currentCountryHex = Buffer.from(currentCountry).toString('hex')

                console.log("\n--- Match Simulation (with profile 0) ---")
                console.log(`Criteria: user_type='professional', country='${currentCountry}' (${currentCountryHex}), province='${l.province}'`)
                console.log(`Match user_type? ${p.user_type === 'professional'}`)
                console.log(`Match country? ${p.country === currentCountry} (Profile: ${p.country})`)
                console.log(`Match province (ilike)? ${p.address_province?.toLowerCase() === l.province?.toLowerCase()}`)
            }
        }
    }
}

surgicalDebugV2()
