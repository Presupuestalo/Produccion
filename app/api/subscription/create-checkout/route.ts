export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

const PLAN_CONFIG = {
  basic: {
    name: "Plan Básico",
    stripeName: "Plan Básico", // Nombre exacto en Stripe
    monthly: 5900, // 59€
    annual: 59000, // 590€
  },
  pro: {
    name: "Plan Pro",
    stripeName: "Plan Pro", // Cambiado de "Plan Profesional" a "Plan Pro" para coincidir con Stripe
    monthly: 8900, // 89€
    annual: 89000, // 890€
  },
  business: {
    name: "Plan Empresa",
    stripeName: "Plan Empresa", // Nombre exacto en Stripe
    monthly: 7990, // 79.90€
    annual: 79900, // 799€
  },
}

// Cache para almacenar los price IDs
const priceCache: Record<string, Record<string, string>> = {}

async function findExistingProduct(stripeName: string): Promise<Stripe.Product | null> {
  const products = await stripe.products.list({
    limit: 100,
    active: true,
  })

  // Buscar por nombre exacto
  const found = products.data.find((p) => p.name === stripeName || p.name.toLowerCase() === stripeName.toLowerCase())

  if (found) {
    console.log(`[v0] Found existing product "${stripeName}":`, found.id)
    return found
  }

  console.log(`[v0] Product not found: "${stripeName}"`)
  return null
}

async function findExistingPrice(productId: string, billingType: "monthly" | "annual"): Promise<string | null> {
  const interval = billingType === "monthly" ? "month" : "year"

  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  })

  // Buscar precio con el intervalo correcto
  const existingPrice = prices.data.find((p) => p.recurring?.interval === interval)

  if (existingPrice) {
    console.log(`[v0] Found existing price for ${billingType}:`, existingPrice.id, `(${existingPrice.unit_amount}c)`)
    return existingPrice.id
  }

  return null
}

export async function POST(req: Request) {
  try {
    console.log("[v0] Create checkout: Starting...")

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Create checkout: Not authenticated")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    console.log("[v0] Create checkout: User authenticated:", user.id)

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name, stripe_customer_id")
      .eq("id", user.id)
      .single()
    const customerEmail = profile?.email || user.email

    if (!customerEmail) {
      console.error("[v0] Create checkout: No email found")
      return NextResponse.json({ error: "Email no encontrado" }, { status: 400 })
    }

    console.log("[v0] Create checkout: Using email:", customerEmail)

    if (profile?.stripe_customer_id) {
      console.log("[v0] Checking for existing active subscriptions...")

      const existingSubscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: "active",
        limit: 100,
      })

      console.log(`[v0] Found ${existingSubscriptions.data.length} active subscriptions`)

      // Cancelar todas las suscripciones activas
      for (const subscription of existingSubscriptions.data) {
        console.log(`[v0] Canceling subscription: ${subscription.id}`)
        await stripe.subscriptions.cancel(subscription.id)
      }

      if (existingSubscriptions.data.length > 0) {
        console.log("[v0] All old subscriptions canceled successfully")
      }
    }

    const { planName, billingType = "monthly" } = await req.json()

    if (!planName || !PLAN_CONFIG[planName as keyof typeof PLAN_CONFIG]) {
      console.error("[v0] Create checkout: Invalid plan:", planName)
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 })
    }

    const config = PLAN_CONFIG[planName as keyof typeof PLAN_CONFIG]
    const billing = billingType as "monthly" | "annual"

    console.log(`[v0] Looking for product: "${config.stripeName}"`)
    const existingProduct = await findExistingProduct(config.stripeName)

    if (!existingProduct) {
      console.error(`[v0] Product not found in Stripe: "${config.stripeName}"`)
      return NextResponse.json(
        {
          error: `Producto "${config.stripeName}" no encontrado en Stripe. Por favor, verifica el catálogo de productos.`,
        },
        { status: 400 },
      )
    }

    const priceId = await findExistingPrice(existingProduct.id, billing)

    if (!priceId) {
      console.error(`[v0] Price not found for ${config.stripeName} (${billing})`)
      return NextResponse.json(
        { error: `Precio ${billing} no encontrado para "${config.stripeName}". Por favor, crea el precio en Stripe.` },
        { status: 400 },
      )
    }

    console.log("[v0] Create checkout: Using existing price:", priceId)

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/ajustes?tab=subscription&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/ajustes?tab=subscription&canceled=true`,
      metadata: {
        user_id: user.id,
        plan_name: planName,
        billing_type: billingType,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_name: planName,
          billing_type: billingType,
        },
      },
    })

    console.log("[v0] Create checkout: Session created:", session.id)

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("[v0] Create checkout error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

