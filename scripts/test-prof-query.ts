
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testQuery() {
    const reformProvince = 'Toledo'
    const currentCountry = 'España'

    console.log(`Searching for professionals in ${reformProvince}, ${currentCountry}...`)

    const { data: professionals, error: profsError } = await supabase
        .from("profiles")
        .select("id, full_name, email, user_type, country, address_province, service_provinces")
        .eq("user_type", "professional")
        .eq("country", currentCountry)
        .not("email", "is", null)
        .or(`address_province.ilike.${reformProvince},service_provinces.cs.{${reformProvince}}`)

    if (profsError) {
        console.error("Error:", profsError)
        return
    }

    console.log(`Found ${professionals?.length || 0} professionals:`)
    professionals?.forEach(p => {
        console.log(`- ${p.full_name} (${p.email}): service_provinces=${JSON.stringify(p.service_provinces)}, address_province=${p.address_province}`)
    })
}

testQuery()
