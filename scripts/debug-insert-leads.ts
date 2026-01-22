
import { createClient } from "@supabase/supabase-js"

async function debugInsert() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("Attempting debug insert into lead_requests...")

    // Attempt with minimal fields to see what's missing
    const { data, error } = await supabase.from('lead_requests').insert({
        project_id: '00000000-0000-0000-0000-000000000000', // Invalid but will trigger FK or Column error
    }).select()

    if (error) {
        console.log("Error Code:", error.code)
        console.log("Error Message:", error.message)
        console.log("Error Hint:", error.hint)
    }
}

debugInsert()
