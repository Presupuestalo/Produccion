import { supabaseAdmin } from "../lib/supabase-admin"

const userId = "d2552f2d-ce70-4a2e-a405-3f6119a763d4"

async function checkCredits() {
    console.log(`Checking credits for user: ${userId}`)

    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, credits, user_type")
        .eq("id", userId)
        .single()

    console.log("Profile Data:", profile)

    const { data: credits } = await supabaseAdmin
        .from("company_credits")
        .select("*")
        .eq("company_id", userId)
        .single()

    console.log("Company Credits Data:", credits)
}

checkCredits().catch(console.error)
