import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { phone } = await request.json()

    console.log("[v0] SMS verification requested for phone:", phone)

    if (!phone || phone.length < 9) {
      return NextResponse.json(
        { error: "Número de teléfono inválido" },
        { status: 400 }
      )
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const verifySid = process.env.TWILIO_VERIFY_SERVICE

    console.log("[v0] Twilio config check:", {
      accountSid: accountSid ? `${accountSid.substring(0, 10)}...` : 'MISSING',
      authToken: authToken ? 'SET' : 'MISSING',
      verifySid: verifySid ? `${verifySid.substring(0, 10)}...` : 'MISSING'
    })

    if (!accountSid || !authToken || !verifySid) {
      console.error("[v0] Twilio credentials missing")
      // En desarrollo, simular envío exitoso
      if (process.env.NODE_ENV === 'development') {
        console.log("[v0] DEV MODE: Use code '123456' for testing")
        return NextResponse.json({ 
          success: true, 
          message: "Código de verificación enviado (modo desarrollo). Usa: 123456"
        })
      }
      return NextResponse.json(
        { error: "Servicio de SMS no configurado" },
        { status: 500 }
      )
    }

    // Validar formato E.164 del teléfono
    if (!phone.startsWith('+')) {
      console.error("[v0] Invalid phone format, must start with +")
      return NextResponse.json(
        { error: "El número debe incluir el código de país (ej: +34615078192)" },
        { status: 400 }
      )
    }

    console.log("[v0] Sending SMS via Twilio to:", phone)

    // Enviar código de verificación con Twilio Verify
    const twilioUrl = `https://verify.twilio.com/v2/Services/${verifySid}/Verifications`
    
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      },
      body: new URLSearchParams({
        To: phone,
        Channel: 'sms'
      })
    })

    const data = await response.json()

    console.log("[v0] Twilio response status:", response.status)
    console.log("[v0] Twilio response data:", JSON.stringify(data, null, 2))

    if (!response.ok) {
      console.error("[v0] Twilio API error:", data)
      
      // Mostrar mensajes de error más específicos
      let errorMessage = "Error al enviar SMS"
      if (data.code === 20003) {
        errorMessage = "Credenciales de Twilio inválidas"
      } else if (data.code === 21211) {
        errorMessage = "Número de teléfono inválido"
      } else if (data.code === 60200) {
        errorMessage = "Cuenta de Twilio en modo prueba. Verifica el número en el dashboard de Twilio primero."
      } else if (data.message) {
        errorMessage = data.message
      }
      
      return NextResponse.json(
        { error: errorMessage, twilioError: data },
        { status: 500 }
      )
    }

    console.log("[v0] ✅ Verification SMS sent successfully to:", phone)

    return NextResponse.json({
      success: true,
      message: "Código de verificación enviado"
    })

  } catch (error) {
    console.error("[v0] Error sending verification:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
