
import { createClient } from "@supabase/supabase-js"

async function checkLeadsOwnership() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("Checking leads and homeowner emails...")
    const { data: leads, error } = await supabase
        .from('lead_requests')
        .select(`
            id, 
            status, 
            created_at, 
            homeowner_id,
            profiles:homeowner_id (email, full_name, user_type)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) {
        console.error("Error:", error)
    } else {
        console.log("Found", leads.length, "leads:")
        leads.forEach(lead => {
            const profile = lead.profiles as any
            console.log(`Lead ${lead.id} | Status: ${lead.status} | Homeowner ID: ${lead.homeowner_id} | Email: ${profile?.email} | Name: ${profile?.full_name} | Type: ${profile?.user_type}`)
        })
    }
}

checkLeadsOwnership()
