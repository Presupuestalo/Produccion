
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

async function fetchIds() {
    const { data: cat1 } = await supabase.from("price_categories").select("id, name").ilike("name", "%Materiales%")
    const { data: cat2 } = await supabase.from("price_categories").select("id, name").ilike("name", "%Carpintería%")

    console.log("RESULT_START")
    cat1?.forEach(c => {
        console.log("ID_PART_1:" + c.id.substring(0, 18))
        console.log("ID_PART_2:" + c.id.substring(18))
        console.log("NAME:" + c.name)
    })
    cat2?.forEach(c => {
        console.log("ID_PART_1:" + c.id.substring(0, 18))
        console.log("ID_PART_2:" + c.id.substring(18))
        console.log("NAME:" + c.name)
    })
    console.log("RESULT_END")
}

fetchIds()
