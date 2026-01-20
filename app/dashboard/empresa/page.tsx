import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CompanySettings } from "@/components/ajustes/company-settings"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Empresa | Presupuéstalo",
  description: "Gestiona los datos de tu empresa",
}

export default async function EmpresaPage() {
  const supabase = await createClient()

  if (!supabase) {
    return redirect("/auth/login") // Añadido return
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return redirect("/auth/login") // Añadido return
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  // Solo permitir acceso a profesionales
  if (profile?.user_type !== "professional") {
    return redirect("/dashboard") // Añadido return
  }

  const userData = {
    id: session.user.id,
    email: session.user.email,
    company_name: profile?.company_name || "",
    website: profile?.website || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    city: profile?.city || "",
    province: profile?.province || "",
    country: profile?.country || "",
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Datos de Empresa</h1>
      <CompanySettings userId={session.user.id} userData={userData} />
    </div>
  )
}
