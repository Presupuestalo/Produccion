import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pnbvkeysbrixiphlmzjn.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuYnZrZXlzYnJpeGlwaGxtempuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4ODQxMTQsImV4cCI6MjA1OTQ2MDExNH0.D15u1w3aEa4fR1YJtfJWMIEawrW3SP5NJqWHOZXwdz0"

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
