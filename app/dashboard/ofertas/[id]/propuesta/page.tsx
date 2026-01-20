"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Send,
  MapPin,
  Euro,
  Phone,
  Mail,
  User,
  Home,
  Calendar,
  FileText,
  Loader2,
  CheckCircle,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface OfferDetails {
  id: string
  reform_type: string
  city: string
  province?: string
  country: string
  square_meters: string
  rooms: string
  bathrooms: string
  description: string
  price_range: string
  created_at: string
  client_name?: string
  client_email?: string
  client_phone?: string
  user_id?: string
}

interface ExistingOffer {
  id: string
  offered_price: number
  estimated_duration: string
  description: string
  status: string
  created_at: string
}

const REFORM_TYPE_LABELS: Record<string, string> = {
  baño: "Reforma de Baño",
  cocina: "Reforma de Cocina",
  integral: "Reforma Integral",
  "semi-integral": "Reforma Semi-integral",
}

export default function EnviarPropuestaPage() {
  const params = useParams()
  const router = useRouter()
  const offerId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [offer, setOffer] = useState<OfferDetails | null>(null)
  const [existingOffer, setExistingOffer] = useState<ExistingOffer | null>(null)
  const [hasAccess, setHasAccess] = useState(false)

  // Form state
  const [proposedPrice, setProposedPrice] = useState("")
  const [estimatedDuration, setEstimatedDuration] = useState("")
  const [description, setDescription] = useState("")
  const [includes, setIncludes] = useState("")
  const [excludes, setExcludes] = useState("")

  useEffect(() => {
    loadOfferDetails()
  }, [offerId])

  const loadOfferDetails = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }

    // Obtener detalles de la oferta
    const { data: offerData, error: offerError } = await supabase
      .from("quote_requests")
      .select(`
        *,
        profiles!quote_requests_user_id_fkey (
          full_name,
          email,
          phone
        )
      `)
      .eq("id", offerId)
      .single()

    if (offerError || !offerData) {
      toast.error("Oferta no encontrada")
      router.push("/dashboard/solicitudes-disponibles")
      return
    }

    // Verificar si el profesional ya accedió (tiene registro en quote_offers)
    const { data: accessData, error: accessError } = await supabase
      .from("quote_offers")
      .select("*")
      .eq("quote_request_id", offerId)
      .eq("professional_id", user.id)
      .single()

    if (accessError || !accessData) {
      toast.error("No tienes acceso a esta oferta. Debes acceder primero desde la lista de solicitudes.")
      router.push("/dashboard/solicitudes-disponibles")
      return
    }

    setHasAccess(true)
    setExistingOffer(accessData)

    // Si ya envió una propuesta completa, mostrar los datos
    if (accessData.offered_price > 0 && accessData.description !== "Pendiente de propuesta") {
      setProposedPrice(accessData.offered_price.toString())
      setEstimatedDuration(accessData.estimated_duration || "")
      setDescription(accessData.description || "")
      setIncludes(accessData.includes || "")
      setExcludes(accessData.excludes || "")
    }

    setOffer({
      ...offerData,
      client_name: offerData.profiles?.full_name,
      client_email: offerData.profiles?.email,
      client_phone: offerData.profiles?.phone,
    })

    setLoading(false)
  }

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!proposedPrice || !estimatedDuration || !description) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    if (existingOffer?.status === "sent" && existingOffer?.offered_price > 0) {
      toast.error("Ya has enviado una propuesta para esta oferta")
      return
    }

    // Prevenir múltiples clics
    if (submitting) {
      return
    }

    setSubmitting(true)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Sesión expirada")
        setSubmitting(false)
        return
      }

      const { data: currentOffer } = await supabase
        .from("quote_offers")
        .select("status, offered_price")
        .eq("id", existingOffer?.id)
        .single()

      if (currentOffer?.status === "sent" && currentOffer?.offered_price > 0) {
        toast.error("Ya has enviado una propuesta para esta oferta")
        setSubmitting(false)
        // Recargar la página para mostrar la propuesta existente
        await loadOfferDetails()
        return
      }

      console.log("[v0] Enviando propuesta para oferta:", offerId)

      // Actualizar la oferta existente con la propuesta completa
      const { error: updateError } = await supabase
        .from("quote_offers")
        .update({
          offered_price: Number.parseFloat(proposedPrice),
          estimated_duration: estimatedDuration,
          description,
          includes,
          excludes,
          status: "sent",
        })
        .eq("id", existingOffer?.id)
        .eq("status", "accessed")

      if (updateError) {
        console.error("[v0] Error al actualizar quote_offer:", updateError)
        throw updateError
      }

      console.log("[v0] Propuesta enviada correctamente")

      // Enviar email de notificación al propietario
      try {
        await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: offer?.client_email,
            subject: `Nueva propuesta recibida para tu proyecto de ${offer?.reform_type}`,
            template: "new-proposal",
            data: {
              clientName: offer?.client_name,
              reformType: REFORM_TYPE_LABELS[offer?.reform_type || ""] || offer?.reform_type,
              proposedPrice,
              estimatedDuration,
              description,
              offerId,
            },
          }),
        })
      } catch (emailError) {
        console.error("Error sending email:", emailError)
      }

      toast.success("¡Propuesta enviada correctamente!")
      router.push("/dashboard/solicitudes-disponibles")
    } catch (error: any) {
      console.error("[v0] Error al enviar propuesta:", error)
      toast.error(error.message || "Error al enviar la propuesta")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando detalles...</p>
        </div>
      </div>
    )
  }

  if (!offer || !hasAccess) {
    return null
  }

  const proposalSent = existingOffer?.status === "sent" && existingOffer?.offered_price > 0

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/solicitudes-disponibles"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a solicitudes
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {proposalSent ? "Propuesta Enviada" : "Enviar Propuesta"}
          </h1>
          <p className="text-muted-foreground">
            {proposalSent
              ? "Ya has enviado tu propuesta para este proyecto"
              : "Completa los detalles de tu propuesta para este proyecto"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Detalles de la oferta */}
          <div className="lg:col-span-1 space-y-4">
            {/* Información del proyecto */}
            <Card className="p-4 border-border">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Detalles del Proyecto
              </h3>

              <div className="space-y-3">
                <div>
                  <Badge className="bg-primary/10 text-primary border-primary/30 mb-2">
                    {REFORM_TYPE_LABELS[offer.reform_type] || offer.reform_type}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {offer.city}, {offer.province || offer.country}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Home className="h-4 w-4" />
                  <span>
                    {offer.square_meters}m² • {offer.rooms} hab. • {offer.bathrooms} baños
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(offer.created_at).toLocaleDateString("es-ES")}</span>
                </div>

                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Presupuesto estimado</p>
                  <p className="text-lg font-bold text-primary">{offer.price_range}</p>
                </div>
              </div>
            </Card>

            {/* Datos del cliente */}
            <Card className="p-4 border-border bg-green-500/5 border-green-500/20">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-green-500" />
                Datos del Cliente
              </h3>

              <div className="space-y-2">
                {offer.client_name && <p className="font-medium text-foreground">{offer.client_name}</p>}

                {offer.client_phone && (
                  <a
                    href={`tel:${offer.client_phone}`}
                    className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4 text-green-500" />
                    {offer.client_phone}
                  </a>
                )}

                {offer.client_email && (
                  <a
                    href={`mailto:${offer.client_email}`}
                    className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="h-4 w-4 text-green-500" />
                    {offer.client_email}
                  </a>
                )}
              </div>
            </Card>

            {/* Descripción del proyecto */}
            {offer.description && (
              <Card className="p-4 border-border">
                <h3 className="font-semibold text-foreground mb-2">Descripción</h3>
                <p className="text-sm text-muted-foreground">{offer.description}</p>
              </Card>
            )}
          </div>

          {/* Formulario de propuesta */}
          <div className="lg:col-span-2">
            <Card className="p-6 border-border">
              {proposalSent ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Propuesta Enviada</h3>
                  <p className="text-muted-foreground mb-6">
                    Tu propuesta ha sido enviada al cliente. Te notificaremos cuando responda.
                  </p>

                  <div className="bg-muted/50 rounded-lg p-4 text-left max-w-md mx-auto">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Precio propuesto</p>
                        <p className="font-semibold text-foreground">
                          {Number.parseFloat(proposedPrice).toLocaleString("es-ES")}€
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duración estimada</p>
                        <p className="font-semibold text-foreground">{estimatedDuration}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitProposal} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Send className="h-5 w-5 text-primary" />
                      Tu Propuesta
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price" className="text-foreground">
                        Precio Propuesto (€) *
                      </Label>
                      <div className="relative mt-1">
                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          required
                          value={proposedPrice}
                          onChange={(e) => setProposedPrice(e.target.value)}
                          placeholder="15000"
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Sin IVA</p>
                    </div>

                    <div>
                      <Label htmlFor="duration" className="text-foreground">
                        Duración Estimada *
                      </Label>
                      <div className="relative mt-1">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="duration"
                          required
                          value={estimatedDuration}
                          onChange={(e) => setEstimatedDuration(e.target.value)}
                          placeholder="2-3 semanas"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-foreground">
                      Descripción de tu Propuesta *
                    </Label>
                    <Textarea
                      id="description"
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe tu propuesta, experiencia relevante, enfoque para este proyecto, materiales que utilizarás..."
                      className="mt-1 min-h-[120px]"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="includes" className="text-foreground">
                        Qué Incluye
                      </Label>
                      <Textarea
                        id="includes"
                        value={includes}
                        onChange={(e) => setIncludes(e.target.value)}
                        placeholder="- Materiales de primera calidad\n- Mano de obra cualificada\n- Limpieza final\n- Garantía de 2 años"
                        className="mt-1 min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="excludes" className="text-foreground">
                        Qué NO Incluye
                      </Label>
                      <Textarea
                        id="excludes"
                        value={excludes}
                        onChange={(e) => setExcludes(e.target.value)}
                        placeholder="- Permisos municipales\n- Electrodomésticos\n- Mobiliario"
                        className="mt-1 min-h-[100px]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/dashboard/solicitudes-disponibles")}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting} className="flex-1 bg-primary hover:bg-primary/90">
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Propuesta
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
