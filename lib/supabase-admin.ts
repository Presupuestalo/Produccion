import { createClient } from "@supabase/supabase-js"

let supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://placeholder.supabase.co"

// Auto-corrección: Si la URL es la del proxy de Auth, cambiarla a la real del proyecto
// de lo contrario las peticiones a la DB fallarán.
if (supabaseUrl.includes("auth.presupuestalo.com")) {
    supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
}

const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    "build-placeholder-key"

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})
