import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SubscriptionSettings } from "@/components/ajustes/subscription-settings"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Ajustes | Presupuéstalo",
  description: "Configura tus preferencias de la aplicación",
}

export default async function AjustesPage() {
  const supabase = await createClient()

  if (!supabase) {
    return redirect("/auth/login")
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", session.user.id).single()

  const isHomeowner = profile?.user_type === "homeowner"
  const isProfessional = profile?.user_type === "professional"

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Ajustes</h1>

      <div className="space-y-6">
        {isHomeowner && <SubscriptionSettings userId={session.user.id} userType="homeowner" telegramBotUsername="presupuestalobot" />}
        {isProfessional && <SubscriptionSettings userId={session.user.id} userType="professional" telegramBotUsername="presupuestalobot" />}

      </div>
    </div>
  )
}
