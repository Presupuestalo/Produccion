"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { BudgetList } from "./budget-list"
import { BudgetViewer } from "./budget-viewer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertCircle, X } from "lucide-react"
import { BudgetService } from "@/lib/services/budget-service"
import type { Budget } from "@/lib/types/budget"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { getSupabase } from "@/lib/supabase/client"
import { BudgetLimitDialog } from "./budget-limit-dialog"
import * as SubscriptionLimitsService from "@/lib/services/subscription-limits-service"

interface BudgetSectionProps {
  projectId: string
  calculatorData?: any
  calculatorLastSaved?: Date | null
  isV2Mode?: boolean
}

export function BudgetSection({ projectId, calculatorData, calculatorLastSaved, isV2Mode }: BudgetSectionProps) {
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showInfoAlert, setShowInfoAlert] = useState(true)
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [limitData, setLimitData] = useState<{ current: number; limit: number; canUpgrade: boolean } | null>(null)
  const { toast } = useToast()

  // Generate a simple hash of calculator data for comparison
  const calculateDataHash = (data: any): string => {
    if (!data) return ""
    try {
      return JSON.stringify(data)
    } catch {
      return ""
    }
  }

  const currentDataHash = calculateDataHash(calculatorData)

  useEffect(() => {
    const hideAlert = localStorage.getItem("hideBudgetInfoAlert")
    if (hideAlert === "true") {
      setShowInfoAlert(false)
    }
  }, [])

  const handleDismissAlert = () => {
    localStorage.setItem("hideBudgetInfoAlert", "true")
    setShowInfoAlert(false)
  }

  useEffect(() => {
    const fetchV2Budget = async () => {
      // Si estamos en modo V2 y no hay presupuesto seleccionado, buscamos el borrador adecuado
      if (isV2Mode && !selectedBudgetId) {
        try {
          const supabase = await getSupabase()
          const { data: existingBudgets } = await supabase
            .from("budgets")
            .select("id, status, name, version_number")
            .eq("project_id", projectId)
            .order("version_number", { ascending: false })

          // Sincronización unificada: Buscamos simplemente el borrador más reciente del proyecto
          const target = existingBudgets?.find((b: Budget) => b.status === "draft")

          if (target) {
            console.log("[v0] Auto-selecting latest draft:", target.name, `(v${target.version_number})`)
            setSelectedBudgetId(target.id)
          }
        } catch (err) {
          console.error("Error fetching V2 budget:", err)
        }
      }
    }

    fetchV2Budget()
    // IMPORTANTE: No incluimos selectedBudgetId en las dependencias para evitar el bucle infinito
    // al pulsar "Volver a la lista". Solo se dispara al cambiar de modo o proyecto.
  }, [isV2Mode, projectId])

  // Refresh data when calculator saves
  useEffect(() => {
    if (calculatorLastSaved) {
      console.log("[v0] Calculator saved, triggering budget refresh...")
      setRefreshKey((prev) => prev + 1)
    }
  }, [calculatorLastSaved])

  const handleCreateBudget = async () => {
    if (!calculatorData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay datos de la calculadora para generar el presupuesto",
      })
      return
    }

    const hasWindows = (calculatorData.reform?.rooms || []).some((r: any) => r.windows?.length > 0) ||
      (calculatorData.rooms || []).some((r: any) => r.windows?.length > 0)

    const hasRooms =
      calculatorData.demolition?.rooms?.length > 0 ||
      calculatorData.rooms?.filter((r: any) => r.customRoomType !== "Otras ventanas").length > 0 ||
      calculatorData.reform?.rooms?.filter((r: any) => r.customRoomType !== "Otras ventanas").length > 0 ||
      calculatorData.reform_rooms?.length > 0

    if (!hasRooms && !hasWindows) {
      toast({
        variant: "destructive",
        title: "Datos incompletos",
        description: "Debes añadir al menos una habitación o una ventana para generar un presupuesto",
      })
      return
    }

    // Check budget limit before generating
    try {
      const limitCheck = await SubscriptionLimitsService.canCreateBudget(projectId)
      if (!limitCheck.allowed) {
        setLimitData({
          current: limitCheck.currentCount || 0,
          limit: limitCheck.limit || 0,
          canUpgrade: !!limitCheck.canUpgrade,
        })
        setShowLimitDialog(true)
        return
      }
    } catch (limitError) {
      console.error("Error checking budget limits:", limitError)
    }

    try {
      setIsGenerating(true)
      const supabaseClient = await getSupabase()

      if (!supabaseClient) {
        console.error("[v0] No se pudo inicializar el cliente de Supabase")
        throw new Error("Error de conexión con la base de datos")
      }

      const {
        data: { user },
      } = await supabaseClient.auth.getUser()

      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Debes iniciar sesión para generar un presupuesto",
        })
        return
      }

      let budget
      try {
        budget = await BudgetService.createBudgetFromCalculator(projectId, user.id, calculatorData, supabaseClient)
      } catch (serviceError) {
        throw serviceError
      }

      toast({
        title: "Presupuesto generado",
        description: `Se ha creado el presupuesto: ${budget.name}`,
      })

      setSelectedBudgetId(budget.id)
      setRefreshKey((prev) => prev + 1)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo generar el presupuesto",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  if (selectedBudgetId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedBudgetId(null)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a la lista
        </Button>
        <BudgetViewer
          projectId={projectId}
          budgetId={selectedBudgetId}
          onBudgetUpdated={() => setRefreshKey((prev) => prev + 1)}
          refreshTrigger={refreshKey}
        />
      </div>
    )
  }

  const hasWindows = (calculatorData?.reform?.rooms || []).some((r: any) => r.windows?.length > 0) ||
    (calculatorData?.rooms || []).some((r: any) => r.windows?.length > 0)

  const hasData =
    calculatorData?.demolition?.rooms?.length > 0 ||
    calculatorData?.rooms?.length > 0 ||
    calculatorData?.reform?.rooms?.length > 0 ||
    calculatorData?.reform_rooms?.length > 0 ||
    hasWindows

  return (
    <div className="space-y-6">
      {showInfoAlert && hasData && (
        <Alert className="relative">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="pr-8">
            Los presupuestos se generan automáticamente desde los datos de la calculadora. Puedes crear múltiples
            versiones y editarlas según tus necesidades.
          </AlertDescription>
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={handleDismissAlert}>
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {!hasData && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Datos incompletos</AlertTitle>
          <AlertDescription>
            Para generar un presupuesto, debes añadir al menos una habitación en la sección de{" "}
            <strong>Demolición</strong> o en la sección de <strong>Reforma</strong>.
          </AlertDescription>
        </Alert>
      )}

      <BudgetList
        projectId={projectId}
        onSelectBudget={setSelectedBudgetId}
        onCreateBudget={handleCreateBudget}
        isGenerating={isGenerating}
        hasData={hasData}
        refreshTrigger={refreshKey}
        currentDataHash={currentDataHash}
      />

      {limitData && (
        <BudgetLimitDialog
          open={showLimitDialog}
          onOpenChange={setShowLimitDialog}
          currentBudgets={limitData.current}
          maxBudgets={limitData.limit}
          canUpgrade={limitData.canUpgrade}
        />
      )}
    </div>
  )
}
