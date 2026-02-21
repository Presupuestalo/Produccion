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

    // Attempt fetch with join
    let plans: any[] | null = null
    const { data: initialPlans, error: initialError } = await supabase
      .from("project_floor_plans")
      .select(`
        id, 
        name, 
        updated_at, 
        image_url, 
        variant, 
        project_id, 
        user_id, 
        projects:project_id (title)
      `)
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false })
      .limit(20)

    plans = initialPlans

    // Fallback if join fails (useful for local development or schema mismatches)
    if (initialError) {
      console.warn("Retrying without join due to error:", initialError.message)
      const { data: fallbackPlans, error: fallbackError } = await supabase
        .from("project_floor_plans")
        .select("id, name, updated_at, image_url, variant, project_id, user_id")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false })
        .limit(20)

      plans = fallbackPlans
      if (fallbackError) {
        console.error("Critical error fetching plans:", fallbackError)
        return NextResponse.json({ plans: [], debug_error: fallbackError.message })
      }

      // Manual join for project titles
      if (plans && plans.length > 0) {
        const projectIds = plans.map(p => p.project_id).filter(id => id);
        if (projectIds.length > 0) {
          const uniqueProjectIds = [...new Set(projectIds)];
          const { data: projectsData } = await supabase
            .from("projects")
            .select("id, title")
            .in("id", uniqueProjectIds);

          if (projectsData) {
            const projectMap = new Map();
            projectsData.forEach(p => projectMap.set(p.id, p));
            plans = plans.map(p => ({
              ...p,
              projects: p.project_id ? projectMap.get(p.project_id) : null
            }));
          }
        }
      }
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

