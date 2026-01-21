export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { getWelcomeEmailHTML, getWelcomeEmailText } from "@/lib/email/templates"

export async function POST(request: NextRequest) {
  try {
    const { email, name, userType } = await request.json()

    console.log("[v0] ðŸ“§ Iniciando envÃ­o de email de bienvenida...")
    console.log("[v0] Email destinatario:", email)
    console.log("[v0] Nombre:", name)
    console.log("[v0] Tipo de usuario:", userType)

    if (!email) {
      console.error("[v0] âŒ Email no proporcionado")
      return NextResponse.json({ error: "Email es requerido" }, { status: 400 })
    }

    // Verificar que tenemos la API key de Resend
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      console.error("[v0] âŒ RESEND_API_KEY no estÃ¡ configurada en las variables de entorno")
      return NextResponse.json(
        {
          success: false,
          message: "Servicio de email no configurado. Configura RESEND_API_KEY en las variables de entorno.",
        },
        { status: 200 },
      )
    }

    console.log("[v0] âœ… API key de Resend encontrada")

    const emailPayload = {
      from: "PresupuÃ©stalo <onboarding@resend.dev>",
      to: email,
      subject: "Â¡Bienvenido a PresupuÃ©stalo! ðŸŽ‰",
      html: getWelcomeEmailHTML({ name, email, userType }),
      text: getWelcomeEmailText({ name, email, userType }),
    }

    console.log("[v0] ðŸ“¤ Enviando email a Resend API...")

    // Enviar email usando Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    })

    const data = await response.json()

    console.log("[v0] ðŸ“¥ Respuesta de Resend:", JSON.stringify(data, null, 2))

    if (!response.ok) {
      console.error("[v0] âŒ Error al enviar email. Status:", response.status)
      console.error("[v0] âŒ Detalles del error:", data)
      return NextResponse.json(
        {
          success: false,
          error: "Error al enviar email",
          details: data,
          message: data.message || "Error desconocido",
        },
        { status: response.status },
      )
    }

    console.log("[v0] âœ… Email de bienvenida enviado exitosamente a:", email)
    console.log("[v0] âœ… ID del email:", data.id)

    return NextResponse.json({
      success: true,
      data,
      message: "Email enviado correctamente",
    })
  } catch (error: any) {
    console.error("[v0] ðŸ’¥ Error inesperado en send-welcome-email:", error)
    console.error("[v0] ðŸ’¥ Stack trace:", error.stack)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

