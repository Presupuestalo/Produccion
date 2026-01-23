import { createClient } from "@supabase/supabase-js"

async function debugLeads() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("--- Fetching Open Leads ---")
    const { data: leads, error } = await supabase
        .from("lead_requests")
        .select("id, client_name, city, province, estimated_budget, lead_type, budget_snapshot, status")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5)

    if (error) {
        console.error("Error:", error)
        return
    }

    console.log(JSON.stringify(leads, null, 2))
}

debugLeads()
