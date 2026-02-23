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
import { AlertTriangle, ArrowLeft, Settings, PencilRuler, Eye, Layout, Plus, FileText, ChevronDown, Hammer, CheckCircle, Loader2 } from "lucide-react"
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
    <div className="space-y-2">
      <div className="flex flex-col gap-1.5 py-1 border-b">
        {/* Row 1: Back Button + Project Identity */}
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Button asChild variant="ghost" size="icon" className="shrink-0 h-8 w-8 -ml-2">
              <Link href="/dashboard/projects">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver</span>
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate leading-tight">
                {project?.title || project?.name || "Proyecto sin nombre"}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-0.5">
                <p className="text-[13px] font-medium text-slate-700 truncate leading-none">
                  Cliente: <span className="text-muted-foreground font-normal">{project?.client || project?.client_name || "Sin cliente"}</span>
                </p>
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

          {/* Row 1 Middle: Premium Company Branding */}
          {project?.user_type !== "owner" && project?.user_id && (
            <div className="hidden lg:flex desktop:flex flex-none items-center justify-center px-2">
              <CompanyBrandingBlock userId={project.user_id} />
            </div>
          )}

          {/* Right Section: Settings + Status (flex-1 to balance) */}
          <div className="flex flex-1 justify-end items-center gap-2 shrink-0 min-w-0">
            {project?.user_type !== "owner" && (
              <TooltipProvider>
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
              </TooltipProvider>
            )}

            {/* Status Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {project?.status && (String(project.status) === "approved" || String(project.status) === "Aceptado" || String(project.status) === "aceptado") && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("En Obra")}
                  disabled={isLoading}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold gap-1.5 h-10 px-4 rounded-xl shadow-sm transition-all active:scale-95"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hammer className="h-4 w-4" />}
                  <span className="hidden sm:inline desktop:inline">EMPEZAR OBRA</span>
                  <span className="sm:hidden desktop:hidden">OBRA</span>
                </Button>
              )}

              {project?.status && (project.status === "En Obra" || String(project.status) === "en_obra") && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("Terminado")}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold gap-1.5 h-10 px-4 rounded-xl shadow-sm transition-all active:scale-95"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  <span className="hidden sm:inline desktop:inline">FINALIZAR PROYECTO</span>
                  <span className="sm:hidden desktop:hidden">TERMINAR</span>
                </Button>
              )}

              {project?.status && (project.status === "Terminado" || String(project.status) === "Finalizado") && (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  TERMINADO
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Consolidated Actions Row (Unified) */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Main Action Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Floor Plan Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 data-[state=open]:bg-orange-50 data-[state=open]:text-orange-600 data-[state=open]:border-orange-200 transition-all font-bold text-[11px] gap-1.5 px-3">
                  <Layout className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline desktop:inline uppercase tracking-tight">Planos</span>
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

            <div className="h-3 w-px bg-slate-200 mx-0.5 hidden lg:block" />

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

          {/* BUDGET Button - Maximum Prominence, Aligned with Tabs below */}
          {activeTab !== "presupuesto" && (
            <div className="flex-1 md:flex-initial flex justify-end md:pr-1">
              <Button
                variant="default"
                size="lg"
                className="w-full md:w-auto md:px-16 bg-orange-600 hover:bg-orange-700 font-black h-11 shadow-xl shadow-orange-200/50 transition-all active:scale-95 text-sm uppercase tracking-widest rounded-xl border-b-2 border-orange-800"
                onClick={() => {
                  if (calculatorRef.current && "setActiveTab" in calculatorRef.current) {
                    calculatorRef.current.setActiveTab("presupuesto")
                    setActiveTab("presupuesto")
                  }
                }}
              >
                PRESUPUESTOS
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="pt-1">
        <Calculator ref={calculatorRef} projectId={projectId} onTabChange={setActiveTab} />
      </div>
    </div>
  )
}
