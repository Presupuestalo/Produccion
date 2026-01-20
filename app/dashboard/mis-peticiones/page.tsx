"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/client"
import {
  Clock,
  MapPin,
  DollarSign,
  Users,
  AlertCircle,
  Megaphone,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { toast } from "sonner"

interface ProfessionalProposal {
  id: string
  professional_id: string
  proposed_budget: number | null
  message: string | null
  status: string
  created_at: string
  profiles: {
    full_name: string
    company_name: string | null
    email: string
    phone: string | null
    specialty: string | null
    years_experience: number | null
  }
}

interface LeadRequest {
  id: string
  project_id: string
  status: string
  estimated_budget: number
  credits_cost: number
  city: string
  province: string
  companies_accessed_count: number
  max_companies: number
  created_at: string
  expires_at: string
  project_description: string
  proposals: ProfessionalProposal[]
}

export default function MisPeticionesPage() {
  const [leadRequests, setLeadRequests] = useState<LeadRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProposals, setSelectedProposals] = useState<ProfessionalProposal[]>([])
  const [proposalsDialogOpen, setProposalsDialogOpen] = useState(false)

  useEffect(() => {
    loadLeadRequests()
  }, [])

  const loadLeadRequests = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log("[v0] Mis Peticiones - Usuario:", user?.id)

      if (!user) {
        setError("No autenticado")
        return
      }

      // Primero obtenemos los lead_requests
      const { data: leadData, error: leadError } = await supabase
        .from("lead_requests")
        .select("*")
        .eq("homeowner_id", user.id)
        .order("created_at", { ascending: false })

      if (leadError) {
        console.error("[v0] Error cargando lead_requests:", leadError)
        throw leadError
      }

      // Ahora obtenemos las propuestas para cada lead
      const enrichedData = await Promise.all(
        (leadData || []).map(async (request: any) => {
          const { data: proposals, error: proposalsError } = await supabase
            .from("professional_proposals")
            .select("id, professional_id, proposed_budget, message, status, created_at")
            .eq("lead_request_id", request.id)

          if (proposalsError) {
            console.error("[v0] Error cargando propuestas:", proposalsError)
            return { ...request, proposals: [] }
          }

          // Obtener perfiles de los profesionales
          const proposalsWithProfiles = await Promise.all(
            (proposals || []).map(async (proposal: any) => {
              const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, company_name, email, phone, specialty, years_experience")
                .eq("id", proposal.professional_id)
                .single()

              return {
                ...proposal,
                profiles: profile || {
                  full_name: "Profesional",
                  company_name: null,
                  email: null,
                  phone: null,
                  specialty: null,
                  years_experience: null,
                },
              }
            }),
          )

          return {
            ...request,
            proposals: proposalsWithProfiles,
          }
        }),
      )

      console.log("[v0] Mis Peticiones - Solicitudes cargadas:", enrichedData.length)
      setLeadRequests(enrichedData)
    } catch (err: any) {
      console.error("[v0] Mis Peticiones - Error cargando peticiones:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleProposalAction = async (proposalId: string, action: "accepted" | "rejected") => {
    console.log("[v0] handleProposalAction iniciada - proposalId:", proposalId, "action:", action)

    try {
      console.log("[v0] Mostrando toast loading...")
      toast.loading(action === "accepted" ? "Aceptando propuesta..." : "Rechazando propuesta...")

      console.log("[v0] Haciendo fetch a /api/proposals/update-status...")
      const response = await fetch("/api/proposals/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, action }),
      })

      console.log("[v0] Respuesta recibida - status:", response.status)
      toast.dismiss()

      const data = await response.json()
      console.log("[v0] Data del response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar propuesta")
      }

      console.log("[v0] Propuesta actualizada correctamente")
      toast.success(
        action === "accepted"
          ? "¡Propuesta aceptada! El profesional ha sido notificado y ya tiene el proyecto en su dashboard."
          : "Propuesta rechazada. El profesional ha sido notificado.",
      )
      loadLeadRequests()
    } catch (error: any) {
      console.error("[v0] ERROR en handleProposalAction:", error)
      toast.dismiss()
      toast.error(error.message || "Error al actualizar la propuesta")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500">Activo</Badge>
      case "closed":
        return <Badge variant="secondary">Cerrado</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getProposalStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Pendiente</Badge>
      case "accepted":
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Aceptada</Badge>
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Rechazada</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div>
          <h1 className="text-3xl font-bold">Mis Peticiones</h1>
          <p className="text-muted-foreground">Proyectos publicados en el Presmarket</p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Peticiones</h1>
        <p className="text-muted-foreground">Proyectos publicados en el Presmarket</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {leadRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No has publicado ningún proyecto</h3>
            <p className="text-muted-foreground text-center mb-4">
              Publica tus proyectos en el Presmarket para recibir presupuestos de empresas profesionales
            </p>
            <Button asChild>
              <Link href="/dashboard/projects">Ver mis proyectos</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {leadRequests.map((request) => {
            const isActive = request.status === "open"
            const proposalCount = request.proposals?.length || 0

            return (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">Proyecto #{request.project_id.slice(0, 8)}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4" />
                        {request.city}, {request.province}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(request.status)}
                      {proposalCount > 0 && (
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                          {proposalCount} {proposalCount === 1 ? "propuesta" : "propuestas"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {request.project_description && (
                    <p className="text-sm text-muted-foreground">{request.project_description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Presupuesto</p>
                        <p className="font-semibold">{request.estimated_budget.toLocaleString()}€</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Empresas</p>
                        <p className="font-semibold">
                          {request.companies_accessed_count} / {request.max_companies}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Publicado</p>
                        <p className="font-semibold text-xs">
                          {formatDistanceToNow(new Date(request.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isActive && request.companies_accessed_count < request.max_companies && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Tu proyecto está activo. Las empresas pueden verlo y contactarte.
                      </AlertDescription>
                    </Alert>
                  )}

                  {request.companies_accessed_count >= request.max_companies && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Has recibido {request.max_companies} presupuestos. El proyecto ya no acepta más empresas.
                      </AlertDescription>
                    </Alert>
                  )}

                  {proposalCount > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          Propuestas Recibidas ({proposalCount})
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {request.proposals.slice(0, 2).map((proposal) => (
                          <Card key={proposal.id} className="bg-muted/50">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold">
                                    {proposal.profiles.company_name || proposal.profiles.full_name}
                                  </span>
                                </div>
                                {getProposalStatusBadge(proposal.status)}
                              </div>

                              {proposal.proposed_budget && (
                                <p className="text-2xl font-bold text-green-600 mb-2">
                                  {proposal.proposed_budget.toLocaleString()}€
                                </p>
                              )}

                              {proposal.message && (
                                <p className="text-sm text-muted-foreground mb-3">{proposal.message}</p>
                              )}

                              <div className="bg-background/50 rounded-lg p-3 mb-3 space-y-2">
                                {proposal.profiles.specialty && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <Badge variant="secondary" className="text-xs">
                                      {proposal.profiles.specialty}
                                    </Badge>
                                    {proposal.profiles.years_experience && (
                                      <span className="text-muted-foreground">
                                        {proposal.profiles.years_experience} años de experiencia
                                      </span>
                                    )}
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  {proposal.profiles.email && (
                                    <a
                                      href={`mailto:${proposal.profiles.email}`}
                                      className="flex items-center gap-1 hover:text-primary"
                                    >
                                      <Mail className="h-3 w-3" />
                                      <span>{proposal.profiles.email}</span>
                                    </a>
                                  )}
                                  {proposal.profiles.phone && (
                                    <a
                                      href={`tel:${proposal.profiles.phone}`}
                                      className="flex items-center gap-1 hover:text-primary"
                                    >
                                      <Phone className="h-3 w-3" />
                                      <span>{proposal.profiles.phone}</span>
                                    </a>
                                  )}
                                </div>
                              </div>

                              {proposal.status === "pending" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleProposalAction(proposal.id, "rejected")}
                                    className="flex-1"
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Rechazar
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleProposalAction(proposal.id, "accepted")}
                                    className="flex-1"
                                  >
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Aceptar
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}

                        {proposalCount > 2 && (
                          <Button
                            variant="outline"
                            className="w-full bg-transparent"
                            onClick={() => {
                              setSelectedProposals(request.proposals)
                              setProposalsDialogOpen(true)
                            }}
                          >
                            Ver todas las propuestas ({proposalCount})
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={proposalsDialogOpen} onOpenChange={setProposalsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Todas las Propuestas</DialogTitle>
            <DialogDescription>Revisa todas las propuestas recibidas para este proyecto</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {selectedProposals.map((proposal) => (
              <Card key={proposal.id} className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {proposal.profiles.company_name || proposal.profiles.full_name}
                      </span>
                    </div>
                    {getProposalStatusBadge(proposal.status)}
                  </div>

                  {proposal.proposed_budget && (
                    <p className="text-2xl font-bold text-green-600 mb-2">
                      {proposal.proposed_budget.toLocaleString()}€
                    </p>
                  )}

                  {proposal.message && <p className="text-sm text-muted-foreground mb-3">{proposal.message}</p>}

                  <div className="bg-background/50 rounded-lg p-3 mb-3 space-y-2">
                    {proposal.profiles.specialty && (
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary" className="text-xs">
                          {proposal.profiles.specialty}
                        </Badge>
                        {proposal.profiles.years_experience && (
                          <span className="text-muted-foreground">
                            {proposal.profiles.years_experience} años de experiencia
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {proposal.profiles.email && (
                        <a
                          href={`mailto:${proposal.profiles.email}`}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <Mail className="h-3 w-3" />
                          <span>{proposal.profiles.email}</span>
                        </a>
                      )}
                      {proposal.profiles.phone && (
                        <a
                          href={`tel:${proposal.profiles.phone}`}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{proposal.profiles.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {proposal.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleProposalAction(proposal.id, "rejected")
                          setProposalsDialogOpen(false)
                        }}
                        className="flex-1"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Rechazar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          handleProposalAction(proposal.id, "accepted")
                          setProposalsDialogOpen(false)
                        }}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Aceptar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
