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
  // Supermasters should also be considered masters for feature access
  return role === "master" || await isSuperMasterUser()
}

export async function isSuperMasterUser(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const role = await getCurrentUserRole()

    // Supermaster is either role "admin" OR specific emails
    const superMasterEmails = [
      "mikelfedz@gmail.com",
      "mikelfedzmcc@gmail.com",
      "presupuestaloficial@gmail.com",
    ]

    return role === "admin" || superMasterEmails.includes(user?.email || "")
  } catch (error) {
    console.error("Error in isSuperMasterUser:", error)
    return false
  }
}

export async function isAdminUser(): Promise<boolean> {
  // Now isAdmin effectively means SuperMaster (Admin Panel access)
  return await isSuperMasterUser()
}
