import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PlanUsage } from "@/components/dashboard/plan-usage"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Suscripción | Presupuéstalo",
  description: "Gestiona tu plan y suscripción",
}

export default async function SuscripcionPage() {
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

  const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", session.user.id).single()

  // Solo permitir acceso a profesionales
  if (profile?.user_type !== "professional") {
    return redirect("/dashboard") // Añadido return
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-6">
      <h1 className="text-3xl font-bold">Suscripción</h1>

      <PlanUsage />

      {/* SubscriptionSettings que mostraba la sección duplicada ha sido eliminado */}
    </div>
  )
}
