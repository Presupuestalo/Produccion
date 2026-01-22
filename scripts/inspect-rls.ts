
import { createClient } from "@supabase/supabase-js"
require('dotenv').config({ path: '.env.local' });

async function inspectRLS() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("--- Inspecting lead_requests Policies ---")
    const { data: policies, error: pError } = await supabase.rpc('exec_sql', {
        sql: "SELECT * FROM pg_policies WHERE tablename = 'lead_requests';"
    })

    if (pError) console.error("Error fetching policies:", pError)
    else console.log(JSON.stringify(policies, null, 2))

    console.log("\n--- Inspecting lead_requests Column Types ---")
    const { data: cols, error: cError } = await supabase.rpc('exec_sql', {
        sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'lead_requests' AND (column_name = 'id' OR column_name = 'homeowner_id');"
    })

    if (cError) console.error("Error fetching columns:", cError)
    else console.log(JSON.stringify(cols, null, 2))

    console.log("\n--- Checking RLS status ---")
    const { data: rlsStatus, error: rError } = await supabase.rpc('exec_sql', {
        sql: "SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'lead_requests';"
    })

    if (rError) console.error("Error fetching RLS status:", rError)
    else console.log(JSON.stringify(rlsStatus, null, 2))

    process.exit(0)
}

inspectRLS()
