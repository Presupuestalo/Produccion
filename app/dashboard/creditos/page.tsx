"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CREDIT_PACKAGES, formatPrice, calculateCreditValue } from "@/lib/credit-packages"
import { getCreditPricingTable, getPlanInfo, type SubscriptionPlan } from "@/lib/utils/credit-calculator"
import {
  Check,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  Clock,
  RefreshCcw,
  Info,
  Sparkles,
  Coins,
  Gift,
} from "lucide-react"
import { CreditPurchaseDialog } from "@/components/credits/credit-purchase-dialog"
import { CreditPurchaseHistory } from "@/components/credits/credit-purchase-history"
import { toast } from "sonner"

export default function CreditosPage() {
  const [userPlan, setUserPlan] = useState<SubscriptionPlan>("free")
  const [userCredits, setUserCredits] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0) // Key para forzar refresco del historial
  const router = useRouter()
  const searchParams = useSearchParams()
  const pricingTable = getCreditPricingTable()

  const loadCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/credits/balance")
      const data = await res.json()
      console.log("[v0] Credits loaded:", data)
      setUserCredits(data.credits_balance || 0)
      let plan = (data.subscription_plan || "free").toLowerCase()
      if (plan === "business" || plan === "enterprise") {
        plan = "pro"
      }
      setUserPlan(plan as SubscriptionPlan)
    } catch (error) {
      console.error("[v0] Error loading credits:", error)
    }
  }, [])

  useEffect(() => {
    // Obtener plan y créditos del usuario
    loadCredits()
  }, [loadCredits])

  useEffect(() => {
    const purchase = searchParams.get("purchase")
    const canceled = searchParams.get("canceled")

    if (purchase === "success") {
      // Mostrar notificación de compra exitosa
      toast.success("¡Compra realizada con éxito! Tus créditos han sido actualizados.")

      const refreshCredits = () => {
        console.log("[v0] Refrescando créditos por URL param...")
        loadCredits()
        setRefreshKey((prev) => prev + 1)
      }

      // Refrescar inmediatamente y varias veces más
      refreshCredits()
      setTimeout(refreshCredits, 1000)
      setTimeout(refreshCredits, 3000)
      setTimeout(refreshCredits, 6000)
      setTimeout(refreshCredits, 10000)

      // Limpiar el parámetro de la URL
      const params = new URLSearchParams(searchParams.toString())
      params.delete("purchase")
      const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname
      router.replace(newUrl)
    }

    if (canceled === "true") {
      toast.error("Compra cancelada")

      // Limpiar el parámetro de la URL
      const params = new URLSearchParams(searchParams.toString())
      params.delete("canceled")
      const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname
      router.replace(newUrl)
    }
  }, [searchParams, router, loadCredits])

  const handlePurchaseComplete = useCallback(() => {
    console.log("[v0] Purchase dialog closed, refreshing...")
    loadCredits()
    setRefreshKey((prev) => prev + 1)
  }, [loadCredits])

  const planInfo = getPlanInfo(userPlan)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Sistema de Créditos Presmarket
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight">Compra Créditos para Presmarket</h1>
          <p className="text-xl text-muted-foreground">
            Accede a proyectos de reforma verificados. Paga solo por los leads que te interesan.
          </p>
        </div>

        {/* Balance actual */}
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white max-w-md mx-auto">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-white/20 rounded-full p-4">
              <Coins className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm opacity-90">Tu balance actual</p>
              <p className="text-3xl font-bold">{userCredits.toLocaleString()} créditos</p>
              <p className="text-sm opacity-75">
                Plan {planInfo.name} ({planInfo.multiplier})
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Paquetes de créditos */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-8">Elige tu Paquete de Créditos</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {CREDIT_PACKAGES.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative ${pkg.popular ? "border-2 border-primary shadow-lg scale-105" : ""}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <Badge className="bg-primary text-primary-foreground">Más Popular</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <div className="mt-4">
                    <div className="text-5xl font-bold text-primary">{formatPrice(pkg.priceInCents)}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {calculateCreditValue(pkg.credits, pkg.priceInCents)}
                    </div>
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <Coins className="h-5 w-5 text-orange-500" />
                      <span className="text-3xl font-bold">{pkg.credits.toLocaleString()}</span>
                      <span className="text-muted-foreground">créditos</span>
                    </div>
                    {pkg.bonus && (
                      <Badge variant="secondary" className="mt-2">
                        <Gift className="h-3 w-3 mr-1" />
                        {pkg.bonus}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <CreditPurchaseDialog packageId={pkg.id} onPurchaseComplete={handlePurchaseComplete}>
                    <Button className="w-full" size="lg" variant={pkg.popular ? "default" : "outline"}>
                      Comprar Ahora
                    </Button>
                  </CreditPurchaseDialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <CreditPurchaseHistory key={refreshKey} />
        </div>

        {/* Tabla de consumo por plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Consumo de Créditos por Tipo de Reforma
            </CardTitle>
            <CardDescription>El coste depende del presupuesto del proyecto y tu plan contratado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Tipo de Reforma</th>
                    <th className="text-center py-3 px-2">
                      <div>Free</div>
                      <div className="text-xs font-normal text-muted-foreground">(x 2.0)</div>
                    </th>
                    <th className="text-center py-3 px-2">
                      <div>Basic</div>
                      <div className="text-xs font-normal text-muted-foreground">(x 1.0)</div>
                    </th>
                    <th className="text-center py-3 px-2">
                      <div>Pro</div>
                      <div className="text-xs font-normal text-muted-foreground">(x 0.50)</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pricingTable.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3 px-2">
                        <div className="font-medium">{row.category}</div>
                        <div className="text-xs text-muted-foreground">{row.budgetRange}</div>
                      </td>
                      <td className={`text-center py-3 px-2 ${userPlan === "free" ? "bg-orange-50 font-bold" : ""}`}>
                        {row.prices.free.credits} cr.
                      </td>
                      <td className={`text-center py-3 px-2 ${userPlan === "basic" ? "bg-orange-50 font-bold" : ""}`}>
                        {row.prices.basic.credits} cr.
                      </td>
                      <td className={`text-center py-3 px-2 ${userPlan === "pro" ? "bg-orange-50 font-bold" : ""}`}>
                        {row.prices.pro.credits} cr.
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {userPlan !== "pro" && (
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Con tu plan <strong>{planInfo.name}</strong> pagas {planInfo.multiplier} el precio base.
                  {userPlan === "free" && " Suscríbete a un plan para reducir el coste por lead."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Beneficios */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <ShieldCheck className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle className="text-lg">Garantía 100%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Si el propietario no responde en 48h, recuperas el 100% de tus créditos automáticamente.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <RefreshCcw className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Devolución 75%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Si el propietario cancela el proyecto después de contactar, recuperas el 75% de los créditos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Clock className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle className="text-lg">Sin Caducidad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tus créditos no caducan. Úsalos cuando quieras sin prisas ni fechas límite.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Preguntas Frecuentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">¿Cuándo se cobran los créditos?</h4>
              <p className="text-sm text-muted-foreground">
                Los créditos solo se cobran cuando haces clic en "Acceder al Lead" y desbloqueas los datos de contacto
                del propietario. Ver la información básica del proyecto es siempre gratuito.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">¿Qué pasa si el cliente no responde?</h4>
              <p className="text-sm text-muted-foreground">
                Si el propietario no responde en 48 horas después de que accedas al lead, recibirás automáticamente una
                devolución del 100% de los créditos gastados.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">¿Cuántas empresas pueden acceder a un mismo lead?</h4>
              <p className="text-sm text-muted-foreground">
                Máximo 3 empresas pueden acceder a cada proyecto, garantizando oportunidades reales para cada
                profesional.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">¿Cómo afecta mi plan al coste de créditos?</h4>
              <p className="text-sm text-muted-foreground">
                El plan Free paga el doble (x2), Basic el precio base (x1), y Pro la mitad (x0.5). Mejora tu plan para
                reducir costes.
              </p>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>¿Necesitas ayuda?</AlertTitle>
          <AlertDescription>
            Si tienes dudas sobre el sistema de créditos o necesitas un paquete personalizado,{" "}
            <Button variant="link" className="h-auto p-0" onClick={() => router.push("/contacto")}>
              contáctanos aquí
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
