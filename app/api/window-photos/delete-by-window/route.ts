export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const { windowId } = await request.json()

        if (!windowId) {
            return NextResponse.json({ error: "Falta windowId" }, { status: 400 })
        }

        const supabase = await createClient()

        if (!supabase) {
            return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
        }

        // Verificar autenticación
        const {
            data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { data: photos, error: fetchError } = await supabase
            .from("window_photos")
            .select("id, storage_path, user_id")
            .eq("window_id", windowId)
            .eq("user_id", session.user.id)

        if (fetchError) {
            return NextResponse.json({ error: "Error recuperando fotos de la ventana" }, { status: 500 })
        }

        if (!photos || photos.length === 0) {
            return NextResponse.json({ success: true, message: "No había fotos ligadas a esta ventana." })
        }

        // Extraer las rutas del Storage
        const storagePaths = photos.map(p => p.storage_path).filter(Boolean)

        if (storagePaths.length > 0) {
            const { error: storageError } = await supabase.storage.from("window-photos").remove(storagePaths)

            if (storageError) {
                console.error("[v0] Error al eliminar del Storage en cascada:", storageError)
                // Continuamos para eliminar los registros de la BD aunque falle Storage
            }
        }

        // Eliminar registros de la base de datos
        const photoIds = photos.map(p => p.id)
        const { error: deleteError } = await supabase
            .from("window_photos")
            .delete()
            .in("id", photoIds)

        if (deleteError) {
            return NextResponse.json({ error: `Error al vaciar registros de bbdd: ${deleteError.message}` }, { status: 500 })
        }

        return NextResponse.json({ success: true, count: photos.length })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
    }
}
