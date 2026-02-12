"use client"

import { useState } from "react"
import { Check, X, Info, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"

const allFeatures = [
  "proyectos",
  "presupuestos",
  "precios_personalizados",
  "importa_precios",
  "contabilidad",
  "herramientas_ia",
  "anadir_precios_ia",
  "reconocimiento_planos_ia",
  "presupuestos_pdf",
  "contratos_personalizados",
  "gestion_citas",
  "galeria_fotos",
  "soporte",
]

const plans = [
  {
    name: "Free",
    badge: "Gratuito",
    description: "Perfecto para probar la plataforma",
    urgencyNote: "Precio por lanzamiento, la oferta expira en 15 días",
    price: {
      monthly: 0,
      annually: 0,
    },
    credits: 0,
    featuresMap: {
      proyectos: { text: "1 Proyecto", included: true },
      presupuestos: { text: "1 Presupuesto por proyecto", included: true },
      precios_personalizados: { text: "Precios personalizados", included: true },
      importa_precios: { text: "Importa tus precios", included: false },
      contabilidad: { text: "Contabilidad", included: true },
      herramientas_ia: { text: "Herramientas IA", included: true, note: "3 usos/día" },
      anadir_precios_ia: { text: "Añadir Precios con IA", included: false },
      reconocimiento_planos_ia: { text: "Reconocimiento planos IA", included: false },
      presupuestos_pdf: { text: "Presupuestos PDF", included: true, note: "con marca de agua" },
      contratos_personalizados: { text: "Contratos personalizados", included: false },
      gestion_citas: { text: "Gestión de Citas", included: true },
      galeria_fotos: { text: "Galería de fotos personalizada", included: true },
      soporte: { text: "Soporte por email", included: true },
    },
    cta: "Comenzar gratis",
    href: "/auth/login",
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
    featuresMap: {
      proyectos: { text: "Proyectos ilimitados", included: true },
      presupuestos: { text: "3 Presupuestos por proyecto", included: true },
      precios_personalizados: { text: "Precios personalizados", included: true },
      importa_precios: { text: "Importa tus precios", included: true },
      contabilidad: { text: "Contabilidad", included: true },
      herramientas_ia: { text: "Herramientas IA", included: true, note: "5 usos/día" },
      anadir_precios_ia: { text: "Añadir Precios con IA", included: false },
      reconocimiento_planos_ia: { text: "Reconocimiento planos IA", included: false },
      presupuestos_pdf: { text: "Presupuestos PDF", included: true, note: "sin marca de agua" },
      contratos_personalizados: { text: "Contratos personalizados", included: true },
      gestion_citas: { text: "Gestión de Citas + Avisos", included: true },
      galeria_fotos: { text: "Galería de fotos personalizada", included: true },
      soporte: { text: "Soporte por email", included: true },
    },
    cta: "Comenzar ahora",
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
    featuresMap: {
      proyectos: { text: "Proyectos ilimitados", included: true },
      presupuestos: { text: "5 Presupuestos por proyecto", included: true },
      precios_personalizados: { text: "Precios personalizados", included: true },
      importa_precios: { text: "Importa tus precios", included: true },
      contabilidad: { text: "Contabilidad", included: true },
      herramientas_ia: { text: "Herramientas IA ilimitadas", included: true },
      anadir_precios_ia: { text: "Añadir Precios con IA", included: true },
      reconocimiento_planos_ia: { text: "Reconocimiento planos IA", included: true },
      presupuestos_pdf: { text: "Presupuestos PDF", included: true, note: "sin marca de agua" },
      contratos_personalizados: { text: "Contratos personalizados", included: true },
      gestion_citas: { text: "Gestión de Citas + Avisos", included: true },
      galeria_fotos: { text: "Galería de fotos personalizada", included: true },
      soporte: { text: "Soporte prioritario", included: true },
    },
    cta: "Comenzar ahora",
    variant: "outline" as const,
    highlight: true,
  },
]

export function Pricing() {
  const [billingType, setBillingType] = useState<"monthly" | "annually">("monthly")

  const calculateSavings = (monthlyPrice: number) => {
    const yearlyWithoutDiscount = monthlyPrice * 12
    const yearlyWithDiscount = monthlyPrice * 0.8 * 12
    return Math.round(yearlyWithoutDiscount - yearlyWithDiscount)
  }

  const getPlanUrl = (plan: (typeof plans)[0]) => {
    if (plan.href) return plan.href
    if (plan.planKey) {
      return `/auth/login?pendingPlan=${plan.planKey}&billingType=${billingType}`
    }
    return "/auth/login"
  }

  return (
    <TooltipProvider>
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Planes para cada necesidad</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Desde proyectos personales hasta empresas. Elige el plan que mejor se adapte a ti.
            </p>
            <div className="flex justify-center mt-6">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${plan.popular
                  ? "border-orange-500 shadow-lg dark:border-orange-400 lg:scale-105 z-10"
                  : plan.highlight
                    ? "border-blue-500 shadow-lg dark:border-blue-400"
                    : "border-border"
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="bg-orange-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Más popular
                    </span>
                  </div>
                )}
                {plan.highlight && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Mejor valor
                    </span>
                  </div>
                )}
                <CardHeader className="pb-4 min-h-[140px]">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                      {plan.badge}
                    </span>
                  </div>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                  {"urgencyNote" in plan && plan.urgencyNote ? (
                    <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded">
                      ⏰ {plan.urgencyNote}
                    </div>
                  ) : (
                    <div className="mt-2 h-6" />
                  )}
                </CardHeader>
                <CardContent className="space-y-4 flex-grow">
                  <div className="min-h-[70px]">
                    <span className="text-3xl font-bold">
                      {billingType === "monthly" ? `${plan.price.monthly}€` : `${plan.price.annually}€`}
                    </span>
                    <span className="text-muted-foreground text-sm ml-1">/mes</span>
                    {billingType === "annually" && plan.price.monthly > 0 ? (
                      <>
                        <p className="text-xs text-muted-foreground mt-1">Facturado anualmente</p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1">
                          Ahorre €{calculateSavings(plan.price.monthly)} al año
                        </p>
                      </>
                    ) : (
                      <div className="h-8" />
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
                            <button
                              aria-label="Más información sobre los créditos"
                              className="p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded-full transition-colors"
                            >
                              <Info
                                className={`h-4 w-4 ${plan.popular ? "text-orange-500" : plan.highlight ? "text-blue-500" : "text-gray-500"
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
                    {allFeatures.map((featureKey) => {
                      const feature = plan.featuresMap[featureKey as keyof typeof plan.featuresMap]
                      if (!feature) return null
                      return (
                        <li key={featureKey} className="flex items-start text-sm h-6">
                          {feature.included ? (
                            <Check className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={feature.included ? "" : "text-muted-foreground"}>
                            {feature.text}
                            {(feature as any).note && (
                              <span className="text-xs text-muted-foreground ml-1">({(feature as any).note})</span>
                            )}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
                <CardFooter className="pt-4 mt-auto">
                  <Button
                    asChild
                    variant={plan.variant}
                    className={`w-full ${plan.popular ? "bg-orange-500 hover:bg-orange-600 text-white" : plan.highlight ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}`}
                  >
                    <Link href={getPlanUrl(plan)}>{plan.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground">
              ¿Necesitas un plan personalizado?{" "}
              <Link href="/contacto" className="text-orange-500 hover:underline font-medium">
                Contáctanos
              </Link>
            </p>
          </div>
        </div>
      </section>
    </TooltipProvider>
  )
}
