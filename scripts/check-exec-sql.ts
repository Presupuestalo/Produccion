
import { createClient } from "@supabase/supabase-js"

async function checkExecSQL() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"

    const supabase = createClient(supabaseUrl, supabaseKey)

    const sql = process.argv[2] || 'SELECT 1'
    console.log(`Executing SQL: ${sql}`)

    const { data, error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
        console.log(`❌ RPC exec_sql: ERROR (${error.code}: ${error.message})`)
        console.error(error)
    } else {
        console.log(`✅ RPC exec_sql: SUCCESS`)
        console.log(JSON.stringify(data, null, 2))
    }

    process.exit(0)
}

checkExecSQL()
