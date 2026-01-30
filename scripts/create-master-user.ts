
import { createClient } from '@supabase/supabase-js'

// Using credentials verified in check-db.ts
const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const MASTER_EMAIL = 'presupuestaloficial@gmail.com'
const INITIAL_PASSWORD = 'PresupuestaloMasterUser2026!'

async function createMasterUser() {
    console.log(`Checking if user ${MASTER_EMAIL} exists...`)

    // 1. Check if user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
        console.error('Error listing users:', listError)
        return
    }

    let user = users.find(u => u.email === MASTER_EMAIL)
    let userId = user?.id

    if (!user) {
        console.log(`User does not exist. Creating ${MASTER_EMAIL}...`)
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: MASTER_EMAIL,
            password: INITIAL_PASSWORD,
            email_confirm: true,
            user_metadata: {
                full_name: 'Presupuestalo Oficial',
                user_type: 'company'
            }
        })

        if (createError) {
            console.error('Error creating user:', createError)
            return
        }

        if (newUser.user) {
            user = newUser.user
            userId = newUser.user.id
            console.log('User created successfully:', userId)
        } else {
            console.error('User created but no user object returned')
            return
        }
    } else {
        console.log(`User already exists: ${userId}`)
    }

    if (!userId) {
        console.error('User ID is null')
        return
    }

    // 2. Assign Permissions (is_admin AND role='master')
    console.log('Assigning master permissions...')

    // Force update profiles table
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            is_admin: true,
            role: 'master',
            user_type: 'company',
            subscription_plan: 'enterprise'
        })
        .eq('id', userId)

    if (updateError) {
        console.error('Error updating permissions:', updateError)

        // Fallback: upsert
        console.log('Attempting upsert text...')
        const { error: upsertError } = await supabase.from('profiles').upsert({
            id: userId,
            email: MASTER_EMAIL,
            full_name: 'Presupuestalo Oficial',
            is_admin: true,
            role: 'master',
            user_type: 'company',
            subscription_plan: 'enterprise',
            updated_at: new Date().toISOString()
        })

        if (upsertError) {
            console.error('Failed to upsert profile:', upsertError)
        } else {
            console.log('Profile upserted successfully.')
        }

    } else {
        console.log('Permissions updated successfully.')
    }

    // Double check
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single()
    console.log('Final Profile State:', JSON.stringify({
        email: profile?.email,
        is_admin: profile?.is_admin,
        role: profile?.role,
        plan: profile?.subscription_plan
    }, null, 2))
}

createMasterUser()
