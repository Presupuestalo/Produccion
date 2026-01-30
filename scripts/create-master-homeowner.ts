
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"

const supabase = createClient(supabaseUrl, supabaseKey)

const MASTER_EMAIL = 'propietariopresupuestalo1@gmail.com'
const INITIAL_PASSWORD = 'PresupuestaloPropietario2026!'

async function createMasterHomeowner() {
    console.log(`Checking if user ${MASTER_EMAIL} exists...`)

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
        console.error('Error listing users:', listError)
        return
    }

    let user = users.find(u => u.email === MASTER_EMAIL)

    if (!user) {
        console.log(`User ${MASTER_EMAIL} not found. Creating...`)
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: MASTER_EMAIL,
            password: INITIAL_PASSWORD,
            email_confirm: true,
            user_metadata: {
                full_name: 'Propietario Master',
                user_type: 'homeowner'
            }
        })

        if (createError) {
            console.error('Error creating user:', createError)
            return
        }
        user = newUser.user
        console.log('User created successfully:', user.id)
    } else {
        console.log('User already exists:', user.id)
    }

    console.log('Updating profile to ensure it is master/homeowner...')
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            email: MASTER_EMAIL,
            full_name: 'Propietario Master',
            user_type: 'homeowner',
            role: 'master',
            is_admin: true,
            subscription_plan: 'premium'
        })

    if (profileError) {
        console.error('Error updating profile:', profileError)
    } else {
        console.log('Profile updated successfully as MASTER HOMEOWNER.')
    }
}

createMasterHomeowner()
