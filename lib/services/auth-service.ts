import { createClient } from "@/lib/supabase/client"

export async function getCurrentUserRole(): Promise<string | null> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    return profile?.role || "user"
  } catch (error) {
    console.error("Error getting user role:", error)
    return null
  }
}

export async function isMasterUser(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === "master"
}
