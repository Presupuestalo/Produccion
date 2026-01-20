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
import { Loader2, Plus, Calendar, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { createProjectActivity, getProjectActivities, deleteProjectActivity } from "@/lib/services/project-service"
import type { ProjectActivity, ProjectActivityFormData } from "@/types/project"

interface ProjectActivitiesProps {
  projectId: string
}

export function ProjectActivities({ projectId }: ProjectActivitiesProps) {
  const [activities, setActivities] = useState<ProjectActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ProjectActivityFormData>({
    project_id: projectId,
    description: "",
    date: new Date().toISOString().split("T")[0],
    type: "visita",
  })
  const { toast } = useToast()

  // Cargar actividades al montar el componente
  useEffect(() => {
    loadActivities()
  }, [projectId])

  const loadActivities = async () => {
    setIsLoading(true)
    try {
      const data = await getProjectActivities(projectId)
      setActivities(data)
    } catch (error) {
      console.error("Error al cargar actividades:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las actividades del proyecto",
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

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: value as "visita" | "decisión" | "compra" | "trámite" | "otro",
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await createProjectActivity(formData)
      toast({
        title: "Actividad registrada",
        description: "La actividad se ha registrado correctamente",
      })
      setIsDialogOpen(false)
      // Resetear el formulario
      setFormData({
        project_id: projectId,
        description: "",
        date: new Date().toISOString().split("T")[0],
        type: "visita",
      })
      // Recargar actividades
      await loadActivities()
    } catch (error) {
      console.error("Error al registrar actividad:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar la actividad",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (activityId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta actividad?")) {
      return
    }

    try {
      await deleteProjectActivity(activityId)
      toast({
        title: "Actividad eliminada",
        description: "La actividad se ha eliminado correctamente",
      })
      // Actualizar la lista de actividades
      setActivities(activities.filter((activity) => activity.id !== activityId))
    } catch (error) {
      console.error("Error al eliminar actividad:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la actividad",
        variant: "destructive",
      })
    }
  }

  // Función para obtener el color de la insignia según el tipo
  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case "visita":
        return "bg-blue-100 text-blue-800"
      case "decisión":
        return "bg-green-100 text-green-800"
      case "compra":
        return "bg-purple-100 text-purple-800"
      case "trámite":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return new Date(dateString).toLocaleDateString("es-ES", options)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Actividades del Proyecto</CardTitle>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" /> Añadir
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay actividades registradas para este proyecto.</p>
            <p className="text-sm mt-2">Haz clic en "Añadir" para registrar una nueva actividad.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="border rounded-lg p-4 relative">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Badge className={getActivityTypeColor(activity.type)}>
                      {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {formatDate(activity.date)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(activity.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Eliminar</span>
                  </Button>
                </div>
                <p className="mt-2">{activity.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Diálogo para añadir actividad */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar nueva actividad</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input id="date" type="date" value={formData.date} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={formData.type} onValueChange={handleSelectChange}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visita">Visita</SelectItem>
                      <SelectItem value="decisión">Decisión</SelectItem>
                      <SelectItem value="compra">Compra</SelectItem>
                      <SelectItem value="trámite">Trámite</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe la actividad realizada"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
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
