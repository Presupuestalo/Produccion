export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const { projectId, title, description, location, selectedPhotos } = await request.json()

        if (!projectId) {
            return NextResponse.json({ error: "Falta projectId" }, { status: 400 })
        }

        const supabase = await createClient()
        if (!supabase) {
            return NextResponse.json({ error: "No se pudo conectar con la base de datos" }, { status: 500 })
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const userId = session.user.id

        // 1. Obtener datos del proyecto para el tÃ­tulo si no se proporciona
        const { data: project, error: projectError } = await supabase
            .from("projects")
            .select("name, client_name")
            .eq("id", projectId)
            .eq("user_id", userId)
            .single()

        if (projectError || !project) {
            return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })
        }

        // 2. Buscar si ya existe un professional_work vinculado a este proyecto
        let { data: work, error: workSearchError } = await supabase
            .from("professional_works")
            .select("id")
            .eq("project_id", projectId)
            .eq("user_id", userId)
            .maybeSingle()

        if (!work) {
            // Crear el trabajo profesional
            const { data: newWork, error: createError } = await supabase
                .from("professional_works")
                .insert({
                    user_id: userId,
                    project_id: projectId,
                    title: title || project.name,
                    description: description || `Reforma para ${project.client_name}`,
                    location: location || "",
                    is_published: true
                })
                .select()
                .single()

            if (createError) throw createError
            work = newWork
        }

        if (!work) {
            return NextResponse.json({ error: "No se pudo crear o encontrar el trabajo" }, { status: 500 })
        }

        // 3. Obtener las fotos del proyecto (room_photos)
        let query = supabase
            .from("room_photos")
            .select("*")
            .eq("project_id", projectId)

        if (selectedPhotos && selectedPhotos.length > 0) {
            query = query.in("id", selectedPhotos)
        }

        const { data: projectPhotos, error: photosError } = await query

        if (photosError) throw photosError
        if (!projectPhotos || projectPhotos.length === 0) {
            return NextResponse.json({ error: "No hay fotos para sincronizar" }, { status: 400 })
        }

        // 4. Sincronizar las fotos (Copiando archivos fÃ­sicamente para independencia)
        const { data: existingWorkPhotos } = await supabase
            .from("professional_work_photos")
            .select("storage_path")
            .eq("work_id", work.id)

        // Usamos storage_path para identificar si ya la hemos copiado (con el prefijo 'synced-')
        const existingPaths = new Set(existingWorkPhotos?.map(p => p.storage_path) || [])

        const photosToInsert = []
        let uploadedCount = 0

        for (const photo of projectPhotos) {
            const fileExt = photo.storage_path.split(".").pop()
            const newPath = `${userId}/${work.id}/synced-${photo.id}.${fileExt}`

            // Si ya existe este path en el portfolio, saltar
            if (existingPaths.has(newPath)) continue

            // Descargar de room-photos y subir a professional-works
            const { data: fileData, error: downloadError } = await supabase.storage
                .from("room-photos")
                .download(photo.storage_path)

            if (fileData) {
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from("professional-works")
                    .upload(newPath, fileData, { upsert: true })

                if (uploadData) {
                    const { data: { publicUrl } } = supabase.storage
                        .from("professional-works")
                        .getPublicUrl(newPath)

                    photosToInsert.push({
                        work_id: work.id,
                        photo_url: publicUrl,
                        phase: photo.phase,
                        storage_path: newPath,
                        created_at: new Date().toISOString()
                    })
                    uploadedCount++
                }
            }
        }

        if (photosToInsert.length > 0) {
            const { error: insertError } = await supabase
                .from("professional_work_photos")
                .insert(photosToInsert)

            if (insertError) throw insertError
        }

        // 5. Si no hay imagen destacada, poner la primera de las nuevas sincronizadas
        const { data: currentWork } = await supabase
            .from("professional_works")
            .select("featured_image_url")
            .eq("id", work.id)
            .single()

        if (!currentWork?.featured_image_url && photosToInsert.length > 0) {
            await supabase
                .from("professional_works")
                .update({ featured_image_url: photosToInsert[0].photo_url })
                .eq("id", work.id)
        }

        return NextResponse.json({
            success: true,
            workId: work.id,
            syncedCount: uploadedCount
        })

    } catch (error: any) {
        console.error("[v0] API /professional/works/sync-project - Error:", error)
        return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
    }
}

