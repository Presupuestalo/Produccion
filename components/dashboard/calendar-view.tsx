"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getAllAppointments } from "@/lib/services/appointment-service"
import type { ProjectAppointment } from "@/types/project"
import Link from "next/link"

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  appointments: ProjectAppointment[]
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const [appointments, setAppointments] = useState<ProjectAppointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)

  // Cargar todas las citas al montar el componente
  useEffect(() => {
    loadAppointments()
  }, [])

  // Generar días del calendario cuando cambia el mes o se cargan las citas
  useEffect(() => {
    generateCalendarDays()
  }, [currentDate, appointments])

  const loadAppointments = async () => {
    setIsLoading(true)
    try {
      const data = await getAllAppointments()
      setAppointments(data)
    } catch (error) {
      console.error("Error al cargar citas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Primer día del mes
    const firstDayOfMonth = new Date(year, month, 1)
    // Último día del mes
    const lastDayOfMonth = new Date(year, month + 1, 0)

    // Día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
    let firstDayOfWeek = firstDayOfMonth.getDay()
    // Ajustar para que la semana comience en lunes (0 = lunes, 6 = domingo)
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

    const days: CalendarDay[] = []

    // Añadir días del mes anterior
    const daysFromPrevMonth = firstDayOfWeek
    const prevMonth = new Date(year, month, 0)
    const prevMonthDays = prevMonth.getDate()

    for (let i = prevMonthDays - daysFromPrevMonth + 1; i <= prevMonthDays; i++) {
      const date = new Date(year, month - 1, i)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
        appointments: getAppointmentsForDay(date),
      })
    }

    // Añadir días del mes actual
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(year, month, i)
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isSameDay(date, new Date()),
        appointments: getAppointmentsForDay(date),
      })
    }

    // Añadir días del mes siguiente hasta completar la última semana
    const totalDaysAdded = days.length
    const remainingDays = Math.ceil(totalDaysAdded / 7) * 7 - totalDaysAdded

    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
        appointments: getAppointmentsForDay(date),
      })
    }

    setCalendarDays(days)
  }

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date)
      return isSameDay(appointmentDate, date)
    })
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Función para obtener el color de la insignia según el estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800"
      case "confirmada":
        return "bg-green-100 text-green-800"
      case "cancelada":
        return "bg-red-100 text-red-800"
      case "completada":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Nombres de los días de la semana
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  // Nombres de los meses
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Calendario de Citas</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoy
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <h2 className="text-lg font-medium mt-2">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Días de la semana */}
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-medium py-2">
              {day}
            </div>
          ))}

          {/* Días del calendario */}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`
                min-h-[80px] p-1 border rounded-md relative
                ${day.isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"}
                ${day.isToday ? "border-orange-500" : "border-gray-200"}
                ${selectedDay && isSameDay(selectedDay.date, day.date) ? "ring-2 ring-orange-500" : ""}
                hover:bg-gray-50 cursor-pointer
              `}
              onClick={() => setSelectedDay(day)}
            >
              <div className="text-right text-sm p-1">{day.date.getDate()}</div>

              {/* Indicadores de citas */}
              <div className="mt-1 space-y-1">
                {day.appointments.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {day.appointments.slice(0, 2).map((appointment) => (
                      <div
                        key={appointment.id}
                        className={`
                          text-xs truncate px-1 py-0.5 rounded
                          ${getStatusColor(appointment.status)}
                        `}
                        title={appointment.title}
                      >
                        {appointment.time.substring(0, 5)} {appointment.title}
                      </div>
                    ))}
                    {day.appointments.length > 2 && (
                      <div className="text-xs text-center text-gray-500">+{day.appointments.length - 2} más</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Detalles del día seleccionado */}
        {selectedDay && (
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">
                {selectedDay.date.toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <Button variant="outline" size="sm" onClick={() => setSelectedDay(null)}>
                Cerrar
              </Button>
            </div>

            {selectedDay.appointments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay citas programadas para este día.</p>
            ) : (
              <div className="space-y-3">
                {selectedDay.appointments.map((appointment) => (
                  <div key={appointment.id} className="border rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{appointment.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{appointment.time.substring(0, 5)}</span>
                        </div>
                      </div>
                      {appointment.projects && (
                        <Link
                          href={`/dashboard/projects/${appointment.project_id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {appointment.projects.title}
                        </Link>
                      )}
                    </div>

                    {appointment.description && <p className="mt-2 text-sm">{appointment.description}</p>}

                    {appointment.location && (
                      <div className="mt-2 text-sm text-muted-foreground">Ubicación: {appointment.location}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
