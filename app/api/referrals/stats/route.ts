export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/referrals/stats - Obtener estadísticas de referidos del usuario
export async function GET() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener código del usuario
    const { data: referralCode } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    // Obtener relaciones de referidos
    const { data: relationships } = await supabase
      .from("referral_relationships")
      .select(`
        *,
        referred:referred_id (
          full_name,
          email,
          created_at
        )
      `)
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false })

    // Obtener recompensas ganadas
    const { data: rewards } = await supabase
      .from("referral_rewards")
      .select("*")
      .eq("user_id", user.id)
      .eq("reward_type", "referrer")
      .eq("status", "granted")

    const totalCreditsEarned = rewards?.reduce((sum, r) => sum + r.credits_amount, 0) || 0

    // Calcular estadísticas
    const stats = {
      code: referralCode?.code || null,
      maxUses: referralCode?.max_uses || 5,
      usesCount: referralCode?.uses_count || 0,
      remainingUses: referralCode ? referralCode.max_uses - referralCode.uses_count : 5,
      totalReferrals: relationships?.length || 0,
      pendingReferrals: relationships?.filter((r) => r.status === "pending").length || 0,
      phoneVerifiedReferrals: relationships?.filter((r) => r.status === "phone_verified").length || 0,
      convertedReferrals: relationships?.filter((r) => r.status === "converted").length || 0,
      rewardedReferrals: relationships?.filter((r) => r.status === "rewarded").length || 0,
      totalCreditsEarned,
      referrals:
        relationships?.map((r) => ({
          id: r.id,
          referredName: r.referred?.full_name || "Usuario",
          referredEmail: r.referred?.email,
          status: r.status,
          plan: r.subscription_plan,
          createdAt: r.created_at,
          rewardedAt: r.rewarded_at,
        })) || [],
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] Error in stats:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

