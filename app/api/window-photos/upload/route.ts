export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const projectId = formData.get("projectId") as string
    const windowId = formData.get("windowId") as string
    const roomId = formData.get("roomId") as string

    if (!file || !projectId || !windowId || !roomId) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar autenticaciÃ³n
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `${projectId}/${windowId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("window-photos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg",
      })

    if (uploadError) {
      console.error("[v0] Error uploading window photo:", uploadError)
      return NextResponse.json({ error: `Error al subir la foto: ${uploadError.message}` }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("window-photos").getPublicUrl(fileName)

    // Guardar referencia en la base de datos
    const { data: photoData, error: photoError } = await supabase
      .from("window_photos")
      .insert({
        project_id: projectId,
        window_id: windowId,
        room_id: roomId,
        user_id: session.user.id,
        photo_url: publicUrl,
        storage_path: fileName,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (photoError) {
      console.error("[v0] Error saving window photo to DB:", photoError)
      // Intentar eliminar el archivo subido
      await supabase.storage.from("window-photos").remove([fileName])
      return NextResponse.json({ error: `Error al guardar la foto: ${photoError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, photo: photoData })
  } catch (error: any) {
    console.error("[v0] Error en window photo upload:", error)
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
  }
}

