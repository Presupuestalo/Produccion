"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { getSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import Calculator, { type CalculatorHandle } from "@/components/calculator/calculator"
import { useToast } from "@/components/ui/use-toast"
import { AlertTriangle, ArrowLeft, Settings, PencilRuler, Eye, Layout, Plus, FileText, ChevronDown, Hammer, CheckCircle, Loader2, Copy, Zap } from "lucide-react"
import { updateProject, calculateProgress } from "@/lib/services/project-service"
import type { Project } from "@/types/project"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from "next/link"
import { DualFloorPlanAnalyzer } from "@/components/floor-plan/dual-floor-plan-analyzer"
import { ProjectGallery } from "@/components/calculator/project-gallery"
import { PublishProjectButton } from "@/components/professional-gallery/publish-project-button"
import { isMasterUser } from "@/lib/services/auth-service"
import { CompanyBrandingBlock } from "@/components/dashboard/company-branding-block"

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = params.id as string
  const { toast } = useToast()
  const [project, setProject] = useState<Project & {
    user_type?: string;
    name?: string;
    client_name?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shouldOpenAnalyzer, setShouldOpenAnalyzer] = useState(false)
  const [isMaster, setIsMaster] = useState(false)

  const [linkedPlans, setLinkedPlans] = useState<{ id: string, variant: string }[]>([])
  const [activeTab, setActiveTab] = useState<string>("demolition")
  const [refreshKey, setRefreshKey] = useState(0)

  // Listen for custom project status updates
  useEffect(() => {
    const handleUpdate = () => setRefreshKey(prev => prev + 1)
    window.addEventListener('project-status-updated', handleUpdate)
    return () => window.removeEventListener('project-status-updated', handleUpdate)
  }, [])

  const calculatorRef = useRef<CalculatorHandle>(null)

  useEffect(() => {
    async function checkMaster() {
      const masterStatus = await isMasterUser()
      setIsMaster(masterStatus)
    }
    checkMaster()

    const importPlans = searchParams.get("importPlans")
    if (importPlans === "true") {
      const timer = setTimeout(() => {
        if (calculatorRef.current && "handleManualFloorPlanSync" in calculatorRef.current) {
          calculatorRef.current.handleManualFloorPlanSync()
        }
        const newUrl = window.location.pathname
        window.history.replaceState({}, "", newUrl)
      }, 500)
      return () => clearTimeout(timer)
    }

    // Keep backwards compatibility for any leftover links
    const openAnalyzer = searchParams.get("openFloorPlanAnalyzer") || searchParams.get("sync")
    if (openAnalyzer === "true") {
      setShouldOpenAnalyzer(true)
      const newUrl = window.location.pathname
      window.history.replaceState({}, "", newUrl)
    }
  }, [searchParams, loading])

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
  }, [projectId, toast, refreshKey])

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

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsLoading(true)
      const progress = calculateProgress(newStatus)
      await updateProject(projectId, { status: newStatus as any, progress })

      setProject(prev => prev ? ({ ...prev, status: newStatus as any, progress }) : null)

      toast({
        title: "Estado actualizado",
        description: `El proyecto ahora está en estado: ${newStatus}`,
      })
    } catch (error: any) {
      console.error("Error updating status:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el estado del proyecto",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const [isLoading, setIsLoading] = useState(false)

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
    <TooltipProvider>
      <div className="flex flex-col gap-4 py-3 border-b">
        {/* Main Header Container: Identity + Actions */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 px-1">

          {/* Identity Block (Left side on desktop, Top on mobile) */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Button asChild variant="ghost" size="icon" className="shrink-0 h-9 w-9 -ml-2">
              <Link href="/dashboard/projects">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Volver</span>
              </Link>
            </Button>
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate leading-tight">
                {project?.title || project?.name || "Proyecto sin nombre"}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1.5">
                <div className="text-[13px] font-medium text-slate-700 truncate leading-none flex items-center gap-2">
                  Cliente: <span className="text-muted-foreground font-normal">{project?.client || project?.client_name || "Sin cliente"}</span>
                  {project?.status && (
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border-none shadow-none ${project.status === "Borrador" || String(project.status).toLowerCase() === "draft" ? "bg-slate-100 text-slate-600" :
                      project.status === "Entregado" || String(project.status).toLowerCase() === "sent" ? "bg-blue-100 text-blue-600" :
                        project.status === "Aceptado" || String(project.status).toLowerCase() === "approved" ? "bg-green-100 text-green-600" :
                          project.status === "En Obra" || String(project.status).toLowerCase() === "in_progress" ? "bg-orange-100 text-orange-600" :
                            project.status === "Terminado" || String(project.status).toLowerCase() === "completed" ? "bg-purple-100 text-purple-600" :
                              "bg-slate-100 text-slate-600"
                      }`}>
                      {String(project.status).toUpperCase()}
                    </Badge>
                  )}
                </div>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-200" />
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground leading-none">
                  {project?.ceiling_height && (
                    <span className="bg-slate-50 px-1 py-0.5 rounded border border-slate-100 italic">Alt: {project.ceiling_height}m</span>
                  )}
                  {project?.structure_type && (
                    <span className="bg-slate-50 px-1 py-0.5 rounded border border-slate-100">{project.structure_type}</span>
                  )}
                  {project?.has_elevator && (
                    <span className="bg-slate-50 px-1 py-0.5 rounded border border-slate-100 font-medium">
                      Asc: {project.has_elevator === "Si" || project.has_elevator === "Sí" || project.has_elevator === true || project.has_elevator === "true" ? "Sí" : "No"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions Block (Right side on desktop, Bottom on mobile) */}
          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0">
            {project?.user_type !== "owner" && (
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={async () => {
                        if (window.confirm("¿Seguro que quieres duplicar este proyecto?")) {
                          setIsLoading(true);
                          try {
                            const { duplicateProject } = await import("@/lib/services/project-service");
                            const newId = await duplicateProject(projectId);
                            router.push(`/dashboard/projects/${newId}`);
                            toast({ title: "Proyecto duplicado", description: "Se ha creado una copia de este proyecto." });
                          } catch (e: any) {
                            toast({ variant: "destructive", title: "Error", description: e.message || "No se pudo duplicar el proyecto" });
                          } finally {
                            setIsLoading(false);
                          }
                        }
                      }}
                      disabled={isLoading}
                      className="h-10 w-10 text-slate-500 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all shadow-sm border-slate-200 shrink-0"
                    >
                      <Copy className="h-5 w-5" />
                      <span className="sr-only">Duplicar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent align="end">
                    <p>Duplicar proyecto</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="outline" size="icon" className="h-10 w-10 text-slate-500 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all shadow-sm border-slate-200 shrink-0">
                      <Link href={`/dashboard/projects/${projectId}/edit`}>
                        <Settings className="h-5 w-5" />
                        <span className="sr-only">Ajustes</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent align="end">
                    <p>Ajustes del proyecto</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Status Button and Note */}
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-2">
                {project?.status && (String(project.status) === "approved" || String(project.status) === "Aceptado" || String(project.status) === "aceptado") && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange("En Obra")}
                    disabled={isLoading}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold gap-1.5 h-10 px-4 rounded-xl shadow-sm transition-all active:scale-95 text-xs"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hammer className="h-4 w-4" />}
                    <span>EMPEZAR OBRA</span>
                  </Button>
                )}

                {project?.status && (project.status === "En Obra" || String(project.status) === "en_obra") && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange("Terminado")}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold gap-1.5 h-10 px-4 rounded-xl shadow-sm transition-all active:scale-95 text-xs"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    <span>TERMINAR</span>
                  </Button>
                )}

                {project?.status && (project.status === "Terminado" || String(project.status) === "Finalizado") && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" />
                    TERMINADO
                  </Badge>
                )}
              </div>
              {project?.status && (project.status === "Borrador" || String(project.status).toLowerCase() === "draft" || project.status === "Entregado" || String(project.status).toLowerCase() === "sent") && (
                <p className="hidden lg:block text-[9px] text-muted-foreground italic px-2">
                  * El estado cambia a "Aceptado" al aprobar un presupuesto
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Secondary Navigation and Budget Trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all font-bold text-[11px] gap-1.5 px-3">
                  <Layout className="h-4 w-4" />
                  <span className="uppercase tracking-tight">Planos</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {linkedPlans.length > 0 && (
                  <>
                    <DropdownMenuItem asChild className="focus:bg-orange-50 focus:text-orange-600 cursor-pointer">
                      <Link href={`/dashboard/projects/${projectId}/plano`} className="flex items-center gap-2">
                        <Eye className="h-4 w-4 opacity-70" />
                        <span>Ver lista de planos</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {beforePlan && (
                  <DropdownMenuItem asChild className="focus:bg-orange-50 focus:text-orange-600 cursor-pointer">
                    <Link href={`/dashboard/editor-planos/editar/${beforePlan.id}`} className="flex items-center gap-2">
                      <PencilRuler className="h-4 w-4 opacity-70" />
                      <div className="flex flex-col">
                        <span className="font-medium">Editar Plano ANTES</span>
                        <span className="text-[10px] opacity-70">Estado actual del proyecto</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                )}
                {afterPlan && (
                  <DropdownMenuItem asChild className="focus:bg-orange-50 focus:text-orange-600 cursor-pointer">
                    <Link href={`/dashboard/editor-planos/editar/${afterPlan.id}`} className="flex items-center gap-2">
                      <PencilRuler className="h-4 w-4 opacity-70" />
                      <div className="flex flex-col">
                        <span className="font-medium">Editar Plano DESPUÉS</span>
                        <span className="text-[10px] opacity-70">Propuesta de reforma</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                )}
                {(beforePlan || afterPlan) && <DropdownMenuSeparator />}
                <DropdownMenuItem asChild className="focus:bg-orange-50 focus:text-orange-600 cursor-pointer">
                  <Link href={`/dashboard/editor-planos/nuevo?projectId=${projectId}`} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="font-bold uppercase text-[10px] tracking-tight">Crear Nuevo Plano</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-4 w-px bg-slate-200 mx-1 hidden lg:block" />

            <DualFloorPlanAnalyzer
              projectId={projectId}
              autoOpen={shouldOpenAnalyzer}
              onRoomsDetected={(demolition, reform) => {
                if (calculatorRef.current && "handleRoomsDetectedFromFloorPlan" in calculatorRef.current) {
                  calculatorRef.current.handleRoomsDetectedFromFloorPlan(demolition, reform)
                }
              }}
            />

            {isMaster && (
              <ProjectGallery projectId={projectId} />
            )}

            {project?.user_type === "professional" && <PublishProjectButton project={project} />}
          </div>

          {/* Large Primary Action: PRESUPUESTOS */}
          <div className="w-full sm:w-auto flex items-center justify-center">
            {activeTab !== "presupuesto" && (
              <Button
                variant="default"
                size="lg"
                className="w-full sm:w-auto sm:px-12 bg-orange-600 hover:bg-orange-700 font-black h-11 shadow-lg shadow-orange-200/50 transition-all active:scale-95 text-sm uppercase tracking-widest rounded-xl border-b-2 border-orange-800"
                onClick={() => {
                  if (calculatorRef.current && "setActiveTab" in calculatorRef.current) {
                    calculatorRef.current.setActiveTab("presupuesto")
                    setActiveTab("presupuesto")
                  }
                }}
              >
                PRESUPUESTOS
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Calculator */}
      <div className="pt-2">
        <Calculator ref={calculatorRef} projectId={projectId} onTabChange={setActiveTab} isV2Budget={true} />
      </div>
    </TooltipProvider>
  )
}
