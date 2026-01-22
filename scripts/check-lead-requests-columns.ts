
import { createClient } from "@supabase/supabase-js"

async function checkColumns() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("Checking columns of lead_requests...")
    const { data, error } = await supabase.from('lead_requests').select('*').limit(1)

    if (error) {
        console.error("Error:", error)
    } else if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]))
    } else {
        // Table might be empty, try to get schema info via rpc if exists or just guestimate
        console.log("Table is empty or no columns found.")
    }
}

checkColumns()
