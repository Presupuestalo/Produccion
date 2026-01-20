import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { requestId, offeredPrice, currencySymbol, companyName } = await request.json()

    // Enviar email de notificación al admin
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      console.error("RESEND_API_KEY no está configurada")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: ["presupuestaloficial@gmail.com"],
        subject: "Nueva Oferta de Presupuesto Recibida - Presupuéstalo",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ea580c;">Nueva Oferta de Presupuesto</h2>
            <p>Se ha recibido una nueva oferta para una solicitud de presupuesto:</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Empresa/Profesional:</strong> ${companyName}</p>
              <p><strong>Precio Ofertado:</strong> ${offeredPrice} ${currencySymbol}</p>
              <p><strong>ID de Solicitud:</strong> ${requestId}</p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              El cliente recibirá una notificación y podrá ver la oferta en su panel.
            </p>
          </div>
        `,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      console.error("Error sending email:", errorData)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in notify-new-offer:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
