import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppointmentsManager } from "@/components/appointments/appointments-manager"

export const dynamic = "force-dynamic"

export default async function CitasPage() {
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

  if (profile?.user_type !== "professional" && profile?.user_type !== "company") {
    return redirect("/dashboard") // Añadido return
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestión de Citas</h1>
        <p className="text-muted-foreground mt-2">Programa y gestiona tus citas con clientes</p>
      </div>
      <AppointmentsManager userId={session.user.id} />
    </div>
  )
}
