"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { Maximize2, Loader2, RefreshCw, Trash2, Info, AlertTriangle, Image, Copy } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UpdateFloorPlansButton } from "./update-floor-plans-button"
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
import { FixStoragePermissionsButton } from "./fix-storage-permissions-button"

interface FloorPlanViewerProps {
  projectId: string
}

type PlanType = "before" | "after"

interface FloorPlan {
  id?: string
  project_id: string
  image_url: string
  plan_type: PlanType
  updated_at?: string
}

export function FloorPlanViewer({ projectId }: FloorPlanViewerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [floorPlans, setFloorPlans] = useState<Record<PlanType, string | null>>({
    before: null,
    after: null,
  })
  const [currentPlanType, setCurrentPlanType] = useState<PlanType>("before")
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isFixingPolicies, setIsFixingPolicies] = useState(false)
  const [isTableUpdated, setIsTableUpdated] = useState<boolean | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<PlanType | null>(null)
  const [imageLoadError, setImageLoadError] = useState<Record<PlanType, boolean>>({
    before: false,
    after: false,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({})
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [hasPermissionIssues, setHasPermissionIssues] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Verificar si la tabla tiene la estructura actualizada
  useEffect(() => {
    checkTableStructure()
  }, [])

  // Cargar los planos existentes al montar el componente
  useEffect(() => {
    if (isTableUpdated) {
      loadFloorPlans()
    }
  }, [isTableUpdated, projectId])

  // Verificar la estructura de la tabla
  const checkTableStructure = async () => {
    try {
      // Verificar si existe al menos una de las dos columnas
      const { data, error } = await supabase.from("project_floor_plans").select("plan_type, variant").limit(1)

      if (error) {
        if (error.message.includes("does not exist")) {
          setIsTableUpdated(false)
        } else if (error.message.includes('column "plan_type" does not exist') && error.message.includes('column "variant" does not exist')) {
          setIsTableUpdated(false)
        } else if (!error.message.includes('column')) {
          // Si el error no es por columna faltante (ej. RLS), asumimos por ahora que está bien
          setIsTableUpdated(true)
        } else {
          console.error("Error al verificar la estructura de la tabla:", error)
          setIsTableUpdated(true) // Fallback optimistic
        }
      } else {
        setIsTableUpdated(true)
      }
    } catch (error) {
      console.error("Error al verificar la estructura de la tabla:", error)
      setIsTableUpdated(false)
    }
  }

  // Cargar los planos existentes
  const loadFloorPlans = async () => {
    try {
      setDebugInfo((prev) => ({ ...prev, loadingStarted: new Date().toISOString() }))

      // Buscar si ya existen planos para este proyecto - Ordenar por fecha para tener los más recientes
      const { data, error } = await supabase
        .from("project_floor_plans")
        .select("*")
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false })

      if (error) {
        setDebugInfo((prev) => ({ ...prev, loadError: error.message }))
        return
      }

      setDebugInfo((prev) => ({ ...prev, plansData: data }))

      // Inicializar con null
      const plans: Record<PlanType, string | null> = {
        before: null,
        after: null,
      }

      if (data && data.length > 0) {
        // Procesar los planos encontrados
        data.forEach((plan: any) => {
          let type: PlanType | null = null

          if (plan.plan_type === "before" || plan.plan_type === "after") {
            type = plan.plan_type as PlanType
          } else if (plan.variant === "current") {
            type = "before"
          } else if (plan.variant === "proposal") {
            type = "after"
          }

          if (type && !plans[type]) {
            const timestamp = new Date().getTime()
            plans[type] = `${plan.image_url}?t=${timestamp}`
            console.log(`Cargando plano ${type}:`, plan.image_url)
          }
        })
      }

      setFloorPlans(plans)
      setDebugInfo((prev) => ({ ...prev, processedPlans: plans }))
    } catch (error) {
      setDebugInfo((prev) => ({ ...prev, loadCatchError: String(error) }))
    }
  }

  // Función para clonar el plano de antes al de después
  const handleCloneBeforeToAfter = async () => {
    if (!floorPlans.before) return

    setIsUploading(true)
    try {
      // 1. Obtener los datos completos del plano de origen
      const { data: plans, error: fetchError } = await supabase
        .from("project_floor_plans")
        .select("*")
        .eq("project_id", projectId)
        .or(`plan_type.eq.before,variant.eq.current`)
        .order("updated_at", { ascending: false })
        .limit(1)

      if (fetchError || !plans || plans.length === 0) {
        throw new Error("No se encontró el plano de origen para clonar")
      }

      const sourcePlan = plans[0]

      // 2. Insertar/Upsert como plano de después
      const { error: upsertError } = await supabase
        .from("project_floor_plans")
        .upsert({
          project_id: projectId,
          user_id: sourcePlan.user_id,
          image_url: sourcePlan.image_url,
          plan_type: "after",
          variant: "proposal",
          name: `${sourcePlan.name || "Estado Actual"} (Copia)`,
          data: sourcePlan.data,
          updated_at: new Date().toISOString()
        }, { onConflict: "project_id,variant" })

      if (upsertError) throw upsertError

      await loadFloorPlans()
      toast({
        title: "Plano clonado",
        description: "Se ha usado el plano 'Antes' como base para el 'Después'."
      })
    } catch (error: any) {
      console.error("Error al clonar el plano:", error)
      toast({
        title: "Error al clonar",
        description: error.message || "No se pudo clonar el plano",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Modificamos esta función para que el diálogo no se cierre automáticamente
  const handleOpenChange = (open: boolean) => {
    // Solo permitimos cerrar el diálogo a través del botón X
    if (!open) {
      // No hacemos nada, ignoramos el intento de cerrar
      return
    } else {
      setIsOpen(true)
      // Resetear zoom y posición
      setZoom(1)
      setPosition({ x: 0, y: 0 })
    }
  }

  // Función explícita para cerrar el diálogo
  const closeDialog = () => {
    setIsOpen(false)
  }

  // Función para corregir las políticas de seguridad
  const fixSecurityPolicies = async () => {
    setIsFixingPolicies(true)
    try {
      // Intentar crear el bucket si no existe
      const response = await fetch("/api/fix-storage-permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al corregir los permisos")
      }

      toast({
        title: "Permisos corregidos",
        description: "Se han corregido los permisos de almacenamiento correctamente.",
      })

      // Esperar un momento para que se apliquen los cambios
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return true
    } catch (error) {
      console.error("Error al configurar el almacenamiento:", error)
      return false
    } finally {
      setIsFixingPolicies(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limpiar error anterior
    setUploadError(null)

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato no soportado",
        description: "Por favor, sube una imagen (JPG, PNG, GIF, WEBP) o un PDF.",
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
      // Generar un nombre único para el archivo
      const fileExt = file.name.split(".").pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `floor-plans/${fileName}`

      // Intentar subir el archivo
      let uploadResult = await supabase.storage.from("project-files").upload(filePath, file)

      // Si hay un error de política, intentar corregirlo y volver a intentar
      if (uploadResult.error && uploadResult.error.message.includes("policy")) {
        const fixed = await fixSecurityPolicies()
        if (fixed) {
          // Intentar subir de nuevo
          uploadResult = await supabase.storage.from("project-files").upload(filePath, file)
        }
      }

      if (uploadResult.error) {
        throw uploadResult.error
      }

      // Obtener la URL pública del archivo
      const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(filePath)
      const imageUrl = urlData.publicUrl

      console.log("URL de la imagen subida:", imageUrl)
      setDebugInfo((prev) => ({ ...prev, uploadedImageUrl: imageUrl }))

      // Crear el objeto del plano
      const floorPlan: FloorPlan = {
        project_id: projectId,
        image_url: imageUrl,
        plan_type: currentPlanType,
        updated_at: new Date().toISOString(),
      }

      // Intentar guardar la referencia en la base de datos
      const dbResult = await supabase
        .from("project_floor_plans")
        .upsert({
          ...floorPlan,
          variant: currentPlanType === 'before' ? 'current' : 'proposal'
        }, { onConflict: "project_id,variant" })

      if (dbResult.error) {
        throw dbResult.error
      }

      // Actualizar el estado local
      const timestamp = new Date().getTime()
      setFloorPlans((prev) => ({
        ...prev,
        [currentPlanType]: `${imageUrl}?t=${timestamp}`,
      }))

      // Resetear el error de carga de imagen
      setImageLoadError((prev) => ({
        ...prev,
        [currentPlanType]: false,
      }))

      toast({
        title: "Plano subido correctamente",
        description: `El plano "${currentPlanType === "before" ? "Antes" : "Después"}" ha sido guardado.`,
      })

      // Limpiar el input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      console.error("Error al subir el plano:", error)
      setUploadError(error.message || "Ha ocurrido un error al subir el plano.")
      setDebugInfo((prev) => ({ ...prev, uploadError: String(error) }))
      toast({
        title: "Error al subir el plano",
        description: error.message || "Ha ocurrido un error al subir el plano.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Función para eliminar un plano
  const handleDeletePlan = async () => {
    if (!planToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch("/api/delete-floor-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          planType: planToDelete,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al eliminar el plano")
      }

      // Actualizar el estado local
      setFloorPlans((prev) => ({
        ...prev,
        [planToDelete]: null,
      }))

      toast({
        title: "Plano eliminado",
        description: `El plano "${planToDelete === "before" ? "Antes" : "Después"}" ha sido eliminado.`,
      })
    } catch (error: any) {
      console.error("Error al eliminar el plano:", error)
      toast({
        title: "Error al eliminar el plano",
        description: error.message || "Ha ocurrido un error al eliminar el plano.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setPlanToDelete(null)
    }
  }

  // Funciones para el zoom y movimiento
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5))
  }

  // Simplificar el manejo de eventos
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Añadir soporte para zoom con rueda del ratón
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const delta = e.deltaY * -0.01
    const newZoom = Math.min(Math.max(zoom + delta, 0.5), 3)
    setZoom(newZoom)
  }

  const handleReset = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }

  // Función para confirmar eliminación
  const confirmDelete = (type: PlanType) => {
    setPlanToDelete(type)
    setDeleteDialogOpen(true)
  }

  // Función para manejar errores de carga de imagen
  const handleImageError = (type: PlanType) => {
    console.error(`Error al cargar la imagen del plano ${type}`)
    setImageLoadError((prev) => ({
      ...prev,
      [type]: true,
    }))

    // Marcar que puede haber problemas de permisos
    setHasPermissionIssues(true)

    // Guardar información de depuración
    setDebugInfo((prev) => ({
      ...prev,
      imageError: {
        type,
        url: floorPlans[type],
        time: new Date().toISOString(),
      },
    }))
  }

  // Función para refrescar los planos
  const refreshPlans = async () => {
    setIsRefreshing(true)
    try {
      await loadFloorPlans()

      // Resetear los errores de carga
      setImageLoadError({
        before: false,
        after: false,
      })

      toast({
        title: "Planos actualizados",
        description: "Se han actualizado los planos correctamente.",
      })
    } catch (error) {
      console.error("Error al refrescar los planos:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Función para verificar y corregir los permisos de la imagen
  const verifyAndFixImage = async (type: PlanType) => {
    if (!floorPlans[type]) return

    setIsVerifying(true)
    try {
      const response = await fetch("/api/verify-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: floorPlans[type],
        }),
      })

      const data = await response.json()

      setDebugInfo((prev) => ({
        ...prev,
        imageVerification: {
          type,
          url: floorPlans[type],
          response: data,
          time: new Date().toISOString(),
        },
      }))

      if (data.success) {
        toast({
          title: "Imagen verificada",
          description: "La imagen existe y es accesible. Intenta cargarla nuevamente.",
        })

        // Actualizar la URL con un nuevo timestamp para forzar la recarga
        const timestamp = new Date().getTime()
        setFloorPlans((prev) => ({
          ...prev,
          [type]: `${floorPlans[type]?.split("?")[0]}?t=${timestamp}`,
        }))

        // Resetear el error de carga
        setImageLoadError((prev) => ({
          ...prev,
          [type]: false,
        }))
      } else if (data.corrected) {
        toast({
          title: "Permisos corregidos",
          description: "Se han corregido los permisos. Intenta cargar la imagen nuevamente.",
        })

        // Esperar un momento para que se apliquen los cambios
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Actualizar la URL con un nuevo timestamp para forzar la recarga
        const timestamp = new Date().getTime()
        setFloorPlans((prev) => ({
          ...prev,
          [type]: `${floorPlans[type]?.split("?")[0]}?t=${timestamp}`,
        }))

        // Resetear el error de carga
        setImageLoadError((prev) => ({
          ...prev,
          [type]: false,
        }))
      } else {
        toast({
          title: "Error al verificar la imagen",
          description: data.error || "No se pudo verificar la imagen",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error al verificar la imagen:", error)
      toast({
        title: "Error al verificar la imagen",
        description: error.message || "Ha ocurrido un error al verificar la imagen",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  // Función para abrir la imagen en una ventana separada del navegador
  const openInNewWindow = (type: PlanType) => {
    if (!floorPlans[type]) return

    // URL de la imagen
    const imageUrl = floorPlans[type] as string

    // Crear una URL de datos con la imagen directamente
    const windowName = `floorPlan_${projectId}_${type}_${new Date().getTime()}`

    // Crear una URL simple que solo muestra la imagen a pantalla completa
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>LORENA ${type === "before" ? "ANTES" : "DESPUÉS"}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100vh;
          font-family: Arial, sans-serif;
        }
        .header {
          background-color: #f0f0f0;
          padding: 10px;
          text-align: center;
          font-weight: bold;
          font-size: 18px;
          border-bottom: 1px solid #ddd;
        }
        .content {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #f5f5f5;
          overflow: auto;
        }
        img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        @media print {
          .header {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">LORENA ${type === "before" ? "ANTES" : "DESPUÉS"}</div>
      <div class="content">
        <img src="${imageUrl}" alt="Plano" crossorigin="anonymous">
      </div>
    </body>
    </html>
  `

    // Crear un blob con el HTML
    const blob = new Blob([html], { type: "text/html" })
    const blobUrl = URL.createObjectURL(blob)

    // Abrir la ventana con el blob URL
    const newWindow = window.open(blobUrl, windowName, "width=800,height=600,resizable=yes,scrollbars=yes,status=yes")

    if (!newWindow) {
      toast({
        title: "Ventana bloqueada",
        description:
          "El navegador ha bloqueado la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.",
        variant: "destructive",
      })
    }

    // Limpiar el blob URL cuando la ventana se cierre
    if (newWindow) {
      newWindow.addEventListener("beforeunload", () => {
        URL.revokeObjectURL(blobUrl)
      })
    }
  }

  const showDetailedDiagnostics = () => {
    setShowDebugInfo(true)
  }

  // Si la tabla no está actualizada, mostrar botón para actualizarla
  if (isTableUpdated === false) {
    return (
      <Alert className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Actualización necesaria</AlertTitle>
        <AlertDescription>
          <p>Es necesario actualizar la estructura de la tabla para soportar múltiples planos.</p>
          <div className="mt-2">
            <UpdateFloorPlansButton />
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <Label>Planos de referencia</Label>
          <Button variant="outline" size="sm" onClick={refreshPlans} disabled={isRefreshing} className="gap-1">
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Actualizar
          </Button>
        </div>

        <Tabs value={currentPlanType} onValueChange={(value) => setCurrentPlanType(value as PlanType)}>
          <TabsList className="mb-2">
            <TabsTrigger value="before">Plano Antes</TabsTrigger>
            <TabsTrigger value="after">Plano Después</TabsTrigger>
          </TabsList>

          <TabsContent value="before" className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                id="floor-plan-before"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                disabled={isUploading || isFixingPolicies}
                className="flex-1"
              />
              {floorPlans.before && (
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
            {floorPlans.before ? (
              <div
                className="h-32 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer"
                onClick={() => openInNewWindow("before")}
              >
                {imageLoadError.before ? (
                  <div className="text-center p-4">
                    <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Error al cargar la imagen</p>
                  </div>
                ) : (
                  <img
                    src={floorPlans.before || "/placeholder.svg"}
                    alt="Plano antes"
                    className="max-h-full max-w-full object-contain"
                    onError={() => handleImageError("before")}
                    crossOrigin="anonymous"
                  />
                )}
              </div>
            ) : (
              <div className="h-32 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                <div className="text-center p-4">
                  <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No hay plano "Antes" cargado</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="after" className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                id="floor-plan-after"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                disabled={isUploading || isFixingPolicies}
                className="flex-1"
              />
              {floorPlans.after && (
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => openInNewWindow("after")}
                    title="Ver plano en ventana separada"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => confirmDelete("after")}
                    title="Eliminar plano"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {floorPlans.after ? (
              <div className="h-32 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                {imageLoadError.after ? (
                  <div className="text-center p-4">
                    <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Error al cargar la imagen</p>
                    <div className="flex flex-col gap-1 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => verifyAndFixImage("after")}
                        disabled={isVerifying}
                        className="text-xs"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            Corrigiendo...
                          </>
                        ) : (
                          "Corregir permisos"
                        )}
                      </Button>
                      <Button variant="outline" size="sm" onClick={refreshPlans} className="text-xs mt-1">
                        Reintentar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <img
                    src={floorPlans.after || "/placeholder.svg"}
                    alt="Plano después"
                    className="max-h-full max-w-full object-contain"
                    onClick={() => openInNewWindow("after")}
                    onError={() => handleImageError("after")}
                    style={{ cursor: "pointer" }}
                    crossOrigin="anonymous"
                  />
                )}
              </div>
            ) : (
              <div className="h-32 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                <div className="text-center p-4">
                  <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No hay plano "Después" cargado</p>

                  {floorPlans.before && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-xs"
                      onClick={handleCloneBeforeToAfter}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />}
                      Usar plano "Antes" como base
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Subiendo plano...</span>
          </div>
        )}

        {isFixingPolicies && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Configurando permisos de almacenamiento...</span>
          </div>
        )}

        {(uploadError || hasPermissionIssues || imageLoadError.before || imageLoadError.after) && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Problemas con los planos</AlertTitle>
            <AlertDescription>
              {uploadError && <p>{uploadError}</p>}
              {(imageLoadError.before || imageLoadError.after) && (
                <p>
                  Hay problemas para cargar las imágenes de los planos. Esto puede deberse a permisos de acceso o
                  problemas con el almacenamiento.
                </p>
              )}
              <div className="mt-4 space-y-2">
                <p className="text-sm">Intenta alguna de estas soluciones:</p>
                <div className="flex flex-col gap-2">
                  <FixStoragePermissionsButton />
                  <Button variant="outline" onClick={refreshPlans} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Actualizar planos
                  </Button>
                  <Button variant="outline" onClick={showDetailedDiagnostics} className="gap-2">
                    <Info className="h-4 w-4" />
                    Generar diagnóstico detallado
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

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
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlan} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
