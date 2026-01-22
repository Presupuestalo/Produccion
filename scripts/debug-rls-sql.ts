
import { createClient } from "@supabase/supabase-js"

async function debugRLS() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("Checking all policies for lead_requests in the database...")
    // This query works with service role
    const { data, error } = await supabase.rpc('exec_sql', {
        sql_text: "SELECT * FROM pg_policies WHERE tablename = 'lead_requests'"
    })

    // If exec_sql doesn't work, I'll try to find another way or just report what I suspect.
    if (error) {
        console.error("Error executing SQL:", error.message)
    } else {
        console.log("Policies found:", data)
    }
}

debugRLS()
