export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Verificar conexión a Supabase
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, subscription_plan_id")
      .limit(1)

    if (profilesError) {
      return NextResponse.json({
        status: "error",
        message: "No se puede conectar a Supabase",
        error: profilesError.message,
      })
    }

    // Verificar que existe la tabla subscription_plans
    const { data: plans, error: plansError } = await supabase
      .from("subscription_plans")
      .select("id, name, display_name")
      .limit(5)

    if (plansError) {
      return NextResponse.json({
        status: "error",
        message: "No se puede acceder a subscription_plans",
        error: plansError.message,
      })
    }

    // Verificar variables de entorno
    const envVars = {
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    }

    return NextResponse.json({
      status: "ok",
      message: "Webhook configurado correctamente",
      checks: {
        supabase_connection: "✅ OK",
        profiles_table: "✅ OK",
        subscription_plans_table: "✅ OK",
        environment_variables: envVars,
      },
      available_plans: plans,
      webhook_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/stripe`,
    })
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: error.message,
      stack: error.stack,
    })
  }
}

