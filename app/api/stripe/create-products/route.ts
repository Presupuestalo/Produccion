export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { CREDIT_PACKAGES, SUBSCRIPTION_PLANS } from "@/lib/credit-packages"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_PRUEBAS || process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST() {
  try {
    const createdProducts: Array<{
      packageId: string
      productId: string
      priceId: string
      name: string
      credits: number
      priceInEuros: number
    }> = []

    for (const pkg of CREDIT_PACKAGES) {
      const product = await stripe.products.create({
        name: pkg.name,
        description: `${pkg.credits} crÃ©ditos para acceder a leads de clientes${pkg.bonus ? ` - ${pkg.bonus}` : ""}`,
        metadata: {
          package_id: pkg.id,
          credits: pkg.credits.toString(),
          type: "credits",
        },
      })

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pkg.priceInCents,
        currency: "eur",
        metadata: {
          package_id: pkg.id,
          credits: pkg.credits.toString(),
        },
      })

      createdProducts.push({
        packageId: pkg.id,
        productId: product.id,
        priceId: price.id,
        name: pkg.name,
        credits: pkg.credits,
        priceInEuros: pkg.priceInCents / 100,
      })
    }

    const createdSubscriptions: Array<{
      planId: string
      productId: string
      monthlyPriceId: string
      yearlyPriceId: string
      name: string
      monthlyPriceInEuros: number
      yearlyPriceInEuros: number
    }> = []

    for (const plan of SUBSCRIPTION_PLANS) {
      const product = await stripe.products.create({
        name: plan.name,
        description: `SuscripciÃ³n ${plan.name} - Acceso completo a la plataforma`,
        metadata: {
          plan_id: plan.id,
          type: "subscription",
        },
      })

      // Precio mensual
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthlyPriceInCents,
        currency: "eur",
        recurring: {
          interval: "month",
        },
        metadata: {
          plan_id: plan.id,
          billing_period: "monthly",
        },
      })

      // Precio anual
      const yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.yearlyPriceInCents,
        currency: "eur",
        recurring: {
          interval: "year",
        },
        metadata: {
          plan_id: plan.id,
          billing_period: "yearly",
        },
      })

      createdSubscriptions.push({
        planId: plan.id,
        productId: product.id,
        monthlyPriceId: monthlyPrice.id,
        yearlyPriceId: yearlyPrice.id,
        name: plan.name,
        monthlyPriceInEuros: plan.monthlyPriceInCents / 100,
        yearlyPriceInEuros: plan.yearlyPriceInCents / 100,
      })
    }

    // Generar el cÃ³digo actualizado
    const updatedCode = `
// === BONOS DE CRÃ‰DITOS ===
${createdProducts.map((p) => `// ${p.name}: stripePriceId: "${p.priceId}"`).join("\n")}

// === PLANES DE SUSCRIPCIÃ“N ===
${createdSubscriptions.map((s) => `// ${s.name}: monthly: "${s.monthlyPriceId}", yearly: "${s.yearlyPriceId}"`).join("\n")}
`

    return NextResponse.json({
      success: true,
      message: "Productos y suscripciones creados en Stripe",
      products: createdProducts,
      subscriptions: createdSubscriptions,
      instructions: updatedCode,
    })
  } catch (error) {
    console.error("Error creating Stripe products:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

// GET para verificar productos existentes
export async function GET() {
  try {
    const products = await stripe.products.list({
      limit: 100,
      active: true,
    })

    const productsWithPrices = await Promise.all(
      products.data.map(async (product) => {
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
        })
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          metadata: product.metadata,
          prices: prices.data.map((p) => ({
            id: p.id,
            amount: p.unit_amount,
            currency: p.currency,
            recurring: p.recurring,
          })),
        }
      }),
    )

    return NextResponse.json({
      success: true,
      products: productsWithPrices,
    })
  } catch (error) {
    console.error("Error fetching Stripe products:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

