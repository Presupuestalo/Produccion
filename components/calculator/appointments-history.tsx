"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"

interface AppointmentsHistoryProps {
  projectId: string
}

export function AppointmentsHistory({ projectId }: AppointmentsHistoryProps) {
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAppointments()
  }, [projectId])

  const loadAppointments = async () => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("project_id", projectId)
        .order("appointment_date", { ascending: false })

      if (error) {
        console.error("[v0] Error loading appointments:", error)
        throw error
      }

      setAppointments(data || [])
    } catch (error) {
      console.error("[v0] Error al cargar citas:", error)
      setAppointments([])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Programada"
      case "completed":
        return "Completada"
      case "cancelled":
        return "Cancelada"
      default:
        return status
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Histórico de Citas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">Cargando...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Histórico de Citas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No hay citas programadas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="p-2 border rounded-md hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-1 mb-1">
                  <h4 className="font-medium text-xs truncate">{appointment.name}</h4>
                  <Badge variant="outline" className={`text-[10px] px-1 py-0 ${getStatusColor(appointment.status)}`}>
                    {getStatusLabel(appointment.status)}
                  </Badge>
                </div>

                <div className="space-y-0.5 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    <span>{format(new Date(appointment.appointment_date), "d MMM yyyy", { locale: es })}</span>
                    <Clock className="h-2.5 w-2.5 ml-1" />
                    <span>{format(new Date(appointment.appointment_date), "HH:mm")}</span>
                  </div>

                  {appointment.address && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      <span className="line-clamp-1">{appointment.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
