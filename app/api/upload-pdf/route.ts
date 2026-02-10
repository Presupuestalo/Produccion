export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "El archivo debe ser un PDF" }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "El archivo no puede superar los 10MB" }, { status: 400 })
    }

    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const fileExt = file.name.split(".").pop()
    const fileName = `${session.user.id}/${timestamp}-${randomId}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage.from("pdfs").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: "application/pdf",
    })

    if (uploadError) {
      console.error("[v0] Error uploading PDF to Supabase:", uploadError)
      return NextResponse.json({ error: `Error al subir el archivo: ${uploadError.message}` }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("pdfs").getPublicUrl(fileName)

    return NextResponse.json({
      url: publicUrl,
      fileName: file.name,
      size: file.size,
    })
  } catch (error: any) {
    console.error("[v0] Error uploading PDF:", error)
    return NextResponse.json({ error: error?.message || "Error al subir el archivo" }, { status: 500 })
  }
}

