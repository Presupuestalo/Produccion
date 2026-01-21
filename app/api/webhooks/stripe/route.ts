export const dynamic = "force-dynamic"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { supabaseAdmin } from "@/lib/supabase-admin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

const STRIPE_PRODUCT_TO_PLAN: Record<string, string> = {
  // Planes mensuales
  prod_TJcVSyeJ2SwC1v: "basic",
  prod_TJcqqIZj8aG35x: "pro",
  prod_TJcsRCcDAqrER8: "business",
  // Planes anuales
  prod_TMjcUmxdOVfbmk: "basic",
  prod_TMjd5KCD1pDsBW: "pro",
  prod_TMjfLQG7sGX2Hn: "business",
}

const STRIPE_PRICE_TO_PLAN: Record<string, string> = {
  price_1SqLioEQQaEB67RQJQGndw3R: "basic",
  price_1SqLioEQQaEB67RQF8hzdUFQ: "basic",
  price_1SqLiqEQQaEB67RQNljlhUAq: "pro",
  price_1SqLiqEQQaEB67RQEROaUynZ: "pro",
}

const PLAN_CREDIT_RELOAD: Record<string, number> = {
  basic: 300,
  pro: 500,
  business: 1000,
}

export async function POST(req: Request) {
  console.log("[v0] Webhook: === NEW REQUEST ===")

  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret) {
      console.error("[v0] Webhook: STRIPE_WEBHOOK_SECRET not set")
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
    }

    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      console.error("[v0] Webhook: No signature in headers")
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, secret)
      console.log("[v0] Webhook: Verified. Type:", event.type)
    } catch (err: any) {
      console.error("[v0] Webhook: Signature verification failed:", err.message)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice

      if (!invoice.subscription) {
        return NextResponse.json({ received: true })
      }

      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
      const priceId = subscription.items.data[0]?.price?.id
      const productId = subscription.items.data[0]?.price?.product as string

      const planName =
        subscription.metadata?.plan_name || STRIPE_PRICE_TO_PLAN[priceId || ""] || STRIPE_PRODUCT_TO_PLAN[productId || ""]

      if (!planName) {
        return NextResponse.json({ received: true })
      }

      const minCredits = PLAN_CREDIT_RELOAD[planName]
      if (!minCredits) {
        return NextResponse.json({ received: true })
      }

      let userId = subscription.metadata?.user_id

      if (!userId) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, credits")
          .eq("stripe_customer_id", invoice.customer as string)
          .single()

        if (profile) {
          userId = profile.id
          const currentCredits = profile.credits || 0
          if (currentCredits < minCredits) {
            await supabaseAdmin.from("profiles").update({ credits: minCredits }).eq("id", userId)
          }
        }
      } else {
        const { data: profile } = await supabaseAdmin.from("profiles").select("credits").eq("id", userId).single()
        if (profile) {
          const currentCredits = profile.credits || 0
          if (currentCredits < minCredits) {
            await supabaseAdmin.from("profiles").update({ credits: minCredits }).eq("id", userId)
          }
        }
      }

      return NextResponse.json({ received: true })
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      let userId = session.metadata?.user_id
      let planName = session.metadata?.plan_name

      if (!planName && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        userId = userId || subscription.metadata?.user_id
        const priceId = subscription.items.data[0]?.price?.id
        const productId = subscription.items.data[0]?.price?.product as string
        planName = subscription.metadata?.plan_name || STRIPE_PRICE_TO_PLAN[priceId || ""] || STRIPE_PRODUCT_TO_PLAN[productId || ""]
      }

      if (!userId) {
        return NextResponse.json({ error: "No user_id" }, { status: 400 })
      }

      const { data: plan } = await supabaseAdmin
        .from("subscription_plans")
        .select("id, name, display_name")
        .eq("name", planName || "")
        .single()

      if (plan) {
        const minCredits = PLAN_CREDIT_RELOAD[planName || ""] || 0
        const { data: currentProfile } = await supabaseAdmin.from("profiles").select("credits").eq("id", userId).single()
        const currentCredits = currentProfile?.credits || 0
        const newCredits = currentCredits < minCredits ? minCredits : currentCredits

        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_plan_id: plan.id,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            credits: newCredits,
          })
          .eq("id", userId)
      }
    } else if (event.type === "customer.subscription.created") {
      const subscription = event.data.object as Stripe.Subscription
      let userId = subscription.metadata?.user_id
      const priceId = subscription.items.data[0]?.price?.id
      const productId = subscription.items.data[0]?.price?.product as string
      const planName = subscription.metadata?.plan_name || STRIPE_PRICE_TO_PLAN[priceId || ""] || STRIPE_PRODUCT_TO_PLAN[productId || ""]

      if (!userId) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, credits")
          .eq("stripe_customer_id", subscription.customer as string)
          .single()

        if (profile) {
          userId = profile.id
          const minCredits = PLAN_CREDIT_RELOAD[planName || ""]
          if (minCredits && (profile.credits || 0) < minCredits) {
            await supabaseAdmin.from("profiles").update({ credits: minCredits }).eq("id", userId)
          }
        }
      } else {
        const { data: profile } = await supabaseAdmin.from("profiles").select("credits").eq("id", userId).single()
        const minCredits = PLAN_CREDIT_RELOAD[planName || ""]
        if (minCredits && profile && (profile.credits || 0) < minCredits) {
          await supabaseAdmin.from("profiles").update({ credits: minCredits }).eq("id", userId)
        }
      }

      const { data: plan } = await supabaseAdmin
        .from("subscription_plans")
        .select("id")
        .eq("name", planName || "")
        .single()

      if (plan && userId) {
        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_plan_id: plan.id,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
          })
          .eq("id", userId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[v0] Webhook fatal error:", error.message)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
