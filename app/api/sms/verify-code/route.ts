import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
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

    const { phone, code } = await request.json()

    console.log("[v0] Verify code request - userId:", user.id, "phone:", phone, "code:", code)

    if (!phone || !code) {
      return NextResponse.json({ error: "Teléfono y código requeridos" }, { status: 400 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const verifySid = process.env.TWILIO_VERIFY_SERVICE

    if (!accountSid || !authToken || !verifySid) {
      return NextResponse.json({ error: "Servicio de SMS no configurado" }, { status: 500 })
    }

    // Verificar código con Twilio Verify
    const twilioUrl = `https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
      body: new URLSearchParams({
        To: phone,
        Code: code,
      }),
    })

    const data = await response.json()
    console.log("[v0] Twilio response:", data)

    if (!response.ok || data.status !== "approved") {
      return NextResponse.json(
        { error: data.status === "pending" ? "Código incorrecto" : "Código expirado o incorrecto", verified: false },
        { status: 400 },
      )
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Verificar si el perfil existe
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single()

    console.log("[v0] Existing profile check:", existingProfile, "error:", fetchError)

    let updateResult
    if (!existingProfile) {
      // Crear perfil si no existe
      console.log("[v0] Creating new profile for user:", user.id)
      updateResult = await supabaseAdmin
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          phone,
          phone_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
    } else {
      // Actualizar perfil existente
      console.log("[v0] Updating existing profile for user:", user.id)
      updateResult = await supabaseAdmin
        .from("profiles")
        .update({
          phone,
          phone_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
    }

    console.log("[v0] Update result:", updateResult.data, "error:", updateResult.error)

    if (updateResult.error) {
      console.error("[v0] Error updating profile:", updateResult.error)
      return NextResponse.json(
        { error: "Error al actualizar perfil: " + updateResult.error.message, verified: false },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Teléfono verificado correctamente",
      profile: updateResult.data?.[0],
    })
  } catch (error) {
    console.error("[v0] Error verifying code:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
