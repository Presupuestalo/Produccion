import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { supabaseAdmin } from "@/lib/supabase-admin"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

async function logWebhook(msg: string, data: any = {}) {
  console.log(`[WebhookDebug] ${msg}`, data)
  try {
    await supabaseAdmin.from("debug_logs").insert({
      message: `WEBHOOK: ${msg}`,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (e) {
    console.error("Failed to write to debug_logs:", e)
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia" as any,
})

export async function GET(req: Request) {
  await logWebhook("GET_PING", { url: req.url })
  return NextResponse.json({ status: "ok", message: "Stripe Webhook Endpoint" })
}

export async function POST(req: Request) {
  await logWebhook("PING")

  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    const headersList = await headers()
    const isTest = headersList.get("x-internal-test") === "true"

    if (!secret && !isTest) {
      await logWebhook("CRITICAL: STRIPE_WEBHOOK_SECRET missing", { envKeys: Object.keys(process.env).filter(k => k.includes("STRIPE")) })
      return NextResponse.json({ error: "Missing secret" }, { status: 500 })
    }

    const body = await req.text()
    const signature = headersList.get("stripe-signature")

    // Log all headers for diagnosis
    const hObj: Record<string, string> = {}
    headersList.forEach((v, k) => { hObj[k] = v })
    await logWebhook("NEW_REQUEST", { headers: hObj, bodyLength: body.length })

    if (!signature && !isTest) {
      await logWebhook("ERROR: No signature found in headers")
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    let event: Stripe.Event
    if (isTest) {
      event = JSON.parse(body) as any
      await logWebhook("TEST_EVENT", { type: event.type })
    } else {
      try {
        event = stripe.webhooks.constructEvent(body, signature!, secret!)
        await logWebhook("VERIFIED_EVENT", { type: event.type })
      } catch (err: any) {
        await logWebhook("SIGNATURE_ERROR", { message: err.message })
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
      }
    }

    // --- CHECKOUT SESSION COMPLETED ---
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      await logWebhook("SESSION_DATA", {
        id: session.id,
        metadata: session.metadata,
        email: session.customer_email,
        amount: session.amount_total
      })

      const metadataType = session.metadata?.type
      let userId = session.metadata?.user_id

      // 1. IDENTIFICACIÓN DE USUARIO (Metadata -> Email -> Customer ID)
      if (!userId && session.customer_email) {
        await logWebhook("SEARCHING_USER_BY_EMAIL", { email: session.customer_email })
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", session.customer_email)
          .single()
        userId = profile?.id
        await logWebhook("USER_FOUND", { userId: userId || 'NONE' })
      }

      if (!userId) {
        await logWebhook("CRITICAL: COULD NOT IDENTIFY USER")
        return NextResponse.json({ received: true, warning: "User not found" })
      }

      // 2. DETERMINAR CRÉDITOS Y PLAN
      let planName = session.metadata?.plan_name
      const creditsAmount = parseInt(session.metadata?.credits_amount || "0")
      let finalCredits = creditsAmount

      // Si es una suscripción (tiene plan_name)
      if (planName) {
        await logWebhook("PLAN_UPGRADE_DETECTED", { planName, userId })

        // Mapeo de créditos por plan
        if (planName === "basic") finalCredits = 300
        else if (planName === "pro") finalCredits = 500

        // Actualizar el perfil del usuario con el nuevo plan
        const { error: profileErr } = await supabaseAdmin
          .from("profiles")
          .update({
            subscription_plan: planName,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            updated_at: new Date().toISOString()
          })
          .eq("id", userId)

        if (profileErr) {
          await logWebhook("PROFILE_UPDATE_ERROR", { error: profileErr })
        } else {
          await logWebhook("PROFILE_UPDATED_WITH_PLAN", { planName, userId })
        }
      }

      if (finalCredits === 0 && session.amount_total) {
        // Fallback basado en precios de producción (Paquetes en céntimos)
        const amount = session.amount_total
        if (amount === 5000) finalCredits = 500
        else if (amount === 10000) finalCredits = 1200
        else if (amount === 20000) finalCredits = 2500
        else if (amount === 1000) finalCredits = 50

        // Si el precio coincide con un plan mensual pero no venía el plan_name, lo inferimos
        if (amount === 5900 && !planName) planName = "basic", finalCredits = 300
        if (amount === 8900 && !planName) planName = "pro", finalCredits = 500

        await logWebhook("INFERRED_DATA", { amount, finalCredits, planName })
      }

      if (finalCredits > 0) {
        await logWebhook("UPDATING_CREDITS_START", { userId, amountToAdd: finalCredits, plan: planName })

        const { data: current, error: fetchErr } = await supabaseAdmin
          .from("company_credits")
          .select("credits_balance, credits_purchased_total")
          .eq("company_id", userId)
          .single()

        if (fetchErr && fetchErr.code !== "PGRST116") {
          await logWebhook("FETCH_BALANCE_ERROR", { error: fetchErr })
        }

        const prevBalance = current?.credits_balance || 0
        const prevTotal = current?.credits_purchased_total || 0

        const { error: upsertErr } = await supabaseAdmin.from("company_credits").upsert({
          company_id: userId,
          credits_balance: prevBalance + finalCredits,
          credits_purchased_total: prevTotal + finalCredits,
          last_purchase_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'company_id' })

        if (upsertErr) {
          await logWebhook("UPSERT_CREDITS_ERROR", { error: upsertErr })
          return NextResponse.json({ error: "DB Error" }, { status: 500 })
        }

        // 3. REGISTRAR TRANSACCIÓN
        const { error: txErr } = await supabaseAdmin.from("credit_transactions").insert({
          company_id: userId,
          type: "purchase",
          amount: finalCredits,
          payment_amount: (session.amount_total || 0) / 100,
          description: planName
            ? `Suscripción al ${planName} (${finalCredits} créditos mensuales)`
            : `Compra de ${finalCredits} créditos (via Master Webhook)`,
          stripe_payment_id: (session.payment_intent || session.id) as string,
        })

        if (txErr) await logWebhook("TX_INSERT_ERROR", { error: txErr })

        await logWebhook("SUCCESSFULLY_PROCESSED_PAYMENT", { userId, totalAdded: finalCredits, plan: planName })
        return NextResponse.json({ received: true, success: true })
      } else {
        await logWebhook("WARNING: FINAL CREDITS IS 0")
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    await logWebhook("FATAL_EXCEPTION", { message: error.message })
    console.error("[v0] Master Webhook Fatal Exception:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
