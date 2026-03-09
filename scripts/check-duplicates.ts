
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

async function checkDuplicates() {
    const { data, error } = await supabase
        .from("price_master")
        .select("id")

    if (error) {
        console.error("Error:", error)
        return
    }

    const ids = data.map(d => d.id)
    const uniqueIds = new Set(ids)

    if (ids.length !== uniqueIds.size) {
        console.log(`DUPLICATES FOUND! Total: ${ids.length}, Unique: ${uniqueIds.size}`)
    } else {
        console.log(`No duplicates found in ${ids.length} rows.`)
    }
}

checkDuplicates()
