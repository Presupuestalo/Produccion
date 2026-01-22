"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { BudgetService } from "@/lib/services/budget-service"
import { createClient } from "@/lib/supabase/client"
import type { Budget } from "@/lib/types/budget"
import { FileText, Plus, Loader2, Trash2 } from "lucide-react"
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
}

export function BudgetList({
  projectId,
  onSelectBudget,
  onCreateBudget,
  isGenerating = false,
  hasData = true,
  refreshTrigger = 0,
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

        const { data: settings } = await supabase
          .from("budget_settings")
          .select("status")
          .eq("project_id", projectId)
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
      toast({
        title: "Presupuesto eliminado",
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
      toast({
        title: "Presupuestos eliminados",
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
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h3 className="text-lg font-medium">Presupuestos del Proyecto</h3>
          <div className="flex gap-2 w-full sm:w-auto">
            {budgets.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDeleteAllDialog(true)}
                disabled={deletingAll}
                className="text-destructive hover:text-white flex-1 sm:flex-none"
              >
                {deletingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Todos
                  </>
                )}
              </Button>
            )}
            <Button
              size="sm"
              onClick={onCreateBudget}
              disabled={!hasData || isGenerating || hasAcceptedBudget}
              title={hasAcceptedBudget ? "No se pueden crear más presupuestos mientras haya uno aceptado" : ""}
              className="flex-1 sm:flex-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {budgets.map((budget) => (
            <Card key={budget.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectBudget(budget.id)}>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{budget.name}</h4>
                      {budget.is_original && (
                        <Badge variant="outline" className="text-xs">
                          Original
                        </Badge>
                      )}
                      {getStatusBadge(budget.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      v{budget.version_number} •{" "}
                      {formatDistanceToNow(new Date(budget.created_at), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-primary">{formatCurrency(budget.total)}</div>
                      <div className="text-xs text-muted-foreground">IVA incluido</div>
                    </div>
                    {budgets.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          setBudgetToDelete(budget)
                        }}
                        disabled={deletingId === budget.id}
                      >
                        {deletingId === budget.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    )}
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
