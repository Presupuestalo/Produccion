import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await supabase.from("subscription_plans").select("id, name, display_name").limit(1)

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
    const Stripe = require("stripe")
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-11-20.acacia",
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

  return NextResponse.json(diagnostics, { status: 200 })
}
