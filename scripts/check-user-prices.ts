
import { createClient } from "@supabase/supabase-js"

async function checkUserPrices() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase.from("user_prices").select("*").limit(1)
    if (error) {
        console.log("Error checking user_prices:", error)
    } else if (data && data.length > 0) {
        console.log("Columns in user_prices:", Object.keys(data[0]).join(", "))
    } else {
        console.log("user_prices is empty")
    }
    process.exit(0)
}
checkUserPrices()
