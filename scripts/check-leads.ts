
import { supabaseAdmin } from "../lib/supabase-admin"

async function checkLeads() {
    console.log("Checking lead_requests...")

    const { data: leads, error } = await supabaseAdmin
        .from("lead_requests")
        .select("id, homeowner_id, client_name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10)

    if (error) {
        console.error("Error fetching leads:", error)
        return
    }

    console.log(`Found ${leads.length} recent leads:`)
    leads.forEach(l => {
        console.log(`- ID: ${l.id} | Homeowner: ${l.homeowner_id} | Client: ${l.client_name} | Status: ${l.status} | Created: ${l.created_at}`)
    })

    // Check unique homeowners
    const homeowners = [...new Set(leads.map(l => l.homeowner_id))]
    console.log("\nUnique homeowners in recent leads:", homeowners)

    for (const hid of homeowners) {
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id, email, full_name, user_type")
            .eq("id", hid)
            .single()

        console.log(`Profile for ${hid}:`, profile ? `${profile.email} (${profile.user_type})` : "NOT FOUND")
    }
}

checkLeads()
