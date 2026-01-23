import { createClient } from "@supabase/supabase-js"

import * as fs from 'fs'

async function debugNotifications() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"

    const supabase = createClient(supabaseUrl, supabaseKey)
    const results: any = {}

    const email = "presupuestaloficial@gmail.com"
    console.log(`Inspecting professional: ${email}`)

    const { data: profs, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)

    results.professional = profs || { error }

    // Attempt to replicate query
    const testProvince = "Madrid"
    const testCountry = "ES"

    const { data: matches, error: matchError } = await supabase
        .from("profiles")
        .select("id, full_name, email, user_type, country, address_province")
        .eq("address_province", testProvince)
        .eq("country", testCountry)

    results.matches = matches || { error: matchError }
    results.all_profs_count = profs?.length || 0
    results.test_params = { testProvince, testCountry }

    fs.writeFileSync('debug_prof_results.json', JSON.stringify(results, null, 2))
    console.log("Results written to debug_prof_results.json")

    process.exit(0)
}

debugNotifications()
