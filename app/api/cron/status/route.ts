export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Cron API is working correctly",
    version: "1.0.1", // added version to force deployment
    availableEndpoints: {
      emailVerificationReminder: "/api/cron/email-verification-reminder",
      emailVerificationReminderTest: "/api/cron/email-verification-reminder/test",
      appointmentReminders: "/api/cron/appointment-reminders",
      appointmentRemindersTest: "/api/cron/appointment-reminders/test",
    },
    timestamp: new Date().toISOString(),
  })
}

