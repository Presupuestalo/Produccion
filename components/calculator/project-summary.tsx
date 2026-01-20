"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Building, Ruler, Calculator as Elevator } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ProjectSummaryProps {
  projectId: string
}

interface ProjectData {
  ceiling_height?: string
  project_floor?: string
  has_elevator?: string
  structure_type?: string
  title?: string
}

export function ProjectSummary({ projectId }: ProjectSummaryProps) {
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  const loadProjectData = async () => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase
        .from("projects")
        .select("ceiling_height, project_floor, has_elevator, structure_type, title")
        .eq("id", projectId)
        .single()

      if (error) {
        console.error("Error al cargar datos del proyecto:", error)
        return
      }

      setProjectData(data)
    } catch (error) {
      console.error("Error al cargar datos del proyecto:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProject = () => {
    router.push(`/dashboard/projects/${projectId}/edit`)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="h-5 w-5" />
            Características del Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Cargando...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="h-5 w-5" />
            Características del Proyecto
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditProject}
            className="flex items-center gap-2 bg-transparent"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Ruler className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-sm font-medium">Altura máxima</div>
              <div className="text-lg font-semibold">
                {projectData?.ceiling_height ? `${projectData.ceiling_height} m` : "No definida"}
              </div>
              <div className="text-xs text-muted-foreground">Sin falsos techos</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Building className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-sm font-medium">Planta</div>
              <div className="text-lg font-semibold">
                {projectData?.project_floor !== undefined
                  ? projectData.project_floor === "0"
                    ? "Bajo"
                    : `${projectData.project_floor}º`
                  : "No definida"}
              </div>
              <div className="text-xs text-muted-foreground">
                {projectData?.structure_type || "Estructura no definida"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Elevator className="h-5 w-5 text-purple-600" />
            <div>
              <div className="text-sm font-medium">Ascensor</div>
              <div className="text-lg font-semibold">
                {projectData?.has_elevator === "true"
                  ? "Sí"
                  : projectData?.has_elevator === "false"
                    ? "No"
                    : "No definido"}
              </div>
              <div className="text-xs text-muted-foreground">
                {projectData?.has_elevator === "false" &&
                projectData?.project_floor &&
                Number.parseInt(projectData.project_floor) > 0
                  ? "⚠️ Sin ascensor en altura"
                  : "Transporte de materiales"}
              </div>
            </div>
          </div>
        </div>

        {(!projectData?.ceiling_height || !projectData?.project_floor || !projectData?.has_elevator) && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-800">
              <div className="text-sm font-medium">⚠️ Información incompleta</div>
            </div>
            <div className="text-sm text-orange-700 mt-1">
              Algunos datos importantes no están definidos. Haz clic en "Editar" para completar la información necesaria
              para los cálculos.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
