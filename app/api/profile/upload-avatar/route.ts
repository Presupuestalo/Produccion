import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 400 })
    }

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "La imagen no puede superar 2MB" }, { status: 400 })
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `${session.user.id}-${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("[v0] Error uploading avatar:", uploadError)
      return NextResponse.json({ error: "Error al subir avatar" }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName)

    console.log("[v0] Avatar subido a Supabase Storage:", publicUrl)

    // Actualizar perfil con nueva URL de avatar
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", session.user.id)

    if (updateError) {
      console.error("[v0] Error actualizando avatar en perfil:", updateError)
      return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      avatar_url: publicUrl,
    })
  } catch (error: any) {
    console.error("[v0] Error subiendo avatar:", error)
    return NextResponse.json(
      {
        error: error.message || "Error al subir avatar",
      },
      { status: 500 },
    )
  }
}
