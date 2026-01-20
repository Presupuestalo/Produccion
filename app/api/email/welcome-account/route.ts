import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { email, fullName, password } = await request.json()

    console.log("[v0] Sending welcome email to:", email)

    const { data, error } = await resend.emails.send({
      from: "noreply@presupuestalo.com",
      to: email,
      subject: "Tu cuenta en Presupuestalo - Accede a tu solicitud",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .credentials-box { background: white; border: 2px solid #f97316; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .features { list-style: none; padding: 0; }
              .features li { padding: 8px 0; padding-left: 28px; position: relative; }
              .features li:before { content: "✓"; position: absolute; left: 0; color: #22c55e; font-weight: bold; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>¡Bienvenido/a a Presupuestalo!</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${fullName}</strong>,</p>
                
                <p>Tu solicitud de presupuesto ha sido publicada en nuestro <strong>Presmarket</strong> donde empresas verificadas pueden acceder.</p>
                
                <div class="credentials-box">
                  <h3 style="margin-top: 0; color: #f97316;">🔐 Tus credenciales de acceso:</h3>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Contraseña temporal:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${password}</code></p>
                </div>
                
                <div style="text-align: center;">
                  <a href="${request.nextUrl.origin}/login" class="button">Acceder a mi panel</a>
                </div>
                
                <h3 style="color: #f97316;">Podrás:</h3>
                <ul class="features">
                  <li>Ver empresas interesadas en tu proyecto</li>
                  <li>Recibir propuestas personalizadas</li>
                  <li>Cambiar tu contraseña</li>
                  <li>Gestionar tu proyecto</li>
                  <li>Comunicarte directamente con las empresas</li>
                </ul>
                
                <p style="margin-top: 30px;"><strong>Importante:</strong> Te recomendamos cambiar tu contraseña la primera vez que accedas por seguridad.</p>
                
                <div class="footer">
                  <p>Saludos,<br>El equipo de Presupuestalo</p>
                  <p style="font-size: 12px; color: #9ca3af;">Si no solicitaste esta cuenta, puedes ignorar este email.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        ¡Bienvenido/a a Presupuestalo!
        
        Hola ${fullName},
        
        Tu solicitud de presupuesto ha sido publicada en nuestro Presmarket donde empresas verificadas pueden acceder.
        
        TUS CREDENCIALES DE ACCESO:
        Email: ${email}
        Contraseña temporal: ${password}
        
        Accede a tu panel: ${request.nextUrl.origin}/login
        
        Podrás:
        ✓ Ver empresas interesadas en tu proyecto
        ✓ Recibir propuestas personalizadas
        ✓ Cambiar tu contraseña
        ✓ Gestionar tu proyecto
        ✓ Comunicarte directamente con las empresas
        
        Importante: Te recomendamos cambiar tu contraseña la primera vez que accedas por seguridad.
        
        Saludos,
        El equipo de Presupuestalo
      `,
    })

    if (error) {
      console.error("[v0] Error sending welcome email:", error)
      return NextResponse.json({ error: "Error al enviar email" }, { status: 500 })
    }

    console.log("[v0] Welcome email sent successfully")

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error) {
    console.error("[v0] Error in welcome email API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
