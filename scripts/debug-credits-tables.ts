import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTables() {
    console.log("Checking company_credits table...")
    const { data: credits, error: creditsError } = await supabase
        .from("company_credits")
        .select("*")
        .limit(5)

    if (creditsError) {
        console.error("Error fetching company_credits:", creditsError)
    } else {
        console.log("company_credits sample:", credits)
    }

    console.log("\nChecking credit_transactions table...")
    const { data: txs, error: txsError } = await supabase
        .from("credit_transactions")
        .select("*")
        .limit(5)

    if (txsError) {
        console.error("Error fetching credit_transactions:", txsError)
    } else {
        console.log("credit_transactions sample:", txs)
    }
}

checkTables()
