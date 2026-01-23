
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLeads() {
    const { data, error } = await supabase
        .from('lead_requests')
        .select('id, city, province, reform_types, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Latest Leads:', data)
}

checkLeads()
