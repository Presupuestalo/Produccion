import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ClientsList } from "@/components/clients/clients-list"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Clientes | Presupuéstalo",
  description: "Gestión de clientes de Presupuéstalo",
}

export default async function ClientsPage() {
  const supabase = await createClient()

  if (!supabase) {
    return redirect("/auth/login")
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  let projects = null
  let coordinationProjects = null
  let error = null

  try {
    // Obtener proyectos regulares
    const { data: regularProjects, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (projectsError) {
      console.error("Error al obtener proyectos:", projectsError)
      error = projectsError.message
    } else {
      projects = regularProjects
    }

    // Obtener proyectos de coordinación
    const { data: coordProjects, error: coordError } = await supabase
      .from("coordinator_projects")
      .select("*")
      .eq("coordinator_id", session.user.id)
      .order("created_at", { ascending: false })

    if (coordError) {
      console.error("Error al obtener proyectos de coordinación:", coordError)
      // No establecemos error aquí para no bloquear si solo falla coordinación
    } else {
      coordinationProjects = coordProjects
    }
  } catch (err: any) {
    console.error("Error al obtener proyectos:", err)
    error = err.message
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
      </div>

      <ClientsList projects={projects} coordinationProjects={coordinationProjects} error={error} />
    </div>
  )
}
