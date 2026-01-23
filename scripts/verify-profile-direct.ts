import { createClient } from "@supabase/supabase-js"

async function verifyProfile() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("--- Verifying Profile Directly via Supabase Client ---")
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, user_type, country, email')
        .eq('email', 'presupuestaloficial@gmail.com')

    if (error) {
        console.error("Select Error:", error)
    } else {
        console.log("Profile Data:", JSON.stringify(data, null, 2))
    }
}

verifyProfile()
