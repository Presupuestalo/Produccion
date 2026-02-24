import { createClient } from "@/lib/supabase/server"

export async function getCurrentUserRoleOnServer(): Promise<string | null> {
    try {
        const supabase = await createClient()
        if (!supabase) return null

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) return null

        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        return profile?.role || "user"
    } catch (error) {
        console.error("Error getting user role on server:", error)
        return null
    }
}

export async function isMasterUserOnServer(): Promise<boolean> {
    const role = await getCurrentUserRoleOnServer()
    // Supermasters should also be considered masters
    return role === "master" || await isSuperMasterUserOnServer()
}

export async function isSuperMasterUserOnServer(): Promise<boolean> {
    try {
        const supabase = await createClient()
        if (!supabase) return false

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) return false

        const role = await getCurrentUserRoleOnServer()

        // Centralized Supermaster logic
        const superMasterEmails = [
            "mikelfedz@gmail.com",
            "mikelfedzmcc@gmail.com",
            "presupuestaloficial@gmail.com",
        ]

        return role === "admin" || superMasterEmails.includes(user.email || "")
    } catch (error) {
        console.error("Error checking supermaster on server:", error)
        return false
    }
}

export async function isAdminUserOnServer(): Promise<boolean> {
    return await isSuperMasterUserOnServer()
}
