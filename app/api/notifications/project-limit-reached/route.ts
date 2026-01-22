export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"

const FROM_EMAIL = "noreply@presupuestalo.com"

export async function POST(request: NextRequest) {
  try {
    const { userEmail, userName, maxProjects } = await request.json()

    console.log("[v0] Enviando email de límite de proyectos alcanzado a:", userEmail)

    // Verificar que tenemos la API key de Resend
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      console.error("[v0] âŒ RESEND_API_KEY no está configurada")
      return NextResponse.json({ success: false, message: "Servicio de email no configurado" }, { status: 500 })
    }

    console.log("[v0] ✅ API key de Resend encontrada")

    // Construir el HTML del email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9fafb;
              border-radius: 8px;
              padding: 32px;
            }
            .header {
              text-align: center;
              margin-bottom: 32px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #ea580c;
            }
            .content {
              background-color: white;
              border-radius: 6px;
              padding: 24px;
              margin-bottom: 24px;
            }
            h1 {
              color: #111827;
              font-size: 24px;
              margin-bottom: 16px;
            }
            p {
              margin-bottom: 16px;
              color: #4b5563;
            }
            .button {
              display: inline-block;
              background-color: #ea580c;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin-top: 16px;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              margin-top: 32px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Presupuéstalo</div>
            </div>
            
            <div class="content">
              <h1>Has alcanzado el límite de proyectos</h1>
              
              <p>Hola ${userName || ""},</p>
              
              <p>
                Has alcanzado el límite de <strong>${maxProjects} ${maxProjects === 1 ? "proyecto" : "proyectos"}</strong> 
                de tu plan actual.
              </p>
              
              <p>
                Para continuar creando más proyectos y aprovechar al máximo Presupuéstalo, 
                actualiza tu plan a uno superior.
              </p>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://presupuestalo.com"}/dashboard/planes" class="button">
                  Ver Planes Disponibles
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>Este es un email automático. Por favor, no respondas a este mensaje.</p>
              <p>© ${new Date().getFullYear()} Presupuéstalo. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Enviar email usando Resend
    console.log("[v0] 📤 Enviando email a Resend API...")
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Presupuestalo <noreply@presupuestalo.com>",
        to: userEmail,
        subject: "Presupuestalo.com - Límite alcanzado",
        html: emailHtml,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[v0] âŒ Error de Resend:", data)
      return NextResponse.json({ success: false, message: "Error al enviar email", resendError: data }, { status: 500 })
    }

    console.log("[v0] ✅ Email enviado exitosamente:", data.id)
    return NextResponse.json({ success: true, emailId: data.id })
  } catch (error: any) {
    console.error("[v0] âŒ Error enviando email de límite:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

