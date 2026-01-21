export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: preferences, error } = await supabase
      .from("company_lead_preferences")
      .select("*")
      .eq("company_id", user.id)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching preferences:", error)
      return NextResponse.json({ error: "Error al obtener preferencias" }, { status: 500 })
    }

    return NextResponse.json({ preferences })
  } catch (error: any) {
    console.error("[v0] Error in preferences GET:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const preferences = await req.json()

    const { data, error } = await supabase
      .from("company_lead_preferences")
      .upsert({
        company_id: user.id,
        ...preferences,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving preferences:", error)
      return NextResponse.json({ error: "Error al guardar preferencias" }, { status: 500 })
    }

    return NextResponse.json({ success: true, preferences: data })
  } catch (error: any) {
    console.error("[v0] Error in preferences POST:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

