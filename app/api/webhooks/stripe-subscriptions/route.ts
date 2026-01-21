export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { supabaseAdmin } from "@/lib/supabase-admin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

const PLAN_CREDITS: Record<string, number> = {
  basic: 300,
  pro: 500,
}

const REFERRAL_CREDITS: Record<string, number> = {
  basic: 100,
  pro: 150,
}

function getReferralCredits(planType: string): number {
  return REFERRAL_CREDITS[planType.toLowerCase()] || 0
}

async function notifyReferrer(referrerId: string, referredName: string, planType: string, creditsEarned: number) {
  try {
    // Get referrer's email and name
    const { data: referrer } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", referrerId)
      .single()

    if (!referrer?.email) {
      console.log("[v0] Could not find referrer email")
      return
    }

    // Create in-app notification
    await supabaseAdmin.from("notifications").insert({
      user_id: referrerId,
      type: "referral_reward",
      title: "Has ganado créditos por referido",
      message: `${referredName} ha contratado el plan ${planType.charAt(0).toUpperCase() + planType.slice(1)}. Has recibido ${creditsEarned} créditos de recompensa.`,
      data: {
        referred_name: referredName,
        plan_type: planType,
        credits_earned: creditsEarned,
      },
      read: false,
      created_at: new Date().toISOString(),
    })

    console.log("[v0] Notification created for referrer:", referrerId)

    // Optionally send email notification
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://presupuestalo.com"}/api/send-referral-reward-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: referrer.email,
          referrerName: referrer.full_name || "Usuario",
          referredName,
          planType,
          creditsEarned,
        }),
      })
    } catch (emailErr) {
      console.error("[v0] Error sending referral email:", emailErr)
    }
  } catch (error) {
    console.error("[v0] Error notifying referrer:", error)
  }
}

async function grantReferralRewards(
  userId: string,
  planType: string,
): Promise<{
  found: boolean
  rewarded: boolean
  referrerId?: string
  credits?: number
  error?: string
}> {
  try {
    console.log("[v0] Checking referral for user:", userId, "plan:", planType)

    // Only grant rewards for basic or pro plans
    if (planType.toLowerCase() !== "basic" && planType.toLowerCase() !== "pro") {
      console.log("[v0] Plan type not eligible for referral rewards:", planType)
      return { found: false, rewarded: false, error: "plan_not_eligible" }
    }

    // Find if this user was referred and has pending/phone_verified status
    const { data: relationship, error: relError } = await supabaseAdmin
      .from("referral_relationships")
      .select("*")
      .eq("referred_id", userId)
      .in("status", ["pending", "phone_verified"])
      .single()

    if (relError || !relationship) {
      console.log("[v0] No pending referral found for user:", userId, "error:", relError?.message)
      return { found: false, rewarded: false, error: relError?.message || "no_pending_referral" }
    }

    const credits = getReferralCredits(planType)
    if (credits === 0) {
      console.log("[v0] No credits for plan type:", planType)
      return { found: true, rewarded: false, error: "no_credits_for_plan" }
    }

    console.log("[v0] Found referral relationship:", relationship.id, "referrer:", relationship.referrer_id)
    console.log("[v0] Granting referral rewards:", credits, "credits to both users")

    // Get referred user's name for notification
    const { data: referredUser } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single()

    const referredName = referredUser?.full_name || referredUser?.email || "Un usuario"

    // Update relationship to converted
    await supabaseAdmin
      .from("referral_relationships")
      .update({
        status: "converted",
        subscription_plan: planType,
        converted_at: new Date().toISOString(),
      })
      .eq("id", relationship.id)

    // Create reward record for referrer
    await supabaseAdmin.from("referral_rewards").insert({
      referral_relationship_id: relationship.id,
      user_id: relationship.referrer_id,
      reward_type: "referrer",
      credits_amount: credits,
      plan_type: planType,
      status: "pending",
    })

    // Grant credits to referrer
    const { data: referrerCredits } = await supabaseAdmin
      .from("company_credits")
      .select("credits_balance, credits_purchased_total")
      .eq("company_id", relationship.referrer_id)
      .single()

    if (referrerCredits) {
      await supabaseAdmin
        .from("company_credits")
        .update({
          credits_balance: referrerCredits.credits_balance + credits,
          credits_purchased_total: referrerCredits.credits_purchased_total + credits,
          updated_at: new Date().toISOString(),
        })
        .eq("company_id", relationship.referrer_id)
      console.log("[v0] SUCCESS: Referrer credits updated:", referrerCredits.credits_balance + credits)
    } else {
      await supabaseAdmin.from("company_credits").insert({
        company_id: relationship.referrer_id,
        credits_balance: credits,
        credits_purchased_total: credits,
        credits_spent_total: 0,
      })
      console.log("[v0] SUCCESS: Created company_credits for referrer")
    }

    // Grant credits to referred user (the one who just subscribed)
    const { data: referredCredits } = await supabaseAdmin
      .from("company_credits")
      .select("credits_balance, credits_purchased_total")
      .eq("company_id", userId)
      .single()

    if (referredCredits) {
      await supabaseAdmin
        .from("company_credits")
        .update({
          credits_balance: referredCredits.credits_balance + credits,
          credits_purchased_total: referredCredits.credits_purchased_total + credits,
          updated_at: new Date().toISOString(),
        })
        .eq("company_id", userId)
      console.log("[v0] SUCCESS: Referred user credits updated:", referredCredits.credits_balance + credits)
    } else {
      await supabaseAdmin.from("company_credits").insert({
        company_id: userId,
        credits_balance: credits,
        credits_purchased_total: credits,
        credits_spent_total: 0,
      })
      console.log("[v0] SUCCESS: Created company_credits for referred user")
    }

    // Mark reward as granted
    await supabaseAdmin
      .from("referral_rewards")
      .update({
        status: "granted",
        granted_at: new Date().toISOString(),
      })
      .eq("referral_relationship_id", relationship.id)

    // Update relationship to rewarded
    await supabaseAdmin
      .from("referral_relationships")
      .update({
        status: "rewarded",
        rewarded_at: new Date().toISOString(),
      })
      .eq("id", relationship.id)

    // Notificar al referente
    await notifyReferrer(relationship.referrer_id, referredName, planType, credits)

    return {
      found: true,
      rewarded: true,
      referrerId: relationship.referrer_id,
      credits: credits,
    }
  } catch (error: any) {
    console.error("[v0] Error in grantReferralRewards:", error)
    return { found: false, rewarded: false, error: error?.message || "unknown_error" }
  }
}

export async function GET() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  return NextResponse.json({
    status: "Subscription webhook endpoint ready",
    hasWebhookSecret: !!webhookSecret,
    webhookSecretPrefix: webhookSecret ? webhookSecret.substring(0, 15) + "..." : null,
  })
}

export async function POST(req: Request) {
  console.log("[v0] ===== SUBSCRIPTION WEBHOOK RECEIVED =====")

  let body: string
  try {
    body = await req.text()
  } catch (e) {
    console.error("[v0] Error reading body:", e)
    return NextResponse.json({ error: "Error reading body" }, { status: 400 })
  }

  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    console.error("[v0] Missing stripe-signature header")
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET || ""

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log("[v0] Webhook verified successfully! Event type:", event.type)
  } catch (err: any) {
    console.error("[v0] Webhook signature verification failed:", err.message)
    return NextResponse.json(
      {
        error: "Invalid signature",
        details: err.message,
      },
      { status: 400 },
    )
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode !== "subscription") {
          console.log("[v0] Not a subscription checkout, skipping")
          break
        }

        const userId = session.metadata?.user_id
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string
        const planName = session.metadata?.plan_name || "basic"

        if (!userId) {
          console.error("[v0] ERROR: Missing user_id in metadata!")
          if (session.customer_email) {
            const { data: userByEmail } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("email", session.customer_email)
              .single()

            if (userByEmail) {
              await processSubscription(userByEmail.id, subscriptionId, customerId, planName)
            }
          }
          break
        }

        await processSubscription(userId, subscriptionId, customerId, planName)
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice

        if (!invoice.subscription) {
          console.log("[v0] No subscription in invoice, skipping")
          break
        }

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        const priceId = subscription.items.data[0]?.price.id
        const planInfo = await getPlanInfoFromPrice(priceId)
        const customerId = invoice.customer as string

        let userProfile = null

        const { data: userByCustomerId } = await supabaseAdmin
          .from("profiles")
          .select("id, credits, email")
          .eq("stripe_customer_id", customerId)
          .single()

        if (userByCustomerId) {
          userProfile = userByCustomerId
        } else if (invoice.customer_email) {
          const { data: userByEmail } = await supabaseAdmin
            .from("profiles")
            .select("id, credits, email")
            .eq("email", invoice.customer_email)
            .single()

          if (userByEmail) {
            userProfile = userByEmail
            await supabaseAdmin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userProfile.id)
          }
        }

        if (!userProfile) {
          console.log("[v0] ERROR: User not found for customer:", customerId)
          break
        }

        const currentCredits = userProfile.credits || 0
        const minCredits = PLAN_CREDITS[planInfo.plan] || 300
        const newCredits = currentCredits < minCredits ? minCredits : currentCredits

        if (currentCredits < minCredits) {
          await supabaseAdmin
            .from("profiles")
            .update({
              credits: newCredits,
              subscription_plan: planInfo.plan,
            })
            .eq("id", userProfile.id)
        }

        await supabaseAdmin
          .from("user_subscriptions")
          .update({
            status: "active",
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id)

        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const priceId = subscription.items.data[0]?.price.id
        const planInfo = await getPlanInfoFromPrice(priceId)

        const { data: existingSub } = await supabaseAdmin
          .from("user_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single()

        if (existingSub) {
          await supabaseAdmin
            .from("user_subscriptions")
            .update({
              stripe_price_id: priceId,
              plan_id: planInfo.plan,
              billing_type: planInfo.billing,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id)

          await supabaseAdmin
            .from("profiles")
            .update({ subscription_plan: planInfo.plan })
            .eq("id", existingSub.user_id)
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        const { data: existingSub } = await supabaseAdmin
          .from("user_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single()

        if (existingSub) {
          await supabaseAdmin
            .from("user_subscriptions")
            .update({
              status: "canceled",
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id)

          await supabaseAdmin.from("profiles").update({ subscription_plan: "free" }).eq("id", existingSub.user_id)
        }
        break
      }

      default:
        console.log("[v0] Unhandled event type:", event.type)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Webhook processing error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function processSubscription(userId: string, subscriptionId: string, customerId: string, planName: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = subscription.items.data[0]?.price.id
  const planInfo = await getPlanInfoFromPrice(priceId)
  const finalPlan = planName || planInfo.plan

  await supabaseAdmin.from("user_subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      plan_id: finalPlan,
      billing_type: planInfo.billing,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  )

  const { data: companyCredits } = await supabaseAdmin
    .from("company_credits")
    .select("credits_balance")
    .eq("company_id", userId)
    .single()

  const currentCredits = companyCredits?.credits_balance || 0
  const minCredits = PLAN_CREDITS[finalPlan] || 300
  const newCredits = currentCredits < minCredits ? minCredits : currentCredits

  if (currentCredits < minCredits) {
    if (companyCredits) {
      await supabaseAdmin
        .from("company_credits")
        .update({
          credits_balance: newCredits,
          updated_at: new Date().toISOString(),
        })
        .eq("company_id", userId)
    } else {
      await supabaseAdmin.from("company_credits").insert({
        company_id: userId,
        credits_balance: newCredits,
        credits_purchased_total: 0,
        credits_spent_total: 0,
      })
    }
  }

  await supabaseAdmin
    .from("profiles")
    .update({
      subscription_plan: finalPlan,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
    })
    .eq("id", userId)

  await grantReferralRewards(userId, finalPlan)
}

async function getPlanInfoFromPrice(priceId: string): Promise<{ plan: string; billing: string }> {
  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] })
    const product = price.product as Stripe.Product

    if (price.metadata?.plan_key) {
      return {
        plan: price.metadata.plan_key,
        billing: price.metadata.billing_type || (price.recurring?.interval === "year" ? "annual" : "monthly"),
      }
    }

    if (product.metadata?.plan_key) {
      return {
        plan: product.metadata.plan_key,
        billing: price.recurring?.interval === "year" ? "annual" : "monthly",
      }
    }

    const productName = product.name?.toLowerCase() || ""
    let plan = "basic"
    if (productName.includes("pro")) plan = "pro"

    return {
      plan,
      billing: price.recurring?.interval === "year" ? "annual" : "monthly",
    }
  } catch (error) {
    console.error("[v0] Error getting plan info from price:", error)
    return { plan: "basic", billing: "monthly" }
  }
}
