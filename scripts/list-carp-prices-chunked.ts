
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

async function listCarpinteriaPrices() {
    const carpCatId = '30009587-f83a-459a-bb68-b1fd88ee6836'

    const { data: items, error } = await supabase
        .from("price_master")
        .select("code, description, subcategory")
        .eq("category_id", carpCatId)

    if (error) {
        console.error("Error:", error)
        return
    }

    if (!items || items.length === 0) {
        console.log("No items found in CARPINTERÍA.")
        return
    }

    console.log(`TOTAL ITEMS: ${items.length}`)
    // Log in chunks to avoid truncation
    const chunkSize = 20
    for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize)
        chunk.forEach(item => {
            console.log(`CODE: ${item.code} | SUBCAT: ${item.subcategory} | DESC: ${item.description}`)
        })
        console.log("--- CHUNK END ---")
    }
}

listCarpinteriaPrices()
