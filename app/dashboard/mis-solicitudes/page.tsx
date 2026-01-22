"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FileText,
  MapPin,
  Home,
  Calendar,
  Phone,
  Mail,
  Sparkles,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Euro,
  Users,
  Eye,
  Star,
  Send,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface ProfessionalProposal {
  id: string
  professional_id: string
  proposed_budget: number
  message: string | null
  status: string
  created_at: string
  professional_name: string | null
  company_name: string | null
  professional_phone: string | null
  professional_email: string | null
}

interface QuoteOffer {
  id: string
  offered_price: number
  currency_symbol: string
  estimated_duration: string
  description: string
  includes: string | null
  excludes: string | null
  company_name: string | null
  professional_phone: string
  professional_email: string
  status: string
  viewed_by_client: boolean
  created_at: string
}

interface QuoteRequest {
  id: string
  square_meters: string
  rooms: string
  bathrooms: string
  country: string
  city: string
  heating_type: string
  features: string | null
  available_budget: string | null
  reform_type: string
  phone: string
  email: string
  description: string
  price_range: string
  currency_code: string
  currency_symbol: string
  ai_explanation: string | null
  status: string
  created_at: string
  offers?: QuoteOffer[]
}

interface LeadRequest {
  id: string
  status: string
  estimated_budget: number
  credits_cost: number
  reform_types: string[]
  project_description: string
  surface_m2: number | null
  city: string
  province: string
  country_code: string
  client_name: string
  client_email: string
  client_phone: string
  max_companies: number
  companies_accessed_count: number
  companies_accessed_ids: string[] | null
  created_at: string
  expires_at: string
  budget_snapshot: any | null // Añadido para detectar PREMIUM
  companies_accessed?: CompanyAccess[]
  proposals?: ProfessionalProposal[] // Añadido propuestas
}

interface CompanyAccess {
  id: string
  company_name: string | null
  full_name: string | null // Añadido nombre completo
  phone: string | null
  email: string | null
  accessed_at: string
  has_proposal: boolean // Añadido si tiene propuesta
  proposal?: ProfessionalProposal | null // Añadido propuesta
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  open: { label: "Abierta", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  contacted: { label: "Contactado", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  quoted: { label: "Presupuestado", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  completed: { label: "Completado", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  cancelled: { label: "Cancelado", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  expired: { label: "Expirada", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
}

const REFORM_TYPE_LABELS: Record<string, string> = {
  baño: "Reforma de Baño",
  cocina: "Reforma de Cocina",
  integral: "Reforma Integral",
  "semi-integral": "Reforma Semi-integral",
  reforma_integral: "Reforma Integral",
}

const OFFER_STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendiente", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: Clock },
  accepted: { label: "Aceptada", color: "bg-green-500/10 text-green-400 border-green-500/20", icon: CheckCircle2 },
  rejected: { label: "Rechazada", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle },
}

export default function MisSolicitudesPage() {
  const [requests, setRequests] = useState<QuoteRequest[]>([])
  const [leadRequests, setLeadRequests] = useState<LeadRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    const supabase = await createClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[v0] MisSolicitudes - No user found")
      setLoading(false)
      return
    }

    console.log("[v0] MisSolicitudes - Fetching for user:", user.id)

    const [quoteResult, leadResult] = await Promise.all([
      supabase.from("quote_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase
        .from("lead_requests")
        .select("*")
        .eq("homeowner_id", user.id)
        .order("created_at", { ascending: false }),
    ])

    if (quoteResult.error) {
      console.error("Error fetching quote_requests:", quoteResult.error)
    } else {
      console.log("[v0] MisSolicitudes - quote_requests found:", quoteResult.data?.length || 0)
    }

    if (leadResult.error) {
      console.error("Error fetching lead_requests:", leadResult.error)
    } else {
      console.log("[v0] MisSolicitudes - lead_requests found:", leadResult.data?.length || 0)
    }

    const leadsWithCompaniesAndProposals = await Promise.all(
      (leadResult.data || []).map(async (lead: any) => {
        // Cargar propuestas del lead
        const { data: proposalsData } = await supabase
          .from("professional_proposals")
          .select("*")
          .eq("lead_request_id", lead.id)
          .order("created_at", { ascending: false })

        // Obtener perfiles de profesionales que enviaron propuestas
        const proposalsWithProfiles: ProfessionalProposal[] = await Promise.all(
          (proposalsData || []).map(async (proposal: any) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, company_name, phone, email")
              .eq("id", proposal.professional_id)
              .single()

            return {
              ...proposal,
              professional_name: profile?.full_name || null,
              company_name: profile?.company_name || null,
              professional_phone: profile?.phone || null,
              professional_email: profile?.email || null,
            }
          }),
        )

        let companiesAccessed: CompanyAccess[] = []

        if (lead.companies_accessed_ids && lead.companies_accessed_ids.length > 0) {
          const { data: companiesData } = await supabase
            .from("profiles")
            .select("id, company_name, full_name, phone, email")
            .in("id", lead.companies_accessed_ids)

          const { data: interactionsData } = await supabase
            .from("lead_interactions")
            .select("company_id, accessed_at")
            .eq("lead_request_id", lead.id)
            .eq("action", "accessed")

          companiesAccessed = (companiesData || []).map((company: any) => {
            const interaction = (interactionsData || []).find((i: any) => i.company_id === company.id)
            const proposal = proposalsWithProfiles.find((p) => p.professional_id === company.id)
            return {
              id: company.id,
              company_name: company.company_name,
              full_name: company.full_name,
              phone: company.phone,
              email: company.email,
              accessed_at: interaction?.accessed_at || lead.created_at,
              has_proposal: !!proposal,
              proposal: proposal || null,
            }
          })
        }

        return {
          ...lead,
          companies_accessed: companiesAccessed,
          proposals: proposalsWithProfiles,
        }
      }),
    )

    // Procesar quote_requests con ofertas
    const requestsWithOffers = await Promise.all(
      (quoteResult.data || []).map(async (request: any) => {
        const { data: offersData } = await supabase
          .from("quote_offers")
          .select("*")
          .eq("quote_request_id", request.id)
          .order("created_at", { ascending: false })

        if (offersData && offersData.length > 0) {
          const unviewedOffers = offersData.filter((offer: any) => !offer.viewed_by_client)
          if (unviewedOffers.length > 0) {
            await supabase
              .from("quote_offers")
              .update({ viewed_by_client: true, viewed_at: new Date().toISOString() })
              .in(
                "id",
                unviewedOffers.map((o: any) => o.id),
              )
          }
        }

        return { ...request, offers: offersData || [] }
      }),
    )

    setRequests(requestsWithOffers)
    setLeadRequests(leadsWithCompaniesAndProposals)
    setLoading(false)
  }

  useEffect(() => {
    fetchRequests()
  }, [])


  const handleProposalAction = async (proposalId: string, action: "accepted" | "rejected") => {
    try {
      const response = await fetch("/api/proposals/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ proposalId, action }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || "Error al actualizar la propuesta")
        return
      }

      if (action === "accepted") {
        toast.success("¡Propuesta aceptada! El profesional ha sido notificado y ya tiene el proyecto asignado.")
      } else {
        toast.success("Propuesta rechazada. El profesional ha sido notificado.")
      }

      fetchRequests()
    } catch (error) {
      console.error("[v0] Error updating proposal:", error)
      toast.error("Error al actualizar la propuesta")
    }
  }

  const handleOfferAction = async (offerId: string, action: "accepted" | "rejected") => {
    const supabase = await createClient()
    if (!supabase) return

    const { error } = await supabase.from("quote_offers").update({ status: action }).eq("id", offerId)

    if (error) {
      toast.error("Error al actualizar la oferta")
      return
    }

    toast.success(action === "accepted" ? "Oferta aceptada" : "Oferta rechazada")
    fetchRequests()
  }

  const isPremiumLead = (lead: LeadRequest) => {
    return lead.budget_snapshot?.line_items && lead.budget_snapshot.line_items.length > 0
  }

  const getCompanyDisplayName = (company: CompanyAccess) => {
    if (company.company_name && company.company_name.trim()) {
      return company.company_name
    }
    if (company.full_name && company.full_name.trim()) {
      return company.full_name
    }
    return "Profesional"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-orange-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando solicitudes...</p>
        </div>
      </div>
    )
  }

  const hasNoRequests = requests.length === 0 && leadRequests.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-6">
            <FileText className="h-4 w-4 text-orange-400" />
            <span className="text-sm text-orange-400 font-medium">Mis Solicitudes</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Solicitudes de Presupuesto</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Aquí puedes ver todas tus solicitudes de presupuesto y las empresas que han accedido a tus datos
          </p>
        </div>

        {hasNoRequests ? (
          <Card className="bg-gray-800/50 border-gray-700 p-12">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No tienes solicitudes</h3>
              <p className="text-gray-500">Cuando solicites presupuestos desde la estimación rápida, aparecerán aquí</p>
            </div>
          </Card>
        ) : (
          <div className="max-w-5xl mx-auto space-y-6">
            {leadRequests.map((lead) => (
              <Card key={lead.id} className="bg-gray-800/50 border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {lead.reform_types?.map((t) => REFORM_TYPE_LABELS[t] || t).join(", ") || "Reforma"}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Calendar className="h-4 w-4" />
                      {new Date(lead.created_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Badge className={STATUS_LABELS[lead.status]?.color || "bg-gray-500/10 text-gray-400"}>
                      {STATUS_LABELS[lead.status]?.label || lead.status}
                    </Badge>
                    {isPremiumLead(lead) && (
                      <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                        <Star className="h-3 w-3 mr-1 fill-yellow-400" />
                        PREMIUM
                      </Badge>
                    )}
                    <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">Presmarket</Badge>
                    {lead.proposals && lead.proposals.length > 0 && (
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                        <Send className="h-3 w-3 mr-1" />
                        {lead.proposals.length} propuesta{lead.proposals.length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="h-4 w-4 text-orange-400 flex-shrink-0" />
                      <span className="text-sm md:text-base">
                        {lead.city}
                        {lead.province ? `, ${lead.province}` : ""}
                      </span>
                    </div>
                    {lead.surface_m2 && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Home className="h-4 w-4 text-orange-400 flex-shrink-0" />
                        <span className="text-sm md:text-base">{lead.surface_m2} m²</span>
                      </div>
                    )}
                    <div className="hidden md:flex items-center gap-2 text-gray-300">
                      <Phone className="h-4 w-4 text-orange-400" />
                      <span>{lead.client_phone}</span>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-gray-300">
                      <Mail className="h-4 w-4 text-orange-400" />
                      <span className="text-sm break-all">{lead.client_email}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 md:p-4">
                      <p className="text-xs md:text-sm text-gray-400 mb-1">Presupuesto Estimado</p>
                      <p className="text-xl md:text-2xl font-bold text-green-400 flex items-center gap-1">
                        <Euro className="h-4 w-4 md:h-5 md:w-5" />
                        {lead.estimated_budget?.toLocaleString("es-ES")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-xs md:text-sm">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>Expira: {new Date(lead.expires_at).toLocaleDateString("es-ES")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-xs md:text-sm">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {lead.companies_accessed_count || 0} de {lead.max_companies} empresas han accedido
                      </span>
                    </div>
                  </div>
                </div>

                {lead.project_description && (
                  <div className="hidden md:block bg-gray-900/50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-gray-400 mb-2">Descripción del Proyecto</p>
                    <p className="text-gray-300 text-sm whitespace-pre-line">{lead.project_description}</p>
                  </div>
                )}

                {lead.proposals && lead.proposals.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                      <Send className="h-5 w-5 text-green-400" />
                      <h4 className="text-lg font-bold text-white">Propuestas Recibidas ({lead.proposals.length})</h4>
                    </div>
                    <div className="grid gap-3">
                      {lead.proposals.map((proposal) => (
                        <Card key={proposal.id} className="bg-green-900/20 border-green-700/50 p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-green-400" />
                                <span className="font-semibold text-white">
                                  {proposal.company_name || proposal.professional_name || "Profesional"}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                {proposal.professional_phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <a href={`tel:${proposal.professional_phone}`} className="hover:text-green-400">
                                      {proposal.professional_phone}
                                    </a>
                                  </div>
                                )}
                                {proposal.professional_email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    <a href={`mailto:${proposal.professional_email}`} className="hover:text-green-400">
                                      {proposal.professional_email}
                                    </a>
                                  </div>
                                )}
                              </div>
                              {proposal.message && <p className="text-sm text-gray-300 mt-2">{proposal.message}</p>}
                            </div>
                            <div className="text-right ml-4">
                              <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2 mb-2">
                                <p className="text-xs text-gray-400">Presupuesto</p>
                                <p className="text-xl font-bold text-green-400">
                                  {proposal.proposed_budget?.toLocaleString("es-ES")} €
                                </p>
                                <p className="text-xs text-gray-500">
                                  +IVA:{" "}
                                  {((proposal.proposed_budget || 0) * 1.21).toLocaleString("es-ES", {
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  €
                                </p>
                              </div>
                              <Badge className={OFFER_STATUS_LABELS[proposal.status]?.color || "bg-gray-500/10"}>
                                {OFFER_STATUS_LABELS[proposal.status]?.label || proposal.status}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(proposal.created_at).toLocaleDateString("es-ES", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              {proposal.status === "pending" && (
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                                    onClick={() => handleProposalAction(proposal.id, "accepted")}
                                  >
                                    <ThumbsUp className="h-3 w-3 mr-1" />
                                    Aceptar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                    onClick={() => handleProposalAction(proposal.id, "rejected")}
                                  >
                                    <ThumbsDown className="h-3 w-3 mr-1" />
                                    Rechazar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {lead.companies_accessed && lead.companies_accessed.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                      <Eye className="h-5 w-5 text-blue-400" />
                      <h4 className="text-base md:text-lg font-bold text-white">
                        Empresas que han accedido ({lead.companies_accessed.length})
                      </h4>
                    </div>
                    <div className="grid gap-3">
                      {lead.companies_accessed.map((company) => (
                        <Card key={company.id} className="bg-gray-900/50 border-gray-600 p-3 md:p-4">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-orange-400 flex-shrink-0" />
                                <span className="font-semibold text-white text-sm md:text-base">
                                  {getCompanyDisplayName(company)}
                                </span>
                                {company.has_proposal && (
                                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                                    <Send className="h-3 w-3 mr-1" />
                                    <span className="hidden md:inline">Propuesta enviada</span>
                                    <span className="md:hidden">Propuesta</span>
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-400">
                                {company.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 flex-shrink-0" />
                                    <a href={`tel:${company.phone}`} className="hover:text-orange-400">
                                      {company.phone}
                                    </a>
                                  </div>
                                )}
                                {company.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3 flex-shrink-0" />
                                    <a href={`mailto:${company.email}`} className="hover:text-orange-400 break-all">
                                      {company.email}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-2">
                              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                Accedió
                              </Badge>
                              <p className="text-xs text-gray-500">
                                {new Date(company.accessed_at).toLocaleDateString("es-ES", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    <p className="hidden md:block text-xs text-gray-500 mt-3">
                      Estas empresas pueden contactarte para ofrecerte presupuesto. Puedes contactarles directamente si
                      lo deseas.
                    </p>
                  </div>
                )}
              </Card>
            ))}

            {/* El resto del código para quote_requests se mantiene igual */}
            {requests.map((request) => (
              <Card key={request.id} className="bg-gray-800/50 border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {REFORM_TYPE_LABELS[request.reform_type] || request.reform_type}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Calendar className="h-4 w-4" />
                      {new Date(request.created_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_LABELS[request.status]?.color || ""}>
                      {STATUS_LABELS[request.status]?.label || request.status}
                    </Badge>
                    {request.offers && request.offers.length > 0 && (
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                        {request.offers.length} {request.offers.length === 1 ? "oferta" : "ofertas"}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="h-4 w-4 text-orange-400 flex-shrink-0" />
                      <span>
                        {request.city}, {request.country}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Home className="h-4 w-4 text-orange-400 flex-shrink-0" />
                      <span>
                        {request.square_meters}m² • {request.rooms} hab. • {request.bathrooms} baños
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Phone className="h-4 w-4 text-orange-400" />
                      <span>{request.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Mail className="h-4 w-4 text-orange-400" />
                      <span>{request.email}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Rango de Precio Estimado</p>
                      <p className="text-2xl font-bold text-green-400">{request.price_range}</p>
                    </div>
                    {request.available_budget && (
                      <div className="text-sm text-gray-400">Presupuesto disponible: {request.available_budget}</div>
                    )}
                  </div>
                </div>

                {request.description && (
                  <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-gray-400 mb-2">Descripción</p>
                    <p className="text-gray-300 text-sm">{request.description}</p>
                  </div>
                )}

                {request.offers && request.offers.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <h4 className="text-lg font-bold text-white mb-4">Ofertas Recibidas</h4>
                    <div className="grid gap-4">
                      {request.offers.map((offer) => (
                        <Card key={offer.id} className="bg-gray-900/50 border-gray-600 p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="h-4 w-4 text-orange-400" />
                                <span className="font-semibold text-white">{offer.company_name || "Empresa"}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-400">
                                <span>{offer.professional_phone}</span>
                                <span>{offer.professional_email}</span>
                              </div>
                            </div>
                            <Badge className={OFFER_STATUS_LABELS[offer.status]?.color || ""}>
                              {OFFER_STATUS_LABELS[offer.status]?.label || offer.status}
                            </Badge>
                          </div>
                          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-3">
                            <p className="text-2xl font-bold text-green-400">
                              {offer.currency_symbol}
                              {offer.offered_price.toLocaleString("es-ES")}
                            </p>
                            <p className="text-sm text-gray-400">Duración estimada: {offer.estimated_duration}</p>
                          </div>
                          {offer.description && <p className="text-sm text-gray-300 mb-3">{offer.description}</p>}
                          {offer.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleOfferAction(offer.id, "accepted")}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Aceptar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
                                onClick={() => handleOfferAction(offer.id, "rejected")}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
