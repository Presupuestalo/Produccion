
import { createClient } from "@supabase/supabase-js"

async function run() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase.from('price_master').select('code, is_active').eq('code', '02-A-12')
    console.log("02-A-12 status:", { data, error })

    const { count } = await supabase.from('price_master').select('*', { count: 'exact', head: true }).eq('is_active', true)
    console.log("Total active prices:", count)

    process.exit(0)
}
run()
