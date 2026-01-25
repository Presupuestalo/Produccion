export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 })
    }

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase()
    const fileName = `floor-plans/${session.user.id}/${Date.now()}-${file.name.split(".")[0]}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage.from("planos-reconocidos").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("[v0] Error al subir plano:", uploadError)
      return NextResponse.json({ error: uploadError.message || "Error al subir el archivo" }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("planos-reconocidos").getPublicUrl(fileName)

    return NextResponse.json({ imageUrl: publicUrl })
  } catch (error: any) {
    console.error("Error al subir plano:", error)
    return NextResponse.json({ error: error.message || "Error al subir el archivo" }, { status: 500 })
  }
}

