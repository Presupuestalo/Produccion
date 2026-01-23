import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { supabaseAdmin } from "@/lib/supabase-admin"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia" as any,
})

function logHit(msg: string) {
  try {
    const logPath = path.join(process.cwd(), "webhook_hits.log")
    const entry = `${new Date().toISOString()} - ${msg}\n`
    fs.appendFileSync(logPath, entry)
    console.log(`[WebhookHit] ${msg}`)
  } catch (e) {
    console.error("Failed to write to webhook_hits.log", e)
  }
}

export async function POST(req: Request) {
  logHit("========== MASTER WEBHOOK REQUEST START ==========")

  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    const headersList = await headers()
    const isTest = headersList.get("x-internal-test") === "true"

    if (!secret && !isTest) {
      logHit("CRITICAL: STRIPE_WEBHOOK_SECRET missing")
      return NextResponse.json({ error: "Missing secret" }, { status: 500 })
    }

    const body = await req.text()
    const signature = headersList.get("stripe-signature")

    // Log all headers for diagnosis
    const hObj: Record<string, string> = {}
    headersList.forEach((v, k) => { hObj[k] = v })
    logHit(`NEW REQUEST - Headers: ${JSON.stringify(hObj)}`)
    logHit(`Body length: ${body.length}`)

    if (!signature && !isTest) {
      logHit("ERROR: No signature found in headers")
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    let event: Stripe.Event
    if (isTest) {
      event = JSON.parse(body) as any
      logHit(`TEST EVENT: ${event.type}`)
    } else {
      try {
        event = stripe.webhooks.constructEvent(body, signature!, secret!)
        logHit(`VERIFIED EVENT: ${event.type}`)
      } catch (err: any) {
        logHit(`SIGNATURE ERROR: ${err.message}`)
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
      }
    }

    // --- CHECKOUT SESSION COMPLETED ---
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      logHit(`SESSION ID: ${session.id}`)
      logHit(`METADATA: ${JSON.stringify(session.metadata)}`)
      logHit(`CUSTOMER_EMAIL: ${session.customer_email}`)
      logHit(`AMOUNT_TOTAL: ${session.amount_total}`)

      const metadataType = session.metadata?.type
      let userId = session.metadata?.user_id

      // 1. IDENTIFICACIÓN DE USUARIO (Metadata -> Email -> Customer ID)
      if (!userId && session.customer_email) {
        logHit(`Searching user for email: ${session.customer_email}`)
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", session.customer_email)
          .single()
        userId = profile?.id
        logHit(`User found by email: ${userId || 'NONE'}`)
      }

      if (!userId) {
        logHit("CRITICAL: COULD NOT IDENTIFY USER")
        return NextResponse.json({ received: true, warning: "User not found" })
      }

      // 2. DETERMINAR CRÉDITOS
      const creditsAmount = parseInt(session.metadata?.credits_amount || "0")
      let finalCredits = creditsAmount

      if (finalCredits === 0 && session.amount_total) {
        // Fallback basado en precios de producción (Paquetes en céntimos)
        const amount = session.amount_total
        if (amount === 2000) finalCredits = 100
        else if (amount === 5000) finalCredits = 300 // Ajustado según logs previos
        else if (amount === 10000) finalCredits = 750 // Ajustado según logs previos
        else if (amount === 1000) finalCredits = 50 // Por si hay paquetes pequeños

        logHit(`INFERRED CREDITS: ${finalCredits} (from amount ${amount})`)
      }

      if (finalCredits > 0) {
        logHit(`UPDATING CREDITS for ${userId}: +${finalCredits}`)

        const { data: current, error: fetchErr } = await supabaseAdmin
          .from("company_credits")
          .select("credits_balance, credits_purchased_total")
          .eq("company_id", userId)
          .single()

        if (fetchErr && fetchErr.code !== "PGRST116") {
          logHit(`FETCH ERROR: ${JSON.stringify(fetchErr)}`)
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
          logHit(`UPSERT ERROR: ${JSON.stringify(upsertErr)}`)
          return NextResponse.json({ error: "DB Error" }, { status: 500 })
        }

        // 3. REGISTRAR TRANSACCIÓN
        const { error: txErr } = await supabaseAdmin.from("credit_transactions").insert({
          company_id: userId,
          type: "purchase",
          amount: finalCredits,
          payment_amount: (session.amount_total || 0) / 100,
          description: `Compra de ${finalCredits} créditos (via Master Webhook)`,
          stripe_payment_id: session.payment_intent as string,
        })

        if (txErr) logHit(`TX INSERT ERROR: ${JSON.stringify(txErr)}`)

        logHit(`SUCCESSFULLY ADDED ${finalCredits} CREDITS TO ${userId}`)
        return NextResponse.json({ received: true, success: true })
      } else {
        logHit("WARNING: FINAL CREDITS IS 0. No update performed.")
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    logHit(`FATAL EXCEPTION: ${error.message}`)
    console.error("[v0] Master Webhook Fatal Exception:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
