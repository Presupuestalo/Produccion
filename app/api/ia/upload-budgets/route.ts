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
    const files = formData.getAll("files") as File[]

    if (files.length === 0 || files.length > 3) {
      return NextResponse.json({ error: "Debes subir entre 1 y 3 archivos" }, { status: 400 })
    }

    const fileUrls: string[] = []

    for (const file of files) {
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 8)
      const fileExt = file.name.split(".").pop()
      const fileName = `${session.user.id}/${timestamp}-${randomId}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage.from("pdfs").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        console.error("[v0] Error uploading budget:", uploadError)
        return NextResponse.json({ error: `Error al subir archivo: ${uploadError.message}` }, { status: 500 })
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("pdfs").getPublicUrl(fileName)

      fileUrls.push(publicUrl)
    }

    return NextResponse.json({ fileUrls })
  } catch (error) {
    console.error("[v0] Error uploading files:", error)
    return NextResponse.json({ error: "Error al subir archivos" }, { status: 500 })
  }
}

