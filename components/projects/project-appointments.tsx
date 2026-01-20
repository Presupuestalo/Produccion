"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Calendar, Trash2, Clock, MapPin, Users, Check, Edit } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  createAppointment,
  getProjectAppointments,
  updateAppointment,
  deleteAppointment,
  completeAppointment,
} from "@/lib/services/appointment-service"
import type { ProjectAppointment, ProjectAppointmentFormData } from "@/types/project"

interface ProjectAppointmentsProps {
  projectId: string
}

export function ProjectAppointments({ projectId }: ProjectAppointmentsProps) {
  const [appointments, setAppointments] = useState<ProjectAppointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<ProjectAppointment | null>(null)
  const [activeTab, setActiveTab] = useState("upcoming")
  const { toast } = useToast()

  // Estado para el formulario
  const [formData, setFormData] = useState<ProjectAppointmentFormData>({
    project_id: projectId,
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    duration: 60,
    location: "",
    attendees: "",
    status: "pendiente",
  })

  // Cargar citas al montar el componente
  useEffect(() => {
    loadAppointments()
  }, [projectId])

  const loadAppointments = async () => {
    setIsLoading(true)
    try {
      const data = await getProjectAppointments(projectId)
      setAppointments(data)
    } catch (error) {
      console.error("Error al cargar citas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las citas del proyecto",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleNumberChange = (id: string, value: string) => {
    const numValue = Number.parseInt(value, 10)
    if (!isNaN(numValue)) {
      setFormData((prev) => ({
        ...prev,
        [id]: numValue,
      }))
    }
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const resetForm = () => {
    setFormData({
      project_id: projectId,
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      time: "10:00",
      duration: 60,
      location: "",
      attendees: "",
      status: "pendiente",
    })
    setEditingAppointment(null)
  }

  const openEditDialog = (appointment: ProjectAppointment) => {
    setEditingAppointment(appointment)
    setFormData({
      project_id: appointment.project_id,
      title: appointment.title,
      description: appointment.description || "",
      date: appointment.date,
      time: appointment.time,
      duration: appointment.duration,
      location: appointment.location || "",
      attendees: appointment.attendees || "",
      status: appointment.status as "pendiente" | "confirmada" | "cancelada" | "completada",
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingAppointment) {
        // Actualizar cita existente
        await updateAppointment(editingAppointment.id, formData)
        toast({
          title: "Cita actualizada",
          description: "La cita se ha actualizado correctamente",
        })
      } else {
        // Crear nueva cita
        await createAppointment(formData)
        toast({
          title: "Cita programada",
          description: "La cita se ha programado correctamente",
        })
      }

      setIsDialogOpen(false)
      resetForm()
      // Recargar citas
      await loadAppointments()
    } catch (error) {
      console.error("Error al guardar cita:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la cita",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (appointmentId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta cita?")) {
      return
    }

    try {
      await deleteAppointment(appointmentId)
      toast({
        title: "Cita eliminada",
        description: "La cita se ha eliminado correctamente",
      })
      // Actualizar la lista de citas
      setAppointments(appointments.filter((appointment) => appointment.id !== appointmentId))
    } catch (error) {
      console.error("Error al eliminar cita:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la cita",
        variant: "destructive",
      })
    }
  }

  const handleComplete = async (appointment: ProjectAppointment) => {
    try {
      const updatedAppointment = await completeAppointment(appointment)
      toast({
        title: "Cita completada",
        description: "La cita se ha marcado como completada y se ha creado una actividad",
      })
      // Actualizar la lista de citas
      setAppointments(appointments.map((a) => (a.id === updatedAppointment.id ? updatedAppointment : a)))
    } catch (error) {
      console.error("Error al completar cita:", error)
      toast({
        title: "Error",
        description: "No se pudo completar la cita",
        variant: "destructive",
      })
    }
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

  // Función para formatear la duración
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours === 0) {
      return `${mins} minutos`
    } else if (mins === 0) {
      return `${hours} ${hours === 1 ? "hora" : "horas"}`
    } else {
      return `${hours} ${hours === 1 ? "hora" : "horas"} y ${mins} minutos`
    }
  }

  // Filtrar citas según la pestaña activa
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingAppointments = appointments
    .filter((appointment) => {
      const appointmentDate = new Date(appointment.date)
      appointmentDate.setHours(0, 0, 0, 0)
      return appointmentDate >= today && appointment.status !== "completada" && appointment.status !== "cancelada"
    })
    .sort((a, b) => {
      // Ordenar por fecha y hora
      const dateA = new Date(`${a.date}T${a.time}`)
      const dateB = new Date(`${b.date}T${b.time}`)
      return dateA.getTime() - dateB.getTime()
    })

  const pastAppointments = appointments
    .filter((appointment) => {
      const appointmentDate = new Date(appointment.date)
      appointmentDate.setHours(0, 0, 0, 0)
      return appointmentDate < today || appointment.status === "completada" || appointment.status === "cancelada"
    })
    .sort((a, b) => {
      // Ordenar por fecha y hora (más reciente primero)
      const dateA = new Date(`${a.date}T${a.time}`)
      const dateB = new Date(`${b.date}T${b.time}`)
      return dateB.getTime() - dateA.getTime()
    })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Agenda de Citas</CardTitle>
        <Button
          onClick={() => {
            resetForm()
            setIsDialogOpen(true)
          }}
          className="gap-1"
        >
          <Plus className="h-4 w-4" /> Programar cita
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">Próximas ({upcomingAppointments.length})</TabsTrigger>
            <TabsTrigger value="past">Pasadas ({pastAppointments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay citas próximas programadas.</p>
                <p className="text-sm mt-2">Haz clic en "Programar cita" para añadir una nueva cita.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-4 relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{appointment.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </Badge>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            {new Date(appointment.date).toLocaleDateString("es-ES", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {appointment.status !== "completada" && appointment.status !== "cancelada" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleComplete(appointment)}
                            className="h-8 w-8 p-0 text-green-500"
                            title="Marcar como completada"
                          >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Completar</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(appointment)}
                          className="h-8 w-8 p-0"
                          title="Editar cita"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(appointment.id)}
                          className="h-8 w-8 p-0 text-red-500"
                          title="Eliminar cita"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </div>

                    {appointment.description && <p className="mt-2 text-sm">{appointment.description}</p>}

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {appointment.time} ({formatDuration(appointment.duration)})
                        </span>
                      </div>

                      {appointment.location && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{appointment.location}</span>
                        </div>
                      )}

                      {appointment.attendees && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>{appointment.attendees}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pastAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay citas pasadas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastAppointments.map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-4 relative opacity-80">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{appointment.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </Badge>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            {new Date(appointment.date).toLocaleDateString("es-ES", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(appointment.id)}
                        className="h-8 w-8 p-0 text-red-500"
                        title="Eliminar cita"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>

                    {appointment.description && <p className="mt-2 text-sm">{appointment.description}</p>}

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {appointment.time} ({formatDuration(appointment.duration)})
                        </span>
                      </div>

                      {appointment.location && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{appointment.location}</span>
                        </div>
                      )}

                      {appointment.attendees && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>{appointment.attendees}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Diálogo para añadir/editar cita */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingAppointment ? "Editar cita" : "Programar nueva cita"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título de la cita *</Label>
                  <Input id="title" value={formData.title} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha *</Label>
                  <Input id="date" type="date" value={formData.date} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Hora *</Label>
                  <Input id="time" type="time" value={formData.time} onChange={handleChange} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (minutos) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    step="15"
                    value={formData.duration}
                    onChange={(e) => handleNumberChange("duration", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado *</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="confirmada">Confirmada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                      <SelectItem value="completada">Completada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input id="location" value={formData.location} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attendees">Asistentes</Label>
                  <Input id="attendees" value={formData.attendees} onChange={handleChange} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  resetForm()
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingAppointment ? (
                  "Actualizar"
                ) : (
                  "Guardar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
