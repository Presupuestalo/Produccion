export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { projectId, imageUrl } = await request.json()

    if (!projectId || !imageUrl) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }

    // Verificar si el usuario está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el proyecto pertenece al usuario
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", session.user.id)
      .single()

    if (projectError || !projectData) {
      return NextResponse.json({ error: "Proyecto no encontrado o no autorizado" }, { status: 403 })
    }

    // Usar SQL directo para insertar/actualizar el plano
    const sql = `
      INSERT INTO project_floor_plans (project_id, image_url, updated_at)
      VALUES ('${projectId}', '${imageUrl}', NOW())
      ON CONFLICT (project_id) 
      DO UPDATE SET image_url = '${imageUrl}', updated_at = NOW();
    `

    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("Error al ejecutar SQL:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
  }
}

