import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

const STRIPE_PRODUCT_TO_PLAN: Record<string, string> = {
  // Planes mensuales
  prod_TJcVSyeJ2SwC1v: "basic",
  prod_TJcqqIZj8aG35x: "pro",
  prod_TJcsRCcDAqrER8: "business",
  // Planes anuales (mapean al mismo plan, la diferencia está en el billing_type)
  prod_TMjcUmxdOVfbmk: "basic",
  prod_TMjd5KCD1pDsBW: "pro",
  prod_TMjfLQG7sGX2Hn: "business",
}

const STRIPE_PRICE_TO_PLAN: Record<string, string> = {
  // Nuevos precios (59€ y 89€)
  price_1SqLioEQQaEB67RQJQGndw3R: "basic", // Basic Monthly
  price_1SqLioEQQaEB67RQF8hzdUFQ: "basic", // Basic Yearly
  price_1SqLiqEQQaEB67RQNljlhUAq: "pro", // Pro Monthly
  price_1SqLiqEQQaEB67RQEROaUynZ: "pro", // Pro Yearly
}

const PLAN_CREDIT_RELOAD: Record<string, number> = {
  basic: 300,
  pro: 500,
  business: 1000, // Por si acaso
}

export async function POST(req: Request) {
  console.log("[v0] Webhook: === NEW REQUEST ===")

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("[v0] Webhook: STRIPE_WEBHOOK_SECRET not set")
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[v0] Webhook: Supabase credentials not set")
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const body = await req.text()
    console.log("[v0] Webhook: Body received, length:", body.length)

    const headersList = await headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      console.error("[v0] Webhook: No signature in headers")
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    console.log("[v0] Webhook: Signature found")

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
      console.log("[v0] Webhook: ✅ Signature verified")
      console.log("[v0] Webhook: Event type:", event.type)
    } catch (err: any) {
      console.error("[v0] Webhook: ❌ Signature verification failed:", err.message)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice
      console.log("[v0] Webhook: Processing invoice payment succeeded:", invoice.id)

      // Solo procesar facturas de suscripción (no pagos únicos)
      if (!invoice.subscription) {
        console.log("[v0] Webhook: Invoice is not from a subscription, skipping credit reload")
        return NextResponse.json({ received: true })
      }

      // Obtener la suscripción para saber el plan
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
      console.log("[v0] Webhook: Subscription ID:", subscription.id)
      console.log("[v0] Webhook: Subscription metadata:", JSON.stringify(subscription.metadata))

      const priceId = subscription.items.data[0]?.price?.id
      const productId = subscription.items.data[0]?.price?.product as string
      console.log("[v0] Webhook: Price ID:", priceId)
      console.log("[v0] Webhook: Product ID:", productId)

      const planName =
        subscription.metadata?.plan_name || STRIPE_PRICE_TO_PLAN[priceId] || STRIPE_PRODUCT_TO_PLAN[productId]

      if (!planName) {
        console.log("[v0] Webhook: Could not determine plan name, skipping credit reload")
        return NextResponse.json({ received: true })
      }

      console.log("[v0] Webhook: Plan name:", planName)

      // Obtener el mínimo de créditos para este plan
      const minCredits = PLAN_CREDIT_RELOAD[planName]
      if (!minCredits) {
        console.log("[v0] Webhook: No credit reload configured for plan:", planName)
        return NextResponse.json({ received: true })
      }

      console.log("[v0] Webhook: Min credits for plan", planName, ":", minCredits)

      // Buscar el usuario por customer_id o metadata
      let userId = subscription.metadata?.user_id

      if (!userId) {
        console.log("[v0] Webhook: No user_id in subscription metadata, searching by customer_id...")
        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("id, credits")
          .eq("stripe_customer_id", invoice.customer as string)
          .single()

        if (profileError || !profile) {
          console.error("[v0] Webhook: User not found by customer_id:", profileError?.message)
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        userId = profile.id
        console.log("[v0] Webhook: Found user by customer_id:", userId, "Current credits:", profile.credits)

        // Aplicar la lógica de recarga
        const currentCredits = profile.credits || 0
        if (currentCredits < minCredits) {
          const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({ credits: minCredits })
            .eq("id", userId)

          if (updateError) {
            console.error("[v0] Webhook: Failed to update credits:", updateError.message)
            return NextResponse.json({ error: "Failed to update credits" }, { status: 500 })
          }

          console.log("[v0] Webhook: ✅ Credits recharged from", currentCredits, "to", minCredits, "for user", userId)
        } else {
          console.log("[v0] Webhook: User has", currentCredits, "credits (>=", minCredits, "), no reload needed")
        }
      } else {
        // Obtener créditos actuales del usuario
        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("credits")
          .eq("id", userId)
          .single()

        if (profileError || !profile) {
          console.error("[v0] Webhook: User not found:", profileError?.message)
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        console.log("[v0] Webhook: User", userId, "current credits:", profile.credits)

        // Aplicar la lógica de recarga
        const currentCredits = profile.credits || 0
        if (currentCredits < minCredits) {
          const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({ credits: minCredits })
            .eq("id", userId)

          if (updateError) {
            console.error("[v0] Webhook: Failed to update credits:", updateError.message)
            return NextResponse.json({ error: "Failed to update credits" }, { status: 500 })
          }

          console.log("[v0] Webhook: ✅ Credits recharged from", currentCredits, "to", minCredits, "for user", userId)
        } else {
          console.log("[v0] Webhook: User has", currentCredits, "credits (>=", minCredits, "), no reload needed")
        }
      }

      return NextResponse.json({ received: true })
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      console.log("[v0] Webhook: Processing checkout session:", session.id)
      console.log("[v0] Webhook: Session metadata:", JSON.stringify(session.metadata))
      console.log("[v0] Webhook: Subscription ID:", session.subscription)

      let userId = session.metadata?.user_id
      let planName = session.metadata?.plan_name

      if (!planName && session.subscription) {
        console.log("[v0] Webhook: No plan_name in session, fetching subscription...")
        try {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          console.log("[v0] Webhook: Subscription metadata:", JSON.stringify(subscription.metadata))
          userId = userId || subscription.metadata?.user_id

          const priceId = subscription.items.data[0]?.price?.id
          const productId = subscription.items.data[0]?.price?.product as string
          console.log("[v0] Webhook: Price ID:", priceId)
          console.log("[v0] Webhook: Product ID:", productId)

          planName =
            subscription.metadata?.plan_name || STRIPE_PRICE_TO_PLAN[priceId] || STRIPE_PRODUCT_TO_PLAN[productId]
        } catch (err: any) {
          console.error("[v0] Webhook: Failed to fetch subscription:", err.message)
        }
      }

      if (!userId) {
        console.error("[v0] Webhook: No user_id in session or subscription metadata")
        return NextResponse.json({ error: "No user_id" }, { status: 400 })
      }

      console.log("[v0] Webhook: User ID:", userId, "Plan:", planName)

      const { data: plan, error: planError } = await supabaseAdmin
        .from("subscription_plans")
        .select("id, name, display_name")
        .eq("name", planName)
        .single()

      if (planError || !plan) {
        console.error("[v0] Webhook: Plan not found:", planError?.message)
        return NextResponse.json({ error: "Plan not found" }, { status: 404 })
      }

      console.log("[v0] Webhook: Found plan:", plan.display_name, "(ID:", plan.id, ")")

      const minCredits = PLAN_CREDIT_RELOAD[planName || ""] || 0
      const { data: currentProfile } = await supabaseAdmin.from("profiles").select("credits").eq("id", userId).single()

      const currentCredits = currentProfile?.credits || 0
      const newCredits = currentCredits < minCredits ? minCredits : currentCredits

      console.log(
        "[v0] Webhook: Current credits:",
        currentCredits,
        "Min credits:",
        minCredits,
        "New credits:",
        newCredits,
      )

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_plan_id: plan.id,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          credits: newCredits, // Actualizar créditos junto con la suscripción
        })
        .eq("id", userId)

      if (updateError) {
        console.error("[v0] Webhook: Update failed:", updateError.message)
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
      }

      console.log(
        "[v0] Webhook: ✅ SUCCESS! User",
        userId,
        "upgraded to",
        plan.display_name,
        "with",
        newCredits,
        "credits",
      )
    } else if (event.type === "customer.subscription.created") {
      const subscription = event.data.object as Stripe.Subscription
      console.log("[v0] Webhook: Processing subscription created:", subscription.id)
      console.log("[v0] Webhook: Subscription metadata:", JSON.stringify(subscription.metadata))
      console.log("[v0] Webhook: Customer ID:", subscription.customer)

      let userId = subscription.metadata?.user_id

      const priceId = subscription.items.data[0]?.price?.id
      const productId = subscription.items.data[0]?.price?.product as string
      console.log("[v0] Webhook: Price ID:", priceId)
      console.log("[v0] Webhook: Product ID:", productId)

      const planName =
        subscription.metadata?.plan_name || STRIPE_PRICE_TO_PLAN[priceId] || STRIPE_PRODUCT_TO_PLAN[productId]

      if (!userId) {
        console.log("[v0] Webhook: No user_id in metadata, searching by customer_id...")
        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("id, credits")
          .eq("stripe_customer_id", subscription.customer as string)
          .single()

        if (profileError || !profile) {
          console.error("[v0] Webhook: User not found by customer_id:", profileError?.message)
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        userId = profile.id
        console.log("[v0] Webhook: Found user by customer_id:", userId)

        const minCredits = PLAN_CREDIT_RELOAD[planName]
        if (minCredits) {
          const currentCredits = profile.credits || 0
          if (currentCredits < minCredits) {
            await supabaseAdmin.from("profiles").update({ credits: minCredits }).eq("id", userId)
            console.log("[v0] Webhook: ✅ Initial credits set to", minCredits, "for new subscriber", userId)
          }
        }
      } else {
        const { data: profile } = await supabaseAdmin.from("profiles").select("credits").eq("id", userId).single()

        const minCredits = PLAN_CREDIT_RELOAD[planName]
        if (minCredits && profile) {
          const currentCredits = profile.credits || 0
          if (currentCredits < minCredits) {
            await supabaseAdmin.from("profiles").update({ credits: minCredits }).eq("id", userId)
            console.log("[v0] Webhook: ✅ Initial credits set to", minCredits, "for new subscriber", userId)
          }
        }
      }

      console.log("[v0] Webhook: User ID:", userId, "Plan:", planName)

      const { data: plan, error: planError } = await supabaseAdmin
        .from("subscription_plans")
        .select("id, name, display_name")
        .eq("name", planName)
        .single()

      if (planError || !plan) {
        console.error("[v0] Webhook: Plan not found:", planError?.message)
        return NextResponse.json({ error: "Plan not found" }, { status: 404 })
      }

      console.log("[v0] Webhook: Found plan:", plan.display_name, "(ID:", plan.id, ")")

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_plan_id: plan.id,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
        })
        .eq("id", userId)

      if (updateError) {
        console.error("[v0] Webhook: Update failed:", updateError.message)
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
      }

      console.log("[v0] Webhook: ✅ SUCCESS! User", userId, "upgraded to", plan.display_name)
    } else {
      console.log("[v0] Webhook: Unhandled event type:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[v0] Webhook: ❌ FATAL ERROR:", error.message)
    console.error("[v0] Webhook: Stack:", error.stack)
    return NextResponse.json({ error: "Internal error", details: error.message }, { status: 500 })
  }
}
