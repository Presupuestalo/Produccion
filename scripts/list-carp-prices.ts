
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
    const carpCatId = '30009587-f83a-459a-bb68-b1fd88ee6836' // This might be wrong, let's check it first

    const { data: cat } = await supabase.from("price_categories").select("id, name").ilike("name", "%Carpintería%").single()
    if (!cat) {
        console.log("CARPINTERÍA category not found.")
        return
    }
    console.log(`FOUND CAT: ${cat.name} (${cat.id})`)

    const { data: items, error } = await supabase
        .from("price_master")
        .select("code, description, subcategory")
        .eq("category_id", cat.id)

    if (error) {
        console.error("Error:", error)
        return
    }

    console.log(`ALL ITEMS IN ${cat.name} CATEGORY:`)
    items?.forEach(item => {
        console.log(`CODE: ${item.code} | DESC: ${item.description} | SUBCAT: ${item.subcategory}`)
    })
}

listCarpinteriaPrices()
