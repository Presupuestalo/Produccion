
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

async function research() {
    const { data: prices } = await supabase
        .from("price_master")
        .select("code, description, category_id")
        .limit(20)

    if (prices && prices.length > 0) {
        console.log("Prices in Master:")
        prices.forEach(p => console.log(`- [${p.code}] ${p.description} (Cat: ${p.category_id})`))
    } else {
        console.log("No prices found at all in price_master.")
    }
}

research()
