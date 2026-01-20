import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, user_type, email, is_admin, company_name")
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("Error fetching profile:", error)
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error in profile route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
