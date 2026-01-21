export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/referrals/get-code - Obtener o crear cÃ³digo de referido del usuario
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar si ya tiene cÃ³digo
    const { data: existingCode, error: fetchError } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (existingCode) {
      return NextResponse.json({
        code: existingCode.code,
        maxUses: existingCode.max_uses,
        usesCount: existingCode.uses_count,
        isNew: false,
      })
    }

    // Generar nuevo cÃ³digo
    const code = `REF_${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const { data: newCode, error: insertError } = await supabase
      .from("referral_codes")
      .insert({
        user_id: user.id,
        code: code,
        max_uses: 5,
        uses_count: 0,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error creating referral code:", insertError)
      return NextResponse.json({ error: "Error al crear cÃ³digo de referido" }, { status: 500 })
    }

    return NextResponse.json({
      code: newCode.code,
      maxUses: newCode.max_uses,
      usesCount: newCode.uses_count,
      isNew: true,
    })
  } catch (error) {
    console.error("[v0] Error in get-code:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

