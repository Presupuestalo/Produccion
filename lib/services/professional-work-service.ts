import { getSupabase } from "@/lib/supabase/client"
import { v4 as uuidv4 } from "uuid"
import type { ProfessionalWork, ProfessionalWorkFormData, ProfessionalWorkPhoto } from "@/types/professional-work"

export async function getProfessionalWorks() {
    try {
        const supabase = await getSupabase()
        if (!supabase) throw new Error("Supabase client not available")

        const { data: session } = await supabase.auth.getSession()
        if (!session.session) return []

        const { data, error } = await supabase
            .from("professional_works")
            .select("*, photos:professional_work_photos(*)")
            .eq("user_id", session.session.user.id)
            .order("created_at", { ascending: false })

        if (error) {
            if (error.message.includes("does not exist")) return []
            throw error
        }

        return data as ProfessionalWork[]
    } catch (error) {
        console.error("Error al obtener trabajos profesionales:", error)
        return []
    }
}

export async function getProfessionalWorkById(id: string) {
    try {
        const supabase = await getSupabase()
        if (!supabase) throw new Error("Supabase client not available")

        const { data, error } = await supabase
            .from("professional_works")
            .select("*, photos:professional_work_photos(*)")
            .eq("id", id)
            .single()

        if (error) throw error
        return data as ProfessionalWork
    } catch (error) {
        console.error(`Error al obtener el trabajo profesional con ID ${id}:`, error)
        return null
    }
}

export async function createProfessionalWork(workData: ProfessionalWorkFormData) {
    try {
        const supabase = await getSupabase()
        if (!supabase) throw new Error("Supabase client not available")

        const { data: session } = await supabase.auth.getSession()
        if (!session.session) throw new Error("No hay sesión activa")

        const newWork = {
            id: uuidv4(),
            user_id: session.session.user.id,
            title: workData.title,
            description: workData.description,
            location: workData.location,
            project_date: workData.project_date,
            featured_image_url: workData.featured_image_url,
            is_published: workData.is_published || false,
            project_id: workData.project_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        const { data, error } = await supabase.from("professional_works").insert(newWork).select().single()

        if (error) throw error
        return data as ProfessionalWork
    } catch (error) {
        console.error("Error al crear el trabajo profesional:", error)
        throw error
    }
}

export async function updateProfessionalWork(id: string, workData: Partial<ProfessionalWorkFormData>) {
    try {
        const supabase = await getSupabase()
        if (!supabase) throw new Error("Supabase client not available")

        const updateData = {
            ...workData,
            updated_at: new Date().toISOString(),
        }

        const { data, error } = await supabase.from("professional_works").update(updateData).eq("id", id).select().single()

        if (error) throw error
        return data as ProfessionalWork
    } catch (error) {
        console.error(`Error al actualizar el trabajo profesional con ID ${id}:`, error)
        throw error
    }
}

export async function deleteProfessionalWork(id: string) {
    try {
        const supabase = await getSupabase()
        if (!supabase) throw new Error("Supabase client not available")

        // Eliminar fotos asociadas primero (opcional si hay Cascade, pero mejor ser explícito)
        const { error: photoError } = await supabase.from("professional_work_photos").delete().eq("work_id", id)
        if (photoError) console.error("Error al eliminar fotos del trabajo:", photoError)

        const { error } = await supabase.from("professional_works").delete().eq("id", id)

        if (error) throw error
        return true
    } catch (error) {
        console.error(`Error al eliminar el trabajo profesional con ID ${id}:`, error)
        throw error
    }
}

export async function addWorkPhoto(workId: string, photo: Omit<ProfessionalWorkPhoto, "id" | "created_at">) {
    try {
        const supabase = await getSupabase()
        if (!supabase) throw new Error("Supabase client not available")

        const newPhoto = {
            id: uuidv4(),
            ...photo,
            work_id: workId,
            created_at: new Date().toISOString(),
        }

        const { data, error } = await supabase.from("professional_work_photos").insert(newPhoto).select().single()

        if (error) throw error
        return data as ProfessionalWorkPhoto
    } catch (error) {
        console.error("Error al añadir foto al trabajo profesional:", error)
        throw error
    }
}

export async function deleteWorkPhoto(photoId: string) {
    try {
        const supabase = await getSupabase()
        if (!supabase) throw new Error("Supabase client not available")

        const { error } = await supabase.from("professional_work_photos").delete().eq("id", photoId)

        if (error) throw error
        return true
    } catch (error) {
        console.error(`Error al eliminar la foto ${photoId}:`, error)
        throw error
    }
}
