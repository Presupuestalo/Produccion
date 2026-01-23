const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

async function thoroughDebug() {
    const supabaseUrl = process.env.SUPABASE_URL || "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("--- 1. Verification of Professional: presupuestaloficial@gmail.com ---")
    const { data: profs } = await supabase.from('profiles').select('*').eq('email', 'presupuestaloficial@gmail.com')
    console.log(`Found ${profs?.length || 0} profiles.`)
    profs.forEach((p, i) => {
        console.log(`Profile ${i}: ID=${p.id}, Type=${p.user_type}, Country="${p.country}", Prov="${p.address_province}"`)
        if (p.country) {
            console.log(`  Country Hex: ${Buffer.from(p.country).toString('hex')}`)
        }
    })

    console.log("\n--- 2. Verification of Last 5 Leads ---")
    const { data: leads } = await supabase.from('lead_requests').select('*').order('created_at', { ascending: false }).limit(5)
    leads.forEach((l, i) => {
        console.log(`Lead ${i}: ID=${l.id}, Email=${l.client_email}, Prov="${l.province}", Country="${l.country_code}", Status=${l.status}`)
        if (l.province) {
            console.log(`  Prov Hex: ${Buffer.from(l.province).toString('hex')}`)
        }
    })
}

thoroughDebug()
