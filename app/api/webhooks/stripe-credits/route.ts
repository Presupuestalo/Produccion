export const dynamic = "force-dynamic"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getPackageById } from "@/lib/credit-packages"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

async function sendPurchaseConfirmationEmail(
  email: string,
  name: string,
  creditsAmount: number,
  pricePaid: number,
  newBalance: number,
) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://presupuestalo.com"

    const response = await fetch(`${siteUrl}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: `✅ Compra confirmada: ${creditsAmount.toLocaleString()} créditos añadidos`,
        template: "credit-purchase-confirmation",
        data: {
          userName: name,
          creditsAmount,
          pricePaid,
          newBalance,
        },
      }),
    })

    return response.ok
  } catch (error: any) {
    console.error("[v0] Error enviando email:", error.message)
    return false
  }
}

export async function GET() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  return NextResponse.json({
    status: "Webhook endpoint ready",
    hasWebhookSecret: !!webhookSecret,
  })
}

export async function POST(req: Request) {
  console.log("[v0] ========== WEBHOOK STRIPE CREDITS ==========")

  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret) {
      console.error("[v0] STRIPE_WEBHOOK_SECRET not set")
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
    }

    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      console.error("[v0] No signature in headers")
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, secret)
    } catch (err: any) {
      console.error("[v0] Signature verification FAILED:", err.message)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const metadataType = session.metadata?.type

      if (metadataType !== "credits_purchase" && metadataType !== "credit_purchase") {
        return NextResponse.json({ received: true })
      }

      const userId = session.metadata?.user_id
      const packageId = session.metadata?.package_id
      const creditsAmount = Number.parseInt(session.metadata?.credits_amount || "0")

      if (!userId || !creditsAmount) {
        return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
      }

      const creditPackage = packageId ? getPackageById(packageId) : null
      const pricePaid = creditPackage ? creditPackage.priceInCents / 100 : (session.amount_total || 0) / 100

      const { data: profileData } = await supabaseAdmin
        .from("profiles")
        .select("email, full_name, company_name")
        .eq("id", userId)
        .single()

      const userEmail = profileData?.email || session.customer_email
      const userName = profileData?.company_name || profileData?.full_name || ""

      const { data: currentCredits } = await supabaseAdmin
        .from("company_credits")
        .select("credits_balance, credits_purchased_total")
        .eq("company_id", userId)
        .single()

      let newBalance = creditsAmount

      if (!currentCredits) {
        await supabaseAdmin.from("company_credits").insert({
          company_id: userId,
          credits_balance: creditsAmount,
          credits_purchased_total: creditsAmount,
          last_purchase_at: new Date().toISOString(),
        })
      } else {
        newBalance = (currentCredits.credits_balance || 0) + creditsAmount
        const newTotal = (currentCredits.credits_purchased_total || 0) + creditsAmount

        await supabaseAdmin
          .from("company_credits")
          .update({
            credits_balance: newBalance,
            credits_purchased_total: newTotal,
            last_purchase_at: new Date().toISOString(),
          })
          .eq("company_id", userId)
      }

      await supabaseAdmin.from("credit_transactions").insert({
        company_id: userId,
        type: "purchase",
        amount: creditsAmount,
        payment_amount: pricePaid,
        description: creditPackage
          ? `Compra ${creditPackage.name} - ${creditsAmount} créditos`
          : `Compra de ${creditsAmount} créditos`,
        stripe_payment_id: session.payment_intent as string,
      })

      if (userEmail) {
        await sendPurchaseConfirmationEmail(userEmail, userName, creditsAmount, pricePaid, newBalance)
      }
    }

    return NextResponse.json({ received: true, success: true })
  } catch (error: any) {
    console.error("[v0] Fatal error:", error.message)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
