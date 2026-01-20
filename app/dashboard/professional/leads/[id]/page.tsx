"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Loader2,
  Send,
  User,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Bell,
  FolderPlus,
  AlertCircle,
  Star,
  Mail,
  Euro,
  Home,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { getCreditCategory } from "@/lib/utils/credit-calculator"

interface EditableBudgetItem {
  id: string
  category: string
  concept: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  professional_price: number | null
  is_custom?: boolean
  _priceInput?: string
  base_price_id?: string
  code?: string
  concept_code?: string
  total: number // Added total field
}

interface ExistingProposal {
  id: string
  proposed_budget: number
  message: string | null
  status: string
  created_at: string
}

function LeadDetailClient({ leadId }: { leadId: string }) {
  const router = useRouter()
  const { toast } = useToast()

  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editableItems, setEditableItems] = useState<EditableBudgetItem[]>([])
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [professionalProfile, setProfessionalProfile] = useState<any>(null)
  const [showProposalDialog, setShowProposalDialog] = useState(false)
  const [existingProposal, setExistingProposal] = useState<ExistingProposal | null>(null)
  const [isPremiumLead, setIsPremiumLead] = useState(false)
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [ivaRate, setIvaRate] = useState<number>(0) // 0 = sin IVA, 10, 21

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadLeadDetails()
  }, [leadId])

  const loadProfessionalPrices = async (userId: string, items: EditableBudgetItem[]) => {
    try {
      setLoadingPrices(true)
      console.log("[v0] ===== CARGANDO PRECIOS DEL PROFESIONAL =====")
      console.log("[v0] User ID:", userId)
      console.log("[v0] Items a procesar:", items.length)

      // Obtener todos los precios del profesional
      const { data: userPrices, error } = await supabase
        .from("user_prices")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)

      if (error) {
        console.error("[v0] ERROR cargando precios del profesional:", error)
        return items.map((item) => ({
          ...item,
          professional_price: item.unit_price || 0,
          _priceInput: (item.unit_price || 0).toFixed(2).replace(".", ","),
          total: (item.unit_price || 0) * item.quantity, // Added total calculation
        }))
      }

      console.log("[v0] Precios del profesional encontrados:", userPrices?.length || 0)

      if (!userPrices || userPrices.length === 0) {
        console.log("[v0] Profesional sin precios configurados, usando precios del presupuesto original")
        return items.map((item) => ({
          ...item,
          professional_price: item.unit_price || 0,
          _priceInput: (item.unit_price || 0).toFixed(2).replace(".", ","),
          total: (item.unit_price || 0) * item.quantity, // Added total calculation
        }))
      }

      const pricesByBasePriceId = new Map(userPrices.filter((p) => p.base_price_id).map((p) => [p.base_price_id, p]))
      const pricesByCode = new Map(userPrices.map((p) => [p.code, p]))

      if (userPrices.length > 0) {
        console.log("[v0] Ejemplo primer precio:", {
          id: userPrices[0].id,
          base_price_id: userPrices[0].base_price_id,
          code: userPrices[0].code,
          description: userPrices[0].description?.substring(0, 50),
          final_price: userPrices[0].final_price,
        })
      }

      if (items.length > 0) {
        console.log("[v0] Ejemplo primer item:", {
          base_price_id: (items[0] as any).base_price_id,
          code: (items[0] as any).code,
          concept_code: (items[0] as any).concept_code,
          concept: items[0].concept?.substring(0, 50),
        })
      }

      const itemsWithPrices = items.map((item) => {
        const itemAny = item as any
        let matchedPrice = null

        // 1. Intentar match por base_price_id del item
        if (itemAny.base_price_id) {
          matchedPrice = pricesByBasePriceId.get(itemAny.base_price_id) || pricesByCode.get(itemAny.base_price_id)
          if (matchedPrice) {
            console.log("[v0] MATCH por base_price_id:", itemAny.base_price_id, "->", matchedPrice.final_price, "€")
          }
        }

        // 2. Si no, intentar match por code del item
        if (!matchedPrice && itemAny.code) {
          matchedPrice = pricesByCode.get(itemAny.code) || pricesByBasePriceId.get(itemAny.code)
          if (matchedPrice) {
            console.log("[v0] MATCH por code:", itemAny.code, "->", matchedPrice.final_price, "€")
          }
        }

        // 3. Si no, intentar match por concept_code del item
        if (!matchedPrice && itemAny.concept_code) {
          matchedPrice = pricesByBasePriceId.get(itemAny.concept_code) || pricesByCode.get(itemAny.concept_code)
          if (matchedPrice) {
            console.log("[v0] MATCH por concept_code:", itemAny.concept_code, "->", matchedPrice.final_price, "€")
          }
        }

        if (matchedPrice) {
          return {
            ...item,
            professional_price: matchedPrice.final_price || matchedPrice.base_price || 0,
            _priceInput: (matchedPrice.final_price || matchedPrice.base_price || 0).toFixed(2).replace(".", ","),
            total: (matchedPrice.final_price || matchedPrice.base_price || 0) * item.quantity, // Added total calculation
          }
        }

        // Si no hay match por ID, usar el precio original del budget
        return {
          ...item,
          professional_price: item.unit_price || 0,
          _priceInput: (item.unit_price || 0).toFixed(2).replace(".", ","),
          total: (item.unit_price || 0) * item.quantity, // Added total calculation
        }
      })

      const matchCount = itemsWithPrices.filter((i) => i.professional_price !== null && i.professional_price > 0).length
      console.log("[v0] Items con precio encontrado:", matchCount, "de", items.length)
      console.log("[v0] ===== FIN CARGA PRECIOS =====")

      return itemsWithPrices
    } catch (error) {
      console.error("[v0] ERROR CRÍTICO en loadProfessionalPrices:", error)
      return items.map((item) => ({
        ...item,
        professional_price: item.unit_price || 0,
        _priceInput: (item.unit_price || 0).toFixed(2).replace(".", ","),
        total: (item.unit_price || 0) * item.quantity, // Added total calculation
      }))
    } finally {
      setLoadingPrices(false)
    }
  }

  const loadLeadDetails = async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      setUser(currentUser)

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single()
      setProfessionalProfile(profile)

      const { data: leadData, error: leadError } = await supabase
        .from("lead_requests")
        .select(`
          *,
          profiles:homeowner_id (
            full_name,
            email,
            phone
          )
        `)
        .eq("id", leadId)
        .single()

      if (leadError || !leadData) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar el lead",
        })
        router.push("/dashboard/solicitudes-disponibles")
        return
      }

      setLead(leadData)

      const { data: proposalData } = await supabase
        .from("professional_proposals")
        .select("id, proposed_budget, message, status, created_at")
        .eq("lead_request_id", leadId)
        .eq("professional_id", currentUser.id)
        .maybeSingle()

      if (proposalData) {
        setExistingProposal(proposalData)
      }

      const hasBudgetSnapshot =
        leadData.budget_snapshot?.line_items?.length > 0 || leadData.budget_snapshot?.lineItems?.length > 0
      setIsPremiumLead(hasBudgetSnapshot)
      console.log("[v0] Lead PREMIUM:", hasBudgetSnapshot)

      if (hasBudgetSnapshot) {
        const lineItems = leadData.budget_snapshot.line_items || leadData.budget_snapshot.lineItems || []
        console.log("[v0] budget_snapshot line_items:", lineItems.length)

        // Log primeros items para debug
        if (lineItems.length > 0) {
          console.log("[v0] Ejemplo item 1:", {
            concept: lineItems[0].concept?.substring(0, 40),
            description: lineItems[0].description?.substring(0, 40),
            unit_price: lineItems[0].unit_price,
          })
        }

        let items: EditableBudgetItem[] = lineItems.map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          category: item.category || "General",
          concept: item.concept || item.description || "",
          description: item.description || "",
          quantity: item.quantity || 1,
          unit: item.unit || "ud",
          unit_price: item.unit_price || item.unitPrice || 0,
          professional_price: null,
          is_custom: false,
          base_price_id: item.base_price_id,
          code: item.code,
          concept_code: item.concept_code,
          total: 0, // Added total field
        }))

        console.log("[v0] Items mapeados, llamando a loadProfessionalPrices...")

        items = await loadProfessionalPrices(currentUser.id, items)

        console.log("[v0] Precios cargados, actualizando estado...")
        setEditableItems(items)
      }
    } catch (error) {
      console.error("Error loading lead:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar los detalles del lead",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePriceChange = useCallback((id: string, value: string) => {
    if (value === "") {
      setEditableItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, professional_price: null, _priceInput: "" } : item)),
      )
      return
    }

    if (!/^\d*,?\d{0,2}$/.test(value)) {
      return
    }

    const numValue = Number.parseFloat(value.replace(",", ".")) || 0
    setEditableItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newTotal = numValue * item.quantity
          return { ...item, professional_price: numValue, _priceInput: value, total: newTotal }
        }
        return item
      }),
    )
  }, [])

  const handlePriceBlur = useCallback((id: string) => {
    setEditableItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const price = item.professional_price
        if (price === null || price === undefined || price === 0) {
          return { ...item, professional_price: 0, _priceInput: "0", total: 0 }
        }
        const formatted = price.toFixed(2).replace(".", ",")
        return { ...item, _priceInput: formatted }
      }),
    )
  }, [])

  const subtotal = useMemo(() => {
    return editableItems.reduce((sum, item) => {
      const price = item.professional_price ?? item.unit_price
      return sum + price * item.quantity
    }, 0)
  }, [editableItems])

  const ivaAmount = useMemo(() => {
    return subtotal * (ivaRate / 100)
  }, [subtotal, ivaRate])

  const totalConIva = useMemo(() => {
    return subtotal + ivaAmount
  }, [subtotal, ivaAmount])

  const itemsMissingPrice = useMemo(() => {
    return editableItems.filter((item) => item.professional_price === null || item.professional_price === 0)
  }, [editableItems])

  const handleOpenProposalDialog = () => {
    if (itemsMissingPrice.length > 0) {
      const firstMissingItem = itemsMissingPrice[0]
      const element = document.getElementById(`price-input-${firstMissingItem.id}`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
        element.focus()
      }
      toast({
        variant: "destructive",
        title: "Precios incompletos",
        description: `Hay ${itemsMissingPrice.length} partida(s) sin precio definido. Revisa los campos marcados en rojo.`,
      })
      return
    }
    setShowProposalDialog(true)
  }

  const handleSendProposal = async () => {
    if (!user || !lead) return

    setSending(true)
    console.log("[v0] Enviando propuesta...")

    try {
      const totalSinIva = editableItems.reduce((sum, item) => sum + item.total, 0)
      const ivaAmount = Math.round(((totalSinIva * ivaRate) / 100) * 100) / 100
      const totalConIva = totalSinIva + ivaAmount

      const response = await fetch("/api/proposals/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_request_id: lead.id,
          professional_id: user.id,
          proposed_budget: totalConIva,
          proposed_budget_without_iva: totalSinIva,
          iva_rate: ivaRate,
          message: message,
          line_items: editableItems,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("[v0] Error enviando propuesta:", data.error)
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "No se pudo enviar la propuesta",
        })
        setSending(false)
        return
      }

      console.log("[v0] Propuesta enviada exitosamente:", data)

      setExistingProposal({
        id: data.proposal_id,
        proposed_budget: totalConIva,
        message: message,
        status: "pending",
        created_at: new Date().toISOString(),
      })

      // Cerrar diálogo
      setShowProposalDialog(false)

      // Mostrar éxito
      toast({
        title: "Éxito",
        description: "Propuesta enviada correctamente. El propietario la recibirá por email.",
      })
    } catch (error) {
      console.error("[v0] Exception enviando propuesta:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al enviar la propuesta",
      })
    } finally {
      setSending(false)
    }
  }

  const getProposalStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Esperando respuesta
          </Badge>
        )
      case "accepted":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aceptada
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Rechazada
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!lead) {
    return null
  }

  const ownerInfo = lead.profiles

  // Vista cuando ya se ha enviado propuesta
  if (existingProposal) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="mb-6">
            <Link
              href="/dashboard/solicitudes-disponibles?tab=mis-leads"
              className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Mis Leads
            </Link>
          </div>

          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <CheckCircle className="h-10 w-10 text-primary flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-bold">Propuesta Enviada</h2>
                  <p className="text-muted-foreground">
                    Enviaste tu propuesta el {new Date(existingProposal.created_at).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <div className="ml-auto">{getProposalStatusBadge(existingProposal.status)}</div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-background rounded-lg p-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-primary" />
                    Información del Cliente
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Nombre:</span> {ownerInfo?.full_name || "Propietario"}
                    </p>
                    {ownerInfo?.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <a href={`tel:${ownerInfo.phone}`} className="hover:text-primary">
                          {ownerInfo.phone}
                        </a>
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {lead.city}, {lead.province}
                    </p>
                    {lead.reform_types && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {lead.reform_types.map((type: string) => (
                          <Badge key={type} variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-background rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Tu Propuesta</h3>
                  <p className="text-3xl font-bold text-primary mb-1">
                    {existingProposal.proposed_budget.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                  </p>
                  <p className="text-xs text-muted-foreground">Sin IVA</p>

                  {existingProposal.message && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Tu mensaje:</p>
                      <p className="text-sm">{existingProposal.message}</p>
                    </div>
                  )}
                </div>
              </div>

              {existingProposal.status === "pending" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Esperando respuesta del propietario</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Cuando el propietario acepte tu propuesta, recibirás una notificación por email.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {existingProposal.status === "accepted" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FolderPlus className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800">¡Propuesta aceptada!</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Puedes contactar al cliente para comenzar la reforma.
                      </p>
                      <Link href="/dashboard/projects">
                        <Button className="mt-3" size="sm">
                          Ver Mis Proyectos
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {existingProposal.status === "rejected" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800">Propuesta rechazada</h4>
                      <p className="text-sm text-red-700 mt-1">
                        El propietario ha decidido no continuar con tu propuesta.
                      </p>
                      <Link href="/dashboard/solicitudes-disponibles">
                        <Button variant="outline" className="mt-3 bg-transparent" size="sm">
                          Ver Nuevas Oportunidades
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isPremiumLead) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="mb-6">
            <Link
              href="/dashboard/solicitudes-disponibles?tab=mis-leads"
              className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Mis Leads
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Detalles del Lead</h1>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Sparkles className="h-3 w-3 mr-1" />
                Estimación
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Este cliente ha solicitado una estimación rápida de su proyecto
            </p>
          </div>

          {/* Card principal con info del cliente */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Información del Cliente
              </CardTitle>
              <CardDescription>Datos de contacto del propietario interesado en tu servicio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium text-lg">{ownerInfo?.full_name || lead.client_name || "Propietario"}</p>
                  </div>

                  {(ownerInfo?.phone || lead.client_phone) && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Teléfono</p>
                        <a
                          href={`tel:${ownerInfo?.phone || lead.client_phone}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {ownerInfo?.phone || lead.client_phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {(ownerInfo?.email || lead.client_email) && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <a
                          href={`mailto:${ownerInfo?.email || lead.client_email}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {ownerInfo?.email || lead.client_email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ubicación</p>
                      <p className="font-medium">
                        {lead.city}, {lead.province}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Categoría de reforma</p>
                      <p className="font-medium text-lg text-primary">
                        {getCreditCategory(lead.estimated_budget)}
                      </p>
                    </div>
                  </div>

                  {lead.surface_m2 && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Home className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Superficie</p>
                        <p className="font-medium">{lead.surface_m2} m²</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {lead.reform_types && lead.reform_types.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Tipo de reforma</p>
                  <div className="flex flex-wrap gap-2">
                    {lead.reform_types.map((type: string) => (
                      <Badge key={type} variant="secondary">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {lead.project_description && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Descripción del proyecto</p>
                  <p className="text-sm">{lead.project_description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Call to action */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/20 rounded-full">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">¡Contacta al cliente!</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Este cliente está interesado en recibir un presupuesto para su reforma. Llámale o envíale un email
                    para ofrecerle tus servicios.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {(ownerInfo?.phone || lead.client_phone) && (
                      <Button asChild>
                        <a href={`tel:${ownerInfo?.phone || lead.client_phone}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          Llamar
                        </a>
                      </Button>
                    )}
                    {(ownerInfo?.email || lead.client_email) && (
                      <Button variant="outline" asChild>
                        <a href={`mailto:${ownerInfo?.email || lead.client_email}`}>
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar email
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const groupedItems = editableItems.reduce(
    (acc, item) => {
      const category = item.category || "General"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(item)
      return acc
    },
    {} as Record<string, EditableBudgetItem[]>,
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/solicitudes-disponibles?tab=mis-leads"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Mis Leads
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Crear Propuesta</h1>
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
              <Star className="h-3 w-3 mr-1 fill-current" />
              PREMIUM
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Este cliente ha detallado su proyecto completo. Revisa las partidas y ajusta tus precios.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">{ownerInfo?.full_name || "Propietario"}</p>
              </div>
              {ownerInfo?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${ownerInfo.phone}`} className="hover:text-primary">
                    {ownerInfo.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {lead.city}, {lead.province}
                </span>
              </div>
              {lead.reform_types && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {lead.reform_types.map((type: string) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
              <CardDescription>Total de tu propuesta basado en tus precios</CardDescription>
            </CardHeader>
            <CardContent>
              {itemsMissingPrice.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-800">Precios incompletos</h4>
                      <p className="text-sm text-orange-700 mt-1">
                        Hay {itemsMissingPrice.length} partida(s) sin precio definido. Debes asignar un precio a todas
                        las partidas antes de poder enviar la propuesta.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center py-4 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Subtotal (sin IVA)</p>
                  <p className="text-2xl font-semibold">
                    {subtotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                  </p>
                </div>

                {/* Selector de IVA */}
                <div className="flex items-center justify-center gap-3">
                  <label className="text-sm text-muted-foreground">IVA:</label>
                  <Select value={ivaRate.toString()} onValueChange={(v) => setIvaRate(Number(v))}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sin IVA</SelectItem>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="21">21%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {ivaRate > 0 && (
                  <div className="text-sm text-muted-foreground">
                    IVA ({ivaRate}%): {ivaAmount.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Total propuesta</p>
                  <p className="text-4xl font-bold text-primary">
                    {totalConIva.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ivaRate > 0 ? `IVA ${ivaRate}% incluido` : "Sin IVA"}
                  </p>
                </div>
              </div>

              <Button
                className="w-full mt-4"
                size="lg"
                onClick={handleOpenProposalDialog}
                disabled={itemsMissingPrice.length > 0}
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Propuesta
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                El propietario recibirá tu propuesta por email y podrá aceptarla o contactarte.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Items */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Presupuesto - Edita tus precios</CardTitle>
                <CardDescription>
                  {loadingPrices
                    ? "Cargando tus precios..."
                    : "Los precios se han cargado desde tu configuración. Puedes modificarlos antes de enviar la propuesta."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingPrices ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span>Cargando tus precios...</span>
              </div>
            ) : (
              Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 bg-primary rounded-full" />
                      <h3 className="font-semibold uppercase text-sm">{category}</h3>
                      <Badge variant="outline" className="text-xs">
                        {items.length} partidas
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">
                      Subtotal:{" "}
                      {items
                        .reduce((sum, item) => sum + (item.professional_price ?? item.unit_price) * item.quantity, 0)
                        .toLocaleString("es-ES", { minimumFractionDigits: 2 })}{" "}
                      €
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground text-xs uppercase">
                          <th className="text-left py-2 font-medium">Concepto</th>
                          <th className="text-right py-2 font-medium w-24">Cantidad</th>
                          <th className="text-right py-2 font-medium w-32">Precio Ud.</th>
                          <th className="text-right py-2 font-medium w-28">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {items.map((item) => {
                          const isMissingPrice = item.professional_price === null || item.professional_price === 0
                          const total = (item.professional_price ?? item.unit_price) * item.quantity

                          return (
                            <tr key={item.id} className={isMissingPrice ? "bg-orange-50/50" : ""}>
                              <td className="py-3">
                                <p className="font-medium">{item.concept}</p>
                                {item.description && item.description !== item.concept && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                                )}
                              </td>
                              <td className="text-right py-3">
                                <span className="font-medium">{item.quantity}</span>
                                <span className="text-muted-foreground ml-1">{item.unit}</span>
                              </td>
                              <td className="text-right py-3">
                                <div className="flex items-center justify-end gap-1">
                                  <Input
                                    id={`price-input-${item.id}`}
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      item._priceInput ?? (item.professional_price?.toFixed(2).replace(".", ",") || "")
                                    }
                                    onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                    onBlur={() => handlePriceBlur(item.id)}
                                    className={`w-20 text-right h-8 ${isMissingPrice ? "border-orange-400 focus:ring-orange-400" : ""}`}
                                    placeholder="0,00"
                                  />
                                  <span className="text-muted-foreground">€</span>
                                </div>
                              </td>
                              <td className="text-right py-3 font-medium text-primary">
                                {total.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Dialog de confirmación */}
        <Dialog open={showProposalDialog} onOpenChange={setShowProposalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar envío de propuesta</DialogTitle>
              <DialogDescription>
                Tu propuesta será enviada al propietario por email. Podrá aceptarla directamente o contactarte para más
                información.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total de tu propuesta</p>
                <p className="text-2xl font-bold text-primary">
                  {totalConIva.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                </p>
                <p className="text-xs text-muted-foreground">{ivaRate > 0 ? `IVA ${ivaRate}% incluido` : "Sin IVA"}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Mensaje opcional para el cliente</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Añade un mensaje personalizado..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProposalDialog(false)} disabled={sending}>
                Cancelar
              </Button>
              <Button onClick={handleSendProposal} disabled={sending}>
                {sending ? (
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
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [leadId, setLeadId] = useState<string | null>(null)

  useEffect(() => {
    // Resolver la Promise de params
    const resolveParams = async () => {
      const resolvedParams = await params
      console.log("[v0] Params resueltos:", resolvedParams)
      setLeadId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  if (!leadId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <LeadDetailClient leadId={leadId} />
}
