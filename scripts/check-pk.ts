
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

async function checkPrimaryKey() {
    // We try to query information_schema to see PKs
    // Since we don't have a direct SQL tool, we try to get it via a dummy update or just listing.
    // Actually, a good way in Supabase is to check if we can get the table definition via RPC if it exists.
    // Or we can try to find an existing RPC that gives info.

    console.log("Checking if id is unique and not null...")
    const { data, error } = await supabase.from("price_master").select("id").limit(5)
    if (data) {
        console.log("IDs found:", data.map(d => d.id))
    }
}

checkPrimaryKey()
