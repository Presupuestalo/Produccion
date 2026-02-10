export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"
import { supabaseAdmin } from "@/lib/supabase-admin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
})



export async function GET() {
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
    const userId = session.user.id

    // 1. Buscar cliente en Stripe
    let stripeCustomer = null
    let stripeSubscriptions: any[] = []
    try {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 })
      if (customers.data.length > 0) {
        stripeCustomer = customers.data[0]
        const subs = await stripe.subscriptions.list({ customer: stripeCustomer.id, limit: 10 })
        stripeSubscriptions = subs.data.map((s) => ({
          id: s.id,
          status: s.status,
          plan: s.items.data[0]?.price.id,
          current_period_end: new Date((s as any).current_period_end * 1000).toISOString(),
        }))
      }
    } catch (e: any) {
      console.error("Stripe error:", e.message)
    }

    // 2. Leer perfil actual
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    // 3. Leer user_subscriptions
    const { data: userSub, error: userSubError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single()

    return NextResponse.json({
      user: {
        id: userId,
        email: userEmail,
      },
      stripe: {
        customer: stripeCustomer
          ? {
            id: stripeCustomer.id,
            email: stripeCustomer.email,
          }
          : null,
        subscriptions: stripeSubscriptions,
      },
      profile: {
        data: profile,
        error: profileError?.message,
      },
      user_subscriptions: {
        data: userSub,
        error: userSubError?.message,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST para forzar actualización
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
    const userId = session.user.id

    // Buscar cliente en Stripe
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 })

    if (customers.data.length === 0) {
      return NextResponse.json({ error: "No hay cliente Stripe con email: " + userEmail }, { status: 404 })
    }

    const customer = customers.data[0]

    // Buscar suscripciones
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: "No hay suscripciones para este cliente" }, { status: 404 })
    }

    const subscription = subscriptions.data[0]
    const priceId = subscription.items.data[0]?.price.id

    // Obtener info del producto
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] })
    const product = price.product as Stripe.Product

    // Detectar plan
    const productName = product.name?.toLowerCase() || ""
    let plan = "basic"
    if (productName.includes("profesional") || productName.includes("pro")) plan = "pro"
    else if (productName.includes("empresa") || productName.includes("business")) plan = "business"

    const billing = price.recurring?.interval === "year" ? "annual" : "monthly"

    // Forzar actualización con SQL directo para evitar problemas de RLS
    const { error: updateError } = await supabaseAdmin.rpc("exec_sql", {
      sql: `
        UPDATE profiles 
        SET 
          subscription_plan = '${plan}',
          stripe_customer_id = '${customer.id}',
          stripe_subscription_id = '${subscription.id}',
          updated_at = NOW()
        WHERE id = '${userId}'::uuid
      `,
    })

    // Si no hay función RPC, intentar update normal
    if (updateError) {
      console.log("RPC failed, trying direct update:", updateError.message)

      const { error: directError } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_plan: plan,
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
        })
        .eq("id", userId)

      if (directError) {
        return NextResponse.json(
          {
            error: "Error actualizando perfil: " + directError.message,
            details: { plan, customer_id: customer.id, subscription_id: subscription.id },
          },
          { status: 500 },
        )
      }
    }

    // Verificar que se actualizó
    const { data: updatedProfile } = await supabaseAdmin
      .from("profiles")
      .select("subscription_plan, stripe_customer_id, stripe_subscription_id")
      .eq("id", userId)
      .single()

    return NextResponse.json({
      success: true,
      updated: {
        plan,
        billing,
        status: subscription.status,
        customer_id: customer.id,
        subscription_id: subscription.id,
      },
      profile_after_update: updatedProfile,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}

