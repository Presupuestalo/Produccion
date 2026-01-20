"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, Clock, Mail, Trash2, CheckCircle, XCircle, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AppointmentsListProps {
  userId: string
  refreshKey: number
}

export function AppointmentsList({ userId, refreshKey }: AppointmentsListProps) {
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadAppointments()
  }, [userId, refreshKey])

  const loadAppointments = async () => {
    try {
      setIsLoading(true)
      console.log("[v0] Loading appointments for user:", userId)
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          projects (
            title,
            client
          )
        `)
        .eq("user_id", userId)
        .order("appointment_date", { ascending: true })

      if (error) {
        console.error("[v0] Error loading appointments:", error)
        throw error
      }
      console.log("[v0] Appointments loaded:", data?.length || 0)
      setAppointments(data || [])
    } catch (error) {
      console.error("[v0] Error loading appointments:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las citas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const { error } = await supabase.from("appointments").delete().eq("id", deleteId)

      if (error) throw error

      toast({
        title: "Cita eliminada",
        description: "La cita ha sido eliminada correctamente",
      })

      loadAppointments()
    } catch (error) {
      console.error("[v0] Error deleting appointment:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la cita",
        variant: "destructive",
      })
    } finally {
      setDeleteId(null)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("appointments").update({ status: newStatus }).eq("id", id)

      if (error) throw error

      toast({
        title: "Estado actualizado",
        description: "El estado de la cita ha sido actualizado",
      })

      loadAppointments()
    } catch (error) {
      console.error("[v0] Error updating status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      })
    }
  }

  const now = new Date()
  const pendingAppointments = appointments.filter(
    (apt) => new Date(apt.appointment_date) >= now && apt.status === "scheduled",
  )
  const pastAppointments = appointments.filter(
    (apt) => new Date(apt.appointment_date) < now || apt.status !== "scheduled",
  )

  const renderAppointment = (appointment: any) => (
    <div
      key={appointment.id}
      className="flex items-start justify-between p-4 border rounded-lg hover:opacity-70 transition-colors"
    >
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{appointment.name}</h3>
          <Badge
            variant={
              appointment.status === "completed"
                ? "default"
                : appointment.status === "cancelled"
                  ? "destructive"
                  : "secondary"
            }
          >
            {appointment.status === "scheduled" && "Programada"}
            {appointment.status === "completed" && "Completada"}
            {appointment.status === "cancelled" && "Cancelada"}
          </Badge>
        </div>

        {appointment.description && <p className="text-sm text-muted-foreground">{appointment.description}</p>}

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {format(new Date(appointment.appointment_date), "PPP", { locale: es })}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {format(new Date(appointment.appointment_date), "HH:mm")}
          </div>
          {appointment.address && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {appointment.address}
            </div>
          )}
          {appointment.guest_email && (
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {appointment.guest_email}
            </div>
          )}
        </div>

        {appointment.projects && (
          <p className="text-sm text-muted-foreground">
            Proyecto: {appointment.projects.title}
            {appointment.projects.client && ` - ${appointment.projects.client}`}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {appointment.status === "scheduled" && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleStatusChange(appointment.id, "completed")}
              title="Marcar como completada"
              className="hover:bg-transparent hover:opacity-70"
            >
              <CheckCircle className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleStatusChange(appointment.id, "cancelled")}
              title="Cancelar cita"
              className="hover:bg-transparent hover:opacity-70"
            >
              <XCircle className="h-4 w-4 text-orange-600" />
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteId(appointment.id)}
          title="Eliminar cita"
          className="hover:bg-transparent hover:opacity-70"
        >
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No hay citas programadas</h3>
        <p className="text-muted-foreground">Crea tu primera cita para comenzar</p>
      </div>
    )
  }

  return (
    <>
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pendientes ({pendingAppointments.length})</TabsTrigger>
          <TabsTrigger value="past">Pasadas ({pastAppointments.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-4 mt-4">
          {pendingAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay citas pendientes</div>
          ) : (
            pendingAppointments.map(renderAppointment)
          )}
        </TabsContent>
        <TabsContent value="past" className="space-y-4 mt-4">
          {pastAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay citas pasadas</div>
          ) : (
            pastAppointments.map(renderAppointment)
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La cita será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
