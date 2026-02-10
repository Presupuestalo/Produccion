export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("budget_comparisons")
      .select("*")
      .eq("id", id)
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
