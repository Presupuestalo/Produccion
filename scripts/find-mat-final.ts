
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

async function findMateriales() {
    const { data: category } = await supabase
        .from("price_categories")
        .select("id, name")
        .eq("name", "01. MATERIALES")
        .maybeSingle()

    if (category) {
        console.log(`MATERIALES ID: ${category.id}`)
    } else {
        const { data: search } = await supabase
            .from("price_categories")
            .select("id, name")
            .ilike("name", "%Materiales%")
        console.log("Search results:", JSON.stringify(search, null, 2))
    }
}

findMateriales()
