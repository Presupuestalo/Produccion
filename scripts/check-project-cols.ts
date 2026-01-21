
import { createClient } from "@supabase/supabase-js"

async function checkCols() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data } = await supabase.from('projects').select('*').limit(1)
    if (data && data.length > 0) {
        console.log("Projects columns:", Object.keys(data[0]))
    }
    const { data: b } = await supabase.from('budgets').select('*').limit(1)
    if (b && b.length > 0) {
        console.log("Budgets columns:", Object.keys(b[0]))
    }
    process.exit(0)
}
checkCols()
