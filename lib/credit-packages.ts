export interface CreditPackage {
  id: string
  name: string
  credits: number
  priceInCents: number
  popular?: boolean
  discount?: string
  bonus?: string
  features: string[]
  stripePriceId: string // ID del precio en Stripe
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "bono-500",
    name: "Bono 500",
    credits: 500,
    priceInCents: 5000, // 50€
    stripePriceId: "price_bono_500",
    features: ["500 créditos", "Acceso a todos los leads", "Sin caducidad", "Soporte por email"],
  },
  {
    id: "bono-1200",
    name: "Bono 1200",
    credits: 1200,
    priceInCents: 10000, // 100€
    popular: true,
    bonus: "+200 créditos gratis",
    stripePriceId: "price_bono_1200",
    features: [
      "1.200 créditos",
      "20% más créditos por tu dinero",
      "Acceso a todos los leads",
      "Sin caducidad",
      "Soporte prioritario",
    ],
  },
  {
    id: "bono-2500",
    name: "Bono 2500",
    credits: 2500,
    priceInCents: 20000, // 200€
    bonus: "+500 créditos gratis",
    stripePriceId: "price_bono_2500",
    features: [
      "2.500 créditos",
      "25% más créditos por tu dinero",
      "Acceso a todos los leads",
      "Sin caducidad",
      "Soporte prioritario",
      "Gestor de cuenta dedicado",
    ],
  },
]

export interface SubscriptionPlan {
  id: string
  name: string
  monthlyPriceInCents: number
  yearlyPriceInCents: number
  features: string[]
  stripeMonthlyPriceId: string
  stripeYearlyPriceId: string
  popular?: boolean
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "plan-basic",
    name: "BASIC",
    monthlyPriceInCents: 5900, // 59€/mes
    yearlyPriceInCents: 59000, // 590€/año
    stripeMonthlyPriceId: "price_1SqLioEQQaEB67RQJQGndw3R",
    stripeYearlyPriceId: "price_1SqLioEQQaEB67RQF8hzdUFQ",
    features: ["Acceso a la plataforma", "Gestión de proyectos", "Soporte por email"],
  },
  {
    id: "plan-profesional",
    name: "Plan Profesional",
    monthlyPriceInCents: 8900, // 89€/mes
    yearlyPriceInCents: 89000, // 890€/año
    popular: true,
    stripeMonthlyPriceId: "price_1SqLiqEQQaEB67RQNljlhUAq",
    stripeYearlyPriceId: "price_1SqLiqEQQaEB67RQEROaUynZ",
    features: ["Acceso a la plataforma", "Gestión de proyectos", "Soporte prioritario", "Estadísticas avanzadas"],
  },
  {
    id: "plan-empresa",
    name: "Plan Empresa",
    monthlyPriceInCents: 9900, // 99€/mes
    yearlyPriceInCents: 99000, // 990€/año
    stripeMonthlyPriceId: "price_plan_empresa_monthly",
    stripeYearlyPriceId: "price_plan_empresa_yearly",
    features: [
      "Acceso a la plataforma",
      "Gestión de proyectos",
      "Soporte prioritario 24/7",
      "Estadísticas avanzadas",
      "Gestor de cuenta dedicado",
    ],
  },
  {
    id: "plan-donacion",
    name: "Plan Donación",
    monthlyPriceInCents: 200, // 2€/mes
    yearlyPriceInCents: 2400, // 24€/año
    stripeMonthlyPriceId: "price_1SvIUlEQQaEB67RQWfEoVlGy",
    stripeYearlyPriceId: "price_1SvIUlEQQaEB67RQWfEoVlGy", // Using monthly for both for now or just monthly
    features: [
      "Evolución de la herramienta",
      "Beneficios exclusivos",
      "Apoyo al proyecto",
    ],
  },
]

export function formatPrice(priceInCents: number): string {
  return `${(priceInCents / 100).toFixed(0)}€`
}

export function calculateCreditValue(credits: number, priceInCents: number): string {
  const pricePerCredit = priceInCents / credits / 100
  return `${pricePerCredit.toFixed(2)}€/crédito`
}

export function getPackageById(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((pkg) => pkg.id === id)
}

export function getPackageByStripePrice(stripePriceId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((pkg) => pkg.stripePriceId === stripePriceId)
}

export function getPlanById(id: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id)
}

export function getPlanByStripePrice(stripePriceId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(
    (plan) => plan.stripeMonthlyPriceId === stripePriceId || plan.stripeYearlyPriceId === stripePriceId,
  )
}
