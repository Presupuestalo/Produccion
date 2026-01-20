import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// POST /api/referrals/register-referred - Registrar un usuario como referido
export async function POST(req: Request) {
  try {
    const { referralCode, referredUserId, phone } = await req.json()

    if (!referralCode || !referredUserId) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    // Verificar que el usuario no sea ya un referido
    const { data: existingRelationship } = await supabaseAdmin
      .from("referral_relationships")
      .select("id")
      .eq("referred_id", referredUserId)
      .single()

    if (existingRelationship) {
      return NextResponse.json(
        {
          error: "Este usuario ya fue referido anteriormente",
        },
        { status: 400 },
      )
    }

    // Obtener el código de referido
    const { data: codeData, error: codeError } = await supabaseAdmin
      .from("referral_codes")
      .select("*")
      .eq("code", referralCode.toUpperCase())
      .eq("is_active", true)
      .single()

    if (codeError || !codeData) {
      return NextResponse.json({ error: "Código no válido" }, { status: 400 })
    }

    // Verificar que no sea auto-referido
    if (codeData.user_id === referredUserId) {
      return NextResponse.json(
        {
          error: "No puedes usar tu propio código de referido",
        },
        { status: 400 },
      )
    }

    // Verificar límite de usos
    if (codeData.uses_count >= codeData.max_uses) {
      return NextResponse.json(
        {
          error: "Este código ha alcanzado el límite de usos",
        },
        { status: 400 },
      )
    }

    // Crear relación de referido
    const { data: relationship, error: relationshipError } = await supabaseAdmin
      .from("referral_relationships")
      .insert({
        referrer_id: codeData.user_id,
        referred_id: referredUserId,
        referral_code_id: codeData.id,
        status: "pending",
        referred_phone: phone || null,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
      })
      .select()
      .single()

    if (relationshipError) {
      console.error("[v0] Error creating referral relationship:", relationshipError)
      return NextResponse.json({ error: "Error al registrar referido" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      relationshipId: relationship.id,
      message: "Referido registrado. Verifica tu teléfono para activar la recompensa.",
    })
  } catch (error) {
    console.error("[v0] Error in register-referred:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
