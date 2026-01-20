"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { FloorPlanAnalysis, Room } from "@/types/floor-plan-analysis"
import { ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react"

interface FloorPlanVisualizerProps {
  analysis: FloorPlanAnalysis
}

export function FloorPlanVisualizer({ analysis }: FloorPlanVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeTab, setActiveTab] = useState<"visual" | "data">("visual")
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  // Dibujar el plano en el canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calcular el factor de escala para ajustar todo al canvas
    const padding = 40
    const roomCoordinates = analysis.rooms.flatMap((room) => room.coordinates)
    const xValues = roomCoordinates.map((coord) => coord[0])
    const yValues = roomCoordinates.map((coord) => coord[1])

    const minX = Math.min(...xValues)
    const maxX = Math.max(...xValues)
    const minY = Math.min(...yValues)
    const maxY = Math.max(...yValues)

    const width = maxX - minX
    const height = maxY - minY

    const scaleX = (canvas.width - padding * 2) / width
    const scaleY = (canvas.height - padding * 2) / height
    const scale = Math.min(scaleX, scaleY) * zoom

    // Guardar el estado actual del canvas
    ctx.save()

    // Trasladar al centro del canvas
    ctx.translate(canvas.width / 2, canvas.height / 2)

    // Aplicar rotación
    ctx.rotate((rotation * Math.PI) / 180)

    // Trasladar para centrar el plano
    ctx.translate(-((minX + maxX) / 2) * scale, -((minY + maxY) / 2) * scale)

    // Dibujar las paredes
    ctx.lineWidth = 2
    ctx.strokeStyle = "#000000"

    analysis.walls.forEach((wall) => {
      ctx.beginPath()

      // Establecer el color según el estado de la pared
      if (wall.status === "demolition") {
        ctx.strokeStyle = "#ef4444" // Rojo para demolición
      } else if (wall.status === "new") {
        ctx.strokeStyle = "#22c55e" // Verde para nuevas
      } else {
        ctx.strokeStyle = "#000000" // Negro para existentes
      }

      // Establecer el grosor según el tipo de pared
      ctx.lineWidth = wall.type === "load_bearing" ? 3 : 2

      // Dibujar la línea de la pared
      ctx.moveTo(wall.coordinates[0][0] * scale, wall.coordinates[0][1] * scale)
      ctx.lineTo(wall.coordinates[1][0] * scale, wall.coordinates[1][1] * scale)
      ctx.stroke()
    })

    // Dibujar las habitaciones
    analysis.rooms.forEach((room) => {
      // Determinar si esta habitación está seleccionada
      const isSelected = selectedRoom && selectedRoom.id === room.id

      // Dibujar el polígono de la habitación
      ctx.beginPath()
      ctx.moveTo(room.coordinates[0][0] * scale, room.coordinates[0][1] * scale)

      for (let i = 1; i < room.coordinates.length; i++) {
        ctx.lineTo(room.coordinates[i][0] * scale, room.coordinates[i][1] * scale)
      }

      ctx.closePath()

      // Rellenar con un color semitransparente
      ctx.fillStyle = isSelected
        ? "rgba(59, 130, 246, 0.3)" // Azul para seleccionado
        : "rgba(229, 231, 235, 0.3)" // Gris claro para no seleccionado
      ctx.fill()

      // Dibujar el borde
      ctx.strokeStyle = isSelected ? "#3b82f6" : "#9ca3af"
      ctx.lineWidth = isSelected ? 2 : 1
      ctx.stroke()

      // Añadir etiqueta con el tipo de habitación
      const centerX = (room.coordinates.reduce((sum, coord) => sum + coord[0], 0) / room.coordinates.length) * scale
      const centerY = (room.coordinates.reduce((sum, coord) => sum + coord[1], 0) / room.coordinates.length) * scale

      ctx.fillStyle = "#000000"
      ctx.font = isSelected ? "bold 14px Arial" : "12px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(room.type, centerX, centerY)

      // Añadir dimensiones si está seleccionada
      if (isSelected) {
        ctx.font = "12px Arial"
        ctx.fillText(
          `${room.measurements.width}m × ${room.measurements.length}m (${room.measurements.area}m²)`,
          centerX,
          centerY + 20,
        )
      }
    })

    // Dibujar las aperturas (puertas y ventanas)
    analysis.openings.forEach((opening) => {
      ctx.beginPath()

      // Establecer el color según el tipo
      ctx.strokeStyle = opening.type === "door" ? "#3b82f6" : "#10b981"
      ctx.lineWidth = 2

      // Dibujar la línea de la apertura
      ctx.moveTo(opening.coordinates[0][0] * scale, opening.coordinates[0][1] * scale)
      ctx.lineTo(opening.coordinates[1][0] * scale, opening.coordinates[1][1] * scale)
      ctx.stroke()

      // Añadir un símbolo para distinguir puertas de ventanas
      const centerX = ((opening.coordinates[0][0] + opening.coordinates[1][0]) / 2) * scale
      const centerY = ((opening.coordinates[0][1] + opening.coordinates[1][1]) / 2) * scale

      if (opening.type === "door") {
        // Dibujar un arco para las puertas
        const dx = opening.coordinates[1][0] - opening.coordinates[0][0]
        const dy = opening.coordinates[1][1] - opening.coordinates[0][1]
        const angle = Math.atan2(dy, dx)

        ctx.beginPath()
        ctx.arc(
          opening.coordinates[0][0] * scale,
          opening.coordinates[0][1] * scale,
          opening.width * scale,
          angle,
          angle + Math.PI / 2,
          false,
        )
        ctx.stroke()
      } else {
        // Dibujar una línea doble para las ventanas
        ctx.beginPath()
        ctx.moveTo(opening.coordinates[0][0] * scale, opening.coordinates[0][1] * scale)
        ctx.lineTo(opening.coordinates[1][0] * scale, opening.coordinates[1][1] * scale)
        ctx.stroke()

        // Segunda línea paralela
        const dx = opening.coordinates[1][0] - opening.coordinates[0][0]
        const dy = opening.coordinates[1][1] - opening.coordinates[0][1]
        const length = Math.sqrt(dx * dx + dy * dy)
        const offsetX = (dy / length) * 5
        const offsetY = -(dx / length) * 5

        ctx.beginPath()
        ctx.moveTo(opening.coordinates[0][0] * scale + offsetX, opening.coordinates[0][1] * scale + offsetY)
        ctx.lineTo(opening.coordinates[1][0] * scale + offsetX, opening.coordinates[1][1] * scale + offsetY)
        ctx.stroke()
      }
    })

    // Restaurar el estado del canvas
    ctx.restore()

    // Añadir leyenda
    ctx.font = "12px Arial"
    ctx.fillStyle = "#000000"
    ctx.textAlign = "left"
    ctx.fillText(`Escala: ${analysis.scale}`, 10, 20)
    ctx.fillText(`Confianza: ${(analysis.confidence * 100).toFixed(0)}%`, 10, 40)

    // Leyenda de colores
    ctx.fillText("Leyenda:", canvas.width - 150, 20)

    ctx.fillStyle = "#000000"
    ctx.fillRect(canvas.width - 150, 30, 20, 10)
    ctx.fillText("Existente", canvas.width - 120, 38)

    ctx.fillStyle = "#ef4444"
    ctx.fillRect(canvas.width - 150, 50, 20, 10)
    ctx.fillText("A demoler", canvas.width - 120, 58)

    ctx.fillStyle = "#22c55e"
    ctx.fillRect(canvas.width - 150, 70, 20, 10)
    ctx.fillText("Nuevo", canvas.width - 120, 78)
  }, [analysis, zoom, rotation, selectedRoom])

  // Función para descargar la imagen
  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Crear un enlace temporal
    const link = document.createElement("a")
    link.download = `plano-analizado-${new Date().toISOString().slice(0, 10)}.png`
    link.href = canvas.toDataURL("image/png")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Función para manejar el clic en una habitación
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convertir las coordenadas del clic a coordenadas del plano
    // (Esta es una simplificación, en una implementación real necesitaríamos
    // tener en cuenta el zoom, la rotación y el desplazamiento)

    // Por ahora, simplemente seleccionamos la primera habitación como ejemplo
    if (analysis.rooms.length > 0) {
      if (selectedRoom) {
        setSelectedRoom(null)
      } else {
        setSelectedRoom(analysis.rooms[0])
      }
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Visualización del Análisis</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="h-8 w-8 p-0"
              title="Reducir zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              className="h-8 w-8 p-0"
              title="Aumentar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="h-8 w-8 p-0"
              title="Rotar 90°"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadImage}
              className="h-8 w-8 p-0"
              title="Descargar imagen"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "visual" | "data")}>
          <TabsList className="mb-4">
            <TabsTrigger value="visual">Visualización</TabsTrigger>
            <TabsTrigger value="data">Datos</TabsTrigger>
          </TabsList>

          <TabsContent value="visual">
            <div className="border rounded-md overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                className="w-full h-[400px]"
                onClick={handleCanvasClick}
              ></canvas>
            </div>
          </TabsContent>

          <TabsContent value="data">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Habitaciones</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Ancho (m)</TableHead>
                      <TableHead>Largo (m)</TableHead>
                      <TableHead>Área (m²)</TableHead>
                      <TableHead>Confianza</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.rooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell>{room.id}</TableCell>
                        <TableCell>{room.type}</TableCell>
                        <TableCell>{room.measurements.width.toFixed(2)}</TableCell>
                        <TableCell>{room.measurements.length.toFixed(2)}</TableCell>
                        <TableCell>{room.measurements.area.toFixed(2)}</TableCell>
                        <TableCell>{(room.confidence * 100).toFixed(0)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Paredes</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Longitud (m)</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.walls.map((wall) => (
                      <TableRow key={wall.id}>
                        <TableCell>{wall.id}</TableCell>
                        <TableCell>{wall.length.toFixed(2)}</TableCell>
                        <TableCell>{wall.type === "load_bearing" ? "Carga" : "Tabique"}</TableCell>
                        <TableCell>
                          {wall.status === "existing"
                            ? "Existente"
                            : wall.status === "demolition"
                              ? "A demoler"
                              : "Nuevo"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Aperturas</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Ancho (m)</TableHead>
                      <TableHead>Conecta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.openings.map((opening) => (
                      <TableRow key={opening.id}>
                        <TableCell>{opening.id}</TableCell>
                        <TableCell>{opening.type === "door" ? "Puerta" : "Ventana"}</TableCell>
                        <TableCell>{opening.width.toFixed(2)}</TableCell>
                        <TableCell>{opening.connects.join(" - ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
