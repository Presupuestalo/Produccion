import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { email, fullName, leadData, leadRequestId } = await request.json()

    console.log("[v0] Sending lead published email to:", email)

    const { data, error } = await resend.emails.send({
      from: "noreply@presupuestalo.com",
      to: email,
      subject: "Tu solicitud está publicada - Esperando empresas",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .project-box { background: white; border: 2px solid #22c55e; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .project-box h3 { margin-top: 0; color: #22c55e; }
              .project-detail { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
              .project-detail:last-child { border-bottom: none; }
              .project-detail strong { color: #374151; }
              .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .step { padding: 15px; margin: 10px 0; background: #f3f4f6; border-radius: 6px; border-left: 4px solid #22c55e; }
              .button { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Tu solicitud está ACTIVA</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${fullName}</strong>,</p>
                
                <p>Tu solicitud de presupuesto está ahora <strong>publicada en el Presmarket</strong> y visible para empresas profesionales verificadas.</p>
                
                <div class="project-box">
                  <h3>📋 Resumen del proyecto:</h3>
                  <div class="project-detail">
                    <strong>Tipo:</strong> ${leadData.reformType}
                  </div>
                  <div class="project-detail">
                    <strong>Superficie:</strong> ${leadData.squareMeters} m²
                  </div>
                  <div class="project-detail">
                    <strong>Ciudad:</strong> ${leadData.city}
                  </div>
                  <div class="project-detail">
                    <strong>Presupuesto estimado:</strong> ${leadData.estimatedBudget.toLocaleString("es-ES")}€
                  </div>
                </div>
                
                <div class="steps">
                  <h3 style="margin-top: 0; color: #22c55e;">🏢 ¿Qué sigue?</h3>
                  
                  <div class="step">
                    <strong>1. Espera propuestas</strong>
                    <p style="margin: 5px 0 0 0; color: #6b7280;">Hasta 3 empresas profesionales recibirán tu solicitud</p>
                  </div>
                  
                  <div class="step">
                    <strong>2. Revisa perfiles</strong>
                    <p style="margin: 5px 0 0 0; color: #6b7280;">Podrás ver información de cada empresa interesada</p>
                  </div>
                  
                  <div class="step">
                    <strong>3. Recibe presupuestos</strong>
                    <p style="margin: 5px 0 0 0; color: #6b7280;">Las empresas te contactarán para ofrecerte presupuestos personalizados</p>
                  </div>
                </div>
                
                <div style="text-align: center;">
                  <a href="${request.nextUrl.origin}/dashboard/mis-solicitudes" class="button">Monitorear estado de mi solicitud</a>
                </div>
                
                <p style="margin-top: 30px; padding: 15px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                  💡 <strong>Consejo:</strong> Mantén tu teléfono disponible. Las empresas pueden contactarte en las próximas 24-48 horas.
                </p>
                
                <div class="footer">
                  <p>Saludos,<br>El equipo de Presupuestalo</p>
                  <p style="font-size: 12px; color: #9ca3af;">Solicitud ID: ${leadRequestId}</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Tu solicitud está ACTIVA en el Presmarket
        
        Hola ${fullName},
        
        Tu solicitud de presupuesto está ahora publicada en el Presmarket y visible para empresas profesionales verificadas.
        
        RESUMEN DEL PROYECTO:
        - Tipo: ${leadData.reformType}
        - Superficie: ${leadData.squareMeters} m²
        - Ciudad: ${leadData.city}
        - Presupuesto estimado: ${leadData.estimatedBudget.toLocaleString("es-ES")}€
        
        ¿QUÉ SIGUE?
        
        1. Espera propuestas
           Hasta 3 empresas profesionales recibirán tu solicitud
        
        2. Revisa perfiles
           Podrás ver información de cada empresa interesada
        
        3. Recibe presupuestos
           Las empresas te contactarán para ofrecerte presupuestos personalizados
        
        Monitorea el estado: ${request.nextUrl.origin}/dashboard/mis-solicitudes
        
        Consejo: Mantén tu teléfono disponible. Las empresas pueden contactarte en las próximas 24-48 horas.
        
        Saludos,
        El equipo de Presupuestalo
        
        Solicitud ID: ${leadRequestId}
      `,
    })

    if (error) {
      console.error("[v0] Error sending lead published email:", error)
      return NextResponse.json({ error: "Error al enviar email" }, { status: 500 })
    }

    console.log("[v0] Lead published email sent successfully")

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error) {
    console.error("[v0] Error in lead published email API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
