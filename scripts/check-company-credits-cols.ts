import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkColumns() {
    const { data, error } = await supabase.rpc("exec_sql_query", {
        sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'company_credits'"
    })

    if (error) {
        // Try without RPC if it fails
        const { data: cols, error: err2 } = await supabase.from('company_credits').select('*').limit(1);
        if (err2) {
            console.error("Error checking columns:", err2)
        } else {
            console.log("Columns found via select:", Object.keys(cols[0] || {}))
        }
    } else {
        console.log("Columns list:", data)
    }
}

checkColumns()
