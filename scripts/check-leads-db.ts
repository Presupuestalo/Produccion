
import { createClient } from "@supabase/supabase-js"

async function checkLeads() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("Fetching all lead_requests...")
    const { data, error } = await supabase.from('lead_requests').select('id, homeowner_id, project_id, status, created_at').order('created_at', { ascending: false }).limit(5)

    if (error) {
        console.error("Error:", error)
    } else {
        console.log("Leads found:", data.length)
        data.forEach(lead => {
            console.log(`Lead ID: ${lead.id} | Homeowner: ${lead.homeowner_id} | Project: ${lead.project_id} | Status: ${lead.status} | Created: ${lead.created_at}`)
        })
    }
}

checkLeads()
