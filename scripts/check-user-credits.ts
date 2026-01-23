import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUserStatus() {
    const userId = "acf8fc4c-9b46-47af-97c0-f25168e64fa7"

    console.log(`Checking status for user: ${userId}`)

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single()
    console.log("Profile:", profile)

    const { data: credits, error: creditsErr } = await supabase.from('company_credits').select('*').eq('company_id', userId).single()
    console.log("Credits Data:", credits || creditsErr)

    const { data: txs } = await supabase.from('credit_transactions').select('*').eq('company_id', userId).order('created_at', { ascending: false })
    console.log("Transactions:", txs)
}

checkUserStatus()
