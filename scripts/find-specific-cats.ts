
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

async function findSpecificCats() {
    const { data: cat1 } = await supabase.from("price_categories").select("id, name").ilike("name", "%Materiales%").maybeSingle()
    const { data: cat2 } = await supabase.from("price_categories").select("id, name").ilike("name", "%Carpintería%").maybeSingle()

    console.log("MATERIALES:", JSON.stringify(cat1))
    console.log("CARPINTERÍA:", JSON.stringify(cat2))

    // Just in case, list all IDs and names again but very carefully
    const { data: all } = await supabase.from("price_categories").select("id, name").order("name")
    console.log("ALL CATS:")
    all?.forEach(c => console.log(`${c.id} | ${c.name}`))
}

findSpecificCats()
