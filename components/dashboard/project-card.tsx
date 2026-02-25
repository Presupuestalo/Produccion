"use client"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Calendar, MapPin, User, MoreHorizontal, Eye, Edit, FileText, Trash2, Loader2, LayoutDashboard, FileCheck, PencilRuler, ShieldCheck, Sparkles, RefreshCw, Download, CheckCircle2, Copy, Hammer } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { Project } from "@/types/project"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase/client"
import { BudgetService } from "@/lib/services/budget-service"
import { Badge } from "@/components/ui/badge"
import { deleteProject, calculateProgress, duplicateProject, updateProject } from "@/lib/services/project-service"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ProjectCardProps {
  project: Project
  onDeleted?: () => void
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: "Borrador",
    sent: "Entregado",
    delivered: "Entregado",
    approved: "Aceptado",
    accepted: "Aceptado",
    rejected: "Rechazado",
    in_progress: "En Obra",
    "En Obra": "En Obra",
    "en_obra": "En Obra",
    completed: "Terminado",
    "Terminado": "Terminado",
    "Finalizado": "Terminado",
    "finalizado": "Terminado",
  }
  return labels[status] || labels[status.toLowerCase()] || status
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700 hover:bg-slate-100",
    sent: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    delivered: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    approved: "bg-green-100 text-green-700 hover:bg-green-100",
    accepted: "bg-green-100 text-green-700 hover:bg-green-100",
    rejected: "bg-red-100 text-red-700 hover:bg-red-100",
    in_progress: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    completed: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    "Terminado": "bg-purple-100 text-purple-700 hover:bg-purple-100",
    "Finalizado": "bg-purple-100 text-purple-700 hover:bg-purple-100",
  }
  return colors[status] || colors[status.toLowerCase()] || colors[status === "En Obra" ? "in_progress" : ""] || "bg-slate-100 text-slate-700"
}

const getMostAdvancedStatus = (statuses: string[]): string | null => {
  if (statuses.length === 0) return null

  const normalized = statuses.map(s => {
    const low = s.toLowerCase()
    if (low === "terminado" || low === "finalizado" || low === "completed") return "completed"
    if (low === "en obra" || low === "en_obra" || low === "in_progress") return "in_progress"
    if (low === "aprobado" || low === "aceptado" || low === "approved" || low === "accepted") return "accepted"
    if (low === "rechazado" || low === "rejected") return "rejected"
    if (low === "entregado" || low === "sent" || low === "delivered") return "delivered"
    return low
  })

  const hierarchy = ["completed", "in_progress", "accepted", "rejected", "delivered", "draft"]

  for (const status of hierarchy) {
    if (normalized.includes(status)) {
      return status
    }
  }

  return normalized[0]
}

export function ProjectCard({ project, onDeleted }: ProjectCardProps) {
  const router = useRouter()
  const [budgetStatus, setBudgetStatus] = useState<string | null>(null)
  const [hasPlans, setHasPlans] = useState(false)
  const [acceptedBudget, setAcceptedBudget] = useState<{
    id: string
    amount: number
    includesVat: boolean
  } | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const supabase = await getSupabase()
        if (!supabase) {
          console.error("[ProjectCard] Supabase client not available")
          return
        }

        // Fetch budget settings for VAT display logic
        const { data: settings } = await supabase
          .from("budget_settings")
          .select("show_vat")
          .eq("project_id", project.id)
          .maybeSingle()

        // Fetch budget status
        const budgets = await BudgetService.getBudgetsByProject(project.id, supabase)

        const allStatuses: string[] = budgets.map((b) => b.status).filter(Boolean) as string[]
        if (project.status) allStatuses.push(project.status)

        if (allStatuses.length > 0) {
          const mostAdvanced = getMostAdvancedStatus(allStatuses)
          setBudgetStatus(mostAdvanced)
        }

        if (budgets.length > 0) {

          const accepted = budgets.find((b) => (b.status as any) === "approved" || (b.status as any) === "accepted")
          if (accepted) {
            // Check if budget data says it includes VAT
            const budgetShowsVat = accepted.accepted_includes_vat === true ||
              (accepted.accepted_includes_vat !== false && (accepted.accepted_vat_amount || 0) > 0)

            // Source of truth: project settings
            const includesVat = settings?.show_vat !== false && budgetShowsVat

            // Select amount based on user preference
            const amount = includesVat
              ? (accepted.accepted_amount_with_vat || accepted.total)
              : (accepted.accepted_amount_without_vat || accepted.subtotal || accepted.total)

            setAcceptedBudget({
              id: accepted.id,
              amount,
              includesVat,
            })
          }
        }

        // Fetch if project has floor plans
        const { count, error: planError } = await supabase
          .from("project_floor_plans")
          .select("id", { count: "exact", head: true })
          .eq("project_id", project.id)

        if (!planError && count && count > 0) {
          setHasPlans(true)
        }

      } catch (error) {
        console.error("[ProjectCard] Error fetching project data:", error)
      }
    }

    fetchProjectData()
  }, [project.id])

  const formatDate = (dateString: string) => {
    if (!dateString) return "Sin fecha"
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    } catch {
      return "Fecha inválida"
    }
  }

  const handleBudgetClick = () => {
    if (acceptedBudget) {
      router.push(`/dashboard/projects/${project.id}?tab=budgets&budgetId=${acceptedBudget.id}`)
    } else {
      router.push(`/dashboard/projects/${project.id}?tab=budgets`)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteProject(project.id)
      toast.success("Proyecto eliminado correctamente")
      setShowDeleteDialog(false)
      if (onDeleted) {
        onDeleted()
      } else {
        router.refresh()
      }
    } catch (error: any) {
      console.error("Error al eliminar proyecto:", error)
      toast.error(error.message || "Error al eliminar el proyecto", {
        duration: 6000,
      })
      setShowDeleteDialog(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    const toastId = toast.loading("Duplicando proyecto...")
    try {
      const newProjectId = await duplicateProject(project.id)
      toast.success("Proyecto duplicado correctamente", { id: toastId })
      if (onDeleted) {
        onDeleted()
      } else {
        router.refresh()
      }
    } catch (error: any) {
      console.error("Error al duplicar proyecto:", error)
      toast.error(error.message || "Error al duplicar el proyecto", { id: toastId })
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const progress = calculateProgress(newStatus)
      await updateProject(project.id, { status: newStatus as any, progress })
      toast.success(`Estado del proyecto actualizado a: ${getStatusLabel(newStatus)}`)

      if (onDeleted) {
        onDeleted()
      } else {
        router.refresh()
      }
    } catch (error: any) {
      console.error("Error al actualizar estado:", error)
      toast.error("No se pudo actualizar el estado del proyecto")
    }
  }

  const calculateDisplayProgress = () => {
    let progress = project.progress || 0

    // Si hay un estado de presupuesto más avanzado, lo usamos como base
    if (budgetStatus) {
      const budgetProgress = calculateProgress(budgetStatus)
      progress = Math.max(progress, budgetProgress)
    }

    // Ajustes adicionales por hitos del proyecto
    if (project.contract_signed) progress = Math.max(progress, 60)
    if (project.license_status === "Concedida") progress = Math.max(progress, 70)

    // Si está en obra o terminado, respetamos el estado del proyecto
    if (budgetStatus === "in_progress" || budgetStatus === "completed") {
      const statusProgress = calculateProgress(budgetStatus)
      progress = Math.max(progress, statusProgress)
    }

    return Math.min(progress, 100)
  }

  const displayProgress = calculateDisplayProgress()

  return (
    <>
      <Card className="group hover:shadow-md transition-all duration-200 border-slate-200 hover:border-slate-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="space-y-1 flex-1 min-w-0">
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="block hover:text-orange-600 transition-colors"
                >
                  <h3 className="font-semibold text-base leading-tight truncate" title={project.title}>
                    {project.title || "Proyecto sin título"}
                  </h3>
                </Link>
                {budgetStatus && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-4 ${getStatusColor(budgetStatus)}`}>
                      {getStatusLabel(budgetStatus)}
                    </Badge>
                    {project.contract_signed && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    )}
                    {project.license_status === "Concedida" && (
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                    )}
                  </div>
                )}
                {acceptedBudget && (
                  <div className="text-sm font-semibold text-green-700">
                    {acceptedBudget.amount.toLocaleString("es-ES", {
                      style: "currency",
                      currency: "EUR",
                    })}{" "}
                    {acceptedBudget.includesVat ? "(IVA incluido)" : "(IVA no incluido)"}
                  </div>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-400 hover:text-orange-600 hover:bg-slate-100 transition-all"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver proyecto!!!
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
                  {isDuplicating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {(budgetStatus === "approved" || budgetStatus === "accepted" || budgetStatus === "delivered" || budgetStatus === "sent") && (
                  <DropdownMenuItem onClick={() => handleStatusChange("in_progress")} className="text-orange-600 focus:text-orange-700 focus:bg-orange-50">
                    <Hammer className="h-4 w-4 mr-2" />
                    Empezar Obra
                  </DropdownMenuItem>
                )}
                {(budgetStatus === "in_progress" || (typeof budgetStatus === 'string' && budgetStatus.toLowerCase() === 'en obra')) && (
                  <DropdownMenuItem onClick={() => handleStatusChange("completed")} className="text-green-600 focus:text-green-700 focus:bg-green-50">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Finalizar Proyecto
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-600">
                <User className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate text-xs">{project.client || "Sin cliente"}</span>
              </div>
              {project.project_address && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate text-xs" title={project.project_address}>
                    {project.project_address}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-right">
              <div className="flex items-center justify-end gap-2 text-slate-600">
                <span className="text-xs">{formatDate((project.dueDate || project.duedate) as string)}</span>
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              </div>
              {displayProgress !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Progreso</span>
                    <span>{displayProgress}%</span>
                  </div>
                  <Progress value={displayProgress} className="h-1" />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-[11px] h-9 bg-slate-50/50 hover:bg-slate-100 hover:text-orange-600 transition-all border-slate-200 gap-1.5 px-2"
              onClick={() => router.push(`/dashboard/projects/${project.id}`)}
            >
              <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Proyecto</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-[11px] h-9 bg-slate-50/50 hover:bg-slate-100 hover:text-orange-600 transition-all border-slate-200 gap-1.5 px-2"
              onClick={handleBudgetClick}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Presupuestos</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-[11px] h-9 bg-slate-50/50 hover:bg-slate-100 hover:text-orange-600 transition-all border-slate-200 gap-1.5 px-2"
              onClick={() => router.push(`/dashboard/projects/${project.id}/edit?tab=contract`)}
            >
              <FileCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Contrato</span>
            </Button>
            {hasPlans && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-[11px] h-9 bg-orange-50/50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 transition-all border-orange-200 gap-1.5 px-2"
                onClick={() => router.push(`/dashboard/projects/${project.id}/plano`)}
              >
                <PencilRuler className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Planos</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los presupuestos, planos y datos asociados a este
              proyecto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
