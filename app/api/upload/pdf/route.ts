export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No se ha proporcionado ningún archivo" }, { status: 400 })
    }

    console.log("[v0] Subiendo archivo:", file.name, "Tipo:", file.type, "Tamaño:", file.size)

    // Validar que sea un PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "El archivo debe ser un PDF" }, { status: 400 })
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "El archivo no puede superar los 10MB" }, { status: 400 })
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const fileName = `${session.user.id}/${timestamp}-${randomId}.pdf`

    const { data: uploadData, error: uploadError } = await supabase.storage.from("pdfs").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: "application/pdf",
    })

    if (uploadError) {
      console.error("[v0] Error de Supabase Storage:", uploadError?.message || uploadError)
      return NextResponse.json(
        { error: `Error de almacenamiento: ${uploadError?.message || "desconocido"}` },
        { status: 500 },
      )
    }

    console.log("[v0] PDF subido correctamente")

    const {
      data: { publicUrl },
    } = supabase.storage.from("pdfs").getPublicUrl(fileName)

    return NextResponse.json({
      url: publicUrl,
      fileName: file.name,
      size: file.size,
    })
  } catch (error: any) {
    console.error("[v0] Error general subiendo PDF:", error?.message || error)
    return NextResponse.json({ error: error?.message || "Error al subir el archivo" }, { status: 500 })
  }
}

