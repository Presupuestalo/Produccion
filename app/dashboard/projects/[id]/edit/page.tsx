import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ProjectForm } from "@/components/dashboard/project-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export const metadata: Metadata = {
  title: "Editar Proyecto | Presupuéstalo",
  description: "Edita los detalles de tu proyecto",
}

// Forzar generación dinámica y sin caché
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ embedded?: string; tab?: string }>
}) {
  // Await params and searchParams for Next.js 16
  const { id } = await params
  const { embedded, tab } = await searchParams

  const isEmbedded = embedded === "true"
  const activeTab = tab || "project"

  try {
    // Crear cliente Supabase directamente en la página
    const supabase = await createClient()

    // Verificar sesión
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <AlertTriangle className="h-16 w-16 text-orange-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Sesión no válida</h1>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            No se pudo verificar tu sesión. Por favor, inicia sesión nuevamente.
          </p>
          <Button asChild variant="outline">
            <Link href="/auth/login">Iniciar sesión</Link>
          </Button>
        </div>
      )
    }

    // Obtener proyecto directamente desde Supabase
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single()

    if (error || !project) {
      console.error("Error al obtener proyecto:", error)
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Button asChild variant="ghost" size="icon">
              <Link href="/dashboard/projects">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Error al cargar el proyecto</h1>
          </div>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No se pudo cargar el proyecto</AlertTitle>
            <AlertDescription>
              No se pudo cargar el proyecto. Por favor, intenta nuevamente o vuelve a la lista de proyectos.
            </AlertDescription>
          </Alert>
          <Button asChild>
            <Link href="/dashboard/projects">Volver a proyectos</Link>
          </Button>
        </div>
      )
    }

    const normalizedProject = {
      id: project.id,
      title: project.title || "",
      description: project.description || "",
      client: project.client || "",
      clientEmail: project.client_email || "",
      clientPhone: project.client_phone || "",
      client_address: project.client_address || "",
      clientNotes: project.client_notes || "",
      project_address: project.project_address || "",
      progress: project.progress || 0,
      status: project.status || "Borrador",
      dueDate: project.duedate || "",
      duedate: project.duedate || "",
      budget: typeof project.budget === "number" ? project.budget : 0,
      color: project.color || "bg-blue-500",
      created_at: project.created_at || new Date().toISOString(),
      user_id: project.user_id || "",
      street: project.street || "",
      project_floor: typeof project.project_floor === "number" ? project.project_floor : 0,
      door: project.door || "",
      city: project.city || "",
      province: project.province || "",
      country: project.country || "España",
      ceiling_height: typeof project.ceiling_height === "number" ? project.ceiling_height : 2.6,
      structure_type: project.structure_type || "",
      has_elevator: project.has_elevator || "",
      // Campos adicionales que faltaban
      client_dni: project.client_dni || "",
      country_code: project.country_code || "ES",
      client_country: project.client_country || "",
      client_street: project.client_street || "",
      client_city: project.client_city || "",
      client_province: project.client_province || "",
      client_postal_code: project.client_postal_code || "",
      license_status: project.license_status || "No iniciado",
      license_date: project.license_date || "",
      contract_signed: project.contract_signed || false,
      contract_date: project.contract_date || "",
      is_from_lead: project.is_from_lead || false,
    }

    return (
      <div className={isEmbedded ? "" : "space-y-6"}>
        {!isEmbedded && (
          <div className="flex items-center gap-2 mb-4">
            <Button asChild variant="ghost" size="icon">
              <Link href={`/dashboard/projects/${id}`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Editar Proyecto</h1>
              <p className="text-muted-foreground">{normalizedProject.title}</p>
            </div>
          </div>
        )}

        <div className={isEmbedded ? "" : ""}>
          <ProjectForm project={normalizedProject} isEmbedded={isEmbedded} initialTab={activeTab} />
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error inesperado:", error)
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/projects">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Error inesperado</h1>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al cargar el proyecto</AlertTitle>
          <AlertDescription>
            Ha ocurrido un error inesperado. Por favor, intenta nuevamente o vuelve a la lista de proyectos.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/dashboard/projects">Volver a proyectos</Link>
        </Button>
      </div>
    )
  }
}
