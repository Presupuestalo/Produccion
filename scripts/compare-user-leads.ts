
import { createClient } from "@supabase/supabase-js"

async function compareUserAndLeads() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    const targetUserId = '76030274-0308-4b66-94d3-e68d206bc7b9'

    console.log(`Searching for leads owned by: ${targetUserId}`)
    const { data: leads, error } = await supabase
        .from('lead_requests')
        .select('id, homeowner_id, client_email')
        .eq('homeowner_id', targetUserId)

    if (error) {
        console.error("Error:", error)
    } else {
        console.log(`Matched leads: ${leads.length}`)
        leads.forEach(l => console.log(`- Lead ${l.id} | Email: ${l.client_email}`))
    }

    console.log("Checking all leads recently created...")
    const { data: allLeads } = await supabase.from('lead_requests').select('homeowner_id').order('created_at', { ascending: false }).limit(5)
    allLeads?.forEach(l => {
        console.log(`Lead Owner: ${l.homeowner_id} ${l.homeowner_id === targetUserId ? '(MATCH!)' : '(MISMATCH)'}`)
    })
}

compareUserAndLeads()
