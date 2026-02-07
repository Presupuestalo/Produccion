
import { createClient } from "@supabase/supabase-js"

async function checkTables() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("Checking quote_requests...")
    const { data: qrData, error: qrError } = await supabase.from('quote_requests').select('*').limit(1)
    if (qrError) console.log("quote_requests ERROR:", qrError)
    else console.log("quote_requests SUCCESS, data count:", qrData?.length)

    console.log("Checking quote_offers...")
    const { data: qoData, error: qoError } = await supabase.from('quote_offers').select('*').limit(1)
    if (qoError) console.log("quote_offers ERROR:", qoError)
    else console.log("quote_offers SUCCESS, data count:", qoData?.length)
}

checkTables()
