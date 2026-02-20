"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { getSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Calculator, { type CalculatorHandle } from "@/components/calculator/calculator"
import { useToast } from "@/components/ui/use-toast"
import { AlertTriangle, ArrowLeft, Settings, PencilRuler } from "lucide-react"
import Link from "next/link"
import { DualFloorPlanAnalyzer } from "@/components/floor-plan/dual-floor-plan-analyzer"
import { ProjectGallery } from "@/components/calculator/project-gallery"
import { PublishProjectButton } from "@/components/professional-gallery/publish-project-button"
import { isMasterUser } from "@/lib/services/auth-service"

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = params.id as string
  const { toast } = useToast()

  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shouldOpenAnalyzer, setShouldOpenAnalyzer] = useState(false)
  const [isMaster, setIsMaster] = useState(false)
  const [linkedPlans, setLinkedPlans] = useState<{ id: string, variant: string }[]>([])

  const calculatorRef = useRef<CalculatorHandle>(null)

  useEffect(() => {
    async function checkMaster() {
      const masterStatus = await isMasterUser()
      setIsMaster(masterStatus)
    }
    checkMaster()

    const openAnalyzer = searchParams.get("openFloorPlanAnalyzer")
    if (openAnalyzer === "true") {
      setShouldOpenAnalyzer(true)
      const newUrl = window.location.pathname
      window.history.replaceState({}, "", newUrl)
    }
  }, [searchParams])

  // Efecto separado para manejar el cambio de pestaña inicial una vez que el calculador está listo
  useEffect(() => {
    if (loading) return

    const tab = searchParams.get("tab")
    if (tab) {
      const timer = setTimeout(() => {
        if (calculatorRef.current && "setActiveTab" in calculatorRef.current) {
          console.log("[v0] Cambiando a pestaña desde URL:", tab)
          calculatorRef.current.setActiveTab(tab === "budgets" ? "presupuesto" : tab)
        }
      }, 800) // Un poco más de tiempo para asegurar que todo el estado interno del calculador se ha cargado
      return () => clearTimeout(timer)
    }
  }, [loading, searchParams])

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)

        const supabase = await getSupabase()

        if (!supabase) {
          throw new Error("No se pudo conectar con la base de datos")
        }

        const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single()

        if (data) {
          const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", data.user_id).single()
          setProject({ ...data, user_type: profile?.user_type })
        }

        if (error) {
          throw error
        }

        if (!data) {
          throw new Error("No se encontró el proyecto o no tienes permisos para acceder a él.")
        }

        setProject(data)
      } catch (error: any) {
        console.error("Error fetching project:", error)
        setError(error.message || "Error al cargar el proyecto")
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar el proyecto. Por favor, inténtalo de nuevo.",
        })
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchProject()
    }
  }, [projectId, toast])

  // Fetch linked floor plans
  useEffect(() => {
    const fetchLinkedPlans = async () => {
      try {
        const supabase = await getSupabase()
        if (!supabase) return
        const { data } = await supabase
          .from("project_floor_plans")
          .select("id, variant")
          .eq("project_id", projectId)
        setLinkedPlans(data || [])
      } catch (e) {
        console.error("Error fetching linked plans:", e)
      }
    }
    if (projectId) fetchLinkedPlans()
  }, [projectId])

  const beforePlan = linkedPlans.find(p => p.variant === 'current')
  const afterPlan = linkedPlans.find(p => p.variant === 'proposal')

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24 mt-1" />
          </div>
        </div>
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Proyectos
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 mb-2 py-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Button asChild variant="ghost" size="icon" className="shrink-0 h-9 w-9 -ml-2">
              <Link href="/dashboard/projects">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Volver</span>
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate leading-tight mb-1">
                {project.title || project.name || "Proyecto sin nombre"}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1">
                <p className="text-sm font-medium text-slate-700 truncate">
                  Cliente: <span className="text-muted-foreground font-normal">{project.client || project.client_name || "Sin cliente"}</span>
                </p>
                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-300" />
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {project.ceiling_height && (
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">Alt: {project.ceiling_height}m</span>
                  )}
                  {project.structure_type && (
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">{project.structure_type}</span>
                  )}
                  {project.has_elevator && (
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                      Asc: {project.has_elevator === "Si" || project.has_elevator === "Sí" || project.has_elevator === true || project.has_elevator === "true" ? "Sí" : "No"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden lg:flex">
              <Button
                variant="default"
                size="lg"
                className="bg-primary hover:bg-primary/90 font-bold h-11 px-8 text-base shadow-lg border-2 border-primary/20"
                onClick={() => {
                  if (calculatorRef.current && "setActiveTab" in calculatorRef.current) {
                    calculatorRef.current.setActiveTab("presupuesto")
                  }
                }}
              >
                PRESUPUESTOS
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {isMaster && (
              <>
                <ProjectGallery projectId={projectId} />
                <DualFloorPlanAnalyzer
                  projectId={projectId}
                  autoOpen={shouldOpenAnalyzer}
                  onRoomsDetected={(demolitionRooms, reformRooms) => {
                    console.log("[v0] Habitaciones detectadas:", { demolitionRooms, reformRooms })
                    if (calculatorRef.current) {
                      calculatorRef.current.handleRoomsDetectedFromFloorPlan(demolitionRooms, reformRooms)
                      toast({
                        title: "Habitaciones importadas",
                        description: `Se han importado ${demolitionRooms.length} habitaciones a demolición y ${reformRooms.length} a reforma`,
                      })
                    }
                  }}
                  onPartitionsDetected={(partitions) => {
                    console.log("[v0] Tabiques detectados:", partitions)
                    if (calculatorRef.current) {
                      calculatorRef.current.handlePartitionsDetectedFromFloorPlan(partitions)
                    }
                  }}
                  onImportComplete={() => {
                    if (calculatorRef.current && "setActiveTab" in calculatorRef.current) {
                      calculatorRef.current.setActiveTab("demolition")
                    }
                  }}
                />
              </>
            )}
            {project.user_type === "professional" && <PublishProjectButton project={project} />}
            {project.user_type !== "owner" && (
              <Button asChild variant="outline" size="sm" className="h-9">
                <Link href={`/dashboard/projects/${projectId}/edit`}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Ajustes</span>
                  <span className="sm:hidden sr-only">Ajustes</span>
                </Link>
              </Button>
            )}

            {/* Floor Plan Buttons */}
            {linkedPlans.length > 0 && (
              <Button asChild variant="default" size="sm" className="h-9 bg-orange-600 hover:bg-orange-700 text-white shadow-sm">
                <Link href={`/dashboard/projects/${projectId}/plano`}>
                  <Eye className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Ver Planos</span>
                  <span className="sm:hidden">Ver</span>
                </Link>
              </Button>
            )}

            {beforePlan ? (
              <Button asChild variant="outline" size="sm" className="h-9 border-amber-200 text-amber-700 hover:bg-amber-50">
                <Link href={`/dashboard/editor-planos/editar/${beforePlan.id}`}>
                  <PencilRuler className="mr-1.5 h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Plano Antes</span>
                  <span className="sm:hidden">Antes</span>
                </Link>
              </Button>
            ) : null}
            {afterPlan ? (
              <Button asChild variant="outline" size="sm" className="h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <Link href={`/dashboard/editor-planos/editar/${afterPlan.id}`}>
                  <PencilRuler className="mr-1.5 h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Plano Después</span>
                  <span className="sm:hidden">Después</span>
                </Link>
              </Button>
            ) : null}
            {linkedPlans.length === 0 && (
              <Button asChild variant="outline" size="sm" className="h-9 border-blue-200 text-blue-700 hover:bg-blue-50">
                <Link href="/dashboard/editor-planos/nuevo">
                  <PencilRuler className="mr-1.5 h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Crear Plano</span>
                  <span className="sm:hidden">Plano</span>
                </Link>
              </Button>
            )}
          </div>

          <div className="lg:hidden w-full">
            <Button
              variant="default"
              size="default"
              className="w-full bg-primary hover:bg-primary/90 font-bold h-11 shadow-lg border-2 border-primary/20 text-base"
              onClick={() => {
                if (calculatorRef.current && "setActiveTab" in calculatorRef.current) {
                  calculatorRef.current.setActiveTab("presupuesto")
                }
              }}
            >
              VER PRESUPUESTOS
            </Button>
          </div>
        </div>
      </div>
      <div className="pt-2">
        <Calculator ref={calculatorRef} projectId={projectId} />
      </div>
    </div>
  )
}
