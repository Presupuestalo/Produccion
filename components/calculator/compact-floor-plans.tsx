"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { ImageIcon, Maximize2, Loader2, Trash2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useMediaQuery } from "@/hooks/use-media-query"

type PlanType = "before" | "after"

interface CompactFloorPlansProps {
  projectId: string
}

export function CompactFloorPlans({ projectId }: CompactFloorPlansProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [floorPlans, set_FloorPlans] = useState<Record<PlanType, string | null>>({
    before: null,
    after: null,
  })
  const [currentPlanType, setCurrentPlanType] = useState<PlanType>("before")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<PlanType | null>(null)
  const [imageLoadError, setImageLoadError] = useState<Record<PlanType, boolean>>({
    before: false,
    after: false,
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Cargar los planos existentes al montar el componente
  useEffect(() => {
    loadFloorPlans()
  }, [projectId])

  // Cargar los planos existentes
  const loadFloorPlans = async () => {
    try {
      // Buscar si ya existen planos para este proyecto
      const { data, error } = await supabase.from("project_floor_plans").select("*").eq("project_id", projectId)

      if (error) {
        console.error("Error al cargar los planos:", error)
        return
      }

      if (data && data.length > 0) {
        const plans: Record<PlanType, string | null> = {
          before: null,
          after: null,
        }

        // Procesar los planos encontrados
        data.forEach((plan) => {
          if (plan.plan_type === "before" || plan.plan_type === "after") {
            // Añadir un timestamp para evitar el caché del navegador
            const timestamp = new Date().getTime()
            plans[plan.plan_type as PlanType] = `${plan.image_url}?t=${timestamp}`
          }
        })

        set_FloorPlans(plans)

        // Si hay planos, expandir automáticamente en móvil
        if (plans.before || plans.after) {
          setIsCollapsed(false)
        }
      }
    } catch (error) {
      console.error("Error al cargar los planos:", error)
    }
  }

  // Función para manejar errores de carga de imagen
  const handleImageError = (type: PlanType) => {
    setImageLoadError((prev) => ({
      ...prev,
      [type]: true,
    }))
  }

  // Función para verificar y procesar imágenes antes de subirlas
  const processImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      // Verificar tipo de archivo
      if (!file.type.startsWith("image/")) {
        reject(new Error("El archivo debe ser una imagen"))
        return
      }

      // Verificar si es JPEG o PNG
      if (file.type !== "image/jpeg" && file.type !== "image/png") {
        reject(new Error("Solo se permiten imágenes JPEG o PNG"))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // Verificar dimensiones
          if (img.width > 1280 || img.height > 800) {
            reject(
              new Error(`La resolución máxima permitida es 1280x800 pixels. Tu imagen es ${img.width}x${img.height}`),
            )
            return
          }

          // Si la imagen ya es pequeña, no la procesamos
          if (file.size <= 2 * 1024 * 1024) {
            resolve(file)
            return
          }

          // Procesar la imagen para reducir su tamaño
          const canvas = document.createElement("canvas")
          let width = img.width
          let height = img.height

          // Mantener la relación de aspecto
          if (width > 1280) {
            height = Math.floor(height * (1280 / width))
            width = 1280
          }
          if (height > 800) {
            width = Math.floor(width * (800 / height))
            height = 800
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("No se pudo procesar la imagen"))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          // Convertir a blob con calidad reducida (para JPEG)
          const quality = file.type === "image/jpeg" ? 0.75 : 0.9
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Error al procesar la imagen"))
                return
              }
              // Crear un nuevo archivo con el blob procesado
              const processedFile = new File([blob], file.name, { type: file.type })
              resolve(processedFile)
            },
            file.type,
            quality,
          )
        }
        img.onerror = () => {
          reject(new Error("Error al cargar la imagen"))
        }
        img.src = e.target?.result as string
      }
      reader.onerror = () => {
        reject(new Error("Error al leer el archivo"))
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/png"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato no soportado",
        description: "Por favor, sube una imagen JPEG (recomendado) o PNG (solo si necesitas transparencia).",
        variant: "destructive",
      })
      return
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "El tamaño máximo permitido es 2MB. Por favor, comprime la imagen antes de subirla.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Procesar la imagen antes de subirla
      const processedFile = await processImage(file)

      // Generar un nombre único para el archivo
      const fileExt = file.name.split(".").pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `floor-plans/${fileName}`

      // Intentar subir el archivo
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("project-files")
        .upload(filePath, processedFile)

      if (uploadError) {
        throw uploadError
      }

      // Obtener la URL pública del archivo
      const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(filePath)
      const imageUrl = urlData.publicUrl

      // Crear el objeto del plano
      const floorPlan = {
        project_id: projectId,
        image_url: imageUrl,
        plan_type: currentPlanType,
        updated_at: new Date().toISOString(),
      }

      // Intentar guardar la referencia en la base de datos
      const { error: dbError } = await supabase
        .from("project_floor_plans")
        .upsert(floorPlan, { onConflict: "project_id,plan_type" })

      if (dbError) {
        throw dbError
      }

      // Actualizar el estado local
      const timestamp = new Date().getTime()
      set_FloorPlans((prev) => ({
        ...prev,
        [currentPlanType]: `${imageUrl}?t=${timestamp}`,
      }))

      // Resetear el error de carga de imagen
      setImageLoadError((prev) => ({
        ...prev,
        [currentPlanType]: false,
      }))

      // Expandir el componente si está colapsado
      if (isCollapsed) {
        setIsCollapsed(false)
      }

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
      toast({
        title: "Error al subir el plano",
        description: error.message || "Ha ocurrido un error al subir el plano.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

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
      set_FloorPlans((prev) => ({
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

  // Función para abrir la imagen en una ventana separada del navegador
  const openInNewWindow = (type: PlanType) => {
    if (!floorPlans[type]) return

    // URL de la imagen
    const imageUrl = floorPlans[type] as string
    const windowName = `floorPlan_${projectId}_${type}_${new Date().getTime()}`

    // Crear una URL simple que solo muestra la imagen a pantalla completa
    const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
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
        touch-action: manipulation;
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
        -webkit-overflow-scrolling: touch;
        touch-action: pan-x pan-y pinch-zoom;
      }
      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        display: block;
        touch-action: manipulation; max-width: 100%; height: auto;
      }
      @media print {
        .header {
          display: none;
        }
      }
      @media (max-width: 768px) {
        .header {
          font-size: 16px;
          padding: 8px;
        }
      }
    </style>
  </head>
  <body>
    <div class="header">LORENA ${type === "before" ? "ANTES" : "DESPUÉS"}</div>
    <div class="content" style="touch-action: pan-x pan-y pinch-zoom;">
      <img 
        src="${imageUrl}" 
        alt="Plano" 
        crossorigin="anonymous"
        style="touch-action: manipulation; max-width: 100%; height: auto;"
        onerror="this.onerror=null; this.src='data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23999\\' strokeWidth=\\'2\\' strokeLinecap=\\'round\\' strokeLinejoin=\\'round\\'%3E%3Cline x1=\\'18\\' y1=\\'6\\' x2=\\'6\\' y2=\\'18\\'%3E%3C/line%3E%3Cline x1=\\'6\\' y1=\\'6\\' x2=\\'18\\' y2=\\'18\\'%3E%3C/line%3E%3C/svg%3E'; this.parentNode.innerHTML += '<p style=\\'text-align:center; color:#666;\\'>Error al cargar la imagen</p>';"
      >
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

  const confirmDelete = (type: PlanType) => {
    setPlanToDelete(type)
    setDeleteDialogOpen(true)
  }

  const analyzePlan = async (planType: "before" | "after") => {
    const imageUrl = floorPlans[planType]
    if (!imageUrl) {
      toast({
        title: "No hay plano para analizar",
        description: "Por favor, sube un plano primero.",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)

    try {
      // Simular el análisis del plano
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Análisis completado",
        description: "El plano ha sido analizado correctamente.",
      })
    } catch (error: any) {
      console.error("Error al analizar el plano:", error)
      toast({
        title: "Error al analizar el plano",
        description: error.message || "Ha ocurrido un error al analizar el plano.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Contenido principal del componente
  const renderContent = () => (
    <>
      <Tabs value={currentPlanType} onValueChange={(value) => setCurrentPlanType(value as PlanType)}>
        <TabsList className="mb-2 w-full">
          <TabsTrigger value="before" className="flex-1">
            Plano Antes
          </TabsTrigger>
          <TabsTrigger value="after" className="flex-1">
            Plano Después
          </TabsTrigger>
        </TabsList>

        <TabsContent value="before" className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2">
              <input
                ref={fileInputRef}
                id="floor-plan-before"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                disabled={isUploading}
                className="sr-only"
                title="Formatos: JPEG o PNG. Tamaño máximo: 2MB. Resolución máxima: 1280x800px"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1 h-8"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <ImageIcon className="h-4 w-4" />
                <span>Subir plano</span>
              </Button>
              <div className="text-xs text-muted-foreground flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span>JPEG/PNG, máx. 2MB</span>
              </div>
            </div>
            {floorPlans.before && (
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openInNewWindow("before")}
                  title="Ver plano en ventana separada"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => confirmDelete("before")}
                  title="Eliminar plano"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {floorPlans.before ? (
            <div
              className="h-20 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center relative"
              onClick={() => openInNewWindow("before")}
            >
              {imageLoadError.before ? (
                <div className="text-center p-2">
                  <p className="text-xs text-muted-foreground">Error al cargar la imagen</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      setImageLoadError((prev) => ({ ...prev, before: false }))
                      // Force reload the image with a new timestamp
                      const timestamp = new Date().getTime()
                      set_FloorPlans((prev) => ({
                        ...prev,
                        before: prev.before ? `${prev.before?.split("?")[0]}?t=${timestamp}` : null,
                      }))
                    }}
                  >
                    Reintentar
                  </Button>
                </div>
              ) : (
                <>
                  <img
                    src={floorPlans.before || "/placeholder.svg"}
                    alt="Plano antes"
                    className="max-h-full w-auto object-contain"
                    onError={() => handleImageError("before")}
                    crossOrigin="anonymous"
                    loading="lazy"
                    decoding="async"
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                      display: "block",
                      margin: "0 auto",
                    }}
                  />
                  <div className="absolute inset-0 bg-transparent" style={{ pointerEvents: "none" }} />
                </>
              )}
            </div>
          ) : (
            <div className="h-20 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
              <div className="text-center p-2">
                <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">No hay plano "Antes" cargado</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="after" className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2">
              <input
                ref={fileInputRef}
                id="floor-plan-after"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                disabled={isUploading}
                className="sr-only"
                title="Formatos: JPEG o PNG. Tamaño máximo: 2MB. Resolución máxima: 1280x800px"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1 h-8"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <ImageIcon className="h-4 w-4" />
                <span>Subir plano</span>
              </Button>
              <div className="text-xs text-muted-foreground flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span>JPEG/PNG, máx. 2MB</span>
              </div>
            </div>
            {floorPlans.after && (
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openInNewWindow("after")}
                  title="Ver plano en ventana separada"
                  className="h-8 w-8"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => confirmDelete("after")}
                  title="Eliminar plano"
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {floorPlans.after ? (
            <div
              className="h-20 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center relative"
              onClick={() => openInNewWindow("after")}
            >
              {imageLoadError.after ? (
                <div className="text-center p-2">
                  <p className="text-xs text-muted-foreground">Error al cargar la imagen</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      setImageLoadError((prev) => ({ ...prev, after: false }))
                      // Force reload the image with a new timestamp
                      const timestamp = new Date().getTime()
                      set_FloorPlans((prev) => ({
                        ...prev,
                        after: prev.after ? `${prev.after?.split("?")[0]}?t=${timestamp}` : null,
                      }))
                    }}
                  >
                    Reintentar
                  </Button>
                </div>
              ) : (
                <>
                  <img
                    src={floorPlans.after || "/placeholder.svg"}
                    alt="Plano después"
                    className="max-h-full w-auto object-contain"
                    onError={() => handleImageError("after")}
                    crossOrigin="anonymous"
                    loading="lazy"
                    decoding="async"
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                      display: "block",
                      margin: "0 auto",
                    }}
                  />
                  <div className="absolute inset-0 bg-transparent" style={{ pointerEvents: "none" }} />
                </>
              )}
            </div>
          ) : (
            <div className="h-20 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
              <div className="text-center p-2">
                <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">No hay plano "Después" cargado</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {isUploading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Subiendo plano...</span>
        </div>
      )}
    </>
  )

  // Determinar si hay planos cargados
  const hasPlans = floorPlans.before || floorPlans.after
  const planCount = (floorPlans.before ? 1 : 0) + (floorPlans.after ? 1 : 0)

  // Si hay planos, expandir automáticamente en móvil
  useEffect(() => {
    if ((floorPlans.before || floorPlans.after) && isMobile) {
      setIsCollapsed(false)
    }
  }, [floorPlans.before, floorPlans.after, isMobile])

  return (
    <Card className="mb-2 sm:mb-4">
      {isMobile ? (
        <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)} className="w-full">
          <div className="flex items-center justify-between">
            <CardHeader className="py-2 sm:pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-md flex items-center gap-2">Planos de referencia</CardTitle>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
          </div>
          <CollapsibleContent>
            <CardContent className="p-3 pt-0">{renderContent()}</CardContent>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Planos de referencia</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">{renderContent()}</CardContent>
        </>
      )}

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
    </Card>
  )
}
