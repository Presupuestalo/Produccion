import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("[v0] API /room-photos/list - Solicitud recibida")

  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get("projectId")
    const phase = searchParams.get("phase")

    console.log("[v0] API /room-photos/list - Parámetros:", { projectId, phase })

    if (!projectId) {
      console.error("[v0] API /room-photos/list - Falta projectId")
      return NextResponse.json({ error: "projectId es requerido" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log("[v0] API /room-photos/list - Sesión:", {
      tieneSession: !!session,
      userId: session?.user?.id,
    })

    if (!session) {
      console.error("[v0] API /room-photos/list - No autorizado")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Construir query
    console.log("[v0] API /room-photos/list - Construyendo query...")
    let query = supabase
      .from("room_photos")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })

    // Filtrar por fase si se proporciona
    if (phase) {
      console.log("[v0] API /room-photos/list - Filtrando por fase:", phase)
      query = query.eq("phase", phase)
    }

    console.log("[v0] API /room-photos/list - Ejecutando query...")
    const { data, error } = await query

    if (error) {
      console.error("[v0] API /room-photos/list - Error al listar fotos:", error)
      return NextResponse.json({ error: "Error al listar fotos" }, { status: 500 })
    }

    console.log("[v0] API /room-photos/list - Fotos obtenidas:", data?.length || 0)

    // Agrupar fotos por habitación
    const photosByRoom: Record<string, any[]> = {}
    data.forEach((photo) => {
      const roomKey = photo.room_name || "general"
      if (!photosByRoom[roomKey]) {
        photosByRoom[roomKey] = []
      }
      photosByRoom[roomKey].push(photo)
    })

    console.log("[v0] API /room-photos/list - Fotos agrupadas por habitación:", Object.keys(photosByRoom))

    return NextResponse.json({ photos: photosByRoom, allPhotos: data })
  } catch (error: any) {
    console.error("[v0] API /room-photos/list - Error inesperado:", error)
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
  }
}
