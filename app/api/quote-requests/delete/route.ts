export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        if (!supabase) {
            return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
        }

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const { requestId } = await req.json()

        if (!requestId) {
            return NextResponse.json({ error: "ID de solicitud requerido" }, { status: 400 })
        }

        // Buscar el request para verificar propiedad
        const { data: request, error: requestError } = await supabaseAdmin
            .from("quote_requests")
            .select("*")
            .eq("id", requestId)
            .single()

        if (requestError || !request) {
            return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
        }

        // Verificar que el usuario es el propietario
        if (request.user_id !== user.id) {
            return NextResponse.json({ error: "No tienes permiso para eliminar esta solicitud" }, { status: 403 })
        }

        // Primero eliminar las ofertas asociadas (si no hay cascade delete)
        await supabaseAdmin.from("quote_offers").delete().eq("quote_request_id", requestId)

        // Proceder con la eliminación de la solicitud
        const { error: deleteError } = await supabaseAdmin
            .from("quote_requests")
            .delete()
            .eq("id", requestId)

        if (deleteError) {
            console.error("[v0] Error deleting quote request:", deleteError)
            return NextResponse.json({ error: "Error al eliminar la solicitud" }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: "Solicitud eliminada correctamente" })
    } catch (error: any) {
        console.error("[v0] Error in quote request deletion:", error)
        return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
    }
}
