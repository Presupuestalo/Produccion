"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ExternalLink, CreditCard, Download, FileText, Calendar, ArrowUpRight } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

interface SubscriptionSettingsProps {
  userId: string
  userType: "homeowner" | "professional"
}

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  basic: "Basic",
  pro: "Pro",
  professional: "Pro",
  enterprise: "Pro",
}

const PLAN_PRICES: Record<string, string> = {
  free: "0€/mes",
  basic: "59€/mes",
  pro: "89€/mes",
  professional: "89€/mes",
  enterprise: "89€/mes",
}

export function SubscriptionSettings({ userId, userType }: SubscriptionSettingsProps) {
  const [subscription, setSubscription] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const { toast } = useToast()
  const searchParams = useSearchParams()

  useEffect(() => {
    const success = searchParams.get("success")
    const canceled = searchParams.get("canceled")

    if (success === "true") {
      toast({
        title: "¡Suscripción activada correctamente!",
        description: "Tu plan ha sido activado correctamente.",
      })
      const url = new URL(window.location.href)
      url.searchParams.delete("success")
      window.history.replaceState({}, "", url.toString())
      fetch("/api/subscription/sync", { method: "POST" }).then(() => loadSubscription())
    } else if (canceled === "true") {
      toast({
        title: "Pago cancelado",
        description: "El proceso de pago fue cancelado. Puedes intentarlo de nuevo cuando quieras.",
        variant: "destructive",
      })
      const url = new URL(window.location.href)
      url.searchParams.delete("canceled")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams, toast])

  useEffect(() => {
    loadSubscription()
    loadInvoices()
  }, [userId])

  const loadSubscription = async () => {
    try {
      const response = await fetch("/api/subscription/status")
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setSubscription(data)
    } catch (error: any) {
      console.error("Error loading subscription:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar la suscripción",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadInvoices = async () => {
    try {
      const response = await fetch("/api/subscription/invoices")
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      console.log("[v0] Facturas cargadas en frontend:", data.invoices)

      setInvoices(data.invoices || [])
    } catch (error: any) {
      console.error("Error loading invoices:", error)
    } finally {
      setIsLoadingInvoices(false)
    }
  }

  const openBillingPortal = async () => {
    setIsRedirecting(true)
    try {
      const response = await fetch("/api/subscription/portal", {
        method: "POST",
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      window.location.href = data.url
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo abrir el portal de facturación",
        variant: "destructive",
      })
      setIsRedirecting(false)
    }
  }

  const handleUpgrade = async (planName: string) => {
    setIsRedirecting(true)
    try {
      const response = await fetch("/api/subscription/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al crear sesión de pago")
      }

      const { url } = await response.json()

      window.location.href = url
    } catch (error: any) {
      console.error("[v0] Upgrade error:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo iniciar el proceso de pago",
        variant: "destructive",
      })
      setIsRedirecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  const planName = PLAN_NAMES[subscription?.plan] || "Plan Desconocido"
  const planPrice = PLAN_PRICES[subscription?.plan] || "N/A"
  const isFree = subscription?.plan === "free"
  const isActive = isFree || subscription?.status === "active"
  const canUpgrade = subscription?.plan !== "enterprise"

  return (
    <div className="space-y-6">
      {subscription?.cancel_at_period_end && !isFree && (
        <Card className="border-orange-500 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-100 rounded-full">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="font-semibold text-orange-900">Tu suscripción está programada para cancelarse</h4>
                <p className="text-sm text-orange-800">
                  Tu plan {planName} se cancelará el{" "}
                  <span className="font-semibold">
                    {format(new Date(subscription.current_period_end), "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                  . Después de esta fecha, tu cuenta volverá al plan Free automáticamente.
                </p>
                <p className="text-sm text-orange-800">
                  Seguirás teniendo acceso completo a todas las funciones de tu plan actual hasta esa fecha.
                </p>
                <Button
                  onClick={openBillingPortal}
                  disabled={isRedirecting}
                  variant="default"
                  size="sm"
                  className="mt-2 bg-orange-600 hover:bg-orange-700"
                >
                  {isRedirecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Abriendo...
                    </>
                  ) : (
                    "Reactivar Suscripción"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Suscripción Actual</CardTitle>
          <CardDescription>
            {userType === "homeowner"
              ? "Información de tu plan de propietario"
              : "Información de tu plan profesional y estado de suscripción"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-6 border rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{planName}</h3>
              <p className="text-3xl font-bold text-orange-600">{planPrice}</p>
              {subscription?.current_period_end && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {subscription?.cancel_at_period_end
                      ? `Activo hasta: ${format(new Date(subscription.current_period_end), "d 'de' MMMM, yyyy", { locale: es })}`
                      : `Renovación: ${format(new Date(subscription.current_period_end), "d 'de' MMMM, yyyy", { locale: es })}`}
                  </span>
                </div>
              )}
              {subscription?.cancel_at_period_end && (
                <Badge variant="destructive" className="mt-2">
                  Se cancelará al final del período
                </Badge>
              )}
            </div>
            <Badge variant={isActive ? "default" : "secondary"} className="text-sm px-4 py-2">
              {isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          <div className="p-4 border rounded-lg bg-blue-50">
            <h4 className="font-semibold mb-3">Características de tu plan:</h4>
            {userType === "homeowner" ? (
              <ul className="space-y-2 text-sm">
                {isFree ? (
                  <>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Hasta 3 solicitudes de presupuesto por mes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Estimación rápida con IA</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gray-400">✗</span>
                      <span className="text-muted-foreground">Presupuestos detallados ilimitados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gray-400">✗</span>
                      <span className="text-muted-foreground">Comparador de presupuestos</span>
                    </li>
                  </>
                ) : subscription?.plan === "basic" ? (
                  <>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Proyectos ilimitados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Herramientas IA (3 usos/día)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>PDF sin marca de agua</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Proyectos ilimitados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Herramientas IA ilimitadas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Reconocimiento de planos IA</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Gestión de citas y fotos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Soporte prioritario</span>
                    </li>
                  </>
                )}
              </ul>
            ) : (
              <ul className="space-y-2 text-sm">
                {isFree ? (
                  <>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>1 proyecto activo</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gray-400">✗</span>
                      <span className="text-muted-foreground">Herramientas IA</span>
                    </li>
                  </>
                ) : subscription?.plan === "basic" ? (
                  <>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Proyectos ilimitados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Herramientas IA (3 usos/día)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>PDF sin marca de agua</span>
                    </li>
                  </>
                ) : subscription?.plan === "pro" ? (
                  <>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Proyectos ilimitados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Herramientas IA ilimitadas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Reconocimiento de planos IA</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Gestión de citas y fotos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Soporte prioritario</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Proyectos ilimitados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Herramientas IA ilimitadas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Soporte prioritario</span>
                    </li>
                  </>
                )}
              </ul>
            )}
          </div>

          {!isFree && subscription?.stripe_customer_id && (
            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold">Gestionar Suscripción</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Actualiza tu método de pago, consulta facturas o cancela tu suscripción
                  </p>
                </div>
                <Button
                  onClick={openBillingPortal}
                  disabled={isRedirecting}
                  variant="outline"
                  className="flex-shrink-0 bg-transparent"
                >
                  {isRedirecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Abriendo...
                    </>
                  ) : (
                    <>
                      Gestionar
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {canUpgrade && (
            <div className="p-4 border rounded-lg bg-gradient-to-r from-orange-100 to-yellow-100">
              <h4 className="font-semibold mb-2">{isFree ? "Mejora tu plan" : "¿Necesitas más?"}</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {userType === "homeowner"
                  ? isFree
                    ? "Desbloquea más solicitudes de presupuesto y funciones avanzadas"
                    : "Actualiza a un plan superior para obtener más funciones"
                  : isFree
                    ? "Desbloquea más funciones y proyectos ilimitados con un plan de pago"
                    : "Actualiza a un plan superior para obtener proyectos ilimitados y más herramientas IA"}
              </p>
              <Button asChild className="w-full">
                <Link href="/dashboard/planes" className="flex items-center justify-center gap-2">
                  Ver Planes Disponibles
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {!isFree && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Facturas</CardTitle>
            <CardDescription>Descarga tus facturas anteriores</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingInvoices ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay facturas disponibles</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{invoice.number || `Factura ${invoice.id.slice(-8)}`}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(invoice.created), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          {invoice.amount} {invoice.currency}
                        </p>
                        <Badge variant={invoice.status === "paid" ? "default" : "secondary"} className="text-xs">
                          {invoice.status === "paid" ? "Pagada" : invoice.status}
                        </Badge>
                      </div>
                      {invoice.invoice_pdf && (
                        <Button variant="outline" size="sm" onClick={() => window.open(invoice.invoice_pdf, "_blank")}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
