export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
  try {
    const { photoId } = await request.json()

    if (!photoId) {
      return NextResponse.json({ error: "Falta photoId" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar autenticaciÃ³n
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: photoData, error: photoError } = await supabase
      .from("window_photos")
      .select("storage_path, user_id")
      .eq("id", photoId)
      .single()

    if (photoError || !photoData) {
      return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 })
    }

    if (photoData.user_id !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { error: storageError } = await supabase.storage.from("window-photos").remove([photoData.storage_path])

    if (storageError) {
      console.error("[v0] Error al eliminar de Storage:", storageError)
      // Continuar con la eliminaciÃ³n de la BD aunque falle el Storage
    }

    // Eliminar registro de la base de datos
    const { error: deleteError } = await supabase.from("window_photos").delete().eq("id", photoId)

    if (deleteError) {
      return NextResponse.json({ error: `Error al eliminar la foto: ${deleteError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
  }
}

