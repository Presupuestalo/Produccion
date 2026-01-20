"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar, Info, Clock } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ProjectAppointments } from "./project-appointments"
import { ProjectActivities } from "./project-activities"

interface ProjectSidebarProps {
  projectId: string
  projectTitle: string
  projectClient: string
  projectBudget?: number
  projectAddress?: string
}

export function ProjectSidebar({
  projectId,
  projectTitle,
  projectClient,
  projectBudget,
  projectAddress,
}: ProjectSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState<"info" | "appointments" | "activities">("info")

  // Recuperar el estado del sidebar del localStorage al montar el componente
  useEffect(() => {
    const savedState = localStorage.getItem(`project_sidebar_${projectId}`)
    if (savedState) {
      setIsCollapsed(JSON.parse(savedState).isCollapsed)
    }
  }, [projectId])

  // Guardar el estado del sidebar en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem(`project_sidebar_${projectId}`, JSON.stringify({ isCollapsed }))
  }, [isCollapsed, projectId])

  // Actualizar las clases del contenido principal cuando cambia el estado del sidebar
  useEffect(() => {
    const content = document.querySelector(".sidebar-content")
    if (content) {
      if (isCollapsed) {
        content.classList.remove("ml-80")
        content.classList.add("ml-12")
      } else {
        content.classList.remove("ml-12")
        content.classList.add("ml-80")
      }
    }
  }, [isCollapsed])

  // Función para formatear el presupuesto
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === 0) return "No especificado"
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div
      className={cn(
        "fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r transition-all duration-300 z-10 flex flex-col",
        isCollapsed ? "w-12" : "w-80",
      )}
    >
      {/* Botón para colapsar/expandir */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-4 bg-white border rounded-full z-20"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Contenido del sidebar */}
      <div className="flex-1 overflow-auto p-2">
        {!isCollapsed ? (
          <>
            {/* Tabs para navegar entre secciones */}
            <div className="flex border-b mb-4">
              <Button
                variant="ghost"
                size="sm"
                className={cn("flex-1 rounded-none", activeSection === "info" && "border-b-2 border-orange-500")}
                onClick={() => setActiveSection("info")}
              >
                <Info className="h-4 w-4 mr-1" />
                Info
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-1 rounded-none",
                  activeSection === "appointments" && "border-b-2 border-orange-500",
                )}
                onClick={() => setActiveSection("appointments")}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Citas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("flex-1 rounded-none", activeSection === "activities" && "border-b-2 border-orange-500")}
                onClick={() => setActiveSection("activities")}
              >
                <Clock className="h-4 w-4 mr-1" />
                Actividades
              </Button>
            </div>

            {/* Contenido según la sección activa */}
            {activeSection === "info" && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-semibold text-lg">{projectTitle}</h2>
                  <p className="text-sm text-muted-foreground">Cliente: {projectClient}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Presupuesto</span>
                    <span className="font-medium">{formatCurrency(projectBudget)}</span>
                  </div>

                  {projectAddress && (
                    <div className="pt-2">
                      <span className="text-sm text-muted-foreground">Dirección</span>
                      <p className="text-sm">{projectAddress}</p>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                    <Link href={`/dashboard/projects/${projectId}/edit`}>Editar proyecto</Link>
                  </Button>
                </div>
              </div>
            )}

            {activeSection === "appointments" && (
              <div className="space-y-4">
                <ProjectAppointments projectId={projectId} />
              </div>
            )}

            {activeSection === "activities" && (
              <div className="space-y-4">
                <ProjectActivities projectId={projectId} />
              </div>
            )}
          </>
        ) : (
          // Versión colapsada - solo iconos
          <div className="flex flex-col items-center space-y-6 pt-4">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", activeSection === "info" && "bg-orange-100 text-orange-700")}
              onClick={() => setActiveSection("info")}
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", activeSection === "appointments" && "bg-orange-100 text-orange-700")}
              onClick={() => setActiveSection("appointments")}
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", activeSection === "activities" && "bg-orange-100 text-orange-700")}
              onClick={() => setActiveSection("activities")}
            >
              <Clock className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
