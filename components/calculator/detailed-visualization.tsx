"use client"

import { useRef, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ZoomIn, ZoomOut, RotateCw, Download, Maximize2 } from "lucide-react"

interface Room {
  id: string
  type: string
  width: number
  length: number
  area: number
  floorMaterial: string
}

interface DetailedVisualizationProps {
  rooms: Room[]
  selectedRoomId?: string
}

// Colores para los diferentes tipos de habitaciones
const roomColors: Record<string, string> = {
  Salón: "#3b82f6", // blue-500
  Cocina: "#f97316", // orange-500
  Baño: "#06b6d4", // cyan-500
  Dormitorio: "#a855f7", // purple-500
  Pasillo: "#22c55e", // green-500
  Otro: "#6b7280", // gray-500
}

export function DetailedVisualization({ rooms, selectedRoomId }: DetailedVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [showLabels, setShowLabels] = useState(true)
  const [showDimensions, setShowDimensions] = useState(true)
  const [showMaterials, setShowMaterials] = useState(false)
  const [rotation, setRotation] = useState(0)

  // Función para dibujar las habitaciones
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Si no hay habitaciones, mostrar mensaje
    if (rooms.length === 0) {
      ctx.fillStyle = "#9ca3af" // gray-400
      ctx.font = "14px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("Añade habitaciones para ver la visualización", canvas.width / 2, canvas.height / 2)
      return
    }

    // Calcular dimensiones totales para escalar
    let maxWidth = 0
    let maxLength = 0
    let totalArea = 0

    rooms.forEach((room) => {
      maxWidth = Math.max(maxWidth, room.width)
      maxLength = Math.max(maxLength, room.length)
      totalArea += room.area
    })

    // Calcular factor de escala (dejando margen)
    const padding = 40
    const maxDimension = Math.max(maxWidth, maxLength)
    const baseScale = maxDimension > 0 ? (Math.min(canvas.width, canvas.height) - padding * 2) / maxDimension : 1
    const scale = baseScale * zoom

    // Guardar el estado actual del canvas
    ctx.save()

    // Trasladar al centro del canvas
    ctx.translate(canvas.width / 2, canvas.height / 2)

    // Aplicar rotación
    ctx.rotate((rotation * Math.PI) / 180)

    // Calcular posiciones para organizar las habitaciones
    let currentX = -canvas.width / 4
    let currentY = -canvas.height / 4
    let rowHeight = 0
    const maxRowWidth = canvas.width * 0.7

    // Dibujar cada habitación
    rooms.forEach((room) => {
      // Si la habitación no tiene dimensiones válidas, omitirla
      if (room.width <= 0 || room.length <= 0) return

      // Calcular dimensiones escaladas
      const width = room.width * scale
      const height = room.length * scale

      // Verificar si la habitación cabe en la fila actual
      if (currentX + width > maxRowWidth) {
        currentX = -canvas.width / 4
        currentY += rowHeight + 20
        rowHeight = 0
      }

      // Actualizar altura máxima de la fila
      rowHeight = Math.max(rowHeight, height)

      // Obtener color según el tipo de habitación
      const color = roomColors[room.type] || roomColors.Otro

      // Dibujar rectángulo (habitación)
      ctx.fillStyle = color + "40" // Añadir transparencia
      ctx.strokeStyle = room.id === selectedRoomId ? "#ef4444" : color // Resaltar si está seleccionada
      ctx.lineWidth = room.id === selectedRoomId ? 3 : 2

      // Dibujar la habitación
      ctx.fillRect(currentX, currentY, width, height)
      ctx.strokeRect(currentX, currentY, width, height)

      // Añadir textos si están activados
      if (showLabels || showDimensions || showMaterials) {
        ctx.fillStyle = "#1f2937" // gray-800
        ctx.font = "12px sans-serif"
        ctx.textAlign = "center"

        let textY = currentY + height / 2
        const lineHeight = 16

        // Mostrar tipo de habitación
        if (showLabels) {
          ctx.font = "bold 12px sans-serif"
          ctx.fillText(room.type, currentX + width / 2, textY)
          textY += lineHeight
        }

        // Mostrar dimensiones
        if (showDimensions) {
          ctx.font = "12px sans-serif"
          ctx.fillText(`${room.width}×${room.length}m (${room.area.toFixed(1)}m²)`, currentX + width / 2, textY)
          textY += lineHeight
        }

        // Mostrar material
        if (showMaterials) {
          ctx.font = "italic 12px sans-serif"
          ctx.fillText(room.floorMaterial, currentX + width / 2, textY)
        }
      }

      // Mover a la siguiente posición
      currentX += width + 20
    })

    // Restaurar el estado del canvas
    ctx.restore()

    // Añadir leyenda
    ctx.font = "12px sans-serif"
    ctx.textAlign = "left"
    ctx.fillStyle = "#1f2937" // gray-800
    ctx.fillText(`Área total: ${totalArea.toFixed(2)} m²`, 10, canvas.height - 10)
    ctx.fillText(`Zoom: ${zoom.toFixed(1)}x`, canvas.width - 100, canvas.height - 10)
  }, [rooms, selectedRoomId, zoom, showLabels, showDimensions, showMaterials, rotation])

  // Función para descargar la imagen
  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Crear un enlace temporal
    const link = document.createElement("a")
    link.download = `plano-habitaciones-${new Date().toISOString().slice(0, 10)}.png`
    link.href = canvas.toDataURL("image/png")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Función para abrir en ventana completa
  const openFullscreen = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (canvas.requestFullscreen) {
      canvas.requestFullscreen()
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Visualización Detallada</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadImage}
              className="h-8 w-8 p-0"
              title="Descargar imagen"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openFullscreen}
              className="h-8 w-8 p-0"
              title="Pantalla completa"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative border rounded-md bg-white">
          <canvas ref={canvasRef} width={800} height={500} className="w-full h-[400px]"></canvas>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="zoom">Zoom</Label>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  className="h-6 w-6 p-0"
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  className="h-6 w-6 p-0"
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Slider
              id="zoom"
              min={0.5}
              max={3}
              step={0.1}
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="rotation">Rotación</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="h-6 w-6 p-0"
              >
                <RotateCw className="h-3 w-3" />
              </Button>
            </div>
            <Slider
              id="rotation"
              min={0}
              max={359}
              step={1}
              value={[rotation]}
              onValueChange={(value) => setRotation(value[0])}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="show-labels" checked={showLabels} onCheckedChange={setShowLabels} />
            <Label htmlFor="show-labels">Mostrar nombres</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="show-dimensions" checked={showDimensions} onCheckedChange={setShowDimensions} />
            <Label htmlFor="show-dimensions">Mostrar dimensiones</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="show-materials" checked={showMaterials} onCheckedChange={setShowMaterials} />
            <Label htmlFor="show-materials">Mostrar materiales</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
