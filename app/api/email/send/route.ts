export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import {
  professionalInterestedTemplate,
  leadAccessConfirmationTemplate,
  claimReceivedTemplate,
  claimApprovedTemplate,
  claimRejectedTemplate,
  newClaimAdminTemplate,
  creditPurchaseConfirmationTemplate,
} from "@/lib/email/templates/presmarket-emails"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = "PresupuÃ©stalo <notificaciones@presupuestalo.com>"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, template, data } = body

    if (!to || !subject || !template) {
      return NextResponse.json({ error: "Faltan campos requeridos: to, subject, template" }, { status: 400 })
    }

    let html = ""

    switch (template) {
      case "professional-interested":
        html = professionalInterestedTemplate(data)
        break
      case "offer-access-confirmation":
        html = leadAccessConfirmationTemplate(data)
        break
      case "claim-received":
        html = claimReceivedTemplate(data)
        break
      case "claim-approved":
        html = claimApprovedTemplate(data)
        break
      case "claim-rejected":
        html = claimRejectedTemplate(data)
        break
      case "new-claim-admin":
        html = newClaimAdminTemplate(data)
        break
      case "credit-purchase-confirmation":
        html = creditPurchaseConfirmationTemplate(data)
        break
      default:
        return NextResponse.json({ error: `Template no reconocido: ${template}` }, { status: 400 })
    }

    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    })

    if (error) {
      console.error("Error enviando email:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: emailData?.id })
  } catch (error: any) {
    console.error("Error en API de email:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

