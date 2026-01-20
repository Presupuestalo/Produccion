import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("budget_comparisons")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Análisis no encontrado" }, { status: 404 })
    }

    return NextResponse.json(data.analysis)
  } catch (error) {
    console.error("Error fetching analysis:", error)
    return NextResponse.json({ error: "Error al cargar análisis" }, { status: 500 })
  }
}
