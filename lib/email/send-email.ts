// Servicio centralizado de envío de emails con Resend

const RESEND_API_URL = "https://api.resend.com/emails"
const FROM_EMAIL = "Presupuéstalo <onboarding@resend.dev>"
const ADMIN_EMAIL = "pascualmollar@gmail.com"

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail(
  options: SendEmailOptions,
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.error("[v0] RESEND_API_KEY no configurada")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[v0] Error enviando email:", data)
      return { success: false, error: data.message || "Error sending email" }
    }

    console.log("[v0] Email enviado:", data.id)
    return { success: true, emailId: data.id }
  } catch (error: any) {
    console.error("[v0] Error en sendEmail:", error)
    return { success: false, error: error.message }
  }
}

export async function sendAdminEmail(subject: string, html: string): Promise<void> {
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Admin] ${subject}`,
    html,
  })
}

export { ADMIN_EMAIL }
