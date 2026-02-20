import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

// Default to process.env if available (Production)
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabaseInstance: ReturnType<typeof createSupabaseBrowserClient> | null = null

export function createBrowserClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  if (envUrl && envKey) {
    supabaseInstance = createSupabaseBrowserClient(envUrl, envKey)
    return supabaseInstance
  }

  return null as unknown as ReturnType<typeof createSupabaseBrowserClient>
}

export async function createClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (url && anonKey) {
    try {
      console.log(`[SupabaseClient] Initializing with: ${url}`)
      supabaseInstance = createSupabaseBrowserClient(url, anonKey)
      return supabaseInstance
    } catch (e) {
      console.error("Error creating Supabase client with env vars:", e)
    }
  }

  // Fallback for v0 preview or misconfigured envs
  try {
    const response = await fetch("/api/supabase-config")
    if (response.ok) {
      const config = await response.json()
      if (config.url && config.anonKey) {
        console.log(`[SupabaseClient] Initializing from API: ${config.url}`)
        supabaseInstance = createSupabaseBrowserClient(config.url, config.anonKey)
        return supabaseInstance
      }
    }
  } catch (error) {
    console.error("Error initializing Supabase client from API:", error)
  }

  return null
}

let syncClient: any = null
try {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (url && key) {
    syncClient = createSupabaseBrowserClient(url, key)
  }
} catch (e) {
  console.error("Error creating sync Supabase client:", e)
}

export const supabase = syncClient

// Explicitly export the async getter
export const getSupabase = async () => {
  return createClient()
}

export const checkSession = async () => {
  const client = await createClient()
  if (!client) return null

  try {
    const { data, error } = await client.auth.getSession()
    if (error) {
      if (!error.message.includes("refresh_token_not_found")) {
        if (typeof window !== "undefined") {
          console.error("Error checking session:", error)
        }
      }
      return null
    }
    return data.session
  } catch (error) {
    console.error("Error checking session:", error)
    return null
  }
}

export const refreshSession = async () => {
  const client = await createClient()
  if (!client) return null

  try {
    const { data, error } = await client.auth.refreshSession()
    if (error) {
      if (!error.message.includes("refresh_token_not_found")) {
        if (typeof window !== "undefined") {
          console.error("Error refreshing session:", error)
        }
      }
      return null
    }
    return data.session
  } catch (error) {
    console.error("Error refreshing session:", error)
    return null
  }
}
