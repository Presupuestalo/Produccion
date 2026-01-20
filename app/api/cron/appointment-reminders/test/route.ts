import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get("mode") || "preview"
    const testEmail = searchParams.get("email")

    console.log(`[v0] TEST CRON: Mode: ${mode}`)

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

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
        reminder_minutes_before,
        reminder_sent
      `,
      )
      .eq("status", "scheduled")
      .eq("reminder_enabled", true)
      .eq("reminder_sent", false)

    if (appointmentsError) {
      return NextResponse.json({ error: "Database error", details: appointmentsError }, { status: 500 })
    }

    const appointmentsToRemind =
      appointments?.filter((apt) => {
        const appointmentDate = new Date(apt.appointment_date)
        appointmentDate.setHours(0, 0, 0, 0)

        const daysUntilAppointment = Math.floor((appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        const reminderDays = apt.reminder_days_before || Math.floor((apt.reminder_minutes_before || 1440) / 1440)

        return daysUntilAppointment === reminderDays
      }) || []

    if (mode === "preview") {
      return NextResponse.json({
        message: "Vista previa de recordatorios pendientes para HOY",
        currentTime: now.toISOString(),
        today: today.toISOString(),
        totalAppointmentsWithReminders: appointments?.length || 0,
        appointmentsDueForReminderToday: appointmentsToRemind.length,
        appointments: appointmentsToRemind.map((apt) => {
          const appointmentDate = new Date(apt.appointment_date)
          appointmentDate.setHours(0, 0, 0, 0)
          const daysUntil = Math.floor((appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          const reminderDays = apt.reminder_days_before || Math.floor((apt.reminder_minutes_before || 1440) / 1440)

          return {
            id: apt.id,
            name: apt.name,
            appointmentDate: apt.appointment_date,
            daysUntilAppointment: daysUntil,
            reminderDaysBefore: reminderDays,
            shouldSendToday: daysUntil === reminderDays,
            guestEmail: apt.guest_email,
          }
        }),
      })
    }

    if (mode === "test-email") {
      if (!testEmail) {
        return NextResponse.json({ error: "email parameter required for test-email mode" }, { status: 400 })
      }

      const testDate = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Mañana

      const testReminderHtml = `
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
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Tu cita es mañana</p>
              </div>
              <div class="content">
                <p>Hola,</p>
                <p>Te recordamos que tienes una cita programada mañana:</p>
                
                <div class="info-box">
                  <div class="info-row">
                    <span class="label">Motivo:</span> Reunión de revisión de proyecto
                  </div>
                  <div class="info-row">
                    <span class="label">Fecha:</span> ${format(testDate, "PPP", { locale: es })}
                  </div>
                  <div class="info-row">
                    <span class="label">Hora:</span> ${format(testDate, "HH:mm")}
                  </div>
                  <div class="info-row">
                    <span class="label">Dirección:</span> Calle Ejemplo 123, Madrid
                  </div>
                  <div class="info-row">
                    <span class="label">Detalles:</span> Revisión del avance del proyecto de reforma
                  </div>
                  <div class="info-row">
                    <span class="label">Cliente:</span> cliente@ejemplo.com
                  </div>
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

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Presupuestalo <noreply@presupuestalo.com>",
          to: testEmail,
          subject: "[PRUEBA] Recordatorio: Reunión de revisión de proyecto mañana",
          html: testReminderHtml,
        }),
      })

      const resendData = await resendResponse.json()

      if (!resendResponse.ok) {
        return NextResponse.json({ error: "Failed to send test email", details: resendData }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Email de prueba enviado correctamente",
        testEmail,
        emailId: resendData.id,
      })
    }

    if (mode === "send") {
      return NextResponse.json(
        {
          error:
            "Para enviar recordatorios reales, usa el endpoint principal del cron: /api/cron/appointment-reminders",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: "Invalid mode. Use: preview, test-email, or send" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] TEST CRON: Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
