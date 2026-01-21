export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
    const { email, code, password, name, referralCode } = await request.json()

    if (!email || !code || !password) {
      return NextResponse.json({ error: "Email, código y contraseña son requeridos" }, { status: 400 })
    }

    console.log("[v0] Verificando código para:", email)

    // Buscar código en la base de datos
    const { data: codeData, error: codeError } = await supabaseAdmin
      .from("email_verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (codeError || !codeData) {
      console.error("[v0] Código inválido o expirado:", codeError?.message)
      return NextResponse.json({ error: "Código inválido o expirado" }, { status: 400 })
    }

    console.log("[v0] Código válido, creando usuario con email verificado...")

    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name || codeData.name,
      },
    })

    if (createError) {
      console.error("[v0] Error al crear usuario:", createError.message)

      // Si el error es de base de datos, podría ser el trigger
      if (createError.message.includes("Database error")) {
        // Verificar si el usuario ya fue creado a pesar del error
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
        const userExists = existingUser.users.find((u) => u.email === email)

        if (userExists) {
          await supabaseAdmin
            .from("profiles")
            .update({
              role: "homeowner",
              user_type: "propietario",
              country: "ES",
              full_name: name || codeData.name || email.split("@")[0],
            })
            .eq("id", userExists.id)

          // Marcar código como verificado
          await supabaseAdmin
            .from("email_verification_codes")
            .update({
              verified: true,
              verified_at: new Date().toISOString(),
            })
            .eq("id", codeData.id)

          if (referralCode) {
            await registerReferralRelationship(referralCode, userExists.id)
          }

          return NextResponse.json({
            success: true,
            message: "Usuario creado correctamente",
            user: userExists,
          })
        }
      }

      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Marcar código como verificado
    await supabaseAdmin
      .from("email_verification_codes")
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq("id", codeData.id)

    if (referralCode && userData.user) {
      await registerReferralRelationship(referralCode, userData.user.id)
    }

    return NextResponse.json({
      success: true,
      message: "Usuario creado correctamente",
      user: userData.user,
    })
  } catch (error: any) {
    console.error("[v0] Error en verify-code:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

async function registerReferralRelationship(
  referralCode: string,
  referredUserId: string,
) {
  try {
    const { data: codeData, error: codeError } = await supabaseAdmin
      .from("referral_codes")
      .select("*")
      .eq("code", referralCode.toUpperCase())
      .eq("is_active", true)
      .single()

    if (codeError || !codeData) return
    if (codeData.user_id === referredUserId) return
    if (codeData.uses_count >= codeData.max_uses) return

    await supabaseAdmin.from("referral_relationships").insert({
      referrer_id: codeData.user_id,
      referred_id: referredUserId,
      referral_code_id: codeData.id,
      status: "pending",
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error en registerReferralRelationship:", error)
  }
}
