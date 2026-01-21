export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"
import { getPackageById } from "@/lib/credit-packages"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

export async function POST(req: Request) {
  try {
    console.log("[v0] Credits purchase: Starting...")

    const supabase = await createClient()

    // Verificar autenticaciÃ³n
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Credits purchase: Not authenticated")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    console.log("[v0] Credits purchase: User authenticated:", user.id)

    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name, user_type")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.error("[v0] Credits purchase: Profile not found")
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
    }

    // Verificar que sea empresa o profesional
    if (profile.user_type === "homeowner") {
      return NextResponse.json({ error: "Solo empresas y profesionales pueden comprar crÃ©ditos" }, { status: 403 })
    }

    console.log("[v0] Credits purchase: Profile found:", profile.email)

    const { packageId } = await req.json()

    const creditPackage = getPackageById(packageId)
    if (!creditPackage) {
      console.error("[v0] Credits purchase: Invalid package:", packageId)
      return NextResponse.json({ error: "Paquete de crÃ©ditos invÃ¡lido" }, { status: 400 })
    }

    console.log("[v0] Credits purchase: Package:", creditPackage.name, "credits:", creditPackage.credits)

    // Buscar si ya existe un producto con este ID en Stripe
    let priceId: string

    try {
      // Buscar productos existentes con el metadata de nuestro package
      const products = await stripe.products.search({
        query: `metadata['package_id']:'${creditPackage.id}'`,
      })

      if (products.data.length > 0 && products.data[0].default_price) {
        // Usar el precio existente
        priceId = products.data[0].default_price as string
        console.log("[v0] Credits purchase: Found existing price:", priceId)
      } else {
        // Crear producto y precio nuevo
        console.log("[v0] Credits purchase: Creating new product and price...")
        const product = await stripe.products.create({
          name: creditPackage.name,
          description: `${creditPackage.credits} crÃ©ditos para Presmarket`,
          metadata: {
            package_id: creditPackage.id,
            credits: creditPackage.credits.toString(),
          },
        })

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: creditPackage.priceInCents,
          currency: "eur",
          metadata: {
            package_id: creditPackage.id,
            credits: creditPackage.credits.toString(),
          },
        })

        priceId = price.id
        console.log("[v0] Credits purchase: Created new price:", priceId)
      }
    } catch (stripeError: any) {
      console.error("[v0] Credits purchase: Stripe error:", stripeError.message)
      return NextResponse.json({ error: "Error al preparar el pago" }, { status: 500 })
    }

    // Crear sesiÃ³n de checkout con el precio obtenido/creado
    const session = await stripe.checkout.sessions.create({
      customer_email: profile.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/creditos?purchase=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/creditos?canceled=true`,
      metadata: {
        user_id: user.id,
        type: "credits_purchase",
        package_id: creditPackage.id,
        credits_amount: creditPackage.credits.toString(),
      },
    })

    console.log("[v0] Credits purchase: Session created:", session.id)

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("[v0] Credits purchase error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

