import { createClient } from "@supabase/supabase-js"

async function simulatePublish() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    // User data for the test
    const email = "presupuestaloficial@gmail.com"
    const province = "Madrid"
    const country = "ES"

    console.log(`--- Simulating Notification Matching for ${email} ---`)
    console.log(`Criteria: Province=${province}, Country=${country}, Type=profesional`)

    const { data: professionals, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, user_type, country, address_province")
        .eq("user_type", "profesional")
        .ilike("address_province", province)
        .eq("country", country)
        .not("email", "is", null)

    if (error) {
        console.error("Error:", error)
        return
    }

    console.log("Matched professionals count:", professionals?.length || 0)
    const target = professionals?.find(p => p.email === email)
    if (target) {
        console.log("✅ TARGET FOUND!")
        console.log(JSON.stringify(target, null, 2))
    } else {
        console.log("❌ TARGET NOT FOUND in matches")
        if (professionals && professionals.length > 0) {
            console.log("Found emails:", professionals.map(p => p.email))
        }
    }
}

simulatePublish()
