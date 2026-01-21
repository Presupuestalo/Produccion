import { NextResponse, type NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get("mode") || "preview"
    const testEmail = searchParams.get("email")

    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    // Buscar citas que necesitan recordatorio
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
        appointmentsDueForReminderToday: appointmentsToRemind.length,
        appointments: appointmentsToRemind.map((apt) => ({
          id: apt.id,
          name: apt.name,
          appointmentDate: apt.appointment_date,
          guestEmail: apt.guest_email,
        })),
      })
    }

    if (mode === "test-email") {
      if (!testEmail) {
        return NextResponse.json({ error: "email parameter required for test-email mode" }, { status: 400 })
      }

      const testDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)

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
          html: `<p>Hola, esto es una prueba de recordatorio para mañana: ${format(testDate, "PPP", { locale: es })}</p>`,
        }),
      })

      if (!resendResponse.ok) {
        return NextResponse.json({ error: "Failed to send test email" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Email de prueba enviado correctamente",
      })
    }

    return NextResponse.json({ error: "Invalid mode. Use: preview or test-email" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
