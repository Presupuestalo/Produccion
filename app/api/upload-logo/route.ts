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
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `${session.user.id}/${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage.from("logos").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("[v0] Error uploading logo:", uploadError)
      return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("logos").getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error("[v0] Error uploading logo:", error)
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 })
  }
}
