"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload, Sparkles, Check, AlertTriangle, ArrowRight, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { Room } from "@/types/calculator"
import * as SubscriptionLimitsService from "@/lib/services/subscription-limits-service"
import { AIPriceImportDialog } from "@/components/precios/ai-price-import-dialog"

interface DualFloorPlanAnalyzerProps {
  projectId: string
  autoOpen?: boolean
  onRoomsDetected: (demolitionRooms: Room[], reformRooms: Room[]) => void
  onPartitionsDetected?: (partitions: Array<{ location: string; length: number; type: "remove" | "add" }>) => void
  onImportComplete?: () => void
}

const TIPOS_SIN_NUMERAR = [
  "cocina",
  "cocina_americana",
  "cocina_abierta",
  "salon",
  "salón",
  "comedor",
  "pasillo",
  "terraza",
  "balcon",
  "balcón",
  "cocina americana",
  "cocina ampliada",
  "salón comedor",
]

const CORRECCIONES_ORTOGRAFICAS: { [key: string]: string } = {
  bano: "Baño",
  banos: "Baños",
  salon: "Salón",
  balcon: "Balcón",
  rincon: "Rincón",
  sotano: "Sótano",
  desvan: "Desván",
  jardin: "Jardín",
  cocina_americana: "Cocina Americana",
  cocina_abierta: "Cocina Abierta",
  hall: "Hall",
  hll: "Hall",
  entrada: "Hall",
  dormitorio: "Dormitorio",
  trastero: "Trastero",
  vestidor: "Vestidor",
  pasillo: "Pasillo",
  otro: "Otro",
}

function normalizeRoomType(type: string): any {
  if (!type) return "Otro"
  const lowerType = type.toLowerCase().trim()
  if (lowerType.includes("bano")) return "Baño"
  if (lowerType.includes("cocina")) return "Cocina"
  if (lowerType.includes("salon")) return "Salón"
  if (lowerType.includes("dormitorio")) return "Dormitorio"
  if (lowerType.includes("pasillo") || lowerType.includes("distribuidor")) return "Pasillo"
  if (lowerType === "hall" || lowerType === "hll" || lowerType.includes("entrada") || lowerType.includes("recibidor")) return "Hall"
  if (lowerType.includes("terraza") || lowerType.includes("balcon")) return "Terraza"
  if (lowerType.includes("trastero")) return "Trastero"
  if (lowerType.includes("vestidor")) return "Vestidor"

  // Intentar encontrar en correcciones ortográficas
  for (const [key, value] of Object.entries(CORRECCIONES_ORTOGRAFICAS)) {
    if (lowerType.includes(key)) return value
  }

  return "Otro"
}

function formatRoomName(room: any, index: number, allRooms: any[]): string {
  const type = (room.type || "").toLowerCase().trim()
  const name = (room.name || "").toLowerCase().trim()

  // Si el nombre ya tiene número, usarlo directamente pero capitalizado
  if (/\d/.test(room.name || "")) {
    return capitalizeWords(room.name)
  }

  // Si es un tipo que no se numera, devolver el nombre formateado
  if (TIPOS_SIN_NUMERAR.some((t) => type.includes(t) || name.includes(t))) {
    return capitalizeWords(room.name || room.type)
  }

  // Contar cuántas habitaciones del mismo tipo hay
  const sameTypeRooms = allRooms.filter((r) => (r.type || "").toLowerCase().trim() === type)

  // Si solo hay una de ese tipo, no numerar
  if (sameTypeRooms.length <= 1) {
    return capitalizeWords(room.name || room.type)
  }

  // Encontrar el índice de esta habitación dentro de las del mismo tipo
  const indexInType = sameTypeRooms.findIndex((r) => r === room) + 1

  // Devolver nombre con número
  const baseName = capitalizeWords(room.type)
  return `${baseName} ${indexInType}`
}

function capitalizeWords(str: string): string {
  if (!str) return ""

  // Primero reemplazar guiones bajos por espacios
  const withSpaces = str.replace(/_/g, " ")

  return withSpaces
    .split(" ")
    .map((word) => {
      const lowerWord = word.toLowerCase()
      // Verificar si hay una corrección ortográfica
      if (CORRECCIONES_ORTOGRAFICAS[lowerWord]) {
        return CORRECCIONES_ORTOGRAFICAS[lowerWord]
      }
      // Capitalizar primera letra
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(" ")
}

export function DualFloorPlanAnalyzer({
  projectId,
  autoOpen = false,
  onRoomsDetected,
  onPartitionsDetected,
  onImportComplete,
}: DualFloorPlanAnalyzerProps) {
  const [open, setOpen] = useState(false)
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)
  const [beforePreview, setBeforePreview] = useState<string | null>(null)
  const [afterPreview, setAfterPreview] = useState<string | null>(null)
  const [useSamePlan, setUseSamePlan] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState<"upload" | "analyzing" | "results">("upload")
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState(0)
  const [beforeAnalysis, setBeforeAnalysis] = useState<any>(null)
  const [afterAnalysis, setAfterAnalysis] = useState<any>(null)
  const [comparison, setComparison] = useState<any>(null)
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

  useEffect(() => {
    if (analysisStep === "analyzing") {
      const steps = [
        "Procesando imágenes...",
        "Identificando habitaciones...",
        "Calculando medidas...",
        "Detectando cambios...",
        "Generando comparación...",
      ]
      let currentStep = 0
      const interval = setInterval(() => {
        currentStep = (currentStep + 1) % steps.length
        setCurrentAnalysisStep(currentStep)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [analysisStep])

  useEffect(() => {
    if (autoOpen) {
      setOpen(true)
    }
  }, [autoOpen])

  const handleFileUpload = (type: "before" | "after", e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo no debe superar los 5MB",
        variant: "destructive",
      })
      return
    }

    if (type === "before") {
      setBeforeFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setBeforePreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setAfterFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setAfterPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const analyzeFloorPlans = async () => {
    if (!beforeFile && !afterFile) {
      toast({
        title: "Falta plano",
        description: "Por favor, sube al menos un plano",
        variant: "destructive",
      })
      return
    }

    if (!useSamePlan && (!beforeFile || !afterFile)) {
      toast({
        title: "Faltan planos",
        description: "Por favor, sube ambos planos o activa la opción 'La distribución no cambia'",
        variant: "destructive",
      })
      return
    }

    // Verificar límites antes de analizar
    const limits = await SubscriptionLimitsService.getSubscriptionLimits()
    if (!limits?.aiFloorPlanUpload) {
      setShowUpgradeDialog(true)
      return
    }

    setIsAnalyzing(true)
    setAnalysisStep("analyzing")
    setCurrentAnalysisStep(0)

    try {
      console.log("[v0] Starting floor plan analysis process...")

      const fileToAnalyze = beforeFile || afterFile
      if (!fileToAnalyze) throw new Error("No hay archivo para analizar")

      console.log("[v0] File to analyze:", fileToAnalyze.name, fileToAnalyze.size, "bytes")

      const formData = new FormData()
      formData.append("file", fileToAnalyze)

      console.log("[v0] Uploading floor plan...")
      const uploadResponse = await fetch("/api/upload-floor-plan", {
        method: "POST",
        body: formData,
      })

      console.log("[v0] Upload response status:", uploadResponse.status)

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error("[v0] Upload failed:", errorText)

        if (uploadResponse.status === 401) {
          throw new Error("Sesión expirada. Por favor, recarga la página.")
        }

        throw new Error("Error al subir plano")
      }

      const { imageUrl } = await uploadResponse.json()
      console.log("[v0] Image uploaded successfully:", imageUrl)

      console.log("[v0] Starting analysis request...")
      const analysisResponse = await fetch("/api/analyze-floor-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      })

      console.log("[v0] Analysis response status:", analysisResponse.status)

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json().catch(e => ({ error: "Error parsing error response", details: String(e) }))
        console.error("[v0] Analysis failed:", JSON.stringify(errorData, null, 2))

        if (errorData.errorType === "invalid_floor_plan") {
          toast({
            title: "Plano no reconocido",
            description:
              errorData.message ||
              "La imagen no parece ser un plano arquitectónico. Por favor, sube una imagen de un plano con las habitaciones y medidas visibles.",
            variant: "destructive",
          })
          setAnalysisStep("upload")
          return
        }

        // Mostrar error específico si lo hay
        const errorDetails = errorData.details || ""
        const errorMessage = errorData.error || "Error al analizar plano"

        console.error("[v0] Full server error:", errorData.fullError)

        throw new Error(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`)
      }

      const { analysis } = await analysisResponse.json()
      console.log("[v0] Analysis completed successfully, rooms found:", analysis.rooms?.length)

      if (useSamePlan) {
        setBeforeAnalysis(analysis)
        setAfterAnalysis(analysis)
        setComparison({
          summary: "La distribución no cambia. Las mismas habitaciones se usarán para demolición y reforma.",
          roomsAdded: [],
          roomsRemoved: [],
          roomsModified: [],
          wallsRemoved: [],
          wallsAdded: [],
          totalWallsRemovedMeters: 0,
          totalWallsAddedMeters: 0,
          suggestAddPartitions: false,
        })
      } else {
        console.log("[v0] Analyzing two separate plans...")

        const beforeFormData = new FormData()
        beforeFormData.append("file", beforeFile!)
        console.log("[v0] Uploading 'before' plan...")
        const beforeUploadResponse = await fetch("/api/upload-floor-plan", {
          method: "POST",
          body: beforeFormData,
        })
        if (!beforeUploadResponse.ok) {
          if (beforeUploadResponse.status === 401) {
            throw new Error("Sesión expirada. Por favor, recarga la página.")
          }
          throw new Error("Error al subir plano 'antes'")
        }
        const { imageUrl: beforeImageUrl } = await beforeUploadResponse.json()
        console.log("[v0] 'Before' plan uploaded:", beforeImageUrl)

        const afterFormData = new FormData()
        afterFormData.append("file", afterFile!)
        console.log("[v0] Uploading 'after' plan...")
        const afterUploadResponse = await fetch("/api/upload-floor-plan", {
          method: "POST",
          body: afterFormData,
        })
        if (!afterUploadResponse.ok) {
          if (afterUploadResponse.status === 401) {
            throw new Error("Sesión expirada. Por favor, recarga la página.")
          }
          throw new Error("Error al subir plano 'después'")
        }
        const { imageUrl: afterImageUrl } = await afterUploadResponse.json()
        console.log("[v0] 'After' plan uploaded:", afterImageUrl)

        console.log("[v0] Analyzing 'before' plan...")
        const beforeAnalysisResponse = await fetch("/api/analyze-floor-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: beforeImageUrl }),
        })
        if (!beforeAnalysisResponse.ok) {
          const errorData = await beforeAnalysisResponse.json().catch(e => ({ error: "Error parsing error response", details: String(e) }))
          console.error("[v0] 'Before' analysis failed:", JSON.stringify(errorData, null, 2))
          const errorDetails = errorData.details || ""
          const errorMessage = errorData.error || "Error al analizar plano 'antes'"
          throw new Error(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`)
        }
        const { analysis: beforeData } = await beforeAnalysisResponse.json()
        console.log("[v0] 'Before' analysis complete, rooms:", beforeData.rooms?.length)
        setBeforeAnalysis(beforeData)

        console.log("[v0] Analyzing 'after' plan...")
        const afterAnalysisResponse = await fetch("/api/analyze-floor-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: afterImageUrl }),
        })
        if (!afterAnalysisResponse.ok) {
          const errorData = await afterAnalysisResponse.json().catch(e => ({ error: "Error parsing error response", details: String(e) }))
          console.error("[v0] 'After' analysis failed:", JSON.stringify(errorData, null, 2))
          const errorDetails = errorData.details || ""
          const errorMessage = errorData.error || "Error al analizar plano 'después'"
          throw new Error(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`)
        }
        const { analysis: afterData } = await afterAnalysisResponse.json()
        console.log("[v0] 'After' analysis complete, rooms:", afterData.rooms?.length)
        setAfterAnalysis(afterData)

        const cleanBeforeUrl = beforeImageUrl.replace(/\.+$/, "")
        const cleanAfterUrl = afterImageUrl.replace(/\.+$/, "")

        console.log("[v0] URLs para comparación:")
        console.log("[v0] - Before (original):", beforeImageUrl)
        console.log("[v0] - Before (limpia):", cleanBeforeUrl)
        console.log("[v0] - After (original):", afterImageUrl)
        console.log("[v0] - After (limpia):", cleanAfterUrl)

        console.log("[v0] Comparing floor plans...")
        const comparisonResponse = await fetch("/api/compare-floor-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            beforeImageUrl: cleanBeforeUrl,
            afterImageUrl: cleanAfterUrl,
          }),
        })
        if (!comparisonResponse.ok) throw new Error("Error al comparar planos")
        const { comparison: comparisonData } = await comparisonResponse.json()
        console.log("[v0] Comparison complete")
        setComparison(comparisonData)
      }

      setAnalysisStep("results")
      console.log("[v0] All analysis complete, showing results")
      toast({
        title: "Análisis completado",
        description: useSamePlan
          ? "El plano ha sido analizado exitosamente"
          : "Los planos han sido analizados y comparados exitosamente",
      })
    } catch (error: any) {
      console.error("[v0] Error al analizar planos:", error)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error stack:", error.stack)
      toast({
        title: "Error en el análisis",
        description: error.message || "No se pudieron analizar los planos",
        variant: "destructive",
      })
      setAnalysisStep("upload")
    } finally {
      setIsAnalyzing(false)
      console.log("[v0] Analysis process finished")
    }
  }

  const confirmAndImport = () => {
    if (!beforeAnalysis || !afterAnalysis) return

    setOpen(false)

    const MIN_ROOM_AREA = 0.5 // m²

    const filteredBeforeRooms = (beforeAnalysis.rooms || []).filter((room: any) => {
      const area = room.area || 0
      if (area < MIN_ROOM_AREA) {
        console.log(`[v0] Habitación ignorada (muy pequeña): ${room.type} - ${area} m²`)
        return false
      }
      return true
    })

    const filteredAfterRooms = (afterAnalysis.rooms || []).filter((room: any) => {
      const area = room.area || 0
      if (area < MIN_ROOM_AREA) {
        console.log(`[v0] Habitación ignorada (muy pequeña): ${room.type} - ${area} m²`)
        return false
      }
      return true
    })

    const roomTypeCounts: { [key: string]: number } = {}

    const demolitionRooms: Room[] = filteredBeforeRooms.map((room: any, i: number) => {
      roomTypeCounts[room.type] = (roomTypeCounts[room.type] || 0) + 1

      const getDefaultMaterials = (roomType: string) => {
        const normalizedType = roomType
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()

        // Baños y cocinas siempre tienen cerámica
        if (
          normalizedType.startsWith("bano") ||
          normalizedType.includes("bano") ||
          normalizedType.startsWith("cocina") ||
          normalizedType.includes("cocina") ||
          normalizedType.startsWith("aseo") ||
          normalizedType.includes("aseo")
        ) {
          return { floor: "Cerámico", wall: "Cerámica" }
        }

        if (normalizedType.startsWith("terraza") || normalizedType.includes("terraza")) {
          return { floor: "Cerámico", wall: "No se modifica" }
        }

        // Por defecto: madera y pintura
        return { floor: "Madera", wall: "Pintura" }
      }

      const defaultMaterials = getDefaultMaterials(room.type)

      const normalizedType = normalizeRoomType(room.type)
      const roomName = formatRoomName(room, i, filteredBeforeRooms)

      return {
        id: crypto.randomUUID(),
        type: normalizedType as any,
        number: roomTypeCounts[room.type],
        width: room.width || 0,
        length: room.length || 0,
        area: room.area || 0,
        perimeter: room.perimeter || 0,
        wallSurface: 0,
        floorMaterial: defaultMaterials.floor,
        wallMaterial: defaultMaterials.wall,
        hasDoors: room.doors > 0,
        doors: room.doors || 1,
        windows: room.windows || 0,
        falseCeiling: false,
        moldings: false,
        demolishWall: false,
        demolishCeiling: false,
        removeFloor: true,
        removeWallTiles: false,
        removeBathroomElements: normalizedType === "Baño",
        removeKitchenFurniture: normalizedType === "Cocina",
        removeBedroomFurniture: false,
        removeSewagePipes: normalizedType === "Baño",
        hasRadiator: false,
        measurementMode: "area-perimeter",
        name: roomName,
        customRoomType: normalizedType === "Otro" ? room.name : undefined,
      }
    })

    const reformTypeCounts: { [key: string]: number } = {}
    const reformRooms: Room[] = filteredAfterRooms.map((room: any, i: number) => {
      reformTypeCounts[room.type] = (reformTypeCounts[room.type] || 0) + 1

      const getDefaultMaterials = (roomType: string) => {
        const normalizedType = roomType
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()

        // Baños y cocinas siempre tienen cerámica
        if (
          normalizedType.startsWith("bano") ||
          normalizedType.includes("bano") ||
          normalizedType.startsWith("cocina") ||
          normalizedType.includes("cocina") ||
          normalizedType.startsWith("aseo") ||
          normalizedType.includes("aseo")
        ) {
          return { floor: "Cerámico", wall: "Cerámica" }
        }

        if (normalizedType.startsWith("terraza") || normalizedType.includes("terraza")) {
          return { floor: "Cerámico", wall: "No se modifica" }
        }

        // Por defecto para reforma: parquet y lucir
        return { floor: "Parquet flotante", wall: "Lucir y pintar" }
      }

      const defaultMaterials = getDefaultMaterials(room.type)

      const normalizedType = normalizeRoomType(room.type)
      const roomName = formatRoomName(room, i, filteredAfterRooms)

      return {
        id: crypto.randomUUID(),
        type: normalizedType as any,
        number: reformTypeCounts[room.type],
        width: room.width || 0,
        length: room.length || 0,
        area: room.area || 0,
        perimeter: room.perimeter || 0,
        wallSurface: 0,
        floorMaterial: defaultMaterials.floor,
        wallMaterial: defaultMaterials.wall,
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
        name: roomName,
        customRoomType: normalizedType === "Otro" ? room.name : undefined,
      }
    })

    onRoomsDetected(demolitionRooms, reformRooms)

    // Extraer cambios de tabiquería si existen
    if (comparison && onPartitionsDetected) {
      const wallChanges: Array<{ location: string; length: number; type: "remove" | "add" }> = []

      // Procesar tabiques eliminados
      if (comparison.wallsRemoved && Array.isArray(comparison.wallsRemoved)) {
        comparison.wallsRemoved.forEach((wall: any) => {
          wallChanges.push({
            location: wall.location || "Tabique antes",
            length: wall.estimatedLength || 0,
            type: "remove"
          })
        })
      }

      // Procesar tabiques añadidos
      if (comparison.wallsAdded && Array.isArray(comparison.wallsAdded)) {
        comparison.wallsAdded.forEach((wall: any) => {
          wallChanges.push({
            location: wall.location || "Tabique reforma",
            length: wall.estimatedLength || 0,
            type: "add"
          })
        })
      }

      if (wallChanges.length > 0) {
        console.log("[v0] Enviando cambios de tabiquería detectados:", wallChanges)
        onPartitionsDetected(wallChanges)
      }
    }

    toast({
      title: "Importación completada",
      description: `Se han importado ${demolitionRooms.length} habitaciones a demolición y ${reformRooms.length} a reforma`,
    })

    if (onImportComplete) {
      onImportComplete()
    }

    setOpen(false)

    setTimeout(() => {
      resetState()
    }, 100)
  }

  const resetState = () => {
    setBeforeFile(null)
    setAfterFile(null)
    setBeforePreview(null)
    setAfterPreview(null)
    setBeforeAnalysis(null)
    setAfterAnalysis(null)
    setComparison(null)
    setAnalysisStep("upload")
    setUseSamePlan(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={handleOpenClick} variant="outline" size="sm" className="bg-transparent h-8">
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline ml-2">Analizar con IA</span>
        {hasAiAccess === false && (
          <Badge
            variant="secondary"
            className="ml-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-none py-0 px-2 h-5 text-[10px] font-bold"
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

      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        {analysisStep === "upload" && (
          <>
            <DialogHeader>
              <DialogTitle>Analizar planos antes/después con IA</DialogTitle>
              <DialogDescription>
                Sube el plano del estado actual y el plano de la reforma. La IA identificará automáticamente las
                diferencias, habitaciones y cambios en tabiquería.
              </DialogDescription>
            </DialogHeader>

            <Alert className="bg-amber-50 border-amber-200">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-900">Tiempo de análisis</AlertTitle>
              <AlertDescription className="text-amber-800">
                El análisis con IA puede tardar varios minutos en función de la complejidad y dificultad de los planos.
                Por favor, ten paciencia mientras procesamos las imágenes.
              </AlertDescription>
            </Alert>

            <div className="flex items-center space-x-2 px-4 py-2 bg-muted/50 rounded-lg">
              <Checkbox
                id="same-plan"
                checked={useSamePlan}
                onCheckedChange={(checked) => setUseSamePlan(checked === true)}
              />
              <Label htmlFor="same-plan" className="text-sm font-normal cursor-pointer">
                La distribución no cambia (usar el mismo plano para demolición y reforma)
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">{useSamePlan ? "Plano único" : "Plano ANTES (Estado actual)"}</h3>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  {!beforePreview ? (
                    <>
                      <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                        <Upload className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">JPG, PNG o PDF (máx. 10MB)</p>
                      <Input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileUpload("before", e)}
                        className="text-xs"
                      />
                    </>
                  ) : (
                    <>
                      <img
                        src={beforePreview || "/placeholder.svg"}
                        alt="Plano antes"
                        className="max-w-full max-h-40 mx-auto mb-2 rounded"
                      />
                      <p className="text-xs text-muted-foreground mb-2">{beforeFile?.name}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBeforeFile(null)
                          setBeforePreview(null)
                        }}
                      >
                        Cambiar
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {!useSamePlan && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Plano DESPUÉS (Reforma)</h3>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    {!afterPreview ? (
                      <>
                        <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                          <Upload className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">JPG, PNG o PDF (máx. 10MB)</p>
                        <Input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => handleFileUpload("after", e)}
                          className="text-xs"
                        />
                      </>
                    ) : (
                      <>
                        <img
                          src={afterPreview || "/placeholder.svg"}
                          alt="Plano después"
                          className="max-w-full max-h-40 mx-auto mb-2 rounded"
                        />
                        <p className="text-xs text-muted-foreground mb-2">{afterFile?.name}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAfterFile(null)
                            setAfterPreview(null)
                          }}
                        >
                          Cambiar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={analyzeFloorPlans}
                disabled={isAnalyzing || (useSamePlan ? !beforeFile && !afterFile : !beforeFile || !afterFile)}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analizar con IA
                    <Badge variant="secondary" className="ml-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-none py-0 px-2 h-5 text-[10px] font-bold">PRO</Badge>
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {analysisStep === "analyzing" && (
          <div className="py-12 px-6">
            <div className="max-w-md mx-auto">
              <div className="relative mb-8 flex justify-center">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"></div>
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20 shadow-lg shadow-primary/10"></div>
                  <div className="absolute inset-0">
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/40 animate-pulse"
                      style={{ animationDelay: "0s" }}
                    ></div>
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/40 animate-pulse"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/40 animate-pulse"
                      style={{ animationDelay: "1s" }}
                    ></div>
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/40 animate-pulse"
                      style={{ animationDelay: "1.5s" }}
                    ></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse"></div>
                      <Sparkles className="relative h-10 w-10 text-primary animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-center mb-2">Analizando planos con IA</h3>
              <p className="text-sm text-muted-foreground text-center mb-8">
                Este proceso puede tardar varios minutos dependiendo de la complejidad del plano. Por favor, no cierres
                esta ventana.
              </p>

              <div className="space-y-3">
                {[
                  { label: "Procesando imágenes", icon: Upload },
                  { label: "Identificando habitaciones", icon: Sparkles },
                  { label: "Calculando medidas", icon: ArrowRight },
                  { label: "Detectando cambios", icon: AlertTriangle },
                  { label: "Generando comparación", icon: Check },
                ].map((step, index) => {
                  const Icon = step.icon
                  const isActive = index === currentAnalysisStep
                  const isCompleted = index < currentAnalysisStep

                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${isActive
                        ? "bg-primary/10 border-2 border-primary"
                        : isCompleted
                          ? "bg-green-50 border-2 border-green-200"
                          : "bg-muted/50 border-2 border-transparent"
                        }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isActive
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground"
                          }`}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : isActive ? (
                          <Icon className="h-4 w-4 animate-pulse" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${isActive ? "text-primary" : isCompleted ? "text-green-700" : "text-muted-foreground"
                          }`}
                      >
                        {step.label}
                      </span>
                      {isActive && <Loader2 className="ml-auto h-4 w-4 animate-spin text-primary flex-shrink-0" />}
                    </div>
                  )
                })}
              </div>

              <div className="mt-8">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 shimmer"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {analysisStep === "results" && comparison && (
          <>
            <DialogHeader>
              <DialogTitle>Resultados del análisis</DialogTitle>
              <DialogDescription>Revisa los cambios detectados y confirma para importar</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert variant="destructive" className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Revisión recomendada</AlertTitle>
                <AlertDescription className="text-amber-700">
                  La IA puede cometer errores en la detección. Por favor, revisa cuidadosamente las medidas y cambios
                  antes de confirmar. Los derribos y creación de tabiques detectados son orientativos y deberás
                  ajustarlos manualmente en la sección de Tabiquería.
                </AlertDescription>
              </Alert>

              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle className="text-sm">Resumen de cambios</AlertTitle>
                <AlertDescription>{comparison.summary}</AlertDescription>
              </Alert>

              {(beforeAnalysis?.enclosures?.length > 0 || afterAnalysis?.enclosures?.length > 0) && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800 text-sm font-bold">Habitáculos detectados (revisión necesaria)</AlertTitle>
                  <AlertDescription className="text-blue-700 text-xs">
                    <p className="mb-2">
                      Se han detectado huecos que podrían ser armarios o habitáculos auxiliares que no se han incluido automáticamente como habitaciones:
                    </p>
                    <ul className="list-disc ml-4 mb-2 space-y-1">
                      {useSamePlan ? (
                        // Si se usa el mismo plano, solo mostrar una vez
                        beforeAnalysis?.enclosures?.map((e: any, i: number) => (
                          <li key={`s-${i}`}>{e.type} detectado ({Number(e.area).toFixed(2)}m²)</li>
                        ))
                      ) : (
                        // Si son planos distintos, mostrar ambos diferenciados
                        <>
                          {beforeAnalysis?.enclosures?.map((e: any, i: number) => (
                            <li key={`b-${i}`} className="text-red-700/80 italic">Original: {e.type} ({Number(e.area).toFixed(2)}m²)</li>
                          ))}
                          {afterAnalysis?.enclosures?.map((e: any, i: number) => (
                            <li key={`a-${i}`} className="text-green-700 font-medium">Reforma: {e.type} ({Number(e.area).toFixed(2)}m²)</li>
                          ))}
                        </>
                      )}
                    </ul>
                    <p>
                      <strong>Sugerencia:</strong> Comprueba estas zonas en el plano para decidir si deben formar parte de una habitación antes de generar el presupuesto.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Badge variant="destructive">Demolición</Badge>
                      {beforeAnalysis?.rooms.length || 0} habitaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    {beforeAnalysis?.rooms.map((room: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span>{formatRoomName(room, i, beforeAnalysis.rooms)}</span>
                        <span className="text-muted-foreground">{Number(room.area).toFixed(2)}m²</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Badge variant="default">Reforma</Badge>
                      {afterAnalysis?.rooms.length || 0} habitaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    {afterAnalysis?.rooms.map((room: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span>{formatRoomName(room, i, afterAnalysis.rooms)}</span>
                        <span className="text-muted-foreground">{Number(room.area).toFixed(2)}m²</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {(comparison.roomsAdded?.length > 0 ||
                comparison.roomsRemoved?.length > 0 ||
                comparison.roomsModified?.length > 0) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Cambios en habitaciones</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      {comparison.roomsAdded?.map((room: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">
                              {room.name} ({Number(room.area).toFixed(2)}m²)
                            </p>
                            <p className="text-muted-foreground">{room.reason}</p>
                          </div>
                        </div>
                      ))}

                      {comparison.roomsRemoved?.map((room: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded">
                          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">
                              {room.name} ({Number(room.area).toFixed(2)}m²)
                            </p>
                            <p className="text-muted-foreground">{room.reason}</p>
                          </div>
                        </div>
                      ))}

                      {comparison.roomsModified?.map((room: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                          <ArrowRight className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">{room.name}</p>
                            <p className="text-muted-foreground">{room.changeDescription}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

              {(comparison.wallsRemoved?.length > 0 || comparison.wallsAdded?.length > 0) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Cambios en tabiquería</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    {comparison.wallsRemoved?.map((wall: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded">
                        <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">
                            Tabique eliminado: {wall.location} ({wall.estimatedLength}m)
                          </p>
                          <p className="text-muted-foreground">{wall.reason}</p>
                        </div>
                      </div>
                    ))}

                    {comparison.wallsAdded?.map((wall: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">
                            Tabique añadido: {wall.location} ({wall.estimatedLength}m)
                          </p>
                          <p className="text-muted-foreground">{wall.reason}</p>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2 border-t">
                      <p className="font-medium">
                        Total: {comparison.totalWallsRemovedMeters}m eliminados, {comparison.totalWallsAddedMeters}m
                        añadidos
                      </p>
                      {comparison.suggestAddPartitions && (
                        <p className="text-muted-foreground mt-1">
                          Se recomienda añadir estos tabiques automáticamente a la sección de tabiquería
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetState}>
                Volver a analizar
              </Button>
              <Button type="button" onClick={confirmAndImport}>
                Confirmar e importar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
