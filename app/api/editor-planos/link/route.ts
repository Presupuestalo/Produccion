export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest) {
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

        const { planId, projectId, variant } = await request.json()

        if (!planId) {
            return NextResponse.json({ error: "planId requerido" }, { status: 400 })
        }

        // Verify ownership of the plan
        const { data: plan, error: planError } = await supabase
            .from("project_floor_plans")
            .select("id, user_id")
            .eq("id", planId)
            .eq("user_id", session.user.id)
            .single()

        if (planError || !plan) {
            return NextResponse.json({ error: "Plano no encontrado o sin permisos" }, { status: 404 })
        }

        // If linking (projectId provided), check no other plan already occupies that slot
        if (projectId && variant) {
            const { data: existing } = await supabase
                .from("project_floor_plans")
                .select("id")
                .eq("project_id", projectId)
                .eq("variant", variant)
                .neq("id", planId)
                .single()

            if (existing) {
                return NextResponse.json(
                    { error: `Ya existe un plano en el slot '${variant}' de este proyecto. Desvincula el anterior primero.` },
                    { status: 409 }
                )
            }
        }

        // Update plan: link or unlink
        const { error: updateError } = await supabase
            .from("project_floor_plans")
            .update({
                project_id: projectId || null,
                variant: projectId ? (variant || "current") : null,
            })
            .eq("id", planId)

        if (updateError) {
            console.error("Error linking plan:", updateError)
            return NextResponse.json({ error: "Error al vincular el plano", details: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
