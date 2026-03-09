
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

async function inspectSchemaFull() {
    const { data, error } = await supabase
        .from("price_master")
        .select("*")
        .limit(1)

    if (error) {
        console.error("Error inspecting schema:", error)
        return
    }

    if (data && data.length > 0) {
        const columns = Object.keys(data[0])
        console.log("FULL COLUMNS:", JSON.stringify(columns))
    } else {
        console.log("No data in price_master to inspect columns.")
    }
}

inspectSchemaFull()
