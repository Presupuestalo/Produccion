
import { createClient } from "@supabase/supabase-js"

async function checkOrphans() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("Checking if there are users in auth but not in profiles...")
    // We can't see auth.users directly from service role JS client usually 
    // depending on settings, but we can look for projects without profiles

    const { data: projects } = await supabase.from('projects').select('user_id').limit(10)
    if (projects) {
        for (const p of projects) {
            const { data: prof } = await supabase.from('profiles').select('id').eq('id', p.user_id).maybeSingle()
            if (!prof) {
                console.log(`Project owner ${p.user_id} has NO profile!`)
            } else {
                console.log(`Project owner ${p.user_id} has a profile.`)
            }
        }
    }
}

checkOrphans()
