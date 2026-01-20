import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Check if webhook secret is configured
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      return NextResponse.json(
        {
          configured: false,
          message: "STRIPE_WEBHOOK_SECRET no está configurado",
          instructions: "Añade la variable de entorno STRIPE_WEBHOOK_SECRET con el signing secret de Stripe",
        },
        { status: 500 },
      )
    }

    // Check if we can access the database
    const { data: profile, error } = await supabase.from("profiles").select("subscription_plan").limit(1).single()

    if (error) {
      return NextResponse.json(
        {
          configured: true,
          database: false,
          message: "No se puede acceder a la base de datos",
          error: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      configured: true,
      database: true,
      message: "Todo está configurado correctamente",
      webhookSecret: webhookSecret.substring(0, 10) + "...",
      instructions: [
        "1. Configura el webhook en Stripe Dashboard",
        "2. URL: https://tu-dominio.vercel.app/api/webhooks/stripe",
        "3. Eventos: checkout.session.completed, customer.subscription.*",
        "4. Prueba con un pago de test",
      ],
    })
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        message: "Error al verificar configuración",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
