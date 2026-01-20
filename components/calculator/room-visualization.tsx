"use client"

import { useRef, useEffect } from "react"

interface Room {
  id: string
  type: string
  number: number
  width: number
  length: number
  area: number
  floorMaterial: string
}

interface RoomVisualizationProps {
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

export function RoomVisualization({ rooms, selectedRoomId }: RoomVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
    const padding = 20
    const maxDimension = Math.max(maxWidth, maxLength)
    const scale = maxDimension > 0 ? (Math.min(canvas.width, canvas.height) - padding * 2) / maxDimension : 1

    // Posición inicial
    let currentX = padding
    let currentY = padding

    // Dibujar cada habitación
    rooms.forEach((room) => {
      // Si la habitación no tiene dimensiones válidas, omitirla
      if (room.width <= 0 || room.length <= 0) return

      // Calcular dimensiones escaladas
      const width = room.width * scale
      const height = room.length * scale

      // Verificar si la habitación cabe en la fila actual
      if (currentX + width > canvas.width - padding) {
        currentX = padding
        currentY += 100 // Saltar a la siguiente fila
      }

      // Obtener color según el tipo de habitación
      const color = roomColors[room.type] || roomColors.Otro

      // Dibujar rectángulo (habitación)
      ctx.fillStyle = color + "40" // Añadir transparencia
      ctx.strokeStyle = room.id === selectedRoomId ? "#ef4444" : color // Resaltar si está seleccionada
      ctx.lineWidth = room.id === selectedRoomId ? 3 : 2

      // Dibujar la habitación
      ctx.fillRect(currentX, currentY, width, height)
      ctx.strokeRect(currentX, currentY, width, height)

      // Añadir texto con el tipo y dimensiones
      ctx.fillStyle = "#1f2937" // gray-800
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"

      // Formatear el título de la habitación (incluir número si no es Salón o Cocina)
      let roomTitle = room.type
      if (room.type !== "Salón" && room.type !== "Cocina") {
        roomTitle = `${room.type} ${room.number}`
      }

      ctx.fillText(`${roomTitle} (${room.width}×${room.length}m)`, currentX + width / 2, currentY + height / 2)

      // Mover a la siguiente posición
      currentX += width + 20
    })

    // Añadir leyenda
    ctx.font = "12px sans-serif"
    ctx.textAlign = "left"
    ctx.fillStyle = "#1f2937" // gray-800
    ctx.fillText(`Área total: ${totalArea.toFixed(2)} m²`, padding, canvas.height - padding)
  }, [rooms, selectedRoomId])

  return (
    <canvas ref={canvasRef} width={600} height={300} className="w-full h-[300px] border rounded-md bg-white"></canvas>
  )
}
