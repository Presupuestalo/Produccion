export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const cronSecret = authHeader?.replace("Bearer ", "")

    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    const { data: appointments, error: appointmentsError } = await supabaseAdmin
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
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending reminders",
        processed: 0,
      })
    }

    const appointmentsToRemind = appointments.filter((apt) => {
      const appointmentDate = new Date(apt.appointment_date)
      appointmentDate.setHours(0, 0, 0, 0)
      const daysUntilAppointment = Math.floor((appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const reminderDays = apt.reminder_days_before || Math.floor((apt.reminder_minutes_before || 1440) / 1440)
      return daysUntilAppointment === reminderDays
    })

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

    for (const appointment of appointmentsToRemind) {
      try {
        const { data: companySettings } = await supabaseAdmin
          .from("user_company_settings")
          .select("company_name, company_email, company_phone")
          .eq("user_id", appointment.user_id)
          .single()

        if (!companySettings?.company_email) {
          results.failed++
          results.errors.push(`Appointment ${appointment.id}: No company email`)
          continue
        }

        const { data: profile } = await supabaseAdmin.from("profiles").select("email").eq("id", appointment.user_id).single()
        const userEmail = profile?.email || companySettings.company_email

        const appointmentDate = new Date(appointment.appointment_date)
        const formattedDate = format(appointmentDate, "PPP", { locale: es })
        const formattedTime = format(appointmentDate, "HH:mm")

        const reminderDays = appointment.reminder_days_before || Math.floor((appointment.reminder_minutes_before || 1440) / 1440)
        const reminderText = reminderDays === 1 ? "mañana" : `en ${reminderDays} días`

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
            html: `<p>Hola, tienes una cita programada ${reminderText}:</p><ul><li>Motivo: ${appointment.name}</li><li>Fecha: ${formattedDate}</li><li>Hora: ${formattedTime}</li><li>Dirección: ${appointment.address}</li></ul>`,
          }),
        })

        if (resendResponse.ok) {
          await supabaseAdmin
            .from("appointments")
            .update({
              reminder_sent: true,
              reminder_sent_at: new Date().toISOString(),
            })
            .eq("id", appointment.id)
          results.success++
        } else {
          results.failed++
        }
      } catch (error: any) {
        results.failed++
        results.errors.push(`Appointment ${appointment.id}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.success + results.failed,
      successful: results.success,
      failed: results.failed,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
