
// @ts-nocheck
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"
import fs from "fs"

const envPath = path.resolve(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath))
    for (const k in envConfig) {
        process.env[k] = envConfig[k]
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectSchemaTable() {
    // We can also query the information_schema to be 100% sure
    const { data: cols, error } = await supabase.rpc('get_table_columns', { table_name: 'price_master' })

    if (error) {
        // Fallback to the property inspection if RPC fails
        console.log("RPC failed, using property inspection...")
        const { data, error: err } = await supabase.from("price_master").select("*").limit(1)
        if (data && data.length > 0) {
            Object.keys(data[0]).forEach(c => console.log(`COLUMN: ${c}`))
        }
        return
    }

    cols?.forEach(c => console.log(`COLUMN: ${c.column_name}`))
}

inspectSchemaTable()
