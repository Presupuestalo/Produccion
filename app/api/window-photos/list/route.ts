import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get("projectId")
    const windowId = searchParams.get("windowId")

    if (!projectId) {
      return NextResponse.json({ error: "projectId es requerido" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    let query = supabase
      .from("window_photos")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })

    if (windowId) {
      query = query.eq("window_id", windowId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: "Error al listar fotos" }, { status: 500 })
    }

    return NextResponse.json({ photos: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
  }
}
