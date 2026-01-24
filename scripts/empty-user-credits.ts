import { supabaseAdmin } from "../lib/supabase-admin"

const userId = "d2552f2d-ce70-4a2e-a405-3f6119a763d4"

async function emptyCredits() {
    console.log(`Emptying credits for user: ${userId}`)

    const { data, error } = await supabaseAdmin
        .from("company_credits")
        .update({
            credits_balance: 0,
            updated_at: new Date().toISOString()
        })
        .eq("company_id", userId)
        .select()

    if (error) {
        console.error("Error emptying credits:", error)
        return
    }

    console.log("Updated record:", data)
    console.log("SUCCESS: All credits emptied.")
}

emptyCredits().catch(console.error)
