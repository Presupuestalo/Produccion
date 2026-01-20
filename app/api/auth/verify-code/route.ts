import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { email, code, password, name, referralCode } = await request.json()

    if (!email || !code || !password) {
      return NextResponse.json({ error: "Email, código y contraseña son requeridos" }, { status: 400 })
    }

    console.log("[v0] Verificando código para:", email)
    if (referralCode) {
      console.log("[v0] Código de referido recibido:", referralCode)
    }

    // Crear cliente con service role
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Buscar código en la base de datos
    const { data: codeData, error: codeError } = await supabase
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

    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
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
        console.log("[v0] Intentando crear perfil manualmente...")

        // Verificar si el usuario ya fue creado a pesar del error
        const { data: existingUser } = await supabase.auth.admin.listUsers()
        const userExists = existingUser.users.find((u) => u.email === email)

        if (userExists) {
          console.log("[v0] Usuario creado, intentando crear perfil...")

          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              role: "homeowner",
              user_type: "propietario",
              country: "ES",
              full_name: name || codeData.name || email.split("@")[0],
            })
            .eq("id", userExists.id)

          if (profileError) {
            console.error("[v0] Error al actualizar perfil:", profileError.message)

            const { error: insertError } = await supabase.from("profiles").insert({
              id: userExists.id,
              full_name: name || codeData.name || email.split("@")[0],
            })

            if (insertError) {
              console.error("[v0] Error al insertar perfil:", insertError.message)
            } else {
              console.log("[v0] Perfil creado, actualizando campos...")

              // Actualizar con los demás campos después de crear
              await supabase
                .from("profiles")
                .update({
                  user_type: "propietario",
                  role: "homeowner",
                  country: "ES",
                })
                .eq("id", userExists.id)
            }
          } else {
            console.log("[v0] Perfil actualizado correctamente")
          }

          // Marcar código como verificado
          await supabase
            .from("email_verification_codes")
            .update({
              verified: true,
              verified_at: new Date().toISOString(),
            })
            .eq("id", codeData.id)

          if (referralCode) {
            await registerReferralRelationship(supabase, referralCode, userExists.id)
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

    console.log("[v0] Usuario creado con email verificado:", userData.user?.email)

    // Marcar código como verificado
    await supabase
      .from("email_verification_codes")
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq("id", codeData.id)

    if (referralCode && userData.user) {
      await registerReferralRelationship(supabase, referralCode, userData.user.id)
    }

    console.log("[v0] Proceso completado correctamente")

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
  supabase: ReturnType<typeof createClient>,
  referralCode: string,
  referredUserId: string,
) {
  try {
    console.log("[v0] Registrando relación de referido:", referralCode, "->", referredUserId)

    // Buscar el código de referido
    const { data: codeData, error: codeError } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("code", referralCode.toUpperCase())
      .eq("is_active", true)
      .single()

    if (codeError || !codeData) {
      console.log("[v0] Código de referido no válido:", codeError?.message)
      return
    }

    // Verificar que no sea auto-referido
    if (codeData.user_id === referredUserId) {
      console.log("[v0] Auto-referido detectado, ignorando")
      return
    }

    // Verificar límite de usos
    if (codeData.uses_count >= codeData.max_uses) {
      console.log("[v0] Código de referido ha alcanzado el límite de usos")
      return
    }

    // Crear relación de referido
    const { error: relationshipError } = await supabase.from("referral_relationships").insert({
      referrer_id: codeData.user_id,
      referred_id: referredUserId,
      referral_code_id: codeData.id,
      status: "pending",
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
    })

    if (relationshipError) {
      console.error("[v0] Error al crear relación de referido:", relationshipError)
      return
    }

    console.log("[v0] Relación de referido creada exitosamente")
  } catch (error) {
    console.error("[v0] Error en registerReferralRelationship:", error)
  }
}
