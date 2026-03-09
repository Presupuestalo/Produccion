
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

async function checkMaterialesSubcats() {
    const matCatId = '0d110423-99b0-4c31-b61a-6d6b1ee629c5'

    const { data: items, error } = await supabase
        .from("price_master")
        .select("subcategory, description")
        .eq("category_id", matCatId)
        .limit(10)

    if (error) {
        console.error("Error:", error)
        return
    }

    console.log("ITEMS IN MATERIALES CATEGORY:")
    console.log(JSON.stringify(items, null, 2))

    // Also check if there is a category named CARPINTERÍA
    const { data: cats } = await supabase
        .from("price_categories")
        .select("id, name")
        .ilike("name", "%Carpintería%")

    console.log("CATEGORIES LIKE CARPINTERÍA:")
    console.log(JSON.stringify(cats, null, 2))
}

checkMaterialesSubcats()
