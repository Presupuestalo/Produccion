const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

async function hexComparison() {
    const supabaseUrl = process.env.SUPABASE_URL || "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("--- Hex Comparison ---")

    const { data: prof } = await supabase.from('profiles').select('address_province').eq('email', 'presupuestaloficial@gmail.com').limit(1).single()
    const { data: lead } = await supabase.from('lead_requests').select('province').order('created_at', { ascending: false }).limit(1).single()

    if (prof) {
        const p = prof.address_province || ""
        console.log(`Professional Prov: "${p}"`)
        console.log(`Hex: ${Buffer.from(p).toString('hex')}`)
        console.log(`Chars: ${Array.from(p).map(c => c.charCodeAt(0).toString(16)).join(' ')}`)
    }

    if (lead) {
        const l = lead.province || ""
        console.log(`Lead Prov: "${l}"`)
        console.log(`Hex: ${Buffer.from(l).toString('hex')}`)
        console.log(`Chars: ${Array.from(l).map(c => c.charCodeAt(0).toString(16)).join(' ')}`)
    }
}

hexComparison()
