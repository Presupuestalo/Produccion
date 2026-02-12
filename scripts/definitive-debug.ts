import { supabaseAdmin } from "../lib/supabase-admin"

async function definitiveDebug() {
    console.log("--- Definitive Lead Debug ---")

    // 1. Total count
    const { count, error: countError } = await supabaseAdmin
        .from('lead_requests')
        .select('*', { count: 'exact', head: true })

    if (countError) {
        console.error("Count Error:", countError)
    } else {
        console.log("Total leads in DB:", count)
    }

    // 2. Last 5 leads
    const { data: leads, error: leadError } = await supabaseAdmin
        .from('lead_requests')
        .select('id, client_name, client_email, province, country_code, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

    if (leadError) {
        console.error("Lead Fetch Error:", leadError)
    } else {
        console.log("Last 5 Leads:", JSON.stringify(leads, null, 2))
    }

    // 3. User check
    const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, user_type')
        .in('email', ['vascolreformas@gmail.com', 'presupuestaloficial@gmail.com'])

    console.log("Profiles Found:", JSON.stringify(profiles, null, 2))
}

definitiveDebug()
