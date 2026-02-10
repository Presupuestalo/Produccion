export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import Stripe from "stripe"

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "✓ Set" : "✗ Missing",
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? "✓ Set" : "✗ Missing",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ Set" : "✗ Missing",
    },
    tests: {} as Record<string, any>,
  }

  // Test Supabase connection
  try {
    const { data, error } = await supabaseAdmin.from("subscription_plans").select("id, name, display_name").limit(1)

    diagnostics.tests.supabase = {
      status: error ? "✗ Failed" : "✓ Connected",
      error: error?.message,
      sampleData: data,
    }
  } catch (err: any) {
    diagnostics.tests.supabase = {
      status: "✗ Error",
      error: err.message,
    }
  }

  // Test Stripe connection
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-11-17.clover",
    })

    const products = await stripe.products.list({ limit: 1 })
    diagnostics.tests.stripe = {
      status: "✓ Connected",
      sampleProduct: products.data[0]?.name,
    }
  } catch (err: any) {
    diagnostics.tests.stripe = {
      status: "✗ Error",
      error: err.message,
    }
  }

  return NextResponse.json(diagnostics)
}
