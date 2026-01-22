export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
  console.log("[v0] API /room-photos/delete - Solicitud recibida")

  try {
    const { photoId, photoUrl } = await request.json()

    console.log("[v0] API /room-photos/delete - Datos recibidos:", {
      photoId,
      photoUrl,
    })

    if (!photoId) {
      console.error("[v0] API /room-photos/delete - Falta photoId")
      return NextResponse.json({ error: "Falta photoId" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log("[v0] API /room-photos/delete - Sesión:", {
      tieneSession: !!session,
      userId: session?.user?.id,
    })

    if (!session) {
      console.error("[v0] API /room-photos/delete - No autorizado")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: photoData, error: photoError } = await supabase
      .from("room_photos")
      .select("storage_path, user_id")
      .eq("id", photoId)
      .single()

    if (photoError || !photoData) {
      console.error("[v0] API /room-photos/delete - Foto no encontrada:", photoError)
      return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 })
    }

    if (photoData.user_id !== session.user.id) {
      console.error("[v0] API /room-photos/delete - No autorizado para eliminar esta foto")
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    console.log("[v0] API /room-photos/delete - Eliminando archivo de Storage:", photoData.storage_path)

    // Eliminar archivo de Storage
    const { error: storageError } = await supabase.storage.from("room-photos").remove([photoData.storage_path])

    if (storageError) {
      console.error("[v0] API /room-photos/delete - Error al eliminar de Storage:", storageError)
      // Continuar con la eliminación de la BD aunque falle el Storage
    }

    // Eliminar registro de la base de datos
    console.log("[v0] API /room-photos/delete - Eliminando registro de BD...")
    const { error: deleteError } = await supabase.from("room_photos").delete().eq("id", photoId)

    if (deleteError) {
      console.error("[v0] API /room-photos/delete - Error al eliminar de BD:", deleteError)
      return NextResponse.json({ error: `Error al eliminar la foto: ${deleteError.message}` }, { status: 500 })
    }

    console.log("[v0] API /room-photos/delete - Foto eliminada exitosamente")

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] API /room-photos/delete - Error inesperado:", error)
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
  }
}

