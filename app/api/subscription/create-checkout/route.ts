export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia" as any,
})

import { supabaseAdmin } from "@/lib/supabase-admin"

async function logMsg(msg: string, data: any = {}) {
  await supabaseAdmin.from("debug_logs").insert({
    message: `SUBSCRIPTION: ${msg}`,
    data: { ...data, timestamp: new Date().toISOString() }
  })
}

const PLAN_CONFIG = {
  basic: {
    name: "Plan Básico",
    stripeName: "Plan Básico",
    monthly: 5900,
    annual: 59000,
  },
  pro: {
    name: "Plan Pro",
    stripeName: "Plan Pro",
    monthly: 8900,
    annual: 89000,
  },
  business: {
    name: "Plan Empresa",
    stripeName: "Plan Empresa",
    monthly: 7990,
    annual: 79900,
  },
}

async function findExistingProduct(stripeName: string): Promise<Stripe.Product | null> {
  const products = await stripe.products.list({
    limit: 100,
    active: true,
  })

  // Buscar por nombre exacto
  const found = products.data.find((p) => p.name === stripeName || p.name.toLowerCase() === stripeName.toLowerCase())

  if (found) {
    await logMsg(`Found product "${stripeName}"`, { productId: found.id })
    return found
  }

  await logMsg(`Product NOT FOUND: "${stripeName}"`, { availableProducts: products.data.map(p => p.name) })
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
    await logMsg(`Found price for ${billingType}`, { productId, priceId: existingPrice.id, amount: existingPrice.unit_amount })
    return existingPrice.id
  }

  await logMsg(`Price NOT FOUND for ${billingType}`, { productId, interval, availablePrices: prices.data.map(p => ({ id: p.id, interval: p.recurring?.interval, amount: p.unit_amount })) })
  return null
}

export async function POST(req: Request) {
  await logMsg("START")
  try {
    const supabase = await createClient()

    if (!supabase) {
      await logMsg("ERROR: Supabase client not initialized")
      return NextResponse.json({ error: "No se pudo conectar con la base de datos" }, { status: 500 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      await logMsg("ERROR: Not authenticated")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    await logMsg("USER_AUTHENTICATED", { userId: user.id })

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name, stripe_customer_id")
      .eq("id", user.id)
      .single()
    const customerEmail = profile?.email || user.email

    if (!customerEmail) {
      await logMsg("ERROR: No email found")
      return NextResponse.json({ error: "Email no encontrado" }, { status: 400 })
    }

    // Identificar URLs base (Stripe requiere URLs absolutas)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "https://presupuestalo.com"

    const { planName, billingType = "monthly" } = await req.json()

    if (!planName || !PLAN_CONFIG[planName as keyof typeof PLAN_CONFIG]) {
      await logMsg("ERROR: Invalid plan", { planName })
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 })
    }

    const config = PLAN_CONFIG[planName as keyof typeof PLAN_CONFIG]
    const billing = billingType as "monthly" | "annual"

    const existingProduct = await findExistingProduct(config.stripeName)

    if (!existingProduct) {
      return NextResponse.json(
        { error: `Producto "${config.stripeName}" no encontrado en Stripe.` },
        { status: 400 }
      )
    }

    const priceId = await findExistingPrice(existingProduct.id, billing)

    if (!priceId) {
      return NextResponse.json(
        { error: `Precio ${billing} no encontrado para "${config.stripeName}".` },
        { status: 400 }
      )
    }

    const sessionData: Stripe.Checkout.SessionCreateParams = {
      customer_email: customerEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/dashboard/ajustes?tab=subscription&success=true`,
      cancel_url: `${baseUrl}/dashboard/ajustes?tab=subscription&canceled=true`,
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
    }

    await logMsg("CREATING_SESSION", {
      userId: user.id,
      priceId,
      baseUrl,
      successUrl: sessionData.success_url
    })

    const session = await stripe.checkout.sessions.create(sessionData)

    await logMsg("SESSION_CREATED", { sessionId: session.id })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    const errorInfo = {
      message: error.message || "Unknown error",
      detail: error.raw?.message || error.type || "No detail",
      stack: (error.stack || "").substring(0, 500)
    }
    await logMsg("FATAL_ERROR", errorInfo)
    console.error("[v0] Create checkout fatal error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

