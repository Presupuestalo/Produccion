import { createClient } from "@supabase/supabase-js"

async function debugLeadsAll() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("--- Fetching Recent Leads (All Statuses) ---")
    const { data: leads, error } = await supabase
        .from("lead_requests")
        .select("id, status, homeowner_id, client_name, city, province, lead_type, created_at")
        .order("created_at", { ascending: false })
        .limit(10)

    if (error) {
        console.error("Error:", error)
        return
    }

    console.log(JSON.stringify(leads, null, 2))
}

debugLeadsAll()
