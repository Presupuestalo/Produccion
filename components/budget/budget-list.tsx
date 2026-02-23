"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { BudgetService } from "@/lib/services/budget-service"
import { createClient } from "@/lib/supabase/client"
import type { Budget } from "@/lib/types/budget"
import { FileText, Plus, Loader2, Trash2, AlertTriangle, ChevronRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
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

interface BudgetListProps {
  projectId: string
  onSelectBudget: (budgetId: string) => void
  onCreateBudget: () => void
  isGenerating?: boolean
  hasData?: boolean
  refreshTrigger?: number
  currentDataHash?: string
}

export function BudgetList({
  projectId,
  onSelectBudget,
  onCreateBudget,
  isGenerating = false,
  hasData = true,
  refreshTrigger = 0,
  currentDataHash,
}: BudgetListProps) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null)
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const [budgetSettings, setBudgetSettings] = useState<any>(null)
  const [hasAcceptedBudget, setHasAcceptedBudget] = useState(false)

  // const { toast } = useToast() // Removed in favor of sonner

  useEffect(() => {
    const loadBudgets = async () => {
      try {
        setLoading(true)
        const supabase = await createClient()
        if (!supabase) {
          console.error("[BudgetList] No se pudo obtener el cliente de Supabase")
          return
        }

        const data = await BudgetService.getBudgetsByProject(projectId, supabase)
        setBudgets(data)

        const acceptedBudget = data.find((b) => b.status === "approved")
        setHasAcceptedBudget(!!acceptedBudget)

        const {
          data: { user },
        } = await supabase.auth.getUser()

        const { data: settings } = await supabase
          .from("budget_settings")
          .select("status, show_vat, vat_percentage")
          .eq("project_id", projectId)
          .eq("user_id", user?.id)
          .maybeSingle()

        setBudgetSettings(settings)
      } catch (err) {
        console.error("[BudgetList] Error loading budgets:", err)
      } finally {
        setLoading(false)
      }
    }

    loadBudgets()
  }, [projectId, refreshTrigger])

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      setDeletingId(budgetId)
      const supabase = await createClient()
      if (!supabase) return

      await BudgetService.deleteBudget(budgetId, supabase)
      setBudgets((prev) => prev.filter((b) => b.id !== budgetId))
      setBudgetToDelete(null)
      toast.success("Presupuesto eliminado", {
        description: "El presupuesto se ha eliminado correctamente",
      })
    } catch (err: any) {
      console.error("[BudgetList] Error deleting budget:", err)
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el presupuesto", {
        position: "top-right",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteAllBudgets = async () => {
    try {
      setDeletingAll(true)
      const supabase = await createClient()
      if (!supabase) return

      await BudgetService.deleteAllBudgets(projectId, supabase)
      setBudgets([])
      setShowDeleteAllDialog(false)
      toast.success("Presupuestos eliminados", {
        description: "Se han eliminado todos los presupuestos del proyecto",
      })
    } catch (err: any) {
      console.error("[BudgetList] Error deleting all budgets:", err)
      toast.error(err instanceof Error ? err.message : "No se pudieron eliminar los presupuestos", {
        position: "top-right",
      })
    } finally {
      setDeletingAll(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "secondary" | "default" | "destructive"; label: string; className?: string }> = {
      draft: { variant: "secondary", label: "Borrador" },
      sent: { variant: "default", label: "Entregado" },
      approved: { variant: "default", label: "Aceptado", className: "bg-green-600" },
      rejected: { variant: "destructive", label: "Rechazado" },
      in_progress: { variant: "default", label: "En Obra", className: "bg-blue-600" },
      completed: { variant: "default", label: "Terminado", className: "bg-green-700" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft

    return (
      <Badge variant={config.variant} className={`text-xs ${config.className || ""}`}>
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (budgets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay presupuestos</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Genera tu primer presupuesto desde los datos de la calculadora
          </p>
          <Button onClick={onCreateBudget} disabled={!hasData || isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Generar Presupuesto
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 pb-2 border-b">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-800">Presupuestos del Proyecto</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Gestiona y compara las versiones de tu presupuesto</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {budgets.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDeleteAllDialog(true)}
                disabled={deletingAll}
                className="text-slate-400 hover:text-destructive hover:bg-destructive/5 flex-1 sm:flex-none transition-colors"
              >
                {deletingAll ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Limpiar todo
                  </>
                )}
              </Button>
            )}
            <Button
              size="sm"
              onClick={onCreateBudget}
              disabled={!hasData || isGenerating || hasAcceptedBudget}
              title={hasAcceptedBudget ? "No se pueden crear más presupuestos mientras haya uno aceptado" : ""}
              className="flex-1 sm:flex-none shadow-md bg-orange-600 hover:bg-orange-700 font-bold px-5"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Nuevo Presupuesto
                </>
              )}
            </Button>
          </div>
        </div>

        {budgets.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
            <div className="bg-orange-100 p-1.5 rounded-full">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
            </div>
            <p className="text-[13px] text-slate-600 font-medium leading-tight">
              Si has modificado la calculadora, genera un <span className="text-orange-700 font-bold">nuevo presupuesto</span> para actualizar resultados.
            </p>
          </div>
        )}

        <div className="grid gap-3">
          {budgets.map((budget, index) => (
            <Card
              key={budget.id}
              className={`group hover:shadow-lg hover:border-orange-200 transition-all duration-300 cursor-pointer overflow-hidden border-slate-200/60 ${index === 0 ? 'bg-gradient-to-br from-white to-slate-50/50' : 'bg-white'}`}
              onClick={() => onSelectBudget(budget.id)}
            >
              <CardContent className="p-0">
                <div className="flex items-center">
                  {/* Status indicator bar */}
                  <div className={`w-1.5 self-stretch ${budget.status === 'approved' ? 'bg-green-500' :
                    budget.status === 'sent' ? 'bg-blue-500' :
                      'bg-slate-300'
                    }`} />

                  <div className="flex-1 p-4 flex justify-between items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors truncate">
                          {budget.name}
                        </h4>
                        <div className="flex items-center gap-1.5">
                          {budget.is_original && (
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400 bg-white shadow-xs">
                              Base
                            </Badge>
                          )}
                          {getStatusBadge(budget.status)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">v{budget.version_number}</span>
                        <span className="flex items-center gap-1 opacity-80">
                          {formatDistanceToNow(new Date(budget.created_at), { addSuffix: true, locale: es })}
                        </span>
                        {currentDataHash && budgets[0]?.id === budget.id && budgets.length > 1 && (
                          <span className="text-blue-600 font-bold flex items-center gap-1">
                            <span className="h-1 w-1 rounded-full bg-blue-600" />
                            Más reciente
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-5 shrink-0">
                      <div className="text-right">
                        <div className="text-xl font-black text-slate-900 flex items-baseline gap-0.5">
                          {(() => {
                            const showVat = budgetSettings?.show_vat
                            const vatRate = budgetSettings?.vat_percentage ?? 21
                            const displayAmount = showVat
                              ? budget.subtotal * (1 + vatRate / 100)
                              : budget.subtotal

                            const formatted = formatCurrency(displayAmount)
                            return (
                              <>
                                {formatted.split(',')[0]}
                                <span className="text-sm font-bold opacity-60">,{formatted.split(',')[1]}</span>
                              </>
                            )
                          })()}
                        </div>
                        {budgetSettings?.show_vat && (
                          <div className="text-[10px] uppercase tracking-tighter font-bold text-slate-400">IVA Incluido</div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {budgets.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-slate-300 hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                            onClick={(e) => {
                              e.stopPropagation()
                              setBudgetToDelete(budget)
                            }}
                            disabled={deletingId === budget.id}
                          >
                            {deletingId === budget.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4.5 w-4.5" />
                            )}
                          </Button>
                        )}
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AlertDialog open={!!budgetToDelete} onOpenChange={(open) => !open && setBudgetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el presupuesto "{budgetToDelete?.name}" (v
              {budgetToDelete?.version_number}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => budgetToDelete && handleDeleteBudget(budgetToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar todos los presupuestos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente todos los {budgets.length} presupuestos de
              este proyecto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllBudgets}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar Todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
