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

    console.log("Fetching plans for user:", session.user.id)

    const { data: plans, error } = await supabase
      .from("project_floor_plans")
      .select("*") // Removed projects join to rule out RLS issues/foreign key errors
      .order("updated_at", { ascending: false })
      .limit(20)

    console.log("Plans found:", plans?.length, "Error:", error)

    // Map to frontend expected format
    const formattedPlans = (plans || []).map((plan: any) => ({
      id: plan.id, // PRIMARY KEY of the plan
      projectId: plan.project_id, // Keep reference if needed
      name: plan.name || "Sin nombre", // Removed plan.projects?.title fallback
      created_at: plan.updated_at || new Date().toISOString(),
      thumbnail: plan.image_url,
      variant: plan.variant
    }))

    if (error) {
      console.error("Error fetching plans:", error)
      return NextResponse.json({ plans: [], debug_error: error })
    }

    return NextResponse.json({
      plans: formattedPlans,
      debug_user: session.user.id,
      debug_count: formattedPlans.length
    })


  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ plans: [] })
  }
}

