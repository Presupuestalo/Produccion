
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
    // 1. Get categories
    const { data: categories } = await supabase
        .from("price_categories")
        .select("*")
        .or('name.ilike.%Carpinteria%,name.ilike.%Materiales%')

    console.log("Categories:")
    categories.forEach(c => console.log(`- [${c.id}] ${c.name}`))

    const carpId = categories.find(c => c.name.toLowerCase().includes("carpinteria"))?.id
    const matId = categories.find(c => c.name.toLowerCase().includes("materiales"))?.id

    if (carpId) {
        const { data: carpPrices } = await supabase
            .from("price_master")
            .select("code, description, final_price")
            .eq("category_id", carpId)
            .limit(10)
        console.log(`\nCarpinteria Prices (${carpId}):`)
        carpPrices?.forEach(p => console.log(`- [${p.code}] ${p.description} (${p.final_price}€)`))
    }

    if (matId) {
        const { data: matPrices } = await supabase
            .from("price_master")
            .select("code, description, final_price")
            .eq("category_id", matId)
            .limit(10)
        console.log(`\nMateriales Prices (${matId}):`)
        matPrices?.forEach(p => console.log(`- [${p.code}] ${p.description} (${p.final_price}€)`))
    }
}

research()
