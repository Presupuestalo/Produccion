"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "react-toastify"
import {
  MapPin,
  Euro,
  Clock,
  Phone,
  User,
  Coins,
  FileText,
  CreditCard,
  Loader2,
  CheckCircle2,
  XCircle,
  Mail,
  Calendar,
  Star,
  Briefcase,
  AlertTriangle,
  Building2,
  Crown,
} from "lucide-react"
import Link from "next/link"
import { AccessOfferDialog } from "@/components/leads/access-offer-dialog"
import { calculateCreditCost, type SubscriptionPlan } from "@/lib/utils/credit-calculator"
import { useSearchParams, useRouter } from "next/navigation"

interface Lead {
  id: string
  homeowner_id: string
  client_name: string | null
  client_name_partial: string | null
  client_email: string | null
  client_phone: string | null
  client_phone_partial: string | null
  city: string
  province: string
  reform_types: string[]
  estimated_budget: number
  description: string
  status: string
  companies_accessed_count: number
  max_companies: number
  created_at: string
  expires_at: string
  has_accessed: boolean
  proposals_count: number
  selected_company: string | null // añadido para detectar adjudicación
  source: string
  lead_type?: "normal" | "premium"
  budget_id?: string | null
  budget_snapshot?: {
    line_items?: any[]
    lineItems?: any[]
  } | null
}

interface ProfessionalProposal {
  id: string
  status: "pending" | "accepted" | "rejected"
  proposed_budget: number
  message: string | null
  created_at: string
}

interface AcquiredLead {
  id: string
  lead_request_id: string
  credits_spent: number
  accessed_at: string
  lead: {
    id: string
    reform_types: string[]
    estimated_budget: number
    city: string
    province: string
    project_description: string | null
    client_name: string
    client_email: string | null
    client_phone: string
    offer_count: number
    max_companies: number
    status: string
    lead_type?: "normal" | "premium"
    budget_snapshot?: {
      line_items?: any[]
      lineItems?: any[]
    } | null
  }
  proposal_sent: boolean
  offer_status: string
  proposal?: ProfessionalProposal
}

const getPlanName = (plan: string) => {
  const planNames: Record<string, string> = {
    free: "Gratuito",
    autonomo: "Autónomo",
    profesional: "Profesional",
    empresa: "Empresa",
  }
  return planNames[plan] || "Gratuito"
}

const getLeadStatus = (lead: Lead) => {
  if (lead.selected_company) {
    return { label: "ADJUDICADA", color: "bg-blue-500 text-white" }
  }
  if ((lead.companies_accessed_count || 0) >= (lead.max_companies || 3)) {
    return { label: "EXPIRADA", color: "bg-gray-500 text-white" }
  }
  if (lead.status !== "open") {
    return { label: "CERRADA", color: "bg-gray-400 text-white" }
  }
  return null
}

export default function SolicitudesDisponiblesPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [acquiredLeads, setAcquiredLeads] = useState<AcquiredLead[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAcquired, setLoadingAcquired] = useState(true)
  const [userCredits, setUserCredits] = useState(0)
  const [userPlan, setUserPlan] = useState<SubscriptionPlan>("free")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userProvince, setUserProvince] = useState<string | null>(null)
  const [userCity, setUserCity] = useState<string | null>(null)
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const purchase = searchParams.get("purchase")
    if (purchase === "success") {
      // Mostrar notificación de compra exitosa
      toast.success("¡Compra realizada con éxito! Tus créditos han sido actualizados.")

      // Refrescar los datos
      fetchData()

      // Limpiar el parámetro de la URL
      const params = new URLSearchParams(searchParams.toString())
      params.delete("purchase")
      const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname
      router.replace(newUrl)
    }
  }, [searchParams, router])

  const fetchData = async () => {
    setLoading(true)
    setLoadingAcquired(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        setLoadingAcquired(false)
        return
      }

      setUserId(user.id)

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("subscription_plan")
        .eq("id", user.id)
        .single()

      console.log("[v0] User ID:", user.id)
      console.log("[v0] Profile data:", profile)
      console.log("[v0] Profile error:", profileError)

      if (profile) {
        setSubscriptionPlan(profile.subscription_plan)
        setUserPlan((profile.subscription_plan as SubscriptionPlan) || "free")
      }

      // Obtener créditos a través de la API para evitar problemas de RLS/406 en el navegador
      try {
        console.log("[v0] Fetching user credits via API...")
        const creditsResponse = await fetch("/api/credits/balance")
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json()
          console.log("[v0] Credits from API:", creditsData.credits_balance)
          setUserCredits(creditsData.credits_balance || 0)
        } else {
          console.warn("[v0] Failed to fetch credits via API, code:", creditsResponse.status)
          setUserCredits(0)
        }
      } catch (creditsError) {
        console.error("[v0] Error fetching credits via API:", creditsError)
        setUserCredits(0)
      }

      try {
        console.log("[v0] Fetching available leads...")
        const availableResponse = await fetch("/api/leads/available")
        const availableData = await availableResponse.json()

        console.log("[v0] Available leads response:", availableData)

        if (availableData.leads) {
          // Transformar los leads al formato esperado
          const formattedLeads: Lead[] = availableData.leads.map((lead: any) => ({
            id: lead.id,
            client_name: lead.client_name,
            client_phone: lead.client_phone,
            client_phone_partial: lead.client_phone_partial,
            client_email: lead.client_email,
            city: lead.city,
            province: lead.province,
            reform_types: lead.reform_types || [],
            description: lead.description,
            estimated_budget: lead.estimated_budget,
            status: lead.status,
            created_at: lead.created_at,
            expires_at: lead.expires_at,
            homeowner_id: lead.homeowner_id,
            companies_accessed_count: lead.companies_accessed_count || 0,
            max_companies: lead.max_companies || 3,
            selected_company: lead.selected_company,
            has_accessed: lead.has_accessed,
            source: "presmarket",
            budget_snapshot: lead.budget_snapshot || null,
            lead_type: lead.lead_type || "normal",
            budget_id: lead.budget_id || null,
          }))

          console.log("[v0] Formatted leads:", formattedLeads.length)
          setLeads(formattedLeads)
        }
      } catch (availableError) {
        console.error("[v0] Error fetching available leads:", availableError)
      }

      setLoading(false)

      // Cargar leads adquiridos
      try {
        console.log("[v0] Fetching acquired leads...")
        const response = await fetch("/api/leads/my-interactions")
        const data = await response.json()

        console.log("[v0] API my-interactions response:", data)

        if (data.interactions) {
          // También obtener propuestas para enriquecer los datos
          const { data: proposals } = await supabase
            .from("professional_proposals")
            .select("*")
            .eq("professional_id", user.id)

          const proposalsMap = new Map((proposals || []).map((p: any) => [p.lead_request_id, p]))

          const acquired: AcquiredLead[] = data.interactions
            .filter((interaction: any) => interaction.lead_requests)
            .map((interaction: any) => {
              const proposal = proposalsMap.get(interaction.lead_request_id)
              return {
                id: interaction.id,
                lead_request_id: interaction.lead_request_id,
                credits_spent: interaction.credits_spent || 0,
                accessed_at: interaction.accessed_at,
                lead: {
                  ...interaction.lead_requests,
                  offer_count: interaction.lead_requests.companies_accessed_count,
                  max_companies: interaction.lead_requests.max_companies || 3,
                  selected_company: interaction.lead_requests.selected_company,
                  lead_type: interaction.lead_requests.lead_type || "normal",
                },
                proposal_sent: !!proposal,
                offer_status: "accessed",
                proposal: proposal
                  ? {
                    id: proposal.id,
                    status: proposal.status,
                    proposed_budget: proposal.proposed_budget,
                    message: proposal.message,
                    created_at: proposal.created_at,
                  }
                  : null,
              }
            })

          console.log("[v0] Leads adquiridos procesados:", acquired.length)
          setAcquiredLeads(acquired)
        }
      } catch (apiError) {
        console.error("[v0] Error calling my-interactions API:", apiError)
      }

      setLoadingAcquired(false)
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
      setLoading(false)
      setLoadingAcquired(false)
    }
  }

  const reloadAcquiredLeads = async () => {
    if (!userId) return

    try {
      const response = await fetch("/api/leads/my-interactions")
      const data = await response.json()

      if (data.interactions) {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        const { data: proposals } = await supabase
          .from("professional_proposals")
          .select("*")
          .eq("professional_id", userId)

        const proposalsMap = new Map((proposals || []).map((p: any) => [p.lead_request_id, p]))

        const acquired: AcquiredLead[] = data.interactions
          .filter((interaction: any) => interaction.lead_requests)
          .map((interaction: any) => {
            const proposal = proposalsMap.get(interaction.lead_request_id)
            return {
              id: interaction.id,
              lead_request_id: interaction.lead_request_id,
              credits_spent: interaction.credits_spent || 0,
              accessed_at: interaction.accessed_at,
              lead: {
                ...interaction.lead_requests,
                offer_count: interaction.lead_requests.companies_accessed_count || 0,
                max_companies: interaction.lead_requests.max_companies || 3,
                selected_company: interaction.lead_requests.selected_company,
              },
              proposal_sent: !!proposal,
              offer_status: "accessed",
              proposal: proposal
                ? {
                  id: proposal.id,
                  status: proposal.status,
                  proposed_budget: proposal.proposed_budget,
                  message: proposal.message,
                  created_at: proposal.created_at,
                }
                : null,
            }
          })

        setAcquiredLeads(acquired)
      }
    } catch (error) {
      console.error("[v0] Error reloading acquired leads:", error)
    }
  }

  const maskPhone = (phonePartial: string | null): string => {
    if (!phonePartial) return "xxx xx xx xx"
    return `${phonePartial} xx xx xx`
  }

  const getFirstName = (fullName: string | null): string => {
    if (!fullName) return "Propietario"
    return fullName.split(" ")[0]
  }

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `hace ${diffDays} día${diffDays > 1 ? "s" : ""}`
    if (diffHours > 0) return `hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`
    return "hace unos minutos"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const handleAccessClick = (lead: Lead) => {
    setSelectedLead(lead)
    setDialogOpen(true)
  }

  const handleAccessSuccess = async () => {
    // Recargar créditos a través de la API
    try {
      const response = await fetch("/api/credits/balance")
      if (response.ok) {
        const data = await response.json()
        setUserCredits(data.credits_balance || 0)
      }
    } catch (error) {
      console.error("[v0] Error reloading credits after access:", error)
    }

    // Recargar leads adquiridos
    await reloadAcquiredLeads()

    // Recargar leads disponibles (para actualizar contador)
    try {
      const response = await fetch("/api/leads/available")
      const data = await response.json()
      if (data.leads) {
        const formattedLeads = data.leads.map((lead: any) => ({
          id: lead.id,
          client_name: lead.client_name,
          client_name_partial: lead.client_name?.substring(0, 3) + "***",
          client_phone: lead.client_phone,
          client_phone_partial: lead.client_phone?.substring(0, 6) + "****",
          homeowner_id: lead.homeowner_id,
          city: lead.city,
          province: lead.province,
          reform_types: lead.reform_types || [],
          description: lead.description,
          estimated_budget: lead.estimated_budget,
          status: lead.status,
          created_at: lead.created_at,
          expires_at: lead.expires_at,
          companies_accessed_count: lead.companies_accessed_count || 0,
          max_companies: lead.max_companies || 3,
          selected_company: lead.selected_company,
          has_accessed: lead.has_accessed,
          source: "presmarket",
          budget_snapshot: lead.budget_snapshot || null,
        }))
        setLeads(formattedLeads)
      }
    } catch (error) {
      console.error("[v0] Error reloading available leads:", error)
    }

    // Cambiar a la pestaña de "Mis Leads"
    const params = new URLSearchParams(window.location.search)
    params.set("tab", "mis-leads")
    window.history.replaceState({}, "", `${window.location.pathname}?${params}`)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Ofertas</h1>
          <p className="text-muted-foreground mt-1">Gestiona las solicitudes disponibles y tus leads adquiridos</p>
        </div>

        {/* Tarjeta de créditos */}
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-white/20 rounded-full p-3">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm opacity-90">Tus créditos</p>
              <p className="text-2xl font-bold">{userCredits.toLocaleString()}</p>
            </div>
            <Link href="/dashboard/creditos">
              <Button variant="secondary" size="sm" className="ml-4">
                Comprar más
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="disponibles" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="disponibles" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Disponibles
            {leads.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {leads.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="mis-leads" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Mis Leads
            {acquiredLeads.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {acquiredLeads.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Ofertas Disponibles */}
        <TabsContent value="disponibles">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : leads.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay ofertas disponibles</h3>
                <p className="text-muted-foreground">
                  En este momento no hay solicitudes de presupuesto disponibles. Vuelve más tarde.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {leads.map((lead) => {
                const estimatedBudget = Number(lead.estimated_budget) || 0
                const creditResult = calculateCreditCost(estimatedBudget, userPlan)
                const creditCost = creditResult.credits || 0
                const category = creditResult.category || "Micro"
                const eurosCost = creditResult.euros || 0
                const companiesCount = Number(lead.companies_accessed_count) || 0
                const maxCompanies = Number(lead.max_companies) || 3
                const hasEnoughCredits = userCredits >= creditCost
                const isFull = companiesCount >= maxCompanies
                const leadStatus = getLeadStatus(lead) // obtener estado de la oferta
                const isPremiumLead = lead.lead_type === 'premium' ||
                  !!lead.budget_id ||
                  (lead.budget_snapshot?.line_items && lead.budget_snapshot.line_items.length > 0) ||
                  (lead.budget_snapshot?.lineItems && lead.budget_snapshot.lineItems.length > 0)

                return (
                  <Card key={lead.id} className={`overflow-hidden ${leadStatus ? "opacity-75" : ""}`}>
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row">
                        {/* Contenido principal */}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-semibold">
                                  Reforma en {lead.city || "Ciudad"}, {lead.province || "Provincia"}
                                </h3>
                                {isPremiumLead && (
                                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 flex items-center gap-1">
                                    <Crown className="h-3 w-3 fill-current" />
                                    PREMIUM
                                  </Badge>
                                )}
                                {leadStatus && <Badge className={leadStatus.color}>{leadStatus.label}</Badge>}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  {lead.client_name_partial || lead.client_name || "Propietario"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="h-4 w-4" />
                                  {lead.has_accessed ? lead.client_phone : maskPhone(lead.client_phone_partial)}
                                </span>
                              </div>
                            </div>
                            <Badge variant={isFull ? "secondary" : "outline"} className="text-sm">
                              {companiesCount} / {maxCompanies} empresas
                            </Badge>
                          </div>

                          <div className="bg-orange-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2 text-muted-foreground">
                                <FileText className="h-4 w-4 text-orange-500" />
                                Tipo de proyecto:
                              </span>
                              <span className="text-xl font-bold text-orange-600">
                                Reforma {category}
                              </span>
                            </div>
                          </div>

                          {lead.reform_types && lead.reform_types.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {lead.reform_types.map((type, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {lead.city || "Ciudad"}, {lead.province || "Provincia"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTimeAgo(lead.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Expira el {formatDate(lead.expires_at)}
                            </span>
                          </div>
                        </div>

                        {/* Panel lateral con coste de créditos */}
                        <div className="lg:w-72 bg-muted/30 p-6 flex flex-col justify-between border-t lg:border-t-0 lg:border-l">
                          <div>
                            <div className="text-center mb-4">
                              <p className="text-sm text-muted-foreground mb-1">Coste para acceder</p>
                              <div className="flex items-center justify-center gap-2">
                                <CreditCard className="h-5 w-5 text-orange-500" />
                                <span className="text-3xl font-bold text-orange-600">{creditCost}</span>
                                <span className="text-muted-foreground">créditos</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Reforma {category}
                              </p>
                              <p className="text-xs text-orange-600 font-medium mt-1">Plan {getPlanName(userPlan)}</p>
                            </div>

                            {!hasEnoughCredits && !leadStatus && (
                              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">
                                Te faltan {creditCost - userCredits} créditos
                              </div>
                            )}

                            {leadStatus && (
                              <div className="bg-gray-100 text-gray-600 text-sm p-3 rounded-lg mb-4 text-center">
                                {leadStatus.label === "ADJUDICADA"
                                  ? "Esta reforma ya ha sido adjudicada"
                                  : "Esta oferta ha expirado"}
                              </div>
                            )}

                            {!leadStatus && isFull && (
                              <div className="bg-gray-100 text-gray-600 text-sm p-3 rounded-lg mb-4 text-center">
                                Esta oferta ya tiene el máximo de empresas
                              </div>
                            )}
                          </div>

                          {lead.has_accessed ? (
                            <Link href={`/dashboard/professional/leads/${lead.id}`}>
                              <Button className="w-full bg-green-600 hover:bg-green-700">
                                {isPremiumLead ? "Ver detalles / Enviar propuesta" : "Ver datos de contacto"}
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              className="w-full bg-orange-500 hover:bg-orange-600"
                              disabled={!hasEnoughCredits || isFull || !!leadStatus}
                              onClick={() => handleAccessClick(lead)}
                            >
                              <Coins className="h-4 w-4 mr-2" />
                              Acceder por {creditCost} créditos
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab: Mis Leads Adquiridos */}
        <TabsContent value="mis-leads">
          {loadingAcquired ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : acquiredLeads.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No has adquirido ningún lead</h3>
                <p className="text-muted-foreground">
                  Los leads que adquieras aparecerán aquí para que puedas gestionarlos.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {acquiredLeads.map((acquired) => {
                const estimatedBudget = Number(acquired.lead.estimated_budget) || 0
                const companiesCount = Number(acquired.lead.offer_count) || 0
                const maxCompanies = Number(acquired.lead.max_companies) || 3
                const proposalStatus = acquired.proposal?.status
                const leadStatus = getLeadStatus(acquired.lead as any) // obtener estado de la oferta

                const getProposalBadge = () => {
                  if (!acquired.proposal_sent) return null

                  switch (proposalStatus) {
                    case "accepted":
                      return (
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                          ✓ Propuesta Aceptada
                        </Badge>
                      )
                    case "rejected":
                      return (
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/20">✗ Propuesta Rechazada</Badge>
                      )
                    case "pending":
                      return (
                        <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                          ⏳ Esperando Respuesta
                        </Badge>
                      )
                    default:
                      return null
                  }
                }

                return (
                  <Card key={acquired.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold">
                              Reforma en {acquired.lead.city}, {acquired.lead.province}
                            </h3>
                            {getProposalBadge()}
                            {(acquired.lead.lead_type === "premium" ||
                              (acquired.lead.budget_snapshot?.line_items?.length || 0) > 0 ||
                              (acquired.lead.budget_snapshot?.lineItems?.length || 0) > 0) && (
                                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 flex items-center gap-1">
                                  <Crown className="h-3 w-3 fill-current" />
                                  PREMIUM
                                </Badge>
                              )}
                            {leadStatus && (
                              <Badge variant="secondary" className={`ml-1 ${leadStatus.color}`}>
                                {leadStatus.label}
                              </Badge>
                            )}
                          </div>

                          {acquired.lead.project_description && (
                            <p className="text-sm text-muted-foreground mb-3">{acquired.lead.project_description}</p>
                          )}

                          {proposalStatus === "accepted" && (
                            <Alert className="bg-green-500/10 border-green-500/20 mb-4">
                              <CheckCircle2 className="h-4 w-4 text-green-400" />
                              <AlertDescription className="text-green-400">
                                ¡Felicidades! El cliente aceptó tu propuesta. Hemos creado el proyecto en tu dashboard.
                              </AlertDescription>
                            </Alert>
                          )}

                          {proposalStatus === "rejected" && (
                            <Alert className="bg-red-500/10 border-red-500/20 mb-4">
                              <XCircle className="h-4 w-4 text-red-400" />
                              <AlertDescription className="text-red-400">
                                El cliente decidió no continuar con tu propuesta. Sigue buscando nuevas oportunidades.
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Categoría</p>
                              <p className="font-semibold">{calculateCreditCost(Number(acquired.lead.estimated_budget), userPlan).category}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Empresas</p>
                              <p className="font-semibold">
                                {companiesCount} / {maxCompanies}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Cliente</p>
                              <p className="font-semibold">{acquired.lead.client_name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Teléfono</p>
                              <p className="font-semibold">{acquired.lead.client_phone}</p>
                            </div>
                          </div>

                          {acquired.proposal && (
                            <div className="bg-muted/50 p-4 rounded-lg mb-4">
                              <h4 className="font-semibold mb-2">Tu Propuesta</h4>
                              <p className="text-lg font-bold text-primary">
                                {acquired.proposal.proposed_budget?.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true })} € (sin IVA)
                              </p>
                              {acquired.proposal.message && (
                                <p className="text-sm text-muted-foreground mt-2">{acquired.proposal.message}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                Enviada el {formatDate(acquired.proposal.created_at)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button asChild variant="outline" className="flex-1 bg-transparent">
                          <Link href={`/dashboard/professional/leads/${acquired.lead_request_id}`}>Ver Detalles</Link>
                        </Button>
                        <Button asChild className="flex-1">
                          <Link href={`tel:${acquired.lead.client_phone}`}>
                            <Phone className="h-4 w-4 mr-2" />
                            Llamar
                          </Link>
                        </Button>
                        <Button asChild className="flex-1">
                          <Link href={`mailto:${acquired.lead.client_email}`}>
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedLead && (
        <AccessOfferDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          offer={{
            id: selectedLead.id,
            reform_type: selectedLead.reform_types?.join(", ") || "Reforma",
            city: selectedLead.city,
            province: selectedLead.province,
            estimated_budget: selectedLead.estimated_budget,
            credits_cost: calculateCreditCost(selectedLead.estimated_budget, userPlan).credits,
            category: calculateCreditCost(selectedLead.estimated_budget, userPlan).category,
            description: selectedLead.description,
          }}
          userCredits={userCredits}
          onSuccess={handleAccessSuccess}
        />
      )}
    </div>
  )
}
