export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("[v0] API /room-photos/upload - Solicitud recibida")

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const projectId = formData.get("projectId") as string
    const phase = formData.get("phase") as string
    const roomName = formData.get("roomName") as string | null

    console.log("[v0] API /room-photos/upload - Datos recibidos:", {
      tieneArchivo: !!file,
      nombreArchivo: file?.name,
      tamanoArchivo: file?.size,
      projectId,
      phase,
      roomName,
    })

    if (!file || !projectId || !phase) {
      console.error("[v0] API /room-photos/upload - Faltan datos requeridos")
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    const supabase = await createClient()

    if (!supabase) {
      console.error("[v0] API /room-photos/upload - Fallo al inicializar Supabase")
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log("[v0] API /room-photos/upload - Sesión:", {
      tieneSession: !!session,
      userId: session?.user?.id,
    })

    if (!session) {
      console.error("[v0] API /room-photos/upload - No autorizado")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el proyecto pertenece al usuario
    console.log("[v0] API /room-photos/upload - Verificando proyecto...")
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", session.user.id)
      .single()

    if (projectError || !projectData) {
      console.error("[v0] API /room-photos/upload - Proyecto no encontrado:", projectError)
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 403 })
    }

    console.log("[v0] API /room-photos/upload - Proyecto verificado")

    // Generar nombre único para el archivo
    const fileExt = file.name.split(".").pop()
    const fileName = `${projectId}/${phase}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    console.log("[v0] API /room-photos/upload - Subiendo archivo a Storage:", fileName)

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage.from("room-photos").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("[v0] API /room-photos/upload - Error al subir archivo:", uploadError)
      return NextResponse.json({ error: `Error al subir la foto: ${uploadError.message}` }, { status: 500 })
    }

    console.log("[v0] API /room-photos/upload - Archivo subido exitosamente:", uploadData)

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("room-photos").getPublicUrl(fileName)

    console.log("[v0] API /room-photos/upload - URL pública:", publicUrl)

    // Guardar referencia en la base de datos
    console.log("[v0] API /room-photos/upload - Guardando referencia en BD...")
    const { data: photoData, error: photoError } = await supabase
      .from("room_photos")
      .insert({
        project_id: projectId,
        user_id: session.user.id,
        room_name: roomName || "Proyecto",
        phase: phase,
        photo_url: publicUrl,
        storage_path: fileName,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (photoError) {
      console.error("[v0] API /room-photos/upload - Error al guardar referencia:", photoError)
      // Intentar eliminar el archivo subido
      await supabase.storage.from("room-photos").remove([fileName])
      return NextResponse.json({ error: `Error al guardar la foto: ${photoError.message}` }, { status: 500 })
    }

    console.log("[v0] API /room-photos/upload - Foto guardada exitosamente:", photoData)

    return NextResponse.json({ success: true, photo: photoData })
  } catch (error: any) {
    console.error("[v0] API /room-photos/upload - Error inesperado:", error)
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
  }
}

