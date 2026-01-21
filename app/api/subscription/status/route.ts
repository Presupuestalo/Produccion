export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("[v0] Fetching subscription status for user:", session.user.id)

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, stripe_subscription_id, is_admin, subscription_plan")
      .eq("id", session.user.id)
      .single()

    console.log("[v0] Profile data:", profile)

    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
    }

    // Si no tiene stripe_customer_id, es usuario free
    if (!profile?.stripe_customer_id) {
      console.log("[v0] Usuario free sin stripe_customer_id")
      return NextResponse.json({
        plan: profile.subscription_plan || "free",
        status: "inactive",
        current_period_end: null,
        cancel_at_period_end: false,
        is_admin: profile.is_admin || false,
      })
    }

    let subscription = null
    if (profile.stripe_subscription_id) {
      try {
        subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      } catch (stripeError: any) {
        console.error("[v0] Error fetching Stripe subscription:", stripeError.message)
      }
    }

    return NextResponse.json({
      plan: profile.subscription_plan || "free",
      status: subscription?.status || "active",
      current_period_end: subscription?.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription?.cancel_at_period_end || false,
      stripe_customer_id: profile.stripe_customer_id,
      is_admin: profile.is_admin || false,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching subscription status:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

