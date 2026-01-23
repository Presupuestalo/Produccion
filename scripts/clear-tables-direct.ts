import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function clearTables() {
    console.log("Clearing credit_transactions...")
    const { error: txError } = await supabase
        .from("credit_transactions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000") // DELETE needs a filter in some Supabase versions/configs

    if (txError) {
        console.error("Error clearing credit_transactions:", txError)
    } else {
        console.log("credit_transactions cleared")
    }

    console.log("Clearing company_credits...")
    const { error: creditsError } = await supabase
        .from("company_credits")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000")

    if (creditsError) {
        console.error("Error clearing company_credits:", creditsError)
    } else {
        console.log("company_credits cleared")
    }
}

clearTables()
