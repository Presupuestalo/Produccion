
import { createClient } from "@supabase/supabase-js"

async function checkExecSQL() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("Checking RPC exec_sql...")
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' })
    if (error) {
        console.log(`❌ RPC exec_sql: ERROR (${error.code}: ${error.message})`)
    } else {
        console.log(`✅ RPC exec_sql: EXISTS`)
    }

    process.exit(0)
}

checkExecSQL()
