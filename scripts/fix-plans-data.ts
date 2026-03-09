
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"
import fs from "fs"

// Load env vars from .env.local
const envPath = path.resolve(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath))
    for (const k in envConfig) {
        process.env[k] = envConfig[k]
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixPlans() {
    console.log("Synchronizing plan_type with variant in project_floor_plans...")

    // 1. Where variant is 'proposal', plan_type MUST be 'after'
    const { data: d1, error: e1 } = await supabase
        .from("project_floor_plans")
        .update({ plan_type: 'after' })
        .eq("variant", "proposal")
        .neq("plan_type", "after")
        .select("id")

    if (e1) {
        console.error("Error updating proposals to 'after':", e1)
    } else {
        console.log(`Updated ${d1?.length || 0} proposals to plan_type='after'`)
    }

    // 2. Where variant is 'current', plan_type MUST be 'before'
    const { data: d2, error: e2 } = await supabase
        .from("project_floor_plans")
        .update({ plan_type: 'before' })
        .eq("variant", "current")
        .neq("plan_type", "before")
        .select("id")

    if (e2) {
        console.error("Error updating current plans to 'before':", e2)
    } else {
        console.log(`Updated ${d2?.length || 0} current plans to plan_type='before'`)
    }

    // 3. Fallback: if variant is null, try to set it from plan_type
    const { data: d3, error: e3 } = await supabase
        .from("project_floor_plans")
        .update({ variant: 'current' })
        .is("variant", null)
        .eq("plan_type", "before")
        .select("id")

    if (e3) console.error("Error updating null variants (before):", e3)
    else console.log(`Fixed ${d3?.length || 0} null variants to 'current'`)

    const { data: d4, error: e4 } = await supabase
        .from("project_floor_plans")
        .update({ variant: 'proposal' })
        .is("variant", null)
        .eq("plan_type", "after")
        .select("id")

    if (e4) console.error("Error updating null variants (after):", e4)
    else console.log(`Fixed ${d4?.length || 0} null variants to 'proposal'`)
}

fixPlans()
