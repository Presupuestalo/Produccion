
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"

const supabase = createClient(supabaseUrl, supabaseKey)

const EMAILS = [
    'presupuestaloficial@gmail.com',
    'propietariopresupuestalo1@gmail.com'
]

async function verify() {
    for (const email of EMAILS) {
        console.log(`\nVerifying user ${email}...`)
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('email, is_admin, role, user_type, subscription_plan')
            .eq('email', email)
            .single()

        if (error) {
            console.error(`Error fetching profile for ${email}:`, error.message)
            continue
        }

        console.log('Profile found:')
        console.table(profile)

        if (profile.is_admin && profile.role === 'master') {
            console.log(`✅ User ${email} is verified as MASTER ADMIN (${profile.user_type}).`)
        } else {
            console.log(`❌ User ${email} does NOT have full master permissions.`)
        }
    }
}

verify()
