
import { createClient } from "@supabase/supabase-js"

async function run() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase.from('price_master').select('code, subcategory').limit(150)
    if (error) console.error("Error:", error)
    else {
        console.log("Loaded", data.length, "prices")
        const codes = data.map(p => p.code)
        console.log("Sample codes:", codes.slice(0, 20))
        console.log("Check for 02-A-12:", codes.includes("02-A-12"))
        console.log("Check for 02-A-15:", codes.includes("02-A-15"))
    }
    process.exit(0)
}
run()
