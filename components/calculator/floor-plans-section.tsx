"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ImageIcon, Loader2, Maximize2, Trash2 } from "lucide-react"
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

interface FloorPlansSectionProps {
  projectId: string
}

type PlanType = "before" | "after"

export function FloorPlansSection({ projectId }: FloorPlansSectionProps) {
  const [activeTab, setActiveTab] = useState<PlanType>("before")
  const [isUploading, setIsUploading] = useState(false)
  const [plans, setPlans] = useState<Record<PlanType, string | null>>({
    before: null,
    after: null,
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<PlanType | null>(null)
  const { toast } = useToast()

  // Función para manejar la subida de archivos
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato no soportado",
        description: "Por favor, sube una imagen (JPG, PNG, GIF, WEBP).",
        variant: "destructive",
      })
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "El tamaño máximo permitido es 5MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Simular subida (en una implementación real, aquí se subiría a un servidor o servicio de almacenamiento)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Crear URL para la imagen (en una implementación real, esta sería la URL devuelta por el servidor)
      const imageUrl = URL.createObjectURL(file)

      // Actualizar el estado con la nueva URL
      setPlans((prev) => ({
        ...prev,
        [activeTab]: imageUrl,
      }))

      toast({
        title: "Plano subido correctamente",
        description: `El plano "${activeTab === "before" ? "Antes" : "Después"}" ha sido guardado.`,
      })
    } catch (error) {
      console.error("Error al subir el plano:", error)
      toast({
        title: "Error al subir el plano",
        description: "Ha ocurrido un error al subir el plano.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Limpiar el input para permitir subir el mismo archivo nuevamente
      e.target.value = ""
    }
  }

  // Función para abrir la imagen en una ventana separada
  const openInNewWindow = (type: PlanType) => {
    if (!plans[type]) return
    window.open(plans[type] as string, "_blank")
  }

  // Función para confirmar eliminación
  const confirmDelete = (type: PlanType) => {
    setPlanToDelete(type)
    setDeleteDialogOpen(true)
  }

  // Función para eliminar un plano
  const handleDeletePlan = () => {
    if (!planToDelete) return

    // Liberar la URL del objeto si es una URL creada con createObjectURL
    if (plans[planToDelete]?.startsWith("blob:")) {
      URL.revokeObjectURL(plans[planToDelete] as string)
    }

    // Actualizar el estado
    setPlans((prev) => ({
      ...prev,
      [planToDelete]: null,
    }))

    toast({
      title: "Plano eliminado",
      description: `El plano "${planToDelete === "before" ? "Antes" : "Después"}" ha sido eliminado.`,
    })

    setDeleteDialogOpen(false)
    setPlanToDelete(null)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-md">Planos del Proyecto</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PlanType)}>
          <TabsList className="mb-4">
            <TabsTrigger value="before">Plano Antes</TabsTrigger>
            <TabsTrigger value="after">Plano Después</TabsTrigger>
          </TabsList>

          <TabsContent value="before" className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                id="floor-plan-before"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="flex-1"
              />
              {plans.before && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openInNewWindow("before")}
                  title="Ver plano en ventana separada"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {plans.before ? (
              <div className="relative h-48 border rounded-md overflow-hidden bg-gray-50">
                <img
                  src={plans.before || "/placeholder.svg"}
                  alt="Plano antes"
                  className="w-full h-full object-contain"
                  onClick={() => openInNewWindow("before")}
                  style={{ cursor: "pointer" }}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => confirmDelete("before")}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                </Button>
              </div>
            ) : (
              <div className="h-48 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                <div className="text-center p-4">
                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No hay plano "Antes" cargado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sube una imagen para visualizar el estado inicial
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="after" className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                id="floor-plan-after"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="flex-1"
              />
              {plans.after && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openInNewWindow("after")}
                  title="Ver plano en ventana separada"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {plans.after ? (
              <div className="relative h-48 border rounded-md overflow-hidden bg-gray-50">
                <img
                  src={plans.after || "/placeholder.svg"}
                  alt="Plano después"
                  className="w-full h-full object-contain"
                  onClick={() => openInNewWindow("after")}
                  style={{ cursor: "pointer" }}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => confirmDelete("after")}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                </Button>
              </div>
            ) : (
              <div className="h-48 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                <div className="text-center p-4">
                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No hay plano "Después" cargado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sube una imagen para visualizar el resultado final
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Subiendo plano...</span>
          </div>
        )}
      </CardContent>

      {/* Diálogo de confirmación para eliminar plano */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plano?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar el plano "{planToDelete === "before" ? "Antes" : "Después"}"? Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlan} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
