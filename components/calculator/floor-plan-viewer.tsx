"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { Maximize2, RefreshCw, Info, AlertTriangle, Image, Pencil, Loader2, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
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
  projectTitle?: string
}

type PlanType = "before" | "after"

interface FloorPlan {
  id?: string
  project_id: string
  image_url: string
  plan_type: PlanType
  updated_at?: string
}

export function FloorPlanViewer({ projectId, projectTitle }: FloorPlanViewerProps) {
  const [floorPlans, setFloorPlans] = useState<Record<PlanType, string | null>>({
    before: null,
    after: null,
  })
  const [planIds, setPlanIds] = useState<Record<PlanType, string | null>>({
    before: null,
    after: null,
  })
  const [currentPlanType, setCurrentPlanType] = useState<PlanType>("before")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<PlanType | null>(null)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("")
  const [isTableUpdated, setIsTableUpdated] = useState<boolean | null>(null)
  const [imageLoadError, setImageLoadError] = useState<Record<PlanType, boolean>>({
    before: false,
    after: false,
  })
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({})
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

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
      const ids: Record<PlanType, string | null> = {
        before: null,
        after: null,
      }

      if (data && data.length > 0) {
        // Procesar los planos encontrados con heurísticas reforzadas
        data.forEach((plan: any) => {
          const planName = (plan.name || "").toLowerCase()
          const planType = (plan.plan_type || "").toLowerCase()
          const variant = (plan.variant || "").toLowerCase()

          // Heurística para ANTES: 
          // 1. variant es 'current'
          // 2. plan_type es 'before' (si variant no es 'proposal')
          // 3. El nombre indica estado actual y NO indica reforma/propuesta
          const isBeforeCandidate =
            variant === "current" ||
            (planType === "before" && variant !== "proposal") ||
            ((planName.includes("antes") ||
              planName.includes("actual") ||
              planName.includes("original") ||
              planName.includes("existente") ||
              planName.includes("estado actual")) &&
              !planName.includes("reforma") &&
              !planName.includes("propuesta") &&
              variant !== "proposal")

          // Heurística para DESPUÉS:
          // 1. variant es 'proposal'
          // 2. plan_type es 'after' (si variant no es 'current')
          // 3. El nombre indica un cambio/propuesta/reforma
          const isAfterCandidate =
            variant === "proposal" ||
            (planType === "after" && variant !== "current") ||
            planName.includes("despues") ||
            planName.includes("después") ||
            planName.includes("reforma") ||
            planName.includes("propuesta") ||
            planName.includes("nuevo") ||
            planName.includes("opcion") ||
            planName.includes("opción") ||
            planName.includes("proyecto") ||
            planName.includes("americana") ||
            planName.includes("modificado")

          if (isBeforeCandidate && !plans.before) {
            const timestamp = new Date().getTime()
            plans.before = `${plan.image_url}?t=${timestamp}`
            ids.before = plan.id
          } else if (isAfterCandidate && !plans.after) {
            const timestamp = new Date().getTime()
            plans.after = `${plan.image_url}?t=${timestamp}`
            ids.after = plan.id
          }
        })

        // Heurística final: si no hemos asignado 'before' y hay datos sobrantes, asignar
        if (!plans.before && data.length > 0) {
          const firstAvailable = data.find((p: any) => p.id !== ids.after) || data[0]
          const timestamp = new Date().getTime()
          plans.before = `${firstAvailable.image_url}?t=${timestamp}`
          ids.before = firstAvailable.id
        }

        // Heurística para 'after': si sigue vacío y hay más planos, asignar el que no sea 'before'
        if (!plans.after && data.length > 1) {
          const leftoverPlan = data.find((p: any) => p.id !== ids.before)
          if (leftoverPlan) {
            const timestamp = new Date().getTime()
            plans.after = `${leftoverPlan.image_url}?t=${timestamp}`
            ids.after = leftoverPlan.id
          }
        }
      }

      setFloorPlans(plans)
      setPlanIds(ids)
      setDebugInfo((prev) => ({ ...prev, processedPlans: plans }))
    } catch (error) {
      setDebugInfo((prev) => ({ ...prev, loadCatchError: String(error) }))
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
      setDeleteConfirmationText("")
    }
  }

  // Función para confirmar eliminación
  const confirmDelete = (type: PlanType) => {
    setPlanToDelete(type)
    setDeleteConfirmationText("")
    setDeleteDialogOpen(true)
  }

  // Función para manejar errores de carga de imagen
  const handleImageError = (type: PlanType) => {
    setImageLoadError((prev) => ({
      ...prev,
      [type]: true,
    }))
  }

  const refreshPlans = async () => {
    setIsRefreshing(true)
    await loadFloorPlans()
    setIsRefreshing(false)
  }

  const openInNewWindow = (type: PlanType) => {
    const imageUrl = floorPlans[type]
    if (!imageUrl) return

    const windowName = `Plano_${type}_${projectId}`
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${projectTitle || "Plano"} ${type === "before" ? "Antes" : "Después"}</title>
      <style>
        body { margin: 0; display: flex; flex-direction: column; height: 100vh; font-family: sans-serif; }
        .header { padding: 10px; background: #f8f9fa; border-bottom: 11px solid #dee2e6; font-weight: bold; }
        .content { flex: 1; display: flex; items-center justify-content: center; overflow: auto; background: #e9ecef; }
        img { max-width: 100%; max-height: 100%; object-contain: contain; }
      </style>
    </head>
    <body>
      <div class="header">${projectTitle || "Plano"} ${type === "before" ? "ANTES" : "DESPUÉS"}</div>
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
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowDebugInfo(!showDebugInfo)} className="h-8 w-8 p-0">
              <Info className="h-4 w-4 text-muted-foreground opacity-50" />
            </Button>
            <Button variant="outline" size="sm" onClick={refreshPlans} disabled={isRefreshing} className="gap-1">
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Actualizar
            </Button>
          </div>
        </div>

        <Tabs value={currentPlanType} onValueChange={(value) => setCurrentPlanType(value as PlanType)}>
          <TabsList className="mb-2">
            <TabsTrigger value="before">Plano Antes</TabsTrigger>
            <TabsTrigger value="after">Plano Después</TabsTrigger>
          </TabsList>

          <TabsContent value="before" className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground italic">
                {floorPlans.before ? "Plano reconocido desde el editor" : "No se ha reconocido ningún plano 'Antes'"}
              </span>
              {floorPlans.before && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => openInNewWindow("before")}
                    title="Ver plano en ventana separada"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  {planIds.before && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => router.push(`/dashboard/editor-planos/editar/${planIds.before}`)}
                      title="Editar plano en el editor"
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
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
                    className="max-h-full max-w-full object-contain cursor-pointer"
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
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground italic">
                {floorPlans.after ? "Plano reconocido desde el editor" : "No se ha reconocido ningún plano 'Después'"}
              </span>
              {floorPlans.after && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => openInNewWindow("after")}
                    title="Ver plano en ventana separada"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  {planIds.after && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => router.push(`/dashboard/editor-planos/editar/${planIds.after}`)}
                      title="Editar plano en el editor"
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
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
                      <Button variant="outline" size="sm" onClick={() => loadFloorPlans()} className="text-xs mt-1">
                        Reintentar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <img
                    src={floorPlans.after || "/placeholder.svg"}
                    alt="Plano después"
                    className="max-h-full max-w-full object-contain cursor-pointer"
                    onClick={() => openInNewWindow("after")}
                    onError={() => handleImageError("after")}
                    crossOrigin="anonymous"
                  />
                )}
              </div>
            ) : (
              <div className="h-32 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                <div className="text-center p-4">
                  <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No se ha reconocido ningún plano 'Después'</p>
                  <p className="text-[10px] text-muted-foreground mt-1 italic">Vaya al editor para crear una propuesta de reforma</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {showDebugInfo && (
          <div className="mt-4 p-4 border rounded-md bg-slate-950 text-slate-50 font-mono text-xs overflow-auto max-h-96">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold">Diagnóstico de Planos</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDebugInfo(false)} className="h-6 w-6 p-0 text-slate-50">
                ×
              </Button>
            </div>
            <p className="mb-2 text-slate-400">ID Proyecto: {projectId}</p>
            <div className="space-y-2">
              <div>
                <p className="text-blue-400 underline">Planos encontrados ({debugInfo.plansData?.length || 0}):</p>
                {debugInfo.plansData?.map((p: any, i: number) => (
                  <div key={i} className="ml-2 mb-1 border-l border-slate-700 pl-2">
                    <p>Nombre: "{p.name}"</p>
                    <p>Tipo: {p.plan_type} | Variant: {p.variant}</p>
                    <p className="truncate text-[10px] text-slate-500">{p.image_url}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-green-400">Asignación actual:</p>
                <p>Antes: {floorPlans.before ? "SÍ" : "NO"} (ID: {planIds.before || "---"})</p>
                <p>Después: {floorPlans.after ? "SÍ" : "NO"} (ID: {planIds.after || "---"})</p>
              </div>
            </div>
          </div>
        )}

        {(imageLoadError.before || imageLoadError.after) && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Problemas con los planos</AlertTitle>
            <AlertDescription>
              <p>
                Hay problemas para cargar las imágenes de los planos. Esto puede deberse a permisos de acceso o
                problemas con el almacenamiento.
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-sm">Intenta alguna de estas soluciones:</p>
                <div className="flex flex-col gap-2">
                  <FixStoragePermissionsButton />
                  <Button variant="outline" onClick={() => loadFloorPlans()} className="gap-2">
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
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open)
        if (!open) setDeleteConfirmationText("")
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              ¿Eliminar plano del proyecto?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Estás a punto de eliminar el plano <strong>"{planToDelete === "before" ? "Antes" : "Después"}"</strong>.
                </p>
                <Alert variant="destructive" className="bg-red-50 border-red-200 py-2">
                  <p className="text-xs font-medium text-red-800">
                    ¡Atención! Este plano está vinculado a este proyecto. Al borrarlo, se perderán las referencias visuales en el calculador. Esta acción es definitiva.
                  </p>
                </Alert>
                <div className="space-y-2 pt-2">
                  <p className="text-sm font-bold text-slate-800">
                    Para confirmar, escribe <span className="text-red-600 underline">ELIMINAR</span> a continuación:
                  </p>
                  <Input
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    placeholder="Escribe ELIMINAR aquí"
                    className="border-red-200 focus:border-red-500 focus:ring-red-500"
                    autoFocus
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              disabled={isDeleting || deleteConfirmationText !== "ELIMINAR"}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar permanentemente"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
