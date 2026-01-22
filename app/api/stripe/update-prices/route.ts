export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST() {
  try {
    // Crear producto Plan Básico
    const basicProduct = await stripe.products.create({
      name: "Plan Básico",
      description: "Plan básico para profesionales - 300 créditos/mes",
      metadata: {
        plan_id: "basic",
        credits: "300",
        version: "v2_2026",
      },
    })

    // Crear producto Plan Profesional
    const proProduct = await stripe.products.create({
      name: "Plan Profesional",
      description: "Plan profesional con funciones avanzadas - 800 créditos/mes",
      metadata: {
        plan_id: "pro",
        credits: "800",
        version: "v2_2026",
      },
    })

    const createdPrices: Array<{
      plan: string
      type: string
      priceId: string
      amount: number
    }> = []

    // Crear precios para Plan Básico (59€/mes, 590€/año)
    const basicMonthly = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 5900, // 59€ en centavos
      currency: "eur",
      recurring: {
        interval: "month",
      },
      metadata: {
        plan_id: "basic",
        billing_period: "monthly",
        version: "v2_2026",
      },
    })
    createdPrices.push({ plan: "basic", type: "monthly", priceId: basicMonthly.id, amount: 59 })

    const basicYearly = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 59000, // 590€ en centavos
      currency: "eur",
      recurring: {
        interval: "year",
      },
      metadata: {
        plan_id: "basic",
        billing_period: "yearly",
        version: "v2_2026",
      },
    })
    createdPrices.push({ plan: "basic", type: "yearly", priceId: basicYearly.id, amount: 590 })

    // Crear precios para Plan Profesional (89€/mes, 890€/año)
    const proMonthly = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 8900, // 89€ en centavos
      currency: "eur",
      recurring: {
        interval: "month",
      },
      metadata: {
        plan_id: "pro",
        billing_period: "monthly",
        version: "v2_2026",
      },
    })
    createdPrices.push({ plan: "pro", type: "monthly", priceId: proMonthly.id, amount: 89 })

    const proYearly = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 89000, // 890€ en centavos
      currency: "eur",
      recurring: {
        interval: "year",
      },
      metadata: {
        plan_id: "pro",
        billing_period: "yearly",
        version: "v2_2026",
      },
    })
    createdPrices.push({ plan: "pro", type: "yearly", priceId: proYearly.id, amount: 890 })

    return NextResponse.json({
      success: true,
      message: "Productos y precios creados en Stripe",
      products: {
        basic: { id: basicProduct.id, name: basicProduct.name },
        pro: { id: proProduct.id, name: proProduct.name },
      },
      prices: createdPrices,
      priceIds: {
        basic: {
          monthly: basicMonthly.id,
          yearly: basicYearly.id,
        },
        pro: {
          monthly: proMonthly.id,
          yearly: proYearly.id,
        },
      },
    })
  } catch (error) {
    console.error("Error creating Stripe products and prices:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

