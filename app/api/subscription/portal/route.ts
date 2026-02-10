export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "No se pudo conectar con la base de datos" }, { status: 500 })
    }
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", session.user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: "No hay cliente de Stripe" }, { status: 400 })
    }

    const origin = req.headers.get("origin")
    const baseUrl = origin || process.env.NEXT_PUBLIC_SITE_URL || "https://presupuestalo.com"

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${baseUrl}/dashboard/ajustes?tab=suscripcion`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error("[v0] Error creating portal session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

