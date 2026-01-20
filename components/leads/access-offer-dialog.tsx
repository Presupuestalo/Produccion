"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coins, AlertTriangle, CheckCircle, Mail, Phone, MapPin, Euro, Building2, FileText } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { CompanyNameRequiredDialog } from "./company-name-required-dialog"
import { createBrowserClient } from "@supabase/ssr"

interface AccessOfferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  offer: {
    id: string
    reform_type: string
    city: string
    province?: string
    estimated_budget: number
    credits_cost: number
    description?: string
    category?: string
  }
  userCredits: number
  onSuccess: () => void
}

export function AccessOfferDialog({ open, onOpenChange, offer, userCredits, onSuccess }: AccessOfferDialogProps) {
  const [loading, setLoading] = useState(false)
  const [accessGranted, setAccessGranted] = useState(false)
  const [clientData, setClientData] = useState<{
    name: string
    email: string
    phone: string
    address?: string
  } | null>(null)
  const [showCompanyNameDialog, setShowCompanyNameDialog] = useState(false)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [checkingCompany, setCheckingCompany] = useState(true)
  const isProcessingRef = useRef(false)

  const hasEnoughCredits = userCredits >= offer.credits_cost
  const creditsAfter = userCredits - offer.credits_cost

  useEffect(() => {
    if (open) {
      checkCompanyName()
      isProcessingRef.current = false
    }
  }, [open])

  const checkCompanyName = async () => {
    setCheckingCompany(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from("profiles").select("company_name").eq("id", user.id).single()

      setCompanyName(profile?.company_name || null)
    } catch (error) {
      console.error("Error checking company name:", error)
    } finally {
      setCheckingCompany(false)
    }
  }

  const processAccess = async (companyNameToUse: string) => {
    // Evitar doble procesamiento
    if (isProcessingRef.current) {
      console.log("[v0] Already processing, skipping")
      return
    }
    isProcessingRef.current = true

    console.log("[v0] processAccess called with company:", companyNameToUse)

    if (!hasEnoughCredits) {
      toast.error("No tienes suficientes créditos")
      isProcessingRef.current = false
      return
    }

    setLoading(true)
    try {
      console.log("[v0] Sending request to /api/leads/accept")
      const response = await fetch("/api/leads/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: offer.id,
          creditsCost: offer.credits_cost,
        }),
      })

      const data = await response.json()

      console.log("[v0] Access response:", response.status, data)

      if (!response.ok) {
        if (data.error === "Ya has accedido a este lead" && data.lead) {
          setClientData({
            name: data.lead.client_name || "Cliente",
            email: data.lead.client_email || "",
            phone: data.lead.client_phone || "",
            address: `${offer.city}${offer.province ? `, ${offer.province}` : ""}`,
          })
          setAccessGranted(true)
          return
        }
        throw new Error(data.error || "Error al acceder a la oferta")
      }

      const leadData = data.lead || data
      setClientData({
        name: leadData.client_name || "Cliente",
        email: leadData.client_email || "",
        phone: leadData.client_phone || "",
        address: `${offer.city}${offer.province ? `, ${offer.province}` : ""}`,
      })
      setAccessGranted(true)
      toast.success(`¡Acceso concedido! Se han descontado ${offer.credits_cost} créditos`)
      onSuccess()
    } catch (error: any) {
      console.error("[v0] Error accessing offer:", error)
      toast.error(error.message || "Error al acceder a la oferta")
      isProcessingRef.current = false
    } finally {
      setLoading(false)
    }
  }

  const handleAccessOffer = async () => {
    if (!companyName) {
      setShowCompanyNameDialog(true)
      return
    }

    // Si ya tiene nombre, procesar directamente
    await processAccess(companyName)
  }

  const handleClose = () => {
    setAccessGranted(false)
    setClientData(null)
    isProcessingRef.current = false
    onOpenChange(false)
  }

  const handleGoToMyLeads = () => {
    handleClose()
  }

  const handleCompanyNameSaved = async (name: string) => {
    console.log("[v0] Company name saved:", name)
    setCompanyName(name)
    setShowCompanyNameDialog(false)
    // Procesar inmediatamente con el nombre recibido (no del estado)
    await processAccess(name)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-background border-border max-w-md">
          {!accessGranted ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">Acceder a esta Oferta</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Al acceder, se descontarán créditos y recibirás los datos de contacto del cliente.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {!checkingCompany && !companyName && (
                  <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <Building2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Configura tu empresa</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Necesitas añadir el nombre de tu empresa antes de acceder a leads.
                      </p>
                    </div>
                  </div>
                )}

                {/* Resumen de la oferta */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-foreground">{offer.reform_type}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {offer.city}
                      {offer.province ? `, ${offer.province}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-primary font-semibold">
                      Reforma {offer.category || "Micro"}
                    </span>
                  </div>
                </div>

                {/* Coste en créditos */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">Coste de acceso:</span>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      <Coins className="h-3 w-3 mr-1" />
                      {offer.credits_cost} créditos
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tu saldo actual:</span>
                    <span className={`font-semibold ${hasEnoughCredits ? "text-green-500" : "text-destructive"}`}>
                      {userCredits} créditos
                    </span>
                  </div>

                  {hasEnoughCredits && (
                    <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-border">
                      <span className="text-muted-foreground">Saldo después:</span>
                      <span className="font-semibold text-foreground">{creditsAfter} créditos</span>
                    </div>
                  )}
                </div>

                {/* Alerta si no hay suficientes créditos */}
                {!hasEnoughCredits && (
                  <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Créditos insuficientes</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Te faltan {offer.credits_cost - userCredits} créditos.
                        <a href="/dashboard/creditos" className="text-primary hover:underline ml-1">
                          Comprar créditos
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {/* Lo que incluye */}
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-2">Al acceder recibirás:</p>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Nombre del cliente
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Teléfono y email de contacto
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Ciudad y provincia del proyecto
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Detalles de la reforma solicitada
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
                  Cancelar
                </Button>
                <Button
                  onClick={handleAccessOffer}
                  disabled={!hasEnoughCredits || loading || checkingCompany}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {checkingCompany
                    ? "Verificando..."
                    : loading
                      ? "Procesando..."
                      : `Acceder por ${offer.credits_cost} cr`}
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  ¡Acceso Concedido!
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Aquí tienes los datos del cliente. Ya puedes contactarle.
                </DialogDescription>
              </DialogHeader>

              {clientData && (
                <div className="space-y-4 py-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-foreground text-lg">{clientData.name}</h4>

                    {clientData.phone && (
                      <a
                        href={`tel:${clientData.phone}`}
                        className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                      >
                        <Phone className="h-4 w-4 text-green-500" />
                        {clientData.phone}
                      </a>
                    )}

                    {clientData.email && (
                      <a
                        href={`mailto:${clientData.email}`}
                        className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                      >
                        <Mail className="h-4 w-4 text-green-500" />
                        {clientData.email}
                      </a>
                    )}

                    {clientData.address && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        {clientData.address}
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Ya puedes contactar al cliente directamente. Este lead quedará guardado en tu panel de "Mis Leads".
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
                  Cerrar
                </Button>
                <Link
                  href="/dashboard/solicitudes-disponibles?tab=mis-leads"
                  onClick={handleGoToMyLeads}
                  className="flex-1"
                >
                  <Button type="button" className="w-full bg-primary hover:bg-primary/90">
                    Ver en Mis Leads
                  </Button>
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <CompanyNameRequiredDialog
        open={showCompanyNameDialog}
        onOpenChange={setShowCompanyNameDialog}
        onSuccess={handleCompanyNameSaved}
      />
    </>
  )
}
