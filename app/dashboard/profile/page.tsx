import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ProfileFormClient from "./ProfileFormClient"

export const metadata: Metadata = {
  title: "Mi Perfil | Presupuéstalo",
  description: "Gestiona tu información personal",
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  const userMetadata = session.user.user_metadata || {}

  const authProvider = session.user.app_metadata?.provider || "email"

  const userData = {
    id: session.user.id,
    email: session.user.email,
    full_name: profile?.full_name || userMetadata.name || "",
    avatar_url: profile?.avatar_url || userMetadata.avatar_url || "",
    country: profile?.country || userMetadata.country || "",
    user_type: profile?.user_type || "",
    phone: profile?.phone || "",
    dni_nif: profile?.dni_nif || "",
    address_street: profile?.address_street || "",
    address_city: profile?.address_city || "",
    address_province: profile?.address_province || "",
    address_postal_code: profile?.address_postal_code || "",
    updated_at: profile?.updated_at || new Date().toISOString(),
    auth_provider: authProvider, // Pass auth provider to client
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
        <ProfileFormClient userData={userData} />
      </div>
    </div>
  )
}
