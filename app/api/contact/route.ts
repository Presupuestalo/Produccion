import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json()

    console.log("[v0] Contacto: Recibida solicitud de contacto")
    console.log("[v0] Contacto: De:", name, email)
    console.log("[v0] Contacto: Asunto:", subject)

    // Validar campos requeridos
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Verificar que tenemos la API key de Resend
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      console.error("[v0] Contacto: ❌ RESEND_API_KEY no está configurada")
      return NextResponse.json({ error: "Servicio de email no configurado" }, { status: 500 })
    }

    console.log("[v0] Contacto: ✅ API key de Resend encontrada")

    // Preparar el email
    const emailData = {
      from: "Presupuéstalo <noreply@presupuestalo.com>",
      to: "soporte@presupuestalo.com",
      replyTo: email,
      subject: `[Contacto Web] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ea580c;">Nuevo mensaje de contacto</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Nombre:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Asunto:</strong> ${subject}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Mensaje:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #666; font-size: 12px;">
            Este mensaje fue enviado desde el formulario de contacto de Presupuéstalo.
          </p>
        </div>
      `,
    }

    console.log("[v0] Contacto: 📤 Enviando email a Resend API...")
    console.log("[v0] Contacto: From:", emailData.from)
    console.log("[v0] Contacto: To:", emailData.to)

    // Enviar email usando Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailData),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[v0] Contacto: ❌ Error de Resend:", data)
      return NextResponse.json(
        {
          error: "Error al enviar el email",
          details: data.message || "Error desconocido",
          resendError: data,
        },
        { status: response.status },
      )
    }

    console.log("[v0] Contacto: ✅ Email enviado exitosamente:", data)

    return NextResponse.json({
      success: true,
      message: "Mensaje enviado correctamente",
      emailId: data.id,
    })
  } catch (error) {
    console.error("[v0] Contacto: Error al procesar solicitud:", error)
    return NextResponse.json(
      {
        error: "Error al enviar el mensaje",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
