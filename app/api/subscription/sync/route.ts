export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"
import { supabaseAdmin } from "@/lib/supabase-admin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})



export async function POST() {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userEmail = session.user.email
    console.log("[v0] Syncing subscription for:", userEmail)

    // Buscar cliente en Stripe por email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    })

    if (customers.data.length === 0) {
      return NextResponse.json({ error: "No se encontrÃ³ cliente en Stripe" }, { status: 404 })
    }

    const customer = customers.data[0]
    console.log("[v0] Found Stripe customer:", customer.id)

    // Buscar suscripciones activas del cliente
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      // Buscar tambiÃ©n trialing o past_due
      const allSubs = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 1,
      })

      if (allSubs.data.length === 0) {
        return NextResponse.json({ error: "No se encontraron suscripciones" }, { status: 404 })
      }

      subscriptions.data = allSubs.data
    }

    const subscription = subscriptions.data[0]
    const priceId = subscription.items.data[0]?.price.id

    // Obtener info del producto
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] })
    const product = price.product as Stripe.Product

    // Detectar plan por nombre del producto
    const productName = product.name?.toLowerCase() || ""
    let plan = "basic"
    if (productName.includes("profesional") || productName.includes("pro")) plan = "pro"
    else if (productName.includes("empresa") || productName.includes("business")) plan = "business"
    else if (productName.includes("bÃ¡sico") || productName.includes("basic")) plan = "basic"

    const billing = price.recurring?.interval === "year" ? "annual" : "monthly"

    console.log("[v0] Subscription found:", {
      subscriptionId: subscription.id,
      priceId,
      productName: product.name,
      plan,
      billing,
      status: subscription.status,
    })

    // Actualizar perfil
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_plan: plan,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
      })
      .eq("id", session.user.id)

    if (profileError) {
      console.error("[v0] Error updating profile:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Actualizar/crear en user_subscriptions
    const { error: subError } = await supabaseAdmin.from("user_subscriptions").upsert(
      {
        user_id: session.user.id,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        plan_id: plan,
        billing_type: billing,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )

    if (subError) {
      console.error("[v0] Error updating user_subscriptions:", subError)
    }

    return NextResponse.json({
      success: true,
      plan,
      billing,
      status: subscription.status,
      customer_id: customer.id,
      subscription_id: subscription.id,
    })
  } catch (error: any) {
    console.error("[v0] Error syncing subscription:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

