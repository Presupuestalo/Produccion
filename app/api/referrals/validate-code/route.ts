import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// POST /api/referrals/validate-code - Validar código de referido
export async function POST(req: Request) {
  try {
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json({ error: "Código requerido" }, { status: 400 })
    }

    // Buscar código
    const { data: referralCode, error } = await supabaseAdmin
      .from("referral_codes")
      .select(`
        *,
        profiles:user_id (
          full_name,
          company_name
        )
      `)
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single()

    if (error || !referralCode) {
      return NextResponse.json(
        {
          valid: false,
          error: "Código de referido no válido o expirado",
        },
        { status: 404 },
      )
    }

    // Verificar límite de usos
    if (referralCode.uses_count >= referralCode.max_uses) {
      return NextResponse.json(
        {
          valid: false,
          error: "Este código ha alcanzado el límite máximo de usos",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      valid: true,
      referrerName: referralCode.profiles?.company_name || referralCode.profiles?.full_name || "Usuario",
      remainingUses: referralCode.max_uses - referralCode.uses_count,
    })
  } catch (error) {
    console.error("[v0] Error validating code:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
