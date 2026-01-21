export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()

    console.log("[v0] ðŸ“§ Enviando notificaciÃ³n de nuevo registro:", { email, name })

    // Enviar email de notificaciÃ³n usando Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: ["presupuestaloficial@gmail.com"],
        subject: "ðŸŽ‰ Nuevo usuario registrado en PresupuÃ©stalo",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d97706;">Nuevo Usuario Registrado</h2>
            <p>Se ha registrado un nuevo usuario en PresupuÃ©stalo:</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Nombre:</strong> ${name || "No proporcionado"}</p>
              <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 10px 0;"><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES", {
                dateStyle: "full",
                timeStyle: "short",
              })}</p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Este es un email automÃ¡tico de notificaciÃ³n de PresupuÃ©stalo.
            </p>
          </div>
        `,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json()
      console.error("[v0] âŒ Error enviando email con Resend:", errorData)
      throw new Error(`Error enviando email: ${errorData.message}`)
    }

    const resendData = await resendResponse.json()
    console.log("[v0] âœ… Email de notificaciÃ³n enviado exitosamente:", resendData)

    return NextResponse.json({ success: true, emailId: resendData.id })
  } catch (error: any) {
    console.error("[v0] âŒ Error en notify-registration:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

