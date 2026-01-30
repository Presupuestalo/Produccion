interface WelcomeEmailProps {
  name: string
  email: string
  userType: string
}

export function getWelcomeEmailHTML({ name, email, userType }: WelcomeEmailProps): string {
  const displayName = name || email.split("@")[0]
  const userTypeText = userType === "profesional" ? "profesional" : "propietario"

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a Presupuéstalo</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                Presupuéstalo
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                Calcula presupuestos de reformas con facilidad
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                ¡Bienvenido, ${displayName}!
              </h2>
              
              <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Nos alegra que te hayas unido a Presupuéstalo como <strong>${userTypeText}</strong>. 
                Estás a punto de descubrir una forma más rápida y precisa de calcular presupuestos de reformas.
              </p>
              
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Con Presupuéstalo podrás:
              </p>
              
              <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
                <li>Calcular presupuestos detallados en minutos</li>
                <li>Ajustar precios según tu ubicación</li>
                <li>Generar informes profesionales</li>
                <li>Guardar y gestionar múltiples proyectos</li>
              </ul>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://presupuestalo.com/dashboard" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Ir al Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. 
                Estamos aquí para ayudarte a sacar el máximo provecho de Presupuéstalo.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                © ${new Date().getFullYear()} Presupuéstalo. Todos los derechos reservados.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Has recibido este email porque te registraste en Presupuéstalo.
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

export function getWelcomeEmailText({ name, email, userType }: WelcomeEmailProps): string {
  const displayName = name || email.split("@")[0]
  const userTypeText = userType === "profesional" ? "profesional" : "propietario"

  return `
¡Bienvenido a Presupuéstalo, ${displayName}!

Nos alegra que te hayas unido a Presupuéstalo como ${userTypeText}. Estás a punto de descubrir una forma más rápida y precisa de calcular presupuestos de reformas.

Con Presupuéstalo podrás:
- Calcular presupuestos detallados en minutos
- Ajustar precios según tu ubicación
- Generar informes profesionales
- Guardar y gestionar múltiples proyectos

Comienza ahora: https://presupuestalo.com/dashboard

Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. Estamos aquí para ayudarte a sacar el máximo provecho de Presupuéstalo.

---
© ${new Date().getFullYear()} Presupuéstalo. Todos los derechos reservados.
Has recibido este email porque te registraste en Presupuéstalo.
  `.trim()
}

interface DonorEmailProps {
  name: string
  email: string
}

export function getDonorEmailHTML({ name, email }: DonorEmailProps): string {
  const displayName = name || email.split("@")[0]

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Gracias por tu apoyo! ❤️</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                Presupuéstalo
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                Gracias por creer en este proyecto
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                ¡Muchas gracias, ${displayName}! ❤️
              </h2>
              
              <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Tu apoyo de 2€ al mes significa muchísimo para nosotros. Gracias a personas como tú, podemos seguir desarrollando esta herramienta creada por y para profesionales de la reforma.
              </p>
              
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Como donante, tienes acceso exclusivo a nuestro **grupo privado de Telegram**, donde compartiremos la evolución de la herramienta, el plan de ruta y recibirás beneficios especiales.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://t.me/+7-uVLs-HemA0YmM0" style="display: inline-block; background-color: #24A1DE; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Unirse al Grupo de Telegram
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Estamos trabajando en un plan de ruta muy completo y tú serás de los primeros en verlo.
              </p>

              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Si el botón de Telegram no funciona, puedes copiar este enlace: https://t.me/+7-uVLs-HemA0YmM0
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
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
  `
}

export function getDonorEmailText({ name, email }: DonorEmailProps): string {
  const displayName = name || email.split("@")[0]

  return `
¡Muchas gracias por tu apoyo, ${displayName}! ❤️

Tu donación de 2€ al mes nos ayuda a seguir mejorando Presupuéstalo para todos los profesionales.

Únete a nuestro grupo privado de Telegram para ver los avances y el plan de ruta:
https://t.me/+7-uVLs-HemA0YmM0

¡Gracias por ser parte de la evolución de la herramienta!

---
© ${new Date().getFullYear()} Presupuéstalo. Todos los derechos reservados.
  `.trim()
}
