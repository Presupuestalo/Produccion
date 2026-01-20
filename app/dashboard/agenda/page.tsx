import type { Metadata } from "next"
import { ModernCalendarView } from "@/components/calendar/modern-calendar-view"

export const metadata: Metadata = {
  title: "Agenda | Presupuéstalo",
  description: "Gestiona tu agenda de citas con clientes",
}

export default function AgendaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Agenda</h1>
        <p className="text-muted-foreground">Gestiona tus citas y reuniones con clientes</p>
      </div>

      <ModernCalendarView />
    </div>
  )
}
