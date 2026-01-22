
import { createClient } from "@supabase/supabase-js"

async function checkLeadsOwnershipSimple() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("Checking leads and client info...")
    const { data: leads, error } = await supabase
        .from('lead_requests')
        .select('id, homeowner_id, client_email, client_name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) {
        console.error("Error:", error)
    } else {
        console.log("Found", leads.length, "leads:")
        leads.forEach(lead => {
            console.log(`Lead ${lead.id} | HomeownerID: ${lead.homeowner_id} | ClientEmail: ${lead.client_email} | ClientName: ${lead.client_name} | Status: ${lead.status}`)
        })
    }
}

checkLeadsOwnershipSimple()
