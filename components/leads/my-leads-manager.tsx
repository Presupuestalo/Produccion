"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/format"
import { MapPin, Calendar, AlertCircle, CheckCircle2, Clock, RefreshCw, Phone, Mail } from 'lucide-react'
import { ClaimLeadDialog } from "./claim-lead-dialog"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { ImportBudgetButton } from "./import-budget-button"

interface LeadInteraction {
  id: string
  lead_request_id: string
  credits_spent: number
  accessed_at: string
  days_since_access: number
  can_claim: boolean
  has_claim: boolean
  claim_data?: any
  lead_requests: {
    id: string
    estimated_budget: number
    city: string
    province: string
    postal_code: string
    reform_types: string[]
    project_description?: string
    status: string
    created_at: string
  }
}

export function MyLeadsManager() {
  const [interactions, setInteractions] = useState<LeadInteraction[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadInteractions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/leads/my-interactions")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      setInteractions(data.interactions || [])
    } catch (error: any) {
      console.error("[v0] Error loading interactions:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudieron cargar tus leads",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInteractions()
  }, [])

  const handleClaimSubmitted = () => {
    loadInteractions()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (interactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-semibold">No has accedido a ningún lead</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Cuando accedas a leads desde el marketplace, aparecerán aquí
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {interactions.map((interaction) => {
        const lead = interaction.lead_requests

        return (
          <Card key={interaction.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {lead.reform_types.join(", ")}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {lead.city}, {lead.province} ({lead.postal_code})
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {interaction.has_claim ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Reclamado
                    </Badge>
                  ) : interaction.can_claim ? (
                    <Badge variant="outline" className="flex items-center gap-1 border-orange-500 text-orange-600">
                      <AlertCircle className="h-3 w-3" />
                      Puedes Reclamar
                    </Badge>
                  ) : (
                    <Badge variant="default">
                      En Seguimiento
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Presupuesto estimado</p>
                  <p className="font-semibold">{formatCurrency(lead.estimated_budget)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Créditos invertidos</p>
                  <p className="font-semibold">{interaction.credits_spent} créditos</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Accedido hace</p>
                  <p className="font-semibold">{interaction.days_since_access} días</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado del lead</p>
                  <p className="font-semibold capitalize">{lead.status}</p>
                </div>
              </div>

              {lead.project_description && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">
                    {lead.project_description}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Accedido {formatDistanceToNow(new Date(interaction.accessed_at), { addSuffix: true, locale: es })}
              </div>

              {interaction.has_claim && interaction.claim_data && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Reclamación aprobada</strong>
                    <br />
                    Se han devuelto {interaction.claim_data.credits_refunded} créditos (50% del coste) a tu cuenta.
                  </AlertDescription>
                </Alert>
              )}

              {interaction.can_claim && !interaction.has_claim && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Han pasado más de 7 días desde que accediste. Si el cliente no ha respondido, puedes reclamar una
                    devolución parcial del 50% de los créditos.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <ImportBudgetButton 
                  leadRequestId={interaction.lead_request_id} 
                  hasAccess={true}
                />
                {interaction.can_claim && !interaction.has_claim && (
                  <ClaimLeadDialog
                    leadId={interaction.lead_request_id}
                    creditsSpent={interaction.credits_spent}
                    onClaimSubmitted={handleClaimSubmitted}
                  >
                    <Button variant="outline" size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reclamar Créditos
                    </Button>
                  </ClaimLeadDialog>
                )}
                <Button variant="default" size="sm" disabled>
                  <Phone className="mr-2 h-4 w-4" />
                  Contactar Cliente
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
