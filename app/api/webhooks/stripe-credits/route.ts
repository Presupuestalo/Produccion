import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { getPackageById } from "@/lib/credit-packages"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

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

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

async function sendPurchaseConfirmationEmail(
  email: string,
  name: string,
  creditsAmount: number,
  pricePaid: number,
  newBalance: number,
) {
  console.log("[v0] ===== ENVIANDO EMAIL CONFIRMACIÓN COMPRA =====")
  console.log("[v0] Destinatario:", email)
  console.log("[v0] Datos:", { name, creditsAmount, pricePaid, newBalance })

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://presupuestalo.com"
    console.log("[v0] Llamando a:", `${siteUrl}/api/email/send`)

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

    const result = await response.json()
    console.log("[v0] Respuesta API email:", response.status, result)

    if (response.ok) {
      console.log("[v0] Email enviado exitosamente!")
      return true
    } else {
      console.error("[v0] Error en API email:", result.error)
      return false
    }
  } catch (error: any) {
    console.error("[v0] Error enviando email:", error.message)
    return false
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Webhook endpoint ready",
    hasWebhookSecret: !!webhookSecret,
    webhookSecretPrefix: webhookSecret ? webhookSecret.substring(0, 15) + "..." : "NOT SET",
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
  })
}

export async function POST(req: Request) {
  console.log("[v0] ========== WEBHOOK STRIPE CREDITS ==========")
  console.log("[v0] Timestamp:", new Date().toISOString())

  try {
    if (!webhookSecret) {
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
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log("[v0] Event type:", event.type)
    } catch (err: any) {
      console.error("[v0] Signature verification FAILED:", err.message)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      console.log("[v0] Session metadata:", JSON.stringify(session.metadata, null, 2))

      const metadataType = session.metadata?.type
      if (metadataType !== "credits_purchase" && metadataType !== "credit_purchase") {
        console.log("[v0] NOT a credits purchase, skipping")
        return NextResponse.json({ received: true, skipped: "not_credits_purchase" })
      }

      const userId = session.metadata?.user_id
      const packageId = session.metadata?.package_id
      const creditsAmount = Number.parseInt(session.metadata?.credits_amount || "0")

      console.log("[v0] Processing:", { userId, packageId, creditsAmount })

      if (!userId || !creditsAmount) {
        console.error("[v0] Missing user_id or credits_amount")
        return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
      }

      const creditPackage = packageId ? getPackageById(packageId) : null
      const pricePaid = creditPackage ? creditPackage.priceInCents / 100 : session.amount_total! / 100

      // Obtener datos del usuario
      const { data: profileData } = await supabaseAdmin
        .from("profiles")
        .select("email, full_name, company_name")
        .eq("id", userId)
        .single()

      const userEmail = profileData?.email || session.customer_email
      const userName = profileData?.company_name || profileData?.full_name || ""

      console.log("[v0] User:", { email: userEmail, name: userName })

      // Buscar créditos actuales
      const { data: currentCredits, error: fetchError } = await supabaseAdmin
        .from("company_credits")
        .select("credits_balance, credits_purchased_total")
        .eq("company_id", userId)
        .single()

      let newBalance = creditsAmount

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("[v0] Error fetching credits:", fetchError.message)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }

      if (!currentCredits) {
        const { error: insertError } = await supabaseAdmin.from("company_credits").insert({
          company_id: userId,
          credits_balance: creditsAmount,
          credits_purchased_total: creditsAmount,
          last_purchase_at: new Date().toISOString(),
        })

        if (insertError) {
          console.error("[v0] Error inserting credits:", insertError.message)
          return NextResponse.json({ error: "Database insert error" }, { status: 500 })
        }
        newBalance = creditsAmount
      } else {
        newBalance = (currentCredits.credits_balance || 0) + creditsAmount
        const newTotal = (currentCredits.credits_purchased_total || 0) + creditsAmount

        const { error: updateError } = await supabaseAdmin
          .from("company_credits")
          .update({
            credits_balance: newBalance,
            credits_purchased_total: newTotal,
            last_purchase_at: new Date().toISOString(),
          })
          .eq("company_id", userId)

        if (updateError) {
          console.error("[v0] Error updating credits:", updateError.message)
          return NextResponse.json({ error: "Database update error" }, { status: 500 })
        }
      }

      console.log("[v0] Credits updated. New balance:", newBalance)

      // Registrar transacción
      const { error: txError } = await supabaseAdmin.from("credit_transactions").insert({
        company_id: userId,
        type: "purchase",
        amount: creditsAmount,
        payment_amount: pricePaid,
        description: creditPackage
          ? `Compra ${creditPackage.name} - ${creditsAmount} créditos`
          : `Compra de ${creditsAmount} créditos`,
        stripe_payment_id: session.payment_intent as string,
      })

      if (txError) {
        console.error("[v0] Transaction record failed:", txError.message)
      }

      // Enviar email de confirmación
      if (userEmail) {
        await sendPurchaseConfirmationEmail(userEmail, userName, creditsAmount, pricePaid, newBalance)
      }

      console.log("[v0] ========== WEBHOOK COMPLETED ==========")
    }

    return NextResponse.json({ received: true, success: true })
  } catch (error: any) {
    console.error("[v0] Fatal error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
