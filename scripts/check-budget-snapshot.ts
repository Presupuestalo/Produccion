
import { createClient } from "@supabase/supabase-js"

async function checkSpecificColumn() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("Checking if 'budget_snapshot' exists in 'lead_requests'...")
    const { data, error } = await supabase.from('lead_requests').select('budget_snapshot').limit(1)

    if (error) {
        console.log("COLUMN MISSING or Error:", error.message)
    } else {
        console.log("COLUMN EXISTS!")
    }
}

checkSpecificColumn()
