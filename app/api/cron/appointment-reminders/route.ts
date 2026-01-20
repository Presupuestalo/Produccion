import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export async function GET(request: Request) {
  try {
    // Verificar el CRON_SECRET
    const authHeader = request.headers.get("authorization")
    const cronSecret = authHeader?.replace("Bearer ", "")

    if (cronSecret !== process.env.CRON_SECRET) {
      console.log("[v0] CRON: Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] CRON: Appointment reminders job started")

    // Crear cliente de Supabase con service role para acceso completo
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    console.log("[v0] CRON: Current time:", now.toISOString(), "Today:", today.toISOString())

    // Buscar citas que necesitan recordatorio
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(
        `
        id,
        user_id,
        name,
        description,
        appointment_date,
        address,
        guest_email,
        reminder_days_before,
        reminder_minutes_before
      `,
      )
      .eq("status", "scheduled")
      .eq("reminder_enabled", true)
      .eq("reminder_sent", false)

    if (appointmentsError) {
      console.error("[v0] CRON: Error fetching appointments:", appointmentsError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!appointments || appointments.length === 0) {
      console.log("[v0] CRON: No appointments with pending reminders found")
      return NextResponse.json({
        success: true,
        message: "No pending reminders",
        processed: 0,
      })
    }

    console.log(`[v0] CRON: Found ${appointments.length} appointments with reminders enabled`)

    const appointmentsToRemind = appointments.filter((apt) => {
      const appointmentDate = new Date(apt.appointment_date)
      appointmentDate.setHours(0, 0, 0, 0)

      const daysUntilAppointment = Math.floor((appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // Usar reminder_days_before si está disponible, sino calcular desde reminder_minutes_before
      const reminderDays = apt.reminder_days_before || Math.floor((apt.reminder_minutes_before || 1440) / 1440)

      return daysUntilAppointment === reminderDays
    })

    console.log(`[v0] CRON: ${appointmentsToRemind.length} appointments need reminders today`)

    if (appointmentsToRemind.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No reminders due today",
        processed: 0,
      })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Procesar cada cita
    for (const appointment of appointmentsToRemind) {
      try {
        console.log(`[v0] CRON: Processing appointment ${appointment.id}`)

        // Obtener datos de la empresa del usuario
        const { data: companySettings, error: companyError } = await supabase
          .from("user_company_settings")
          .select("company_name, company_email, company_phone")
          .eq("user_id", appointment.user_id)
          .single()

        if (companyError || !companySettings?.company_email) {
          console.error(`[v0] CRON: No company email for user ${appointment.user_id}`)
          results.failed++
          results.errors.push(`Appointment ${appointment.id}: No company email`)
          continue
        }

        // Obtener el perfil del usuario para el email
        const { data: profile } = await supabase.from("profiles").select("email").eq("id", appointment.user_id).single()

        const userEmail = profile?.email || companySettings.company_email

        // Formatear fecha y hora
        const appointmentDate = new Date(appointment.appointment_date)
        const formattedDate = format(appointmentDate, "PPP", { locale: es })
        const formattedTime = format(appointmentDate, "HH:mm")

        const reminderDays =
          appointment.reminder_days_before || Math.floor((appointment.reminder_minutes_before || 1440) / 1440)
        const reminderText = reminderDays === 1 ? "mañana" : `en ${reminderDays} días`

        // Enviar email de recordatorio al usuario/empresa
        const reminderEmailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .info-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                .info-row { margin: 10px 0; }
                .label { font-weight: bold; color: #1f2937; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⏰ Recordatorio de Cita</h1>
                  <p style="margin: 5px 0 0 0; opacity: 0.9;">Tu cita es ${reminderText}</p>
                </div>
                <div class="content">
                  <p>Hola,</p>
                  <p>Te recordamos que tienes una cita programada ${reminderText}:</p>
                  
                  <div class="info-box">
                    <div class="info-row">
                      <span class="label">Motivo:</span> ${appointment.name}
                    </div>
                    <div class="info-row">
                      <span class="label">Fecha:</span> ${formattedDate}
                    </div>
                    <div class="info-row">
                      <span class="label">Hora:</span> ${formattedTime}
                    </div>
                    <div class="info-row">
                      <span class="label">Dirección:</span> ${appointment.address}
                    </div>
                    ${appointment.description ? `<div class="info-row"><span class="label">Detalles:</span> ${appointment.description}</div>` : ""}
                    ${appointment.guest_email ? `<div class="info-row"><span class="label">Cliente:</span> ${appointment.guest_email}</div>` : ""}
                  </div>

                  <p>No olvides prepararte para esta reunión.</p>
                  <p>Saludos,<br><strong>Presupuéstalo</strong></p>
                </div>
                <div class="footer">
                  <p>Este es un recordatorio automático de tu agenda en Presupuéstalo.</p>
                </div>
              </div>
            </body>
          </html>
        `

        // Enviar email usando Resend
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Presupuestalo <noreply@presupuestalo.com>",
            to: userEmail,
            subject: `Recordatorio: ${appointment.name} ${reminderText} - ${formattedDate}`,
            html: reminderEmailHtml,
          }),
        })

        const resendData = await resendResponse.json()

        if (!resendResponse.ok) {
          console.error(`[v0] CRON: Error sending email for appointment ${appointment.id}:`, resendData)
          results.failed++
          results.errors.push(`Appointment ${appointment.id}: ${resendData.message || "Email error"}`)
          continue
        }

        console.log(`[v0] CRON: Email sent for appointment ${appointment.id}. Email ID:`, resendData.id)

        // Marcar el recordatorio como enviado
        const { error: updateError } = await supabase
          .from("appointments")
          .update({
            reminder_sent: true,
            reminder_sent_at: new Date().toISOString(),
          })
          .eq("id", appointment.id)

        if (updateError) {
          console.error(`[v0] CRON: Error updating appointment ${appointment.id}:`, updateError)
          results.failed++
          results.errors.push(`Appointment ${appointment.id}: Update error`)
        } else {
          results.success++
          console.log(`[v0] CRON: Successfully processed appointment ${appointment.id}`)
        }
      } catch (error: any) {
        console.error(`[v0] CRON: Exception processing appointment ${appointment.id}:`, error)
        results.failed++
        results.errors.push(`Appointment ${appointment.id}: ${error.message}`)
      }
    }

    console.log("[v0] CRON: Appointment reminders job completed:", results)

    return NextResponse.json({
      success: true,
      processed: results.success + results.failed,
      successful: results.success,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    })
  } catch (error: any) {
    console.error("[v0] CRON: Fatal error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
