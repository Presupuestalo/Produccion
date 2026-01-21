
import { createClient } from "@supabase/supabase-js"

async function run() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase.from('price_master').select('*').eq('code', '02-A-12').single()
    console.log("02-A-12 full data:", JSON.stringify(data || error, null, 2))

    const { data: all } = await supabase.from('price_master').select('code').limit(1000)
    if (all) {
        console.log("Searching for 02-A-12 in all codes...")
        const found = all.find(p => p.code.trim() === '02-A-12')
        console.log("Found by trim:", found)
        const exact = all.find(p => p.code === '02-A-12')
        console.log("Found by exact:", exact)
    }

    process.exit(0)
}
run()
