import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.json({ error: "Supabase environment variables not found" }, { status: 500 })
  }

  return NextResponse.json({
    url,
    anonKey: key,
  })
}
