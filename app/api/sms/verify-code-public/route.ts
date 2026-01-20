import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    console.log("[v0] Public verification check for phone:", phone)
    console.log("[v0] Code received:", code)
    console.log("[v0] Phone format being verified:", phone)

    if (!phone || !code) {
      return NextResponse.json({ error: "Teléfono y código son requeridos" }, { status: 400 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const verifySid = process.env.TWILIO_VERIFY_SERVICE

    if (!accountSid || !authToken || !verifySid) {
      // En desarrollo, aceptar código 123456
      if (process.env.NODE_ENV === "development" && code === "123456") {
        console.log("[v0] DEV MODE: Code '123456' accepted")
        return NextResponse.json({
          verified: true,
          message: "Verificación exitosa (modo desarrollo)",
        })
      }
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

    console.log("[v0] Twilio verification response:", JSON.stringify(data, null, 2))

    if (!response.ok || data.status !== "approved") {
      console.error("[v0] Verification failed:", data)
      return NextResponse.json({ error: "Código incorrecto o expirado", verified: false }, { status: 400 })
    }

    console.log("[v0] Phone verified successfully:", phone)

    return NextResponse.json({
      verified: true,
      message: "Teléfono verificado exitosamente",
    })
  } catch (error) {
    console.error("[v0] Error verifying code:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
