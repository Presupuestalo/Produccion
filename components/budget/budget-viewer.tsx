"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BudgetService } from "@/lib/services/budget-service"
import { getSupabase } from "@/lib/supabase/client"
import type { BudgetWithLineItems, BudgetCategory } from "@/lib/types/budget"
import type { BudgetSettings } from "@/lib/types/budget-settings"
import type { BudgetAdjustment } from "@/lib/types/budget-adjustment"
import { Download, AlertTriangle, CheckCircle2, Copy, CheckCircle, Clock, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/format"
import { BudgetSettingsDialog } from "./budget-settings-dialog"
import { generateBudgetPDF } from "@/lib/utils/pdf-generator"
import { BudgetStatusManager } from "./budget-status-manager"
import { BudgetAdjustmentsSection } from "./budget-adjustments-section"
import { BudgetLineItemsEditor } from "./budget-line-items-editor"
import { useUserProfile } from "@/hooks/use-user-profile"
import { RequestQuotesDialog } from "@/components/leads/request-quotes-dialog"
import { useBudgetNotifications } from "@/hooks/use-budget-notifications"
import { BudgetLimitDialog } from "./budget-limit-dialog"
import * as SubscriptionLimitsService from "@/lib/services/subscription-limits-service"

interface BudgetViewerProps {
  projectId: string
  budgetId?: string
  onBudgetUpdated?: () => void
}

interface LeadRequestStatus {
  id: string
  status: string
  created_at: string
  proposals_count: number
  selected_company: string | null
}

export function BudgetViewer({ projectId, budgetId, onBudgetUpdated }: BudgetViewerProps) {
  const [budget, setBudget] = useState<BudgetWithLineItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings | null>(null)
  const [adjustments, setAdjustments] = useState<BudgetAdjustment[]>([])
  const [isRequestQuotesOpen, setIsRequestQuotesOpen] = useState(false)
  const [existingLeadRequest, setExistingLeadRequest] = useState<LeadRequestStatus | null>(null)
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [limitData, setLimitData] = useState<{ current: number; limit: number; canUpgrade: boolean } | null>(null)
  const { toast } = useToast()
  const { subscribeToBudgetChanges } = useBudgetNotifications()

  const { userProfile, loading: profileLoading } = useUserProfile()
  const isOwner = userProfile?.user_type === "homeowner"

  const loadBudget = async () => {
    try {
      setLoading(true)
      const supabase = await getSupabase()
      if (!supabase) {
        setError("No se pudo conectar con la base de datos")
        return
      }

      if (budgetId) {
        const data = await BudgetService.getBudgetById(budgetId, supabase)
        setBudget(data)

        const { data: settings, error: settingsError } = await supabase
          .from("budget_settings")
          .select("*")
          .eq("project_id", projectId)
          .maybeSingle()

        setBudgetSettings(settings)

        const adjustmentsData = await BudgetService.getBudgetAdjustments(budgetId, supabase)
        setAdjustments(adjustmentsData)

        const { data: leadRequest, error: leadError } = await supabase
          .from("lead_requests")
          .select("id, status, created_at, selected_company")
          .eq("project_id", projectId)
          .maybeSingle()

        if (leadRequest) {
          const { count } = await supabase
            .from("professional_proposals")
            .select("*", { count: "exact", head: true })
            .eq("lead_request_id", leadRequest.id)

          setExistingLeadRequest({
            ...leadRequest,
            proposals_count: count || 0,
          })
        }
      }
    } catch (err) {
      console.error("[BudgetViewer] Error loading budget:", err)
      setError("Error al cargar el presupuesto")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBudget()
    if (budgetId) {
      subscribeToBudgetChanges(budgetId, () => {
        loadBudget()
      })
    }
  }, [budgetId])

  const reloadBudgetSettings = async () => {
    try {
      console.log("[v0] Reloading budget after status change...")
      await loadBudget()
      onBudgetUpdated?.()
      toast({
        title: "Vista actualizada",
        description: "Los cambios se han aplicado correctamente",
      })
    } catch (err) {
      console.error("[v0] Error reloading budget:", err)
    }
  }

  const handleCreateCopy = async () => {
    if (!budget) return

    // Check budget limit before duplicating
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
      console.error("[v0] Error checking budget limits:", limitError)
    }

    try {
      const supabase = await getSupabase()
      if (!supabase) return

      const copyName = `${budget.name} - Copia`
      const copy = await BudgetService.createBudgetCopy(budget.id, supabase, copyName)
      toast({
        title: "Copia creada",
        description: `Se ha creado una copia editable: ${copy.name}`,
      })
      setBudget(copy)
      onBudgetUpdated?.()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la copia del presupuesto",
      })
      throw err
    }
  }

  const handleExportPDF = async () => {
    console.log("[v0] handleExportPDF llamado, budget:", budget?.id)

    if (!budget) {
      console.log("[v0] No hay budget, abortando exportación")
      return
    }

    try {
      console.log("[v0] Iniciando exportación PDF...")

      toast({
        title: "Generando PDF",
        description: "Por favor espera mientras se genera el documento...",
      })

      const supabase = await getSupabase()
      if (!supabase) {
        throw new Error("No hay conexión con la base de datos")
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      let companyData = null
      if (user) {
        const { data: userCompanySettings, error: companyError } = await supabase
          .from("user_company_settings")
          .select(
            "company_name, company_address, company_tax_id, company_phone, company_email, company_website, company_logo_url",
          )
          .eq("user_id", user.id)
          .maybeSingle()

        if (companyError) {
          console.log("[v0] Error cargando datos de empresa:", companyError)
        } else {
          companyData = userCompanySettings
          console.log("[v0] Company data loaded:", companyData)
        }
      }

      const finalSettings = budgetSettings
        ? {
          ...budgetSettings,
          introduction_text: budget.custom_introduction_text || budgetSettings.introduction_text,
          additional_notes: budget.custom_additional_notes || budgetSettings.additional_notes,
        }
        : null

      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("title, client, project_address")
        .eq("id", projectId)
        .single()

      if (projectError) {
        console.log("[v0] Error cargando proyecto:", projectError.message)
      }

      // Verificamos si debemos mostrar marca de agua según el plan
      const limits = await SubscriptionLimitsService.getSubscriptionLimits()
      const showWatermark = limits?.pdfWatermark ?? true

      await generateBudgetPDF(budget, finalSettings, project, companyData, isOwner || false, showWatermark)

      toast({
        title: "PDF generado",
        description: "El presupuesto se ha descargado correctamente",
      })
    } catch (err) {
      console.error("[v0] Error generando PDF:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar el PDF. Por favor, intenta de nuevo.",
      })
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !budget) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error || "No se encontró el presupuesto"}</AlertDescription>
      </Alert>
    )
  }

  const categories: BudgetCategory[] = []
  const categoryMap = new Map<string, BudgetCategory>()

  budget.line_items.forEach((item) => {
    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, {
        category: item.category,
        items: [],
        subtotal: 0,
      })
    }

    const cat = categoryMap.get(item.category)!
    cat.items.push(item)
    cat.subtotal += item.total_price
  })

  categoryMap.forEach((category) => {
    category.items.sort((a, b) => {
      if (a.concept_code && b.concept_code) {
        return a.concept_code.localeCompare(b.concept_code)
      }
      if (a.concept_code && !b.concept_code) return -1
      if (!a.concept_code && b.concept_code) return 1

      if (a.sort_order !== null && b.sort_order !== null) {
        return a.sort_order - b.sort_order
      }
      if (a.sort_order !== null) return -1
      if (b.sort_order !== null) return 1
      return 0
    })
  })

  categoryMap.forEach((value) => categories.push(value))

  const isAccepted = budget.status === "approved"
  const showVat = budgetSettings?.show_vat ?? false
  const vatPercentage = budgetSettings?.vat_percentage ?? 21
  const adjustmentsTotal = adjustments.reduce((sum, adj) => {
    return sum + (adj.type === "addition" ? adj.total_price : -adj.total_price)
  }, 0)
  const subtotalWithAdjustments = budget.subtotal + adjustmentsTotal

  const dbToComponentStatusMap = {
    draft: "draft",
    sent: "delivered",
    approved: "accepted",
    rejected: "rejected",
    in_progress: "accepted",
    completed: "accepted",
  } as const

  const componentStatus = (dbToComponentStatusMap[budget.status as keyof typeof dbToComponentStatusMap] || "draft") as
    | "draft"
    | "delivered"
    | "accepted"
    | "rejected"

  let vatAmount = 0
  let totalWithVat = 0
  if (showVat && budget) {
    vatAmount = subtotalWithAdjustments * (vatPercentage / 100)
    totalWithVat = subtotalWithAdjustments + vatAmount
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <CardTitle className="text-3xl font-serif">{budget.name}</CardTitle>
                {budget.is_original && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Original</span>
                )}
              </div>
              <p className="text-muted-foreground mt-1">Versión {budget.version_number}</p>
              {budget.description && <p className="text-sm text-muted-foreground mt-2">{budget.description}</p>}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {!isOwner && (
                <BudgetStatusManager
                  budgetId={budget.id}
                  projectId={projectId}
                  currentStatus={componentStatus}
                  onStatusChanged={reloadBudgetSettings}
                />
              )}
              <div className="hidden sm:flex sm:flex-1" />
              {!isOwner && (
                <Button variant="outline" size="sm" onClick={handleCreateCopy}>
                  <Copy className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Crear Copia</span>
                </Button>
              )}
              {!isOwner && (
                <BudgetSettingsDialog
                  projectId={projectId}
                  budgetId={budget.id}
                  onSettingsSaved={reloadBudgetSettings}
                />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("[v0] PDF Export button clicked!")
                  handleExportPDF()
                }}
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Exportar PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isAccepted && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Este presupuesto ha sido aceptado. El presupuesto original está bloqueado, pero puedes añadir ajustes y
            partidas adicionales en la sección inferior.
          </AlertDescription>
        </Alert>
      )}

      <BudgetLineItemsEditor
        budgetId={budget.id}
        categories={categories}
        isLocked={isAccepted}
        isOwner={isOwner}
        onItemsUpdated={loadBudget}
      />

      {isAccepted && (
        <BudgetAdjustmentsSection
          budgetId={budget.id}
          projectId={projectId}
          adjustments={adjustments}
          onAdjustmentsUpdated={loadBudget}
        />
      )}

      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold">
            {isOwner ? "Resumen de tu Presupuesto" : "Resumen del Presupuesto"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-3">
          {isOwner ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Este documento presenta una estimación orientativa de los trabajos necesarios para tu proyecto de
                reforma. El presupuesto final puede variar según las condiciones específicas de la obra y los materiales
                seleccionados.
              </p>
              <div className="h-px bg-border my-4" />
              <div className="flex justify-between items-center text-xl bg-background/50 p-4 rounded-lg">
                <span className="font-semibold">Total Estimado</span>
                <span className="font-bold text-primary text-2xl">{formatCurrency(subtotalWithAdjustments)}</span>
              </div>

              <div className="mt-8 pt-6 border-t">
                {existingLeadRequest ? (
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">Solicitud enviada</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Tu proyecto ya está publicado en el mercado de profesionales.
                        {existingLeadRequest.proposals_count > 0
                          ? ` Has recibido ${existingLeadRequest.proposals_count} propuesta${existingLeadRequest.proposals_count > 1 ? "s" : ""}.`
                          : " Pronto recibirás propuestas de profesionales verificados."}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Publicado {new Date(existingLeadRequest.created_at).toLocaleDateString("es-ES")}</span>
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {existingLeadRequest.proposals_count} propuesta
                          {existingLeadRequest.proposals_count !== 1 ? "s" : ""} recibida
                          {existingLeadRequest.proposals_count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {existingLeadRequest.proposals_count > 0 && (
                      <Button
                        onClick={() => (window.location.href = "/dashboard/mis-peticiones")}
                        variant="outline"
                        className="mt-4"
                      >
                        Ver propuestas recibidas
                      </Button>
                    )}

                    <p className="text-xs text-muted-foreground mt-4">
                      Solo puedes tener una solicitud activa por proyecto.
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">¿Quieres recibir presupuestos reales?</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Profesionales verificados de tu zona te enviarán presupuestos personalizados sin compromiso
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setIsRequestQuotesOpen(true)
                      }}
                      size="lg"
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      Solicitar Presupuestos Gratis
                    </Button>
                    <RequestQuotesDialog
                      open={isRequestQuotesOpen}
                      onOpenChange={(open) => {
                        setIsRequestQuotesOpen(open)
                        if (!open) {
                          loadBudget()
                        }
                      }}
                      projectId={projectId}
                      budgetId={budget.id}
                      estimatedBudget={subtotalWithAdjustments}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.length > 0 && (
                <>
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Desglose por Categorías</h4>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category.category} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{category.category}</span>
                          <span className="font-semibold">{formatCurrency(category.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-px bg-border my-3" />
                </>
              )}

              <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">Presupuesto Original</span>
                <span className="font-semibold">{formatCurrency(budget.subtotal)}</span>
              </div>

              {isAccepted && adjustmentsTotal !== 0 && (
                <>
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-muted-foreground">Ajustes y Partidas Adicionales</span>
                    <span className={`font-semibold ${adjustmentsTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {adjustmentsTotal >= 0 ? "+" : ""}
                      {formatCurrency(adjustmentsTotal)}
                    </span>
                  </div>
                  <div className="h-px bg-border my-2" />
                </>
              )}

              {isAccepted && adjustmentsTotal !== 0 && (
                <div className="flex justify-between items-center text-xl font-semibold bg-background/50 p-3 rounded-lg">
                  <span>Subtotal con Ajustes</span>
                  <span>{formatCurrency(subtotalWithAdjustments)}</span>
                </div>
              )}

              {showVat ? (
                <>
                  {(!isAccepted || adjustmentsTotal === 0) && (
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">{formatCurrency(subtotalWithAdjustments)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-muted-foreground">IVA ({vatPercentage}%)</span>
                    <span className="font-semibold">{formatCurrency(vatAmount)}</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between items-center text-2xl font-serif bg-primary/10 p-4 rounded-lg">
                    <span className="font-bold">Total Final</span>
                    <span className="text-primary font-bold">{formatCurrency(totalWithVat)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-right mt-1">Impuestos incluidos</p>
                </>
              ) : (
                <>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between items-center text-2xl font-serif bg-primary/10 p-4 rounded-lg">
                    <span className="font-bold">Total Final</span>
                    <span className="text-primary font-bold">{formatCurrency(subtotalWithAdjustments)}</span>
                  </div>
                </>
              )}

              {isAccepted && adjustmentsTotal !== 0 && (
                <div className="mt-4 pt-4 border-t-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Diferencia con presupuesto original:</span>
                    <span
                      className={`font-bold text-base ${adjustmentsTotal >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {adjustmentsTotal >= 0 ? "+" : ""}
                      {formatCurrency(adjustmentsTotal)}
                      {showVat && ` (${adjustmentsTotal >= 0 ? "+" : ""}${formatCurrency(totalWithVat)} con IVA)`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {budget.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notas del Presupuesto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{budget.notes}</p>
          </CardContent>
        </Card>
      )}

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
