"use client"

import { useState, useEffect } from "react"
import { Check, X, ArrowLeft, Info, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { toast } from "sonner"

const plans = [
  {
    name: "Free",
    badge: "Gratuito",
    description: "Perfecto para probar la plataforma",
    planKey: "free",
    urgencyNote: "Precio por lanzamiento, la oferta expira en 15 días",
    price: {
      monthly: 0,
      annually: 0,
    },
    credits: 0,
    features: [
      { text: "1 Proyecto", included: true, note: "" },
      { text: "1 Presupuesto por proyecto", included: true, note: "" },
      { text: "Precios personalizados", included: true, note: "" },
      { text: "Importa tus precios", included: false, note: "" },
      { text: "Contabilidad", included: true, note: "" },
      { text: "Herramientas IA", included: true, note: "3 usos/día" },
      { text: "Añadir Precios con IA", included: false, note: "" },
      { text: "Reconocimiento planos IA", included: false, note: "" },
      { text: "Presupuestos PDF", included: true, note: "con marca de agua" },
      { text: "Contratos personalizados", included: false, note: "" },
      { text: "Gestión de Citas", included: true, note: "" },
      { text: "Galería de fotos personalizada", included: true, note: "" },
      { text: "Soporte por email", included: true, note: "" },
    ],
    cta: "Plan actual",
    variant: "outline" as const,
  },
  {
    name: "Basic",
    badge: "Esencial",
    description: "Para profesionales que empiezan",
    planKey: "basic",
    price: {
      monthly: 59,
      annually: 47,
    },
    credits: 300,
    features: [
      { text: "Proyectos ilimitados", included: true, note: "" },
      { text: "3 Presupuestos por proyecto", included: true, note: "" },
      { text: "Precios personalizados", included: true, note: "" },
      { text: "Importa tus precios", included: true, note: "" },
      { text: "Contabilidad", included: true, note: "" },
      { text: "Herramientas IA", included: true, note: "5 usos/día" },
      { text: "Añadir Precios con IA", included: false, note: "" },
      { text: "Reconocimiento planos IA", included: false, note: "" },
      { text: "Presupuestos PDF", included: true, note: "sin marca de agua" },
      { text: "Contratos personalizados", included: true, note: "" },
      { text: "Gestión de Citas + Avisos", included: true, note: "" },
      { text: "Galería de fotos personalizada", included: true, note: "" },
      { text: "Soporte por email", included: true, note: "" },
    ],
    cta: "Contratar",
    variant: "default" as const,
    popular: true,
  },
  {
    name: "Pro",
    badge: "Avanzado",
    description: "Todo el poder de la IA",
    planKey: "pro",
    price: {
      monthly: 89,
      annually: 71,
    },
    credits: 500,
    features: [
      { text: "Proyectos ilimitados", included: true, note: "" },
      { text: "5 Presupuestos por proyecto", included: true, note: "" },
      { text: "Precios personalizados", included: true, note: "" },
      { text: "Importa tus precios", included: true, note: "" },
      { text: "Contabilidad", included: true, note: "" },
      { text: "Herramientas IA ilimitadas", included: true, note: "" },
      { text: "Añadir Precios con IA", included: true, note: "" },
      { text: "Reconocimiento planos IA", included: true, note: "" },
      { text: "Presupuestos PDF", included: true, note: "sin marca de agua" },
      { text: "Contratos personalizados", included: true, note: "" },
      { text: "Gestión de Citas + Avisos", included: true, note: "" },
      { text: "Galería de fotos personalizada", included: true, note: "" },
      { text: "Soporte prioritario", included: true, note: "" },
    ],
    cta: "Contratar",
    variant: "outline" as const,
    highlight: true,
  },
  {
    name: "Donación",
    badge: "Apoyo",
    description: "Ayúdanos a mejorar Presupuéstalo",
    planKey: "plan-donacion",
    price: {
      monthly: 2,
      annually: 2, // 2€/mes regardless
    },
    credits: 0,
    features: [
      { text: "Acceso a Telegram Privado", included: true, note: "" },
      { text: "Roadmap exclusivo", included: true, note: "" },
      { text: "Beneficios futuros", included: true, note: "" },
      { text: "Canal de soporte directo", included: true, note: "" },
    ],
    cta: "Apoyar",
    variant: "outline" as const,
  },
]

const planOrder = ["plan-donacion", "free", "basic", "pro"]

export default function PlanesPage() {
  const [billingType, setBillingType] = useState<"monthly" | "annually">("monthly")
  const [loading, setLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string>("free")

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const response = await fetch("/api/subscription/status")
        if (response.ok) {
          const data = await response.json()
          const plan = (data.plan || "free").toLowerCase()
          setCurrentPlan(plan === "professional" || plan === "business" || plan === "enterprise" ? "pro" : plan)
        }
      } catch (error) {
        console.error("Error fetching subscription:", error)
      }
    }
    fetchCurrentPlan()
  }, [])

  // Auto-trigger checkout if plan is in URL
  useEffect(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    const autoPlan = params?.get('plan') || params?.get('pendingPlan')

    if (autoPlan === 'plan-donacion') {
      handleUpgrade('plan-donacion')
      // Clean URL after triggering
      const url = new URL(window.location.href)
      url.searchParams.delete('plan')
      url.searchParams.delete('pendingPlan')
      window.history.replaceState({}, '', url.toString())
      return
    }

    if (autoPlan && !loading && currentPlan === 'free') {
      const planToTrigger = plans.find(p => p.planKey === autoPlan)
      if (planToTrigger) {
        handleUpgrade(autoPlan)
        // Clean URL after triggering
        const url = new URL(window.location.href)
        url.searchParams.delete('plan')
        url.searchParams.delete('pendingPlan')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [currentPlan, loading, router])

  const calculateSavings = (monthlyPrice: number) => {
    const yearlyWithoutDiscount = monthlyPrice * 12
    const yearlyWithDiscount = monthlyPrice * 0.8 * 12
    return Math.round(yearlyWithoutDiscount - yearlyWithDiscount)
  }

  const isCurrentPlan = (planKey: string) => {
    return currentPlan === planKey
  }

  const isUpgrade = (planKey: string) => {
    const currentIndex = planOrder.indexOf(currentPlan)
    const planIndex = planOrder.indexOf(planKey)
    return planIndex > currentIndex
  }

  const isDowngrade = (planKey: string) => {
    const currentIndex = planOrder.indexOf(currentPlan)
    const planIndex = planOrder.indexOf(planKey)
    return planIndex < currentIndex
  }

  const handleUpgrade = async (planKey: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/subscription/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: planKey,
          billingType: billingType === "annually" ? "annual" : "monthly",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        throw new Error("Error al crear la sesión de pago")
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error("Error creating checkout:", error)
      toast.error("Error al procesar el pago. Por favor, inténtalo de nuevo.")
      setLoading(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard/ajustes"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Ajustes
            </Link>
            <h1 className="text-3xl font-bold mb-2">Planes y Precios</h1>
            <p className="text-muted-foreground">Elige el plan que mejor se adapte a tus necesidades</p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center rounded-full border p-1 bg-white dark:bg-gray-800">
              <button
                onClick={() => setBillingType("monthly")}
                className={`px-4 py-2 rounded-full ${billingType === "monthly" ? "bg-orange-500 text-white" : "text-muted-foreground"} font-medium transition-colors`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingType("annually")}
                className={`px-4 py-2 rounded-full ${billingType === "annually" ? "bg-orange-500 text-white" : "text-muted-foreground"} font-medium transition-colors`}
              >
                Anual (20% dto.)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-6">
            {plans.map((plan) => {
              const isCurrent = isCurrentPlan(plan.planKey)
              const canUpgrade = isUpgrade(plan.planKey)
              const canDowngrade = isDowngrade(plan.planKey)

              return (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col ${isCurrent
                    ? "border-green-500 shadow-lg dark:border-green-400"
                    : plan.popular
                      ? "border-orange-500 shadow-lg dark:border-orange-400 lg:scale-105"
                      : plan.highlight
                        ? "border-blue-500 shadow-lg dark:border-blue-400"
                        : "border-border"
                    }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                        Plan actual
                      </span>
                    </div>
                  )}
                  {!isCurrent && plan.popular && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <span className="bg-orange-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                        Más popular
                      </span>
                    </div>
                  )}
                  {!isCurrent && !plan.popular && plan.highlight && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                        Mejor valor
                      </span>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                        {plan.badge}
                      </span>
                    </div>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                    {"urgencyNote" in plan && plan.urgencyNote && (
                      <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded">
                        ⏰ {plan.urgencyNote}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4 flex-grow">
                    <div>
                      <span className="text-3xl font-bold">
                        {billingType === "monthly" ? `${plan.price.monthly}€` : `${plan.price.annually}€`}
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">/mes</span>
                      {billingType === "annually" && plan.price.monthly > 0 && (
                        <>
                          <p className="text-xs text-muted-foreground mt-1">Facturado anualmente</p>
                          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1">
                            Ahorre €{calculateSavings(plan.price.monthly)} al año
                          </p>
                        </>
                      )}
                    </div>

                    {plan.credits > 0 && (
                      <div
                        className={`rounded-lg p-3 ${plan.popular
                          ? "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 border border-orange-200 dark:border-orange-800"
                          : plan.highlight
                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800"
                            : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-1.5 rounded-full ${plan.popular
                                ? "bg-orange-100 dark:bg-orange-900/50"
                                : plan.highlight
                                  ? "bg-blue-100 dark:bg-blue-900/50"
                                  : "bg-gray-100 dark:bg-gray-700"
                                }`}
                            >
                              <Coins
                                className={`h-4 w-4 ${plan.popular
                                  ? "text-orange-600 dark:text-orange-400"
                                  : plan.highlight
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-gray-600 dark:text-gray-400"
                                  }`}
                              />
                            </div>
                            <div>
                              <p
                                className={`text-sm font-semibold ${plan.popular
                                  ? "text-orange-700 dark:text-orange-300"
                                  : plan.highlight
                                    ? "text-blue-700 dark:text-blue-300"
                                    : "text-gray-700 dark:text-gray-300"
                                  }`}
                              >
                                {plan.credits} créditos/mes
                              </p>
                              <p className="text-xs text-muted-foreground">Para acceder al Presmarket</p>
                            </div>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded-full transition-colors">
                                <Info
                                  className={`h-4 w-4 ${plan.popular
                                    ? "text-orange-500"
                                    : plan.highlight
                                      ? "text-blue-500"
                                      : "text-gray-500"
                                    }`}
                                />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[280px] p-3">
                              <p className="font-medium mb-1">Créditos Presmarket</p>
                              <p className="text-xs text-muted-foreground">
                                Cada mes tu saldo se recarga automáticamente a {plan.credits} créditos. Úsalos para
                                acceder a solicitudes de presupuesto de propietarios y enviar ofertas. Si tienes más
                                créditos (por bonos comprados), se mantienen.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    )}

                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-sm">
                          {feature.included ? (
                            <Check className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={feature.included ? "" : "text-muted-foreground"}>
                            {feature.text}
                            {feature.note && (
                              <span className="text-xs text-muted-foreground ml-1">({feature.note})</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-4">
                    {isCurrent ? (
                      <Button variant="outline" disabled className="w-full bg-green-500 text-white cursor-not-allowed">
                        Plan actual
                      </Button>
                    ) : plan.planKey === "free" ? (
                      <Button variant="outline" disabled className="w-full text-muted-foreground bg-transparent">
                        Plan gratuito
                      </Button>
                    ) : plan.planKey === "plan-donacion" ? (
                      <Button
                        disabled={loading}
                        onClick={() => handleUpgrade(plan.planKey)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        {loading ? "Procesando..." : "Apoyar"}
                      </Button>
                    ) : canUpgrade ? (
                      <Button
                        disabled={loading}
                        onClick={() => handleUpgrade(plan.planKey)}
                        className={`w-full ${plan.popular
                          ? "bg-orange-500 hover:bg-orange-600 text-white"
                          : plan.highlight
                            ? "bg-blue-500 hover:bg-blue-600 text-white"
                            : "bg-orange-500 hover:bg-orange-600 text-white"
                          }`}
                      >
                        {loading ? "Procesando..." : "Mejorar plan"}
                      </Button>
                    ) : canDowngrade ? (
                      <Button variant="outline" disabled className="w-full text-muted-foreground bg-transparent">
                        Plan inferior
                      </Button>
                    ) : null}
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground">
              ¿Necesitas un plan personalizado?{" "}
              <Link href="/contacto" className="text-orange-500 hover:underline font-medium">
                Contáctanos
              </Link>
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider >
  )
}
