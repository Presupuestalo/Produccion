export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: plans, error } = await supabase
      .from("floor_plans")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(8)

    if (error) {
      console.error("Error fetching plans:", error)
      return NextResponse.json({ plans: [] })
    }

    return NextResponse.json({ plans: plans || [] })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ plans: [] })
  }
}

