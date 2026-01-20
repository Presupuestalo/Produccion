"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CalendarIcon, Clock, MapPin, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getAllAppointments } from "@/lib/services/appointment-service"
import type { ProjectAppointment } from "@/types/project"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  appointments: ProjectAppointment[]
}

type ViewMode = "month" | "week" | "day"

export function ModernCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const [appointments, setAppointments] = useState<ProjectAppointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("month")

  useEffect(() => {
    loadAppointments()
  }, [])

  useEffect(() => {
    if (viewMode === "month") {
      generateCalendarDays()
    }
  }, [currentDate, appointments, viewMode])

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
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    let firstDayOfWeek = firstDayOfMonth.getDay()
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

    const days: CalendarDay[] = []
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

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(year, month, i)
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isSameDay(date, new Date()),
        appointments: getAppointmentsForDay(date),
      })
    }

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
    setSelectedDay(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente":
        return "bg-amber-500 border-amber-600 hover:bg-amber-600 text-white"
      case "confirmada":
        return "bg-emerald-500 border-emerald-600 hover:bg-emerald-600 text-white"
      case "cancelada":
        return "bg-rose-500 border-rose-600 hover:bg-rose-600 text-white"
      case "completada":
        return "bg-blue-500 border-blue-600 hover:bg-blue-600 text-white"
      default:
        return "bg-slate-500 border-slate-600 hover:bg-slate-600 text-white"
    }
  }

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
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

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)

    const days: CalendarDay[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isSameDay(date, new Date()),
        appointments: getAppointmentsForDay(date),
      })
    }
    return days
  }

  const getCurrentDayAppointments = () => {
    return getAppointmentsForDay(currentDate).sort((a, b) => a.time.localeCompare(b.time))
  }

  return (
    <div className="w-full space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-balance">Calendario de Citas</h1>
                <p className="text-sm text-muted-foreground">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday} className="px-4 bg-transparent">
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="month">Mes</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="day">Día</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="p-0">
          {viewMode === "month" && (
            <div className="p-4">
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="bg-muted text-center text-xs font-semibold py-3 px-2 border-b text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}

                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={cn(
                      "min-h-[100px] bg-background p-2 hover:bg-accent/50 cursor-pointer transition-colors relative",
                      !day.isCurrentMonth && "opacity-40",
                      day.isToday && "bg-accent",
                    )}
                    onClick={() => setSelectedDay(day)}
                  >
                    <div
                      className={cn(
                        "text-sm font-medium mb-1",
                        day.isToday &&
                          "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center",
                      )}
                    >
                      {day.date.getDate()}
                    </div>

                    <div className="space-y-1">
                      {day.appointments.slice(0, 3).map((appointment) => (
                        <div
                          key={appointment.id}
                          className={cn(
                            "text-xs px-2 py-1 rounded-md truncate transition-all border",
                            getStatusColor(appointment.status),
                          )}
                          title={`${appointment.time.substring(0, 5)} - ${appointment.title}`}
                        >
                          <Clock className="inline h-3 w-3 mr-1" />
                          {appointment.time.substring(0, 5)} {appointment.title}
                        </div>
                      ))}
                      {day.appointments.length > 3 && (
                        <div className="text-xs text-center text-muted-foreground font-medium">
                          +{day.appointments.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === "week" && (
            <div className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {getWeekDays().map((day, index) => (
                  <div
                    key={index}
                    className={cn(
                      "border rounded-lg p-3 min-h-[400px]",
                      day.isToday && "border-primary border-2 bg-accent/20",
                    )}
                  >
                    <div className="text-center mb-3">
                      <div className="text-xs text-muted-foreground font-medium">{weekDays[index]}</div>
                      <div
                        className={cn(
                          "text-lg font-bold mt-1",
                          day.isToday &&
                            "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto",
                        )}
                      >
                        {day.date.getDate()}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {day.appointments
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((appointment) => (
                          <div
                            key={appointment.id}
                            className={cn(
                              "p-2 rounded-md border cursor-pointer transition-all",
                              getStatusColor(appointment.status),
                            )}
                            onClick={() => {
                              setCurrentDate(day.date)
                              setSelectedDay(day)
                            }}
                          >
                            <div className="font-semibold text-xs mb-1">{appointment.time.substring(0, 5)}</div>
                            <div className="text-xs font-medium truncate">{appointment.title}</div>
                            {appointment.location && (
                              <div className="text-xs mt-1 truncate opacity-90">
                                <MapPin className="inline h-3 w-3 mr-1" />
                                {appointment.location}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === "day" && (
            <div className="p-6 max-w-3xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold">
                  {currentDate.toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
              </div>

              {getCurrentDayAppointments().length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No hay citas programadas para este día</p>
                  <Button className="mt-4" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva cita
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {getCurrentDayAppointments().map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={cn("text-xs", getStatusColor(appointment.status))}>
                              {appointment.status}
                            </Badge>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              {appointment.time.substring(0, 5)} ({appointment.duration} min)
                            </div>
                          </div>

                          <h3 className="font-semibold text-lg mb-2">{appointment.title}</h3>

                          {appointment.description && (
                            <p className="text-sm text-muted-foreground mb-3">{appointment.description}</p>
                          )}

                          {appointment.location && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-2" />
                              {appointment.location}
                            </div>
                          )}

                          {appointment.projects && (
                            <Link
                              href={`/dashboard/projects/${appointment.project_id}`}
                              className="inline-block mt-3 text-sm text-primary hover:underline"
                            >
                              Ver proyecto: {appointment.projects.title}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDay && viewMode === "month" && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <h3 className="font-semibold text-lg">
                {selectedDay.date.toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedDay.appointments.length} {selectedDay.appointments.length === 1 ? "cita" : "citas"}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)}>
              Cerrar
            </Button>
          </CardHeader>

          <CardContent>
            {selectedDay.appointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay citas para este día</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDay.appointments
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                      onClick={() => {
                        if (appointment.projects) {
                          window.location.href = `/dashboard/projects/${appointment.project_id}`
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{appointment.title}</h4>
                        <Badge className={cn("text-xs", getStatusColor(appointment.status))}>
                          {appointment.status}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {appointment.time.substring(0, 5)} ({appointment.duration} minutos)
                        </div>

                        {appointment.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            {appointment.location}
                          </div>
                        )}

                        {appointment.description && <p className="mt-2 text-sm">{appointment.description}</p>}

                        {appointment.projects && (
                          <div className="mt-2 pt-2 border-t">
                            <span className="text-xs font-medium text-primary">
                              Proyecto: {appointment.projects.title}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
