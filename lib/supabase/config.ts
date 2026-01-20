// This file checks all possible environment variable names and provides fallbacks

export function getSupabaseConfig() {
  // Try all possible environment variable names
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL ||
    ""

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""

  console.log("[v0] Supabase Config Check:", {
    url: url ? "✓ Found" : "✗ Missing",
    anonKey: anonKey ? "✓ Found" : "✗ Missing",
  })

  return { url, anonKey }
}
