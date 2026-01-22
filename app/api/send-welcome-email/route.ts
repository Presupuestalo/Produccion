export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { getWelcomeEmailHTML, getWelcomeEmailText } from "@/lib/email/templates"

export async function POST(request: NextRequest) {
  try {
    const { email, name, userType } = await request.json()

    console.log("[v0] 📧 Iniciando envío de email de bienvenida...")
    console.log("[v0] Email destinatario:", email)
    console.log("[v0] Nombre:", name)
    console.log("[v0] Tipo de usuario:", userType)

    if (!email) {
      console.error("[v0] ❌ Email no proporcionado")
      return NextResponse.json({ error: "Email es requerido" }, { status: 400 })
    }

    // Verificar que tenemos la API key de Resend
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      console.error("[v0] ❌ RESEND_API_KEY no está configurada en las variables de entorno")
      return NextResponse.json(
        {
          success: false,
          message: "Servicio de email no configurado. Configura RESEND_API_KEY en las variables de entorno.",
        },
        { status: 200 },
      )
    }

    console.log("[v0] ✅ API key de Resend encontrada")

    const { sendEmail } = await import("@/lib/email/send-email")

    console.log("[v0] 📤 Enviando email de bienvenida...")

    const { success, emailId, error } = await sendEmail({
      to: email,
      subject: "¡Bienvenido a Presupuéstalo! 🎉",
      html: getWelcomeEmailHTML({ name, email, userType }),
    })

    if (!success) {
      console.error("[v0] ❌ Error al enviar email:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Error al enviar email",
          message: error || "Error desconocido",
        },
        { status: 500 },
      )
    }

    console.log("[v0] ✅ Email de bienvenida enviado exitosamente a:", email)
    console.log("[v0] ✅ ID del email:", emailId)

    return NextResponse.json({
      success: true,
      emailId,
      message: "Email enviado correctamente",
    })
  } catch (error: any) {
    console.error("[v0] 💥 Error inesperado en send-welcome-email:", error)
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
