const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

async function checkEveryLead() {
    const supabaseUrl = process.env.SUPABASE_URL || "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, supabaseKey)

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    console.log(`--- Checking ALL leads since ${yesterday} ---`)

    const { data: leads, error } = await supabase
        .from('lead_requests')
        .select('*')
        .gte('created_at', yesterday)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error:", error)
        return
    }

    console.log(`Leads found in last 24h: ${leads?.length || 0}`)
    leads?.forEach((l, i) => {
        console.log(`[${i + 1}] ID: ${l.id} | Email: ${l.client_email} | Prov: ${l.province} | Status: ${l.status} | Time: ${l.created_at}`)
    })
}

checkEveryLead()
