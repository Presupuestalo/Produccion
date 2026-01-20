import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export { createServerClient } from "@supabase/ssr"

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[Supabase] Missing environment variables - returning null client")
    return null
  }

  // cookies() solo funciona en request time, lo que previene pre-rendering
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        try {
          return cookieStore.get(name)?.value
        } catch (error) {
          console.error(`Error getting cookie ${name}:`, error)
          return undefined
        }
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          console.error(`Error setting cookie ${name}:`, error)
        }
      },
      remove(name, options) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          console.error(`Error removing cookie ${name}:`, error)
        }
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}
