
import { createClient } from "@supabase/supabase-js"

async function listConstraints() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    const sql = `
        SELECT conname, contype, pg_get_constraintdef(oid) as def
        FROM pg_constraint 
        WHERE conrelid = 'project_floor_plans'::regclass;
    `

    const { data, error } = await supabase.rpc("exec_sql", { sql }) // Trying exec_sql again

    if (error) {
        console.error("Error listing constraints:", error)
        // Alternative if exec_sql fails (it shouldn't if migration worked):
        // We can't query pg_catalog directly from client usually unless exposed.
    } else {
        console.log("Constraints:", data)
    }
}

listConstraints()
