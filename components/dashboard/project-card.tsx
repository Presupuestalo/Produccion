"use client"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Calendar, MapPin, User, MoreHorizontal, Eye, Edit, FileText, Trash2, Loader2, LayoutDashboard, FileCheck, PencilRuler, ShieldCheck, Sparkles, RefreshCw, Download, CheckCircle2 } from "lucide-react"
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
import { deleteProject } from "@/lib/services/project-service"
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
    completed: "Terminado",
  }
  return labels[status] || status
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
  }
  return colors[status] || "bg-slate-100 text-slate-700"
}

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

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const supabase = await getSupabase()
        if (!supabase) {
          console.error("[ProjectCard] Supabase client not available")
          return
        }

        // Fetch budget status
        const budgets = await BudgetService.getBudgetsByProject(project.id, supabase)

        if (budgets.length > 0) {
          const statuses = budgets.map((b) => b.status).filter(Boolean)
          const mostAdvanced = getMostAdvancedStatus(statuses)
          setBudgetStatus(mostAdvanced)

          const accepted = budgets.find((b) => (b.status as any) === "approved" || (b.status as any) === "accepted")
          if (accepted) {
            const amount = accepted.accepted_amount_with_vat || accepted.accepted_amount_without_vat || accepted.total
            const includesVat = accepted.accepted_includes_vat !== false
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
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver proyecto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
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
              {project.progress !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Progreso</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-1" />
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
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-[11px] h-9 bg-orange-50/50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 transition-all border-orange-200 gap-1.5 px-2"
                  onClick={() => router.push(`/dashboard/projects/${project.id}/plano`)}
                >
                  <PencilRuler className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Planos</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="col-span-2 w-full text-[11px] h-9 bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-all border-none gap-1.5 px-2 font-medium"
                  onClick={() => router.push(`/dashboard/projects/${project.id}?importPlans=true`)}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Importar desde Planos</span>
                </Button>
              </>
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
