export function accountDeletedAdminTemplate(data: {
  email: string
  fullName: string
  userType: string
  companyName?: string
  phone?: string
  city?: string
  province?: string
  country?: string
  subscriptionPlan?: string
  projectsCount: number
  quotesSentCount?: number
  quotesReceivedCount?: number
  creditsRemaining?: number
  accountCreatedAt?: string
  deletedAt: string
}): string {
  const isProfessional = data.userType === "profesional" || data.userType === "professional"
  const userTypeLabel = isProfessional ? "Profesional" : "Propietario"
  const userTypeColor = isProfessional ? "#3b82f6" : "#10b981"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Usuario Eliminado</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 30px 40px; background-color: #dc2626; border-radius: 12px 12px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                    ⚠️ Usuario Eliminado
                  </h1>
                  <p style="margin: 10px 0 0; color: #fecaca; font-size: 14px;">
                    Un usuario ha eliminado su cuenta de Presupuéstalo
                  </p>
                </td>
              </tr>
              
              <!-- User Type Badge -->
              <tr>
                <td style="padding: 20px 40px 0;">
                  <span style="display: inline-block; padding: 6px 16px; background-color: ${userTypeColor}; color: white; border-radius: 20px; font-size: 14px; font-weight: 500;">
                    ${userTypeLabel}
                  </span>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 20px 40px;">
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <!-- Información básica -->
                    <tr>
                      <td style="padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
                        <h3 style="margin: 0 0 10px; color: #374151; font-size: 16px;">Información del Usuario</h3>
                        <table style="width: 100%;">
                          <tr>
                            <td style="padding: 4px 0; color: #6b7280; font-size: 14px; width: 140px;">Nombre:</td>
                            <td style="padding: 4px 0; color: #111827; font-size: 14px; font-weight: 500;">${data.fullName || "No especificado"}</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Email:</td>
                            <td style="padding: 4px 0; color: #111827; font-size: 14px; font-weight: 500;">${data.email}</td>
                          </tr>
                          ${
                            data.phone
                              ? `
                          <tr>
                            <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Teléfono:</td>
                            <td style="padding: 4px 0; color: #111827; font-size: 14px;">${data.phone}</td>
                          </tr>
                          `
                              : ""
                          }
                          ${
                            data.companyName
                              ? `
                          <tr>
                            <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Empresa:</td>
                            <td style="padding: 4px 0; color: #111827; font-size: 14px;">${data.companyName}</td>
                          </tr>
                          `
                              : ""
                          }
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Ubicación -->
                    ${
                      data.city || data.province || data.country
                        ? `
                    <tr>
                      <td style="padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
                        <h3 style="margin: 0 0 10px; color: #374151; font-size: 16px;">Ubicación</h3>
                        <p style="margin: 0; color: #111827; font-size: 14px;">
                          ${[data.city, data.province, data.country].filter(Boolean).join(", ")}
                        </p>
                      </td>
                    </tr>
                    `
                        : ""
                    }
                    
                    <!-- Estadísticas -->
                    <tr>
                      <td style="padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
                        <h3 style="margin: 0 0 10px; color: #374151; font-size: 16px;">Estadísticas de Uso</h3>
                        <table style="width: 100%;">
                          <tr>
                            <td style="padding: 4px 0; color: #6b7280; font-size: 14px; width: 140px;">Plan:</td>
                            <td style="padding: 4px 0; color: #111827; font-size: 14px;">${data.subscriptionPlan || "Free"}</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Proyectos:</td>
                            <td style="padding: 4px 0; color: #111827; font-size: 14px;">${data.projectsCount}</td>
                          </tr>
                          ${
                            isProfessional
                              ? `
                          <tr>
                            <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Propuestas enviadas:</td>
                            <td style="padding: 4px 0; color: #111827; font-size: 14px;">${data.quotesSentCount || 0}</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Créditos restantes:</td>
                            <td style="padding: 4px 0; color: #111827; font-size: 14px;">${data.creditsRemaining || 0}</td>
                          </tr>
                          `
                              : `
                          <tr>
                            <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Propuestas recibidas:</td>
                            <td style="padding: 4px 0; color: #111827; font-size: 14px;">${data.quotesReceivedCount || 0}</td>
                          </tr>
                          `
                          }
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Fechas -->
                    <tr>
                      <td style="padding: 15px 0;">
                        <h3 style="margin: 0 0 10px; color: #374151; font-size: 16px;">Fechas</h3>
                        <table style="width: 100%;">
                          ${
                            data.accountCreatedAt
                              ? `
                          <tr>
                            <td style="padding: 4px 0; color: #6b7280; font-size: 14px; width: 140px;">Cuenta creada:</td>
                            <td style="padding: 4px 0; color: #111827; font-size: 14px;">${data.accountCreatedAt}</td>
                          </tr>
                          `
                              : ""
                          }
                          <tr>
                            <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Eliminada:</td>
                            <td style="padding: 4px 0; color: #dc2626; font-size: 14px; font-weight: 500;">${data.deletedAt}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px 30px; background-color: #f9fafb; border-radius: 0 0 12px 12px;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                    Este es un mensaje automático de Presupuéstalo
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
