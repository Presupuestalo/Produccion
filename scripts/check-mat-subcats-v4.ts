
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

async function checkSubcats() {
    const matCatId = '0d110423-99b0-4c31-b61a-6d6b1ee629c5'

    const { data: items, error } = await supabase
        .from("price_master")
        .select("subcategory")
        .eq("category_id", matCatId)

    if (error) {
        console.error("Error:", error)
        return
    }

    const uniqueSubcats = Array.from(new Set(items?.map(s => s.subcategory || "NULL")));
    console.log("---START---")
    console.log(`TOTAL_UNIQUE: ${uniqueSubcats.length}`)
    for (const s of uniqueSubcats) {
        console.log(`S:${s}`)
    }
    console.log("---END---")
}

checkSubcats()
