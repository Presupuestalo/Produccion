export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

export async function GET() {
  try {
    // Obtener todos los productos activos
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    })

    // Filtrar solo los planes de suscripciÃ³n
    const subscriptionProducts = products.data.filter(
      (p) => p.name.includes("Plan") || p.name.includes("Basic") || p.name.includes("Pro"),
    )

    return NextResponse.json({
      success: true,
      products: subscriptionProducts.map((p) => ({
        id: p.id,
        name: p.name,
        active: p.active,
        metadata: p.metadata,
      })),
    })
  } catch (error: any) {
    console.error("Error getting products:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

