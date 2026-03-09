
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

async function inspectPlans() {
    console.log("Fetching latest projects with floor plans...")

    // Fetch latest 5 projects that have floor plans
    const { data: projects, error: pError } = await supabase
        .from("project_floor_plans")
        .select("project_id, updated_at")
        .order("updated_at", { ascending: false })
        .limit(20)

    if (pError) {
        console.error("Error fetching projects:", pError)
        return
    }

    const uniqueProjectIds = Array.from(new Set(projects.map(p => p.project_id)))

    // Also check the column definitions
    const { data: cols, error: cError } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'project_floor_plans';"
    })
    if (!cError) {
        console.log("Columns in project_floor_plans:", cols.map((c: any) => c.column_name).join(", "))
    }

    for (const projectId of uniqueProjectIds.slice(0, 5)) {
        console.log(`\n--- Project: ${projectId} ---`)
        const { data: plans, error: fError } = await supabase
            .from("project_floor_plans")
            .select("*")
            .eq("project_id", projectId)
            .order("updated_at", { ascending: false })

        if (fError) {
            console.error("Error fetching plans:", fError)
            continue
        }

        plans.forEach(plan => {
            console.log(`Plan ID: ${plan.id}`)
            console.log(`  Name: "${plan.name}"`)
            console.log(`  Plan Type: ${plan.plan_type}`)
            console.log(`  Variant: ${plan.variant}`)
            console.log(`  Updated At: ${plan.updated_at}`)
            console.log(`  Image URL: ${plan.image_url.substring(0, 50)}...`)
        })
    }
}

inspectPlans()
