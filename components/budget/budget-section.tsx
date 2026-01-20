"use client"

import React, { useState, useEffect } from "react"
import { BudgetList } from "./budget-list"
import { BudgetViewer } from "./budget-viewer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertCircle, X } from "lucide-react"
import { BudgetService } from "@/lib/services/budget-service"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { BudgetLimitDialog } from "./budget-limit-dialog"
import * as SubscriptionLimitsService from "@/lib/services/subscription-limits-service"

interface BudgetSectionProps {
  projectId: string
  calculatorData?: any
}

export function BudgetSection({ projectId, calculatorData }: BudgetSectionProps) {
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showInfoAlert, setShowInfoAlert] = useState(true)
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [limitData, setLimitData] = useState<{ current: number; limit: number; canUpgrade: boolean } | null>(null)
  const { toast } = useToast()

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

  const handleCreateBudget = async () => {
    if (!calculatorData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay datos de la calculadora para generar el presupuesto",
      })
      return
    }

    const hasRooms =
      calculatorData.demolition?.rooms?.length > 0 ||
      calculatorData.rooms?.length > 0 ||
      calculatorData.reform?.rooms?.length > 0 ||
      calculatorData.reform_rooms?.length > 0

    if (!hasRooms) {
      toast({
        variant: "destructive",
        title: "Datos incompletos",
        description: "Debes añadir al menos una habitación en Demolición o Reforma para generar un presupuesto",
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
      if (!supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()

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
        if (!supabase) throw new Error("Supabase client not initialized")
        budget = await BudgetService.createBudgetFromCalculator(projectId, user.id, calculatorData, supabase)
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
        />
      </div>
    )
  }

  const hasData =
    calculatorData?.demolition?.rooms?.length > 0 ||
    calculatorData?.rooms?.length > 0 ||
    calculatorData?.reform?.rooms?.length > 0 ||
    calculatorData?.reform_rooms?.length > 0

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
