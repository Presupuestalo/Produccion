import { createClient } from "@supabase/supabase-js"
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runClear() {
    console.log("Reading SQL script...")
    const sql = fs.readFileSync(path.join(process.cwd(), 'scripts', 'clear-credits-data.sql'), 'utf8')

    console.log("Executing SQL via RPC...")
    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
        console.error("Error executing clear script:", error)
    } else {
        console.log("Success:", data)
    }
}

runClear()
