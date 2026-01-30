
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function verifyMasterUser() {
    const EMAIL = 'presupuestaloficial@gmail.com'
    console.log(`Verifying user ${EMAIL}...`)

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('email, is_admin, role, subscription_plan, user_type')
        .eq('email', EMAIL)

    if (error) {
        console.error('Error fetching profile:', error)
        return
    }

    if (!profiles || profiles.length === 0) {
        console.error('Profile not found!')
        return
    }

    const profile = profiles[0]
    console.log('Profile found:')
    console.table(profile)

    if (profile.is_admin && profile.role === 'master') {
        console.log('✅ User is verified as MASTER ADMIN.')
    } else {
        console.log('❌ User permissions are incorrect.')
    }
}

verifyMasterUser()
