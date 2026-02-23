import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import StandaloneViewerClient from "./client"

export const dynamic = "force-dynamic"

export default async function StandaloneViewerPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const supabase = await createClient()

    if (!supabase) {
        return <div>Error de configuración</div>
    }

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect("/auth/login")
    }

    // Fetch plan by ID
    const { data: plan, error } = await supabase
        .from("project_floor_plans")
        .select("*, projects(title)")
        .eq("id", params.id)
        .single()

    if (error || !plan) {
        console.error("Plan not found for viewer", error)
        return <div className="p-8 text-center text-slate-500">Plano no encontrado o no tienes permisos para verlo.</div>
    }

    return (
        <StandaloneViewerClient
            initialData={plan.data || {}}
            planName={plan.name}
            projectName={plan.projects?.title}
            variant={plan.variant}
        />
    )
}
