export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

// POST /api/referrals/verify-phone - Verificar teléfono del referido via Twilio
export async function POST(req: Request) {
  try {
    const { relationshipId, phone, code } = await req.json()

    if (!relationshipId || !phone || !code) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    // Verificar código con Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const verifySid = process.env.TWILIO_VERIFY_SERVICE

    if (!accountSid || !authToken || !verifySid) {
      return NextResponse.json({ error: "Configuración de SMS no disponible" }, { status: 500 })
    }

    const twilioUrl = `https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`

    const twilioResponse = await fetch(twilioUrl, {
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

    const twilioData = await twilioResponse.json()

    if (twilioData.status !== "approved") {
      return NextResponse.json(
        {
          error: "Código de verificación incorrecto",
        },
        { status: 400 },
      )
    }

    // Verificar que el teléfono no esté ya usado por otro referido
    const { data: existingPhone } = await supabaseAdmin
      .from("referral_relationships")
      .select("id")
      .eq("referred_phone", phone)
      .eq("status", "phone_verified")
      .single()

    if (existingPhone) {
      return NextResponse.json(
        {
          error: "Este número de teléfono ya fue usado en otro referido",
        },
        { status: 400 },
      )
    }

    // Actualizar relación a phone_verified
    const { error: updateError } = await supabaseAdmin
      .from("referral_relationships")
      .update({
        status: "phone_verified",
        referred_phone: phone,
        phone_verified_at: new Date().toISOString(),
      })
      .eq("id", relationshipId)

    if (updateError) {
      console.error("[v0] Error updating relationship:", updateError)
      return NextResponse.json({ error: "Error al verificar teléfono" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Teléfono verificado. Las recompensas se otorgarán cuando completes tu suscripción.",
    })
  } catch (error) {
    console.error("[v0] Error in verify-phone:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
