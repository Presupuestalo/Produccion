export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const VERIFIED_EMAIL = "presupuestaloficial@gmail.com"
const IS_TEST_MODE = false // Modo de prueba desactivado
const FROM_EMAIL = "citas@presupuestalo.com" // Cambia esto por tu dominio verificado en Resend

export async function POST(request: Request) {
  try {
    console.log("[v0] ðŸ“§ Send invitation API called")
    console.log(`[v0] ðŸ§ª Test mode: ${IS_TEST_MODE ? "ENABLED" : "DISABLED"}`)

    const { appointmentId, guestEmail, appointmentName, appointmentDate, address, description } = await request.json()

    console.log("[v0] Request data:", { appointmentId, guestEmail, appointmentName, appointmentDate, address })

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      console.log("[v0] âŒ No authenticated user")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("[v0] User ID:", user.id)

    const { data: companySettings, error: companyError } = await supabase
      .from("user_company_settings")
      .select("company_name, company_email, company_phone")
      .eq("user_id", user.id)
      .single()

    if (companyError) {
      console.error("[v0] âŒ Error fetching company settings:", companyError)
      return NextResponse.json({ error: "Datos de empresa no encontrados" }, { status: 404 })
    }

    if (!companySettings || !companySettings.company_email) {
      console.log("[v0] âŒ No company email found in settings")
      return NextResponse.json(
        {
          error: "Email de empresa no configurado. Por favor, configura tu email en Ajustes > Datos de Empresa",
        },
        { status: 400 },
      )
    }

    console.log("[v0] âœ… Company settings loaded:", {
      name: companySettings.company_name,
      email: companySettings.company_email,
    })

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error("[v0] âŒ RESEND_API_KEY no estÃ¡ configurada")
      return NextResponse.json({ error: "Servicio de email no configurado" }, { status: 500 })
    }

    console.log("[v0] âœ… RESEND_API_KEY found")

    const date = new Date(appointmentDate)
    const formattedDate = format(date, "PPP", { locale: es })
    const formattedTime = format(date, "HH:mm")

    const testModeBanner = IS_TEST_MODE
      ? `
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
        <strong>ðŸ§ª MODO DE PRUEBA</strong><br>
        Este email se envÃ­a a ${VERIFIED_EMAIL} porque Resend estÃ¡ en modo de prueba.<br>
        En producciÃ³n, este email se enviarÃ­a a: <strong>${guestEmail || companySettings.company_email}</strong>
      </div>
    `
      : ""

    const guestEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #1f2937; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
            .warning { background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ConfirmaciÃ³n de Cita</h1>
            </div>
            <div class="content">
              ${testModeBanner}
              <p>Estimado/a cliente,</p>
              <p>Le confirmamos que tiene una cita programada con <strong>${companySettings.company_name}</strong>.</p>
              
              <div class="info-box">
                <div class="info-row">
                  <span class="label">Motivo:</span> ${appointmentName}
                </div>
                <div class="info-row">
                  <span class="label">Fecha:</span> ${formattedDate}
                </div>
                <div class="info-row">
                  <span class="label">Hora:</span> ${formattedTime}
                </div>
                <div class="info-row">
                  <span class="label">DirecciÃ³n:</span> ${address}
                </div>
                ${description ? `<div class="info-row"><span class="label">Detalles:</span> ${description}</div>` : ""}
              </div>

              <div class="warning">
                <strong>âš ï¸ Importante:</strong> Si no puede asistir a la cita, por favor infÃ³rmenos con antelaciÃ³n para poder anularla o modificarla. Puede contactarnos en:
                <ul>
                  <li>Email: ${companySettings.company_email}</li>
                  ${companySettings.company_phone ? `<li>TelÃ©fono: ${companySettings.company_phone}</li>` : ""}
                </ul>
              </div>

              <p>Quedamos a su disposiciÃ³n para cualquier consulta.</p>
              <p>Saludos cordiales,<br><strong>${companySettings.company_name}</strong></p>
            </div>
            <div class="footer">
              <p>Este es un email automÃ¡tico, por favor no responda a este mensaje.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const companyEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #1f2937; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>âœ… Nueva Cita Creada</h1>
            </div>
            <div class="content">
              ${testModeBanner}
              <p>Se ha creado una nueva cita en tu agenda:</p>
              
              <div class="info-box">
                <div class="info-row">
                  <span class="label">Motivo:</span> ${appointmentName}
                </div>
                <div class="info-row">
                  <span class="label">Fecha:</span> ${formattedDate}
                </div>
                <div class="info-row">
                  <span class="label">Hora:</span> ${formattedTime}
                </div>
                <div class="info-row">
                  <span class="label">DirecciÃ³n:</span> ${address}
                </div>
                ${description ? `<div class="info-row"><span class="label">Detalles:</span> ${description}</div>` : ""}
                ${guestEmail ? `<div class="info-row"><span class="label">Cliente invitado:</span> ${guestEmail}</div>` : ""}
              </div>

              <p>Se ha enviado una confirmaciÃ³n por email al cliente${guestEmail ? ` (${guestEmail})` : ""}.</p>
              <p>Puedes gestionar tus citas desde el panel de control de PresupuÃ©stalo.</p>
            </div>
            <div class="footer">
              <p>PresupuÃ©stalo - GestiÃ³n de Citas</p>
            </div>
          </div>
        </body>
      </html>
    `

    const emailResults = {
      guestEmailSent: false,
      companyEmailSent: false,
      errors: [] as string[],
      testMode: IS_TEST_MODE,
    }

    const actualGuestEmail = IS_TEST_MODE ? VERIFIED_EMAIL : guestEmail
    const actualCompanyEmail = IS_TEST_MODE ? VERIFIED_EMAIL : companySettings.company_email

    if (guestEmail) {
      console.log(
        `[v0] ðŸ“¤ Enviando email de confirmaciÃ³n al cliente: ${guestEmail} ${IS_TEST_MODE ? `(redirigido a ${VERIFIED_EMAIL})` : ""}`,
      )

      try {
        const guestResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `PresupuÃ©stalo <${FROM_EMAIL}>`,
            to: actualGuestEmail,
            subject: `${IS_TEST_MODE ? "[TEST] " : ""}ConfirmaciÃ³n de cita - ${appointmentName}`,
            html: guestEmailHtml,
          }),
        })

        const guestData = await guestResponse.json()

        if (!guestResponse.ok) {
          console.error("[v0] âŒ Error enviando email al cliente:", guestData)
          emailResults.errors.push(`Error al cliente: ${guestData.message || "Error desconocido"}`)
        } else {
          console.log("[v0] âœ… Email enviado al cliente exitosamente. ID:", guestData.id)
          emailResults.guestEmailSent = true
        }
      } catch (error: any) {
        console.error("[v0] âŒ Exception enviando email al cliente:", error)
        emailResults.errors.push(`Exception al cliente: ${error.message}`)
      }
    } else {
      console.log("[v0] âš ï¸ No guest email provided, skipping guest notification")
    }

    console.log(
      `[v0] ðŸ“¤ Enviando email de confirmaciÃ³n a la empresa: ${companySettings.company_email} ${IS_TEST_MODE ? `(redirigido a ${VERIFIED_EMAIL})` : ""}`,
    )

    try {
      const companyResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: `PresupuÃ©stalo <${FROM_EMAIL}>`,
          to: actualCompanyEmail,
          subject: `${IS_TEST_MODE ? "[TEST] " : ""}Nueva cita creada - ${appointmentName}`,
          html: companyEmailHtml,
        }),
      })

      const companyData = await companyResponse.json()

      if (!companyResponse.ok) {
        console.error("[v0] âŒ Error enviando email a la empresa:", companyData)
        emailResults.errors.push(`Error a empresa: ${companyData.message || "Error desconocido"}`)
      } else {
        console.log("[v0] âœ… Email enviado a la empresa exitosamente. ID:", companyData.id)
        emailResults.companyEmailSent = true
      }
    } catch (error: any) {
      console.error("[v0] âŒ Exception enviando email a la empresa:", error)
      emailResults.errors.push(`Exception a empresa: ${error.message}`)
    }

    console.log("[v0] ðŸ“Š Email results:", emailResults)

    if (emailResults.errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          guestEmailSent: emailResults.guestEmailSent,
          companyEmailSent: emailResults.companyEmailSent,
          testMode: emailResults.testMode,
          errors: emailResults.errors,
          message: "Algunos emails no se pudieron enviar",
        },
        { status: 207 },
      )
    }

    return NextResponse.json({
      success: true,
      guestEmailSent: emailResults.guestEmailSent,
      companyEmailSent: emailResults.companyEmailSent,
      testMode: emailResults.testMode,
      message: IS_TEST_MODE ? `Emails enviados en modo de prueba a ${VERIFIED_EMAIL}` : "Emails enviados correctamente",
    })
  } catch (error: any) {
    console.error("[v0] âŒ Error sending invitation:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

