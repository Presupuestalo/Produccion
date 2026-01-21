
import { createClient } from "@supabase/supabase-js"

async function checkJoin() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("Checking Join...")

    const { data, error } = await supabase
        .from("price_master")
        .select("id, category:price_categories(name)")
        .limit(1)

    if (error) {
        console.log("Join failed with error:", JSON.stringify(error, null, 2))
    } else {
        console.log("Join successful:", JSON.stringify(data, null, 2))
    }

    process.exit(0)
}

checkJoin()
