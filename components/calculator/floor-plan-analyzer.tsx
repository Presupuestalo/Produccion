"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Upload, Sparkles } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Room } from "@/types/calculator"
import * as SubscriptionLimitsService from "@/lib/services/subscription-limits-service"
import { AIPriceImportDialog } from "@/components/precios/ai-price-import-dialog"

type FloorPlanAnalyzerProps = {
  onRoomsDetected: (rooms: Room[]) => void
  projectId: string
}

export function FloorPlanAnalyzer({ onRoomsDetected, projectId }: FloorPlanAnalyzerProps) {
  const [open, setOpen] = useState(false)
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null)
  const [floorPlanPreview, setFloorPlanPreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [hasAiAccess, setHasAiAccess] = useState<boolean | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function checkAccess() {
      const limits = await SubscriptionLimitsService.getSubscriptionLimits()
      setHasAiAccess(limits?.aiFloorPlanUpload || false)
    }
    checkAccess()
  }, [])

  const handleOpenClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (hasAiAccess === false) {
      setShowUpgradeDialog(true)
    } else {
      setOpen(true)
    }
  }

  const handleFloorPlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ["image/jpeg", "image/png", "application/pdf"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato no válido",
        description: "Por favor, sube un archivo JPG, PNG o PDF",
        variant: "destructive",
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo no debe superar los 10MB",
        variant: "destructive",
      })
      return
    }

    setFloorPlanFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setFloorPlanPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const analyzeFloorPlan = async () => {
    // Verificar límites antes de analizar
    const limits = await SubscriptionLimitsService.getSubscriptionLimits()
    if (!limits?.aiFloorPlanUpload) {
      setShowUpgradeDialog(true)
      return
    }

    if (!floorPlanFile) return

    setIsAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append("file", floorPlanFile)

      const uploadResponse = await fetch("/api/upload-floor-plan", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Error al subir el plano")
      }

      const { imageUrl } = await uploadResponse.json()

      const analysisResponse = await fetch("/api/analyze-floor-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      })

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json()
        throw new Error(errorData.error || "Error al analizar el plano")
      }

      const { analysis } = await analysisResponse.json()
      setAnalysisResult(analysis)
      setShowConfirmation(true)

      toast({
        title: "Análisis completado",
        description: `Se han identificado ${analysis.rooms.length} habitaciones`,
      })
    } catch (error: any) {
      console.error("Error al analizar plano:", error)
      toast({
        title: "Error en el análisis",
        description: error.message || "No se pudo analizar el plano. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const confirmAnalysis = () => {
    if (!analysisResult) return

    const roomTypeCounts: { [key: string]: number } = {}

    const detectedRooms: Room[] = analysisResult.rooms.map((room: any) => {
      // Incrementar el contador para este tipo de habitación
      roomTypeCounts[room.type] = (roomTypeCounts[room.type] || 0) + 1
      const roomNumber = roomTypeCounts[room.type]

      const isBathroomOrKitchen = room.type === "Baño" || room.type === "Cocina"
      const isTerrace = room.type === "Terraza"

      return {
        id: crypto.randomUUID(),
        type: room.type,
        number: roomNumber, // Usar número secuencial único
        width: room.width || 0,
        length: room.length || 0,
        area: room.area || 0,
        perimeter: room.perimeter || 0,
        wallSurface: 0,
        floorMaterial: isBathroomOrKitchen || isTerrace ? "Cerámico" : "Parquet flotante",
        wallMaterial: isTerrace ? "No se modifica" : isBathroomOrKitchen ? "Cerámica" : "Lucir y pintar",
        hasDoors: room.doors > 0,
        doors: room.doors || 1,
        windows: room.windows || 0,
        falseCeiling: false,
        moldings: false,
        demolishWall: false,
        demolishCeiling: false,
        removeFloor: false,
        removeWallTiles: false,
        removeBathroomElements: false,
        removeKitchenFurniture: false,
        removeBedroomFurniture: false,
        removeSewagePipes: false,
        hasRadiator: false,
        measurementMode: "area-perimeter",
      }
    })

    onRoomsDetected(detectedRooms)
    setOpen(false)
    setShowConfirmation(false)
    setFloorPlanFile(null)
    setFloorPlanPreview(null)
    setAnalysisResult(null)

    toast({
      title: "Habitaciones reemplazadas",
      description: `Se han reemplazado todas las habitaciones con ${detectedRooms.length} habitaciones detectadas`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" className="gap-2 bg-transparent" onClick={handleOpenClick}>
        <Sparkles className="h-4 w-4" />
        Analizar Plano con IA
        {hasAiAccess === false && (
          <Badge
            variant="secondary"
            className="ml-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-none py-0 px-2 h-5 text-[10px] font-bold"
          >
            PRO
          </Badge>
        )}
      </Button>

      <AIPriceImportDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        mode="import"
      />
      <DialogContent className="sm:max-w-[600px]">
        {!showConfirmation ? (
          <>
            <DialogHeader>
              <DialogTitle>Analizar plano con IA</DialogTitle>
              <DialogDescription>
                Sube un plano del proyecto y la IA identificará automáticamente las habitaciones, medidas y elementos
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                {!floorPlanPreview ? (
                  <>
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Sube el plano del proyecto</h3>
                    <p className="text-sm text-muted-foreground mb-4">Formatos aceptados: JPG, PNG o PDF (máx. 10MB)</p>
                    <Input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFloorPlanUpload}
                      className="max-w-xs mx-auto"
                    />
                  </>
                ) : (
                  <>
                    <img
                      src={floorPlanPreview || "/placeholder.svg"}
                      alt="Preview del plano"
                      className="max-w-full max-h-64 mx-auto mb-4 rounded-lg"
                    />
                    <p className="text-sm text-muted-foreground mb-4">{floorPlanFile?.name}</p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFloorPlanFile(null)
                          setFloorPlanPreview(null)
                        }}
                      >
                        Cambiar plano
                      </Button>
                      <Button type="button" onClick={analyzeFloorPlan} disabled={isAnalyzing}>
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analizando...
                          </>
                        ) : (
                          "Analizar con IA"
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {isAnalyzing && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-center">
                    La IA está analizando el plano para identificar habitaciones, medidas y elementos...
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirmar análisis del plano</DialogTitle>
              <DialogDescription>
                La IA ha identificado las siguientes habitaciones. Revisa y confirma para añadirlas a la calculadora.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
              {analysisResult.rooms.map((room: any) => (
                <div key={room.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{room.type}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {room.width > 0 && (
                      <div>
                        <span className="text-muted-foreground">Ancho:</span> {room.width}m
                      </div>
                    )}
                    {room.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Largo:</span> {room.length}m
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Área:</span> {room.area}m²
                    </div>
                    <div>
                      <span className="text-muted-foreground">Perímetro:</span> {room.perimeter}ml
                    </div>
                    {room.doors > 0 && (
                      <div>
                        <span className="text-muted-foreground">Puertas:</span> {room.doors}
                      </div>
                    )}
                    {room.windows > 0 && (
                      <div>
                        <span className="text-muted-foreground">Ventanas:</span> {room.windows}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {analysisResult.warnings && analysisResult.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Advertencias:</h4>
                  <ul className="list-disc list-inside text-sm text-yellow-700">
                    {analysisResult.warnings.map((msg: string, i: number) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysisResult.errors && analysisResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Errores:</h4>
                  <ul className="list-disc list-inside text-sm text-red-700">
                    {analysisResult.errors.map((msg: string, i: number) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowConfirmation(false)}>
                Volver a analizar
              </Button>
              <Button type="button" onClick={confirmAnalysis}>
                Confirmar y añadir habitaciones
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
