import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function checkUserLeads() {
    const supabaseUrl = process.env.SUPABASE_URL || "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, supabaseKey!)

    const userEmail = "vascolreformas@gmail.com"

    console.log(`--- Checking leads for ${userEmail} ---`)

    const { data: profile } = await supabase.from('profiles').select('id').eq('email', userEmail).single()
    if (!profile) {
        console.log("Profile not found")
        return
    }

    const { data: leads, error } = await supabase
        .from('lead_requests')
        .select('*')
        .eq('homeowner_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5)

    if (error) {
        console.error("Error fetching leads:", error)
        return
    }

    console.log(`Found ${leads?.length || 0} leads.`)
    leads?.forEach((l, i) => {
        console.log(`Lead ${i + 1}: ID=${l.id}, Status=${l.status}, Created=${l.created_at}, Province=${l.province}, LeadType=${l.lead_type}`)
        console.log(`Summary: ${l.project_description?.substring(0, 50)}...`)
    })
}

checkUserLeads()
