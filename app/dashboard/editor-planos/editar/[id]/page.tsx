import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import EditPlanClient from "./client"

export const dynamic = "force-dynamic"

export default async function EditPlanPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const supabase = await createClient()

    if (!supabase) {
        return <div>Error de configuración</div>
    }

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect("/auth/login")
    }

    // Try to fetch by ID (Primary Key) -> Standard behavior for V2 decoupled plans
    let { data: plan, error } = await supabase
        .from("project_floor_plans")
        .select("*, projects:project_id(title)")
        .eq("id", params.id)
        .single()

    // Fallback if join fails or plan not found by primary ID
    if (error || !plan) {
        if (error) console.warn("Retry without join or fallback search due to:", error.message)

        // Retry without join first for the same ID
        const fallback = await supabase
            .from("project_floor_plans")
            .select("*")
            .eq("id", params.id)
            .single()

        if (fallback.data) {
            plan = fallback.data
            error = null
        }
    }

    // Fallback logic: If plan not found by ID (even if error occurred), check legacy project_id lookup
    // Only proceed to fallback if we didn't find the plan by ID
    if (!plan) {
        const { data: projectPlan, error: projectError } = await supabase
            .from("project_floor_plans")
            .select("*, projects(title)")
            .eq("project_id", params.id)
            .order("updated_at", { ascending: false })
            .limit(1)
            .single()

        if (projectPlan) {
            plan = projectPlan
            // Clear error since we found a plan via fallback
            error = null
        }
    }

    if (!plan) {
        // If still not found, implies it might be a new plan or invalid ID.
        // However, we rely on "Nuevo Plano" for new plans.
        // If the ID is valid but no plan exists, it's an error 404 fundamentally.
        // But let's allow the client to handle it gracefully or redirect.
        console.error("Plan not found", error)
        // return redirect("/dashboard/editor-planos") // Optional: redirect to list

        // For now, pass null to client, but client expects data.
        // Let's assume it's a new standalone plan if ID is just a random string? 
        // No, that's dangerous.

        return <div className="p-8 text-center">Plano no encontrado. <a href="/dashboard/editor-planos" className="text-blue-500 underline">Volver al listado</a></div>
    }

    // Ensure 'data' field has the structure EditorContainer expects
    const initialData = plan.data || {}
    // Add projectName to initialData for EditorContainer settings dialog
    const enrichedInitialData = {
        ...initialData,
        projectName: (plan as any).projects?.title || null
    }

    return <EditPlanClient
        initialData={enrichedInitialData}
        planId={plan.id}
        projectId={plan.project_id}
        planName={plan.name}
        variant={plan.variant}
    />
}
