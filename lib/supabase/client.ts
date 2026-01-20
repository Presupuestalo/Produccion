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

  // 1. Try using environment variables directly (Production / Local)
  if (envUrl && envKey) {
    try {
      supabaseInstance = createSupabaseBrowserClient(envUrl, envKey)
      return supabaseInstance
    } catch (e) {
      console.error("Error creating Supabase client with env vars:", e)
    }
  }

  // 2. If env vars are missing, try fetching from server API (v0 Preview)
  try {
    // Use a relative URL to avoid issues with base URL
    const response = await fetch("/api/supabase-config")
    if (!response.ok) {
      console.warn("Failed to fetch Supabase config from server")
      return null
    }

    const config = await response.json()
    if (config.url && config.anonKey) {
      supabaseInstance = createSupabaseBrowserClient(config.url, config.anonKey)
      return supabaseInstance
    }
  } catch (error) {
    console.error("Error initializing Supabase client:", error)
  }

  return null
}

// Export a synchronous client for backward compatibility where possible,
// but it might be null in v0 preview.
// We use a try-catch block to prevent module initialization errors
let syncClient = null
try {
  if (envUrl && envKey) {
    syncClient = createSupabaseBrowserClient(envUrl, envKey)
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
        console.error("Error checking session:", error)
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
        console.error("Error refreshing session:", error)
      }
      return null
    }
    return data.session
  } catch (error) {
    console.error("Error refreshing session:", error)
    return null
  }
}
