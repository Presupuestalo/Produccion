
import { createClient } from "@supabase/supabase-js"
import * as fs from 'fs'

async function applyFix() {
    try {
        const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
        const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"

        const supabase = createClient(supabaseUrl, supabaseKey)

        const sqlPath = "f:\\PRESUPUESTALO\\WEB-PRODUCCIÓN\\scripts\\delete-user-complete-fixed-v3.sql"
        if (!fs.existsSync(sqlPath)) {
            console.error(`File not found: ${sqlPath}`)
            process.exit(1)
        }
        const fullSql = fs.readFileSync(sqlPath, 'utf8')

        console.log("Applying deletion RPC fix...")
        const { data, error } = await supabase.rpc('exec_sql', { sql: fullSql })

        if (error) {
            console.log("Status: FAIL")
            console.log(`Error Code: ${error.code}`)
            console.log(`Error Message: ${error.message}`)
            if (error.hint) console.log(`Hint: ${error.hint}`)
            if (error.details) console.log(`Details: ${error.details}`)
        } else {
            console.log("Status: OK")
            console.log(`Result: ${JSON.stringify(data)}`)
        }
    } catch (e: any) {
        console.error("Critical error in script:")
        console.error(e.message)
        console.error(e.stack)
    }

    process.exit(0)
}

applyFix()
