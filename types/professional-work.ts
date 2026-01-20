export interface ProfessionalWork {
    id: string
    user_id: string
    title: string
    description: string
    location?: string
    project_date?: string
    featured_image_url?: string
    is_published: boolean
    project_id?: string // Linked project ID
    created_at?: string
    updated_at?: string
    // Virtual field for photos
    photos?: ProfessionalWorkPhoto[]
}

export interface ProfessionalWorkPhoto {
    id: string
    work_id: string
    photo_url: string
    phase: "before" | "during" | "after"
    storage_path: string
    created_at: string
}

export type ProfessionalWorkFormData = Omit<ProfessionalWork, "id" | "user_id" | "created_at" | "updated_at">
