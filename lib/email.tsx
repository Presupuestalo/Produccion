import nodemailer from "nodemailer"

export async function sendEstimationNotification(data: {
  squareMeters: string
  rooms: string
  bathrooms: string
  height: string
  country: string
  city: string
  heatingType: string
  availableBudget?: string
  currency: { code: string; symbol: string }
  userEmail?: string
}) {
  try {
    // Crear transporter con SMTP de Hostinger
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true, // true para puerto 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Email HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ea580c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .data-row { margin: 10px 0; padding: 10px; background-color: white; border-radius: 4px; }
            .label { font-weight: bold; color: #ea580c; }
            .value { color: #333; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 Nueva Estimación de Presupuesto</h1>
            </div>
            <div class="content">
              <p>Se ha generado una nueva estimación de presupuesto con los siguientes datos:</p>
              
              <div class="data-row">
                <span class="label">📍 Ubicación:</span>
                <span class="value">${data.city}, ${data.country}</span>
              </div>
              
              <div class="data-row">
                <span class="label">📐 Metros cuadrados:</span>
                <span class="value">${data.squareMeters} m²</span>
              </div>
              
              <div class="data-row">
                <span class="label">🚪 Habitaciones:</span>
                <span class="value">${data.rooms}</span>
              </div>
              
              <div class="data-row">
                <span class="label">🚿 Baños:</span>
                <span class="value">${data.bathrooms}</span>
              </div>
              
              <div class="data-row">
                <span class="label">📏 Altura techos:</span>
                <span class="value">${data.height} m</span>
              </div>
              
              <div class="data-row">
                <span class="label">🔥 Tipo de calefacción:</span>
                <span class="value">${data.heatingType}</span>
              </div>
              
              ${
                data.availableBudget
                  ? `
              <div class="data-row">
                <span class="label">💰 Presupuesto disponible:</span>
                <span class="value">${data.availableBudget} ${data.currency.symbol}</span>
              </div>
              `
                  : ""
              }
              
              <div class="data-row">
                <span class="label">💵 Moneda:</span>
                <span class="value">${data.currency.code} (${data.currency.symbol})</span>
              </div>
              
              ${
                data.userEmail
                  ? `
              <div class="data-row">
                <span class="label">📧 Email del usuario:</span>
                <span class="value">${data.userEmail}</span>
              </div>
              `
                  : ""
              }
              
              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                Este email se envió automáticamente desde Presupuéstalo cuando un usuario generó una estimación de presupuesto.
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    // Enviar email
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Enviar al mismo email del administrador
      subject: `Nueva estimación: ${data.city}, ${data.country} - ${data.squareMeters}m²`,
      html: htmlContent,
    })

    console.log("[v0] Email de notificación enviado exitosamente")
  } catch (error) {
    console.error("[v0] Error enviando email de notificación:", error)
    // No lanzamos el error para no bloquear la respuesta al usuario
  }
}
