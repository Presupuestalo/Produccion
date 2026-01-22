export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { email, referrerName, referredName, planType, creditsEarned } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    const planDisplayName = planType === "pro" ? "Plan Pro" : "Plan Basic"
    const convertedDate = new Date().toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    // Using Resend for email
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Presupuéstalo <no-reply@presupuestalo.com>",
        to: email,
        subject: `Has ganado ${creditsEarned} créditos por tu referido`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 ¡Felicidades ${referrerName}!</h1>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                          <p style="font-size: 48px; margin: 0 0 8px 0;">🪙</p>
                          <p style="font-size: 36px; font-weight: bold; color: #d97706; margin: 0;">+${creditsEarned} créditos</p>
                        </div>
                        
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                          <strong>${referredName}</strong> ha contratado el <strong>${planDisplayName}</strong> el ${convertedDate} gracias a tu invitación.
                        </p>
                        
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                          Como recompensa, hemos añadido <strong>${creditsEarned} créditos</strong> a tu cuenta. ¡Sigue invitando a más profesionales para ganar más!
                        </p>
                        
                        <div style="text-align: center; margin-top: 32px;">
                          <a href="https://presupuestalo.com/dashboard/referidos" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            Ver mis referidos
                          </a>
                        </div>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">
                          © ${new Date().getFullYear()} Presupuéstalo. Todos los derechos reservados.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Error sending referral email:", errorData)
      return NextResponse.json({ error: "Error enviando email" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in send-referral-reward-email:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

