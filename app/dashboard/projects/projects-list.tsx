"use client"

import { useProjects } from "@/lib/contexts/projects-context"
import { ProjectCard } from "@/components/dashboard/project-card"
import { Loader2, FolderOpen } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { BudgetService } from "@/lib/services/budget-service"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ProjectStatus = "all" | "draft" | "delivered" | "accepted" | "rejected" | "in_progress" | "completed"

export function ProjectsList() {
  const { projects, isLoading, error, refreshProjects } = useProjects()
  const [activeFilter, setActiveFilter] = useState<ProjectStatus>("all")
  const [projectStatuses, setProjectStatuses] = useState<Record<string, string | null>>({})
  const [userType, setUserType] = useState<string | null>(null)

  useEffect(() => {
    console.log("[v0] ProjectsList - Estado recibido del contexto:")
    console.log("[v0] - isLoading:", isLoading)
    console.log("[v0] - error:", error)
    console.log("[v0] - projects:", projects)
    console.log("[v0] - projects length:", projects?.length || 0)

    const fetchAllStatuses = async () => {
      if (!projects) return

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const statuses: Record<string, string | null> = {}

      await Promise.all(
        projects.map(async (project) => {
          try {
            const budgets = await BudgetService.getBudgetsByProject(project.id, supabase)
            if (budgets.length > 0) {
              const budgetStatuses = budgets.map((b) => b.status).filter(Boolean)
              const mostAdvanced = getMostAdvancedStatus(budgetStatuses)
              statuses[project.id] = mostAdvanced
            } else {
              statuses[project.id] = "draft"
            }
          } catch (error) {
            console.error(`Error fetching status for project ${project.id}:`, error)
            statuses[project.id] = "draft"
          }
        }),
      )

      setProjectStatuses(statuses)
    }

    fetchAllStatuses()
  }, [projects, isLoading, error])

  useEffect(() => {
    const getUserType = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", session.user.id).single()
        setUserType(profile?.user_type || null)
      }
    }
    getUserType()
  }, [])

  const getMostAdvancedStatus = (statuses: string[]): string | null => {
    if (statuses.length === 0) return null

    const hierarchy = ["completed", "in_progress", "approved", "accepted", "rejected", "sent", "delivered", "draft"]

    for (const status of hierarchy) {
      if (statuses.includes(status)) {
        return status
      }
    }

    return statuses[0]
  }

  const filteredProjects = projects?.filter((project) => {
    if (activeFilter === "all") return true

    const status = projectStatuses[project.id]
    if (!status) return activeFilter === "draft"

    if (activeFilter === "delivered" && (status === "sent" || status === "delivered")) return true
    if (activeFilter === "accepted" && (status === "approved" || status === "accepted")) return true

    return status === activeFilter
  })

  console.log("[v0] ProjectsList - Proyectos filtrados:", filteredProjects?.length || 0)
  console.log("[v0] ProjectsList - Filtro activo:", activeFilter)

  const counts = {
    all: projects?.length || 0,
    draft: 0,
    delivered: 0,
    accepted: 0,
    rejected: 0,
    in_progress: 0,
    completed: 0,
  }

  projects?.forEach((project) => {
    const status = projectStatuses[project.id] || "draft"
    if (status === "draft") counts.draft++
    else if (status === "sent" || status === "delivered") counts.delivered++
    else if (status === "approved" || status === "accepted") counts.accepted++
    else if (status === "rejected") counts.rejected++
    else if (status === "in_progress") counts.in_progress++
    else if (status === "completed") counts.completed++
  })

  if (isLoading) {
    console.log("[v0] ProjectsList - Mostrando loader...")
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    console.log("[v0] ProjectsList - Mostrando error:", error)
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error al cargar proyectos: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!projects || projects.length === 0) {
    console.log("[v0] ProjectsList - No hay proyectos, mostrando mensaje vacío")
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No hay proyectos</h3>
            <p>Crea tu primer proyecto para empezar a gestionar tus reformas.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  console.log("[v0] ProjectsList - Renderizando", filteredProjects?.length || 0, "proyectos")

  return (
    <div className="space-y-6">
      {userType === "professional" || userType === "company" ? (
        <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as ProjectStatus)}>
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto gap-2 bg-transparent p-1 -mx-1 scrollbar-hide">
            <TabsTrigger value="all" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              Todos ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="draft" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-700">
              Borrador ({counts.draft})
            </TabsTrigger>
            <TabsTrigger
              value="delivered"
              className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
            >
              Entregado ({counts.delivered})
            </TabsTrigger>
            <TabsTrigger
              value="accepted"
              className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
            >
              Aceptado ({counts.accepted})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
              Rechazado ({counts.rejected})
            </TabsTrigger>
            <TabsTrigger
              value="in_progress"
              className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
            >
              En Obra ({counts.in_progress})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
            >
              Terminado ({counts.completed})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      ) : null}

      {filteredProjects && filteredProjects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onDeleted={refreshProjects} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                No hay proyectos{activeFilter !== "all" ? " en este estado" : ""}
              </h3>
              <p>
                {activeFilter !== "all"
                  ? "Intenta con otro filtro para ver más proyectos."
                  : "Crea tu primer proyecto para empezar a gestionar tus reformas."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
