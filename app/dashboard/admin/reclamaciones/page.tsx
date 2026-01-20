"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  User,
  Building2,
  Calendar,
  CreditCard,
  AlertCircle,
  FileText,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import Link from "next/link"

interface Claim {
  id: string
  quote_offer_id: string
  professional_id: string
  reason: string
  details: {
    call_attempts?: number
    call_dates?: string
    whatsapp_sent?: boolean
    email_sent?: boolean
    comments?: string
  }
  status: "pending" | "approved" | "rejected"
  credits_to_refund: number
  admin_notes: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  // Datos del profesional
  professional: {
    full_name: string
    email: string
    company_name?: string
  }
  // Datos del lead/oferta
  quote_offer: {
    id: string
    credits_cost: number
    accessed_at: string
    lead_request: {
      id: string
      work_type: string
      description: string
      city: string
      owner: {
        full_name: string
        email: string
        phone: string
      }
    }
  }
  // Otros profesionales que accedieron al mismo lead
  other_professionals_contacted: number
}

interface ClaimStats {
  total_pending: number
  total_approved: number
  total_rejected: number
  credits_refunded_total: number
}

const CLAIM_REASONS: Record<string, string> = {
  phone_off: "Teléfono apagado/fuera de servicio",
  no_answer: "No contesta tras múltiples intentos",
  wrong_number: "Número incorrecto/no existe",
  email_bounced: "Email rebotado",
  already_hired: "El propietario ya contrató a otro",
  fake_data: "Datos falsos/spam",
  other: "Otro motivo",
}

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [stats, setStats] = useState<ClaimStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolveAction, setResolveAction] = useState<"approve" | "reject">("approve")
  const [adminNotes, setAdminNotes] = useState("")
  const [resolving, setResolving] = useState(false)
  const { toast } = useToast()
  const supabase = createBrowserClient()

  useEffect(() => {
    loadClaims()
  }, [activeTab])

  const loadClaims = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/claims?status=${activeTab}`)
      if (!response.ok) throw new Error("Error cargando reclamaciones")

      const data = await response.json()
      setClaims(data.claims || [])
      setStats(data.stats || null)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las reclamaciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openResolveDialog = (claim: Claim, action: "approve" | "reject") => {
    setSelectedClaim(claim)
    setResolveAction(action)
    setAdminNotes("")
    setResolveDialogOpen(true)
  }

  const handleResolveClaim = async () => {
    if (!selectedClaim) return

    setResolving(true)
    try {
      const response = await fetch(`/api/leads/claims/${selectedClaim.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: resolveAction,
          adminNotes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error resolviendo reclamación")
      }

      toast({
        title: resolveAction === "approve" ? "Reclamación aprobada" : "Reclamación rechazada",
        description:
          resolveAction === "approve"
            ? `Se han devuelto ${selectedClaim.credits_to_refund} créditos al profesional`
            : "La reclamación ha sido rechazada",
      })

      setResolveDialogOpen(false)
      loadClaims()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo resolver la reclamación",
        variant: "destructive",
      })
    } finally {
      setResolving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" /> Pendiente
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" /> Aprobada
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" /> Rechazada
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver al panel de admin
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Reclamaciones</h1>
            <p className="text-muted-foreground">Revisa y resuelve las reclamaciones de profesionales del Presmarket</p>
          </div>
          <Button variant="outline" onClick={loadClaims} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_rejected}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Créditos devueltos</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.credits_refunded_total}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pendientes
            {stats && stats.total_pending > 0 && (
              <Badge variant="destructive" className="ml-1">
                {stats.total_pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Aprobadas
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="w-4 h-4" />
            Rechazadas
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <FileText className="w-4 h-4" />
            Todas
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : claims.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No hay reclamaciones{" "}
                  {activeTab === "pending"
                    ? "pendientes"
                    : `${activeTab === "approved" ? "aprobadas" : activeTab === "rejected" ? "rechazadas" : ""}`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => (
                <Card key={claim.id} className={claim.status === "pending" ? "border-yellow-200" : ""}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                      {/* Info del profesional */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {claim.professional?.company_name || claim.professional?.full_name}
                              </span>
                              {getStatusBadge(claim.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{claim.professional?.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Créditos a devolver</p>
                            <p className="text-xl font-bold text-primary">{claim.credits_to_refund}</p>
                          </div>
                        </div>

                        {/* Info del lead */}
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">Lead: {claim.quote_offer?.lead_request?.work_type}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Propietario:</span>{" "}
                              {claim.quote_offer?.lead_request?.owner?.full_name}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Ciudad:</span>{" "}
                              {claim.quote_offer?.lead_request?.city}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Teléfono:</span>{" "}
                              {claim.quote_offer?.lead_request?.owner?.phone}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Email:</span>{" "}
                              {claim.quote_offer?.lead_request?.owner?.email}
                            </div>
                          </div>
                        </div>

                        {/* Motivo y detalles */}
                        <div>
                          <p className="font-medium mb-2">Motivo de reclamación</p>
                          <Badge variant="outline" className="mb-2">
                            {CLAIM_REASONS[claim.reason] || claim.reason}
                          </Badge>

                          {claim.details && (
                            <div className="flex flex-wrap gap-4 mt-3 text-sm">
                              {claim.details.call_attempts && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-4 h-4 text-muted-foreground" />
                                  <span>{claim.details.call_attempts} llamadas</span>
                                </div>
                              )}
                              {claim.details.whatsapp_sent && (
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="w-4 h-4 text-green-600" />
                                  <span>WhatsApp enviado</span>
                                </div>
                              )}
                              {claim.details.email_sent && (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-4 h-4 text-blue-600" />
                                  <span>Email enviado</span>
                                </div>
                              )}
                            </div>
                          )}

                          {claim.details?.comments && (
                            <p className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                              "{claim.details.comments}"
                            </p>
                          )}
                        </div>

                        {/* Alertas */}
                        {claim.other_professionals_contacted > 0 && (
                          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm">
                              {claim.other_professionals_contacted} profesional(es) marcaron este lead como "contactado"
                            </span>
                          </div>
                        )}

                        {/* Notas del admin si ya está resuelta */}
                        {claim.admin_notes && (
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-medium mb-1">Notas del administrador:</p>
                            <p className="text-sm text-muted-foreground">{claim.admin_notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Fechas y acciones */}
                      <div className="lg:w-64 space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Acceso:</span>
                            <span>{new Date(claim.quote_offer?.accessed_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Reclamación:</span>
                            <span>{new Date(claim.created_at).toLocaleDateString()}</span>
                          </div>
                          {claim.resolved_at && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Resuelta:</span>
                              <span>{new Date(claim.resolved_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {claim.status === "pending" && (
                          <div className="flex flex-col gap-2">
                            <Button onClick={() => openResolveDialog(claim, "approve")} className="w-full">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Aprobar devolución
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => openResolveDialog(claim, "reject")}
                              className="w-full"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de resolución */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{resolveAction === "approve" ? "Aprobar reclamación" : "Rechazar reclamación"}</DialogTitle>
            <DialogDescription>
              {resolveAction === "approve"
                ? `Se devolverán ${selectedClaim?.credits_to_refund} créditos al profesional.`
                : "El profesional no recibirá devolución de créditos."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Textarea
                placeholder="Añade notas sobre la resolución..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-1"
              />
            </div>

            {resolveAction === "approve" && (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span>Se enviarán {selectedClaim?.credits_to_refund} créditos al profesional</span>
              </div>
            )}

            {resolveAction === "reject" && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span>El profesional será notificado del rechazo</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleResolveClaim}
              disabled={resolving}
              variant={resolveAction === "approve" ? "default" : "destructive"}
            >
              {resolving ? "Procesando..." : resolveAction === "approve" ? "Confirmar aprobación" : "Confirmar rechazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
