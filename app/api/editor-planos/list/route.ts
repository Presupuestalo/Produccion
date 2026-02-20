export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
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

    const { data: plans, error } = await supabase
      .from("project_floor_plans")
      .select("id, name, updated_at, image_url, variant, project_id, user_id, projects(title)")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Error fetching plans:", error)
      return NextResponse.json({ plans: [], debug_error: error.message })
    }

    // Map to frontend expected format
    const formattedPlans = (plans || []).map((plan: any) => ({
      id: plan.id,
      projectId: plan.project_id,
      projectName: plan.projects?.title || null,
      name: plan.name || "Sin nombre",
      created_at: plan.updated_at || new Date().toISOString(),
      thumbnail: plan.image_url,
      variant: plan.variant,
    }))

    return NextResponse.json({
      plans: formattedPlans,
    })
  } catch (error) {
    console.error("Error in editor-planos list:", error)
    return NextResponse.json({ plans: [] })
  }
}

