export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
    try {
        console.log("[v0] POST /api/leads/delete - Starting")
        const supabase = await createClient()
        if (!supabase) {
            return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
        }

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error("[v0] Auth error:", authError)
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const { leadId } = await req.json()

        if (!leadId) {
            return NextResponse.json({ error: "ID de solicitud requerido" }, { status: 400 })
        }

        // Buscar el lead para verificar propiedad y estado
        const { data: lead, error: leadError } = await supabaseAdmin
            .from("lead_requests")
            .select("*")
            .eq("id", leadId)
            .single()

        if (leadError || !lead) {
            console.error("[v0] Lead not found:", leadError)
            return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
        }

        // Verificar que el usuario es el propietario
        if (lead.homeowner_id !== user.id) {
            return NextResponse.json({ error: "No tienes permiso para eliminar esta solicitud" }, { status: 403 })
        }

        // Verificar si ha sido comprada por algún profesional
        if ((lead.companies_accessed_count || 0) > 0) {
            return NextResponse.json(
                {
                    error: "No puedes eliminar esta solicitud porque ya ha sido adquirida por profesionales",
                    message: "Una vez que un profesional ha pagado por tus datos de contacto, la solicitud no puede ser eliminada por motivos de transparencia y seguridad."
                },
                { status: 400 }
            )
        }

        // Proceder con la eliminación (o cancelación lógica)
        // En este caso, haremos un borrado físico de la solicitud ya que no ha sido comprada
        const { error: deleteError } = await supabaseAdmin
            .from("lead_requests")
            .delete()
            .eq("id", leadId)

        if (deleteError) {
            console.error("[v0] Error deleting lead:", deleteError)
            return NextResponse.json({ error: "Error al eliminar la solicitud" }, { status: 500 })
        }

        console.log("[v0] Lead deleted successfully:", leadId)

        return NextResponse.json({ success: true, message: "Solicitud eliminada correctamente" })
    } catch (error: any) {
        console.error("[v0] Error in lead deletion:", error)
        return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
    }
}
