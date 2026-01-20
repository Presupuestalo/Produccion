"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"
import type { BudgetAdjustment } from "@/lib/types/budget-adjustment"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { AddAdjustmentDialog } from "./add-adjustment-dialog"
import { BudgetService } from "@/lib/services/budget-service"
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

interface BudgetAdjustmentsSectionProps {
  budgetId: string
  projectId: string
  adjustments: BudgetAdjustment[]
  onAdjustmentsUpdated: () => void
}

export function BudgetAdjustmentsSection({
  budgetId,
  projectId,
  adjustments,
  onAdjustmentsUpdated,
}: BudgetAdjustmentsSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [adjustmentType, setAdjustmentType] = useState<"addition" | "subtraction">("addition")
  const [adjustmentToDelete, setAdjustmentToDelete] = useState<BudgetAdjustment | null>(null)
  const { toast } = useToast()

  const handleAddAdjustment = (type: "addition" | "subtraction") => {
    console.log("[v0] Opening adjustment dialog, type:", type)
    setAdjustmentType(type)
    setAddDialogOpen(true)
  }

  const handleAdjustmentAdded = () => {
    console.log("[v0] Adjustment added, reloading data...")
    onAdjustmentsUpdated()
  }

  const deleteAdjustment = async (id: string) => {
    try {
      console.log("[v0] Deleting adjustment:", id)
      const supabase = createClient()
      await BudgetService.deleteBudgetAdjustment(id, supabase)

      toast({
        title: "Ajuste eliminado",
        description: "El ajuste se ha eliminado correctamente",
      })

      onAdjustmentsUpdated()
      setAdjustmentToDelete(null)
    } catch (err) {
      console.error("[v0] Error deleting adjustment:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el ajuste",
      })
    }
  }

  const adjustmentsTotal = adjustments.reduce((sum, adj) => {
    return sum + (adj.type === "addition" ? adj.total_price : -adj.total_price)
  }, 0)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <>
      <Card className="border-2 border-blue-500/20">
        <CardHeader className="bg-blue-50 dark:bg-blue-950/20">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium">Ajustes y Partidas Adicionales</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleAddAdjustment("addition")} className="gap-1">
                <TrendingUp className="h-4 w-4" />
                Añadir
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleAddAdjustment("subtraction")} className="gap-1">
                <TrendingDown className="h-4 w-4" />
                Restar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {adjustments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay ajustes registrados. Haz clic en 'Añadir' o 'Restar' para crear uno.
            </p>
          ) : (
            <div className="space-y-4">
              {adjustments.map((adj, index) => (
                <div key={adj.id} className="border rounded-lg p-4 space-y-3 bg-background">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {adj.type === "addition" ? "Añadido" : "Restado"} {index + 1}
                        </span>
                        {adj.type === "addition" ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">{formatDate(adj.adjustment_date)}</span>
                      </div>
                      <h4 className="font-medium">{adj.concept}</h4>
                      {adj.description && <p className="text-sm text-muted-foreground">{adj.description}</p>}
                      <div className="text-sm text-muted-foreground mt-1">
                        {adj.quantity} {adj.unit} × {formatCurrency(adj.unit_price)}
                      </div>
                      {adj.notes && <p className="text-sm text-muted-foreground mt-2 italic">{adj.notes}</p>}
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="text-right">
                        <span
                          className={`text-lg font-bold ${adj.type === "addition" ? "text-green-600" : "text-red-600"}`}
                        >
                          {adj.type === "addition" ? "+" : "-"}
                          {formatCurrency(adj.total_price)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAdjustmentToDelete(adj)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-t-2 pt-4 mt-4">
                <div className="flex justify-between items-center text-xl font-semibold">
                  <span>Total Ajustes:</span>
                  <span className={adjustmentsTotal >= 0 ? "text-green-600" : "text-red-600"}>
                    {adjustmentsTotal >= 0 ? "+" : ""}
                    {formatCurrency(adjustmentsTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddAdjustmentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        adjustmentType={adjustmentType}
        budgetId={budgetId}
        onAdjustmentAdded={handleAdjustmentAdded}
      />

      <AlertDialog open={!!adjustmentToDelete} onOpenChange={(open) => !open && setAdjustmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ajuste?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el ajuste "{adjustmentToDelete?.concept}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => adjustmentToDelete && deleteAdjustment(adjustmentToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
