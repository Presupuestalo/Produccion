
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

async function listAllDetailed() {
    const { data: categories, error } = await supabase
        .from("price_categories")
        .select("id, name")
        .order("name")

    if (error) {
        console.error("Error:", error)
        return
    }

    console.log("CATEGORY_LIST_START")
    categories?.forEach(c => {
        console.log(`CAT|${c.id}|${c.name}`)
    })
    console.log("CATEGORY_LIST_END")
}

listAllDetailed()
