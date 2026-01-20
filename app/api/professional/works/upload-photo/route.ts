import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get("file") as File
        const workId = formData.get("workId") as string
        const phase = formData.get("phase") as string // "before", "during", "after" or "featured"

        if (!file || !workId || !phase) {
            return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
        }

        const supabase = await createClient()

        if (!supabase) {
            return NextResponse.json({ error: "No se pudo conectar con la base de datos" }, { status: 500 })
        }

        const {
            data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        // Verificar que el trabajo pertenece al usuario
        const { data: workData, error: workError } = await supabase
            .from("professional_works")
            .select("id")
            .eq("id", workId)
            .eq("user_id", session.user.id)
            .single()

        if (workError || !workData) {
            return NextResponse.json({ error: "Trabajo no encontrado o no pertenece al usuario" }, { status: 403 })
        }

        // Generar nombre único para el archivo
        const fileExt = file.name.split(".").pop()
        const fileName = `${session.user.id}/${workId}/${phase}-${Date.now()}.${fileExt}`

        // Subir archivo a Supabase Storage (usamos el bucket professional-works)
        const { data: uploadData, error: uploadError } = await supabase.storage.from("professional-works").upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
        })

        if (uploadError) {
            console.error("[v0] API /professional/works/upload-photo - Error al subir archivo:", uploadError)
            return NextResponse.json({ error: `Error al subir la foto: ${uploadError.message}` }, { status: 500 })
        }

        // Obtener URL pública
        const {
            data: { publicUrl },
        } = supabase.storage.from("professional-works").getPublicUrl(fileName)

        // Si es la imagen destacada, actualizamos el trabajo directamente
        if (phase === "featured") {
            const { error: updateError } = await supabase
                .from("professional_works")
                .update({ featured_image_url: publicUrl })
                .eq("id", workId)

            if (updateError) {
                return NextResponse.json({ error: `Error al actualizar imagen destacada: ${updateError.message}` }, { status: 500 })
            }
            return NextResponse.json({ success: true, url: publicUrl })
        }

        // Si es una foto de fase, la guardamos en professional_work_photos
        const { data: photoData, error: photoError } = await supabase
            .from("professional_work_photos")
            .insert({
                work_id: workId,
                photo_url: publicUrl,
                phase: phase as any,
                storage_path: fileName,
                created_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (photoError) {
            // Intentar eliminar el archivo subido si falla la DB
            await supabase.storage.from("professional-works").remove([fileName])
            return NextResponse.json({ error: `Error al guardar la foto en BD: ${photoError.message}` }, { status: 500 })
        }

        return NextResponse.json({ success: true, photo: photoData })
    } catch (error: any) {
        console.error("[v0] API /professional/works/upload-photo - Error inesperado:", error)
        return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
    }
}
