import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCounts() {
    const { count: txCount } = await supabase.from('credit_transactions').select('*', { count: 'exact', head: true })
    const { count: creditsCount } = await supabase.from('company_credits').select('*', { count: 'exact', head: true })

    console.log(`credit_transactions count: ${txCount}`)
    console.log(`company_credits count: ${creditsCount}`)
}

checkCounts()
