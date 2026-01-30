
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"

const supabase = createClient(supabaseUrl, supabaseKey)

const TARGET_EMAIL = 'vascolreformas@gmail.com'

async function checkUser() {
  console.log(`Checking profile for ${TARGET_EMAIL}...`)
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, is_admin, role, user_type')
    .ilike('email', `%${TARGET_EMAIL.split('@')[0]}%`)

  if (error) {
    console.error('Error fetching profile:', error.message)
    return
  }

  if (profile && profile.length > 0) {
    console.log('Profiles found:')
    console.table(profile)
  } else {
    const { data: allProfiles, error: allErr } = await supabase.from('profiles').select('email').limit(10)
    console.log('No exact match found. Sample emails in profiles table:')
    console.table(allProfiles)
  }
}

checkUser()
