
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

async function debug() {
    const projectId = "a7e9d9ea-b35d-407a-aed4-14a91203525b"
    const { data: project, error: pError } = await supabase.from("projects").select("*").eq("id", projectId).single()

    if (pError || !project) {
        console.error("Error or no project found", pError)
        return
    }

    console.log(`TITLE: ${project.title}`)
    console.log(`ST_DB: ${project.structure_type}`)

    const { data: calcDataEntry, error: cError } = await supabase.from("calculator_data").select("*").eq("project_id", project.id).single()
    if (cError) {
        console.log("No calculator_data found:", cError.message)
    } else {
        console.log(`CALC_DATA_COLS: [${Object.keys(calcDataEntry).join(", ")}]`)
        // Print snippets of all json columns
        for (const col of Object.keys(calcDataEntry)) {
            const val = calcDataEntry[col]
            if (typeof val === 'object' && val !== null) {
                console.log(`  Col [${col}] keys: [${Object.keys(val).join(", ")}]`)
            } else {
                console.log(`  Col [${col}]: ${val}`)
            }
        }
    }

    const { data: budgets } = await supabase.from("budgets").select("*").eq("project_id", projectId).order("version_number", { ascending: false }).limit(1)
    if (budgets?.[0]) {
        console.log(`BUDGET: v${budgets[0].version_number}`)
        const { data: items } = await supabase.from("budget_line_items").select("*").eq("budget_id", budgets[0].id).eq("concept_code", "02-A-01")
        console.log(`ARLITA: ${items?.[0]?.quantity || 0} m²`)
    }
}

debug()
