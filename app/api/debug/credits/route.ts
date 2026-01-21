import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

// GET - Check credits status for a user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")
  const userId = searchParams.get("user_id")

  try {
    let targetUserId = userId

    // If email provided, find user_id
    if (email && !userId) {
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

      if (authError) {
        return NextResponse.json({ error: "Error listing users", details: authError.message }, { status: 500 })
      }

      const user = authUsers.users.find((u) => u.email === email)
      if (!user) {
        return NextResponse.json({ error: "User not found with email: " + email }, { status: 404 })
      }
      targetUserId = user.id
    }

    if (!targetUserId) {
      return NextResponse.json(
        {
          error: "Provide email or user_id parameter",
          usage: "/api/debug/credits?email=user@example.com or /api/debug/credits?user_id=xxx",
        },
        { status: 400 },
      )
    }

    // Check company_credits table
    const { data: credits, error: creditsError } = await supabaseAdmin
      .from("company_credits")
      .select("*")
      .eq("company_id", targetUserId)
      .single()

    // Check credit_transactions table
    const { data: transactions, error: transError } = await supabaseAdmin
      .from("credit_transactions")
      .select("*")
      .eq("company_id", targetUserId)
      .order("created_at", { ascending: false })
      .limit(10)

    // Check profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .single()

    return NextResponse.json({
      user_id: targetUserId,
      email: email,
      profile: profile || { error: profileError?.message },
      credits: credits || { error: creditsError?.message, code: creditsError?.code },
      recent_transactions: transactions || { error: transError?.message },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Manually add credits for testing
export async function POST(request: Request) {
  try {
    const { email, user_id, credits_to_add } = await request.json()

    if (!credits_to_add || credits_to_add <= 0) {
      return NextResponse.json({ error: "credits_to_add must be a positive number" }, { status: 400 })
    }

    let targetUserId = user_id

    // If email provided, find user_id
    if (email && !user_id) {
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

      if (authError) {
        return NextResponse.json({ error: "Error listing users", details: authError.message }, { status: 500 })
      }

      const user = authUsers.users.find((u) => u.email === email)
      if (!user) {
        return NextResponse.json({ error: "User not found with email: " + email }, { status: 404 })
      }
      targetUserId = user.id
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "Provide email or user_id" }, { status: 400 })
    }

    console.log(`[v0] Adding ${credits_to_add} credits to user ${targetUserId}`)

    // Check if credits record exists
    const { data: existingCredits, error: checkError } = await supabaseAdmin
      .from("company_credits")
      .select("*")
      .eq("company_id", targetUserId)
      .single()

    console.log("[v0] Existing credits:", existingCredits, "Error:", checkError?.message)

    let result
    if (existingCredits) {
      // Update existing
      const newBalance = (existingCredits.balance || 0) + credits_to_add
      const { data, error } = await supabaseAdmin
        .from("company_credits")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("company_id", targetUserId)
        .select()
        .single()

      console.log("[v0] Update result:", data, "Error:", error?.message)
      result = { action: "updated", data, error: error?.message }
    } else {
      // Insert new
      const { data, error } = await supabaseAdmin
        .from("company_credits")
        .insert({
          company_id: targetUserId,
          balance: credits_to_add,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      console.log("[v0] Insert result:", data, "Error:", error?.message)
      result = { action: "inserted", data, error: error?.message }
    }

    // Also record transaction
    const { data: transData, error: transError } = await supabaseAdmin
      .from("credit_transactions")
      .insert({
        company_id: targetUserId,
        amount: credits_to_add,
        type: "purchase",
        description: "Manual test credit addition",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    console.log("[v0] Transaction result:", transData, "Error:", transError?.message)

    return NextResponse.json({
      success: true,
      user_id: targetUserId,
      credits_added: credits_to_add,
      result,
      transaction: transData || { error: transError?.message },
    })
  } catch (error: any) {
    console.log("[v0] Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
