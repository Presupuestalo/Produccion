export type SubscriptionPlan = "free" | "basic" | "pro"

interface CreditCost {
  credits: number
  euros: number
  category: string
}

// Precios BASE por categoría (plan BASIC x1.0)
const BASE_CREDITS = {
  pequena: 40, // < 5.000€
  mediana: 80, // 5k - 15k€
  grande: 120, // 15k - 30k€
  muyGrande: 200, // > 30k€
} as const

const PLAN_MULTIPLIERS: Record<SubscriptionPlan, number> = {
  free: 2.0, // x2 (paga el doble)
  basic: 1.0, // x1 (precio base)
  pro: 0.5, // x0.5 (mitad)
}

export function getCreditCategory(budget: number): string {
  const safeBudget = Number(budget) || 0
  if (safeBudget < 5000) return "Pequeña"
  if (safeBudget < 15000) return "Mediana"
  if (safeBudget < 30000) return "Grande"
  return "Muy Grande"
}

export function calculateCreditCost(budget: number, plan: SubscriptionPlan | string = "free"): CreditCost {
  const safeBudget = Number(budget) || 0
  let safePlan = (plan?.toLowerCase() || "free") as SubscriptionPlan

  if (safePlan === "enterprise" || safePlan === "professional") {
    safePlan = "pro"
  }

  let baseCredits: number
  let category: string

  category = getCreditCategory(safeBudget)

  switch (category) {
    case "Pequeña":
      baseCredits = BASE_CREDITS.pequena
      break
    case "Mediana":
      baseCredits = BASE_CREDITS.mediana
      break
    case "Grande":
      baseCredits = BASE_CREDITS.grande
      break
    case "Muy Grande":
      baseCredits = BASE_CREDITS.muyGrande
      break
    default:
      baseCredits = BASE_CREDITS.pequena
      category = "Pequeña"
  }

  const multiplier = PLAN_MULTIPLIERS[safePlan] || 2.0
  const credits = Math.round(baseCredits * multiplier)
  const euros = credits * 0.1 // 1 crédito = 0.10€

  return { credits, euros, category }
}

export function getCreditPricingTable(): Array<{
  category: string
  budgetRange: string
  prices: Record<SubscriptionPlan, { credits: number; euros: number }>
}> {
  return [
    {
      category: "Pequeña",
      budgetRange: "< 5.000€",
      prices: {
        free: { credits: 80, euros: 8 },
        basic: { credits: 40, euros: 4 },
        pro: { credits: 20, euros: 2 },
      },
    },
    {
      category: "Mediana",
      budgetRange: "5k - 15k€",
      prices: {
        free: { credits: 160, euros: 16 },
        basic: { credits: 80, euros: 8 },
        pro: { credits: 40, euros: 4 },
      },
    },
    {
      category: "Grande",
      budgetRange: "15k - 30k€",
      prices: {
        free: { credits: 240, euros: 24 },
        basic: { credits: 120, euros: 12 },
        pro: { credits: 60, euros: 6 },
      },
    },
    {
      category: "Muy Grande",
      budgetRange: "> 30.000€",
      prices: {
        free: { credits: 400, euros: 40 },
        basic: { credits: 200, euros: 20 },
        pro: { credits: 100, euros: 10 },
      },
    },
  ]
}

export function getPlanInfo(plan: SubscriptionPlan | string): {
  name: string
  multiplier: string
  description: string
} {
  const info: Record<string, { name: string; multiplier: string; description: string }> = {
    free: { name: "Free", multiplier: "x 2.0", description: "Paga el doble de créditos por lead" },
    basic: { name: "Basic", multiplier: "x 1.0", description: "Precio base de créditos" },
    pro: { name: "Pro", multiplier: "x 0.50", description: "Mitad de créditos por lead" },
    enterprise: { name: "Pro", multiplier: "x 0.50", description: "Mitad de créditos por lead" },
    professional: { name: "Pro", multiplier: "x 0.50", description: "Mitad de créditos por lead" },
  }
  return info[plan] || info.free
}
