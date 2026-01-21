export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Verificar autenticaciÃ³n
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { projectId, planType, analysis } = await request.json()

    if (!projectId || !planType || !analysis) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    // Guardar anÃ¡lisis en la base de datos
    const { error } = await supabase.from("floor_plan_analysis").upsert({
      project_id: projectId,
      plan_type: planType,
      analysis_data: analysis,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error al guardar anÃ¡lisis:", error)
    return NextResponse.json({ error: error.message || "Error al guardar el anÃ¡lisis" }, { status: 500 })
  }
}

