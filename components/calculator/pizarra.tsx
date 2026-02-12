"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Undo, Grid, Magnet, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { formatNumber } from "@/lib/utils/format"

interface Point {
  x: number
  y: number
}

interface PizarraProps {
  onMeasurementsCalculated?: (area: number, perimeter: number) => void
}

export function Pizarra({ onMeasurementsCalculated }: PizarraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [points, setPoints] = useState<Point[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null)
  const [area, setArea] = useState<number | null>(null)
  const [perimeter, setPerimeter] = useState<number | null>(null)
  const [isClosed, setIsClosed] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [zoom, setZoom] = useState(0.3)
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null)
  const [lastTouchCenter, setLastTouchCenter] = useState<Point | null>(null)

  // Nueva configuración para rejilla de 10cm x 10cm con snap de 1cm
  const gridSize = 20 // 20 píxeles = 10cm (rejilla visual)
  const snapSize = 2 // 2 píxeles = 1cm (precisión de movimiento)
  const pixelsPerCm = 2 // 2 píxeles = 1cm (escala general)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // Agregar estado para el pan con mouse
  const [isMousePanning, setIsMousePanning] = useState(false)
  const [lastMousePosition, setLastMousePosition] = useState<Point | null>(null)

  // Función para verificar si tres puntos están en la misma línea (colineales)
  const arePointsCollinear = (p1: Point, p2: Point, p3: Point, tolerance = 2): boolean => {
    // Calcular el área del triángulo formado por los tres puntos
    // Si el área es 0 (o muy pequeña), los puntos están en la misma línea
    const area = Math.abs((p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y)) / 2
    return area <= tolerance
  }

  // Función para agrupar líneas consecutivas que están en la misma recta
  const groupCollinearLines = (
    points: Point[],
  ): Array<{ start: number; end: number; totalLength: number; midPoint: Point }> => {
    if (points.length < 3) return []

    const groups: Array<{ start: number; end: number; totalLength: number; midPoint: Point }> = []
    let currentGroupStart = 0

    for (let i = 1; i < points.length - 1; i++) {
      const p1 = points[i - 1]
      const p2 = points[i]
      const p3 = points[i + 1]

      // Si los puntos no son colineales, terminar el grupo actual
      if (!arePointsCollinear(p1, p2, p3)) {
        // Si hay más de 2 puntos en el grupo, crear una agrupación
        if (i - currentGroupStart >= 2) {
          const startPoint = points[currentGroupStart]
          const endPoint = points[i]
          const totalLength = calculateDistance(startPoint, endPoint)
          const midPoint = {
            x: (startPoint.x + endPoint.x) / 2,
            y: (startPoint.y + endPoint.y) / 2,
          }

          groups.push({
            start: currentGroupStart,
            end: i,
            totalLength,
            midPoint,
          })
        }
        currentGroupStart = i
      }
    }

    // Verificar el último grupo
    const lastIndex = points.length - 1
    if (lastIndex - currentGroupStart >= 2) {
      const startPoint = points[currentGroupStart]
      const endPoint = points[lastIndex]
      const totalLength = calculateDistance(startPoint, endPoint)
      const midPoint = {
        x: (startPoint.x + endPoint.x) / 2,
        y: (startPoint.y + endPoint.y) / 2,
      }

      groups.push({
        start: currentGroupStart,
        end: lastIndex,
        totalLength,
        midPoint,
      })
    }

    return groups
  }

  // Función para hacer scroll automático más robusta
  const scrollToResults = () => {
    // Intentar múltiples métodos de scroll para máxima compatibilidad
    setTimeout(() => {
      try {
        // Método 1: scrollIntoView en el elemento de resultados
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          })
        }
      } catch (e) {
        console.log("ScrollIntoView falló, intentando método alternativo")
      }
    }, 100)

    // Método 2: Scroll manual calculando la posición
    setTimeout(() => {
      try {
        if (resultsRef.current && containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect()
          const resultsRect = resultsRef.current.getBoundingClientRect()
          const scrollTop = resultsRect.top - containerRect.top + containerRef.current.scrollTop - 20

          containerRef.current.scrollTo({
            top: scrollTop,
            behavior: "smooth",
          })
        }
      } catch (e) {
        console.log("Scroll manual falló")
      }
    }, 200)

    // Método 3: Scroll de ventana como fallback
    setTimeout(() => {
      try {
        if (resultsRef.current) {
          const rect = resultsRef.current.getBoundingClientRect()
          const scrollY = window.pageYOffset + rect.top - 100

          window.scrollTo({
            top: scrollY,
            behavior: "smooth",
          })
        }
      } catch (e) {
        console.log("Window scroll falló")
      }
    }, 300)
  }

  // Función para ajustar un punto a la rejilla de 1cm
  const snapPointToGrid = (point: Point): Point => {
    if (!snapToGrid) return point
    return {
      x: Math.round(point.x / snapSize) * snapSize,
      y: Math.round(point.y / snapSize) * snapSize,
    }
  }

  // Función para imantar a líneas paralelas (horizontal/vertical)
  const snapToParallelLines = (currentPoint: Point, lastPoint: Point): Point => {
    if (!snapToGrid || points.length < 2) return currentPoint

    const snapTolerance = 15 / zoom // Tolerancia de imantación ajustada por zoom
    const snappedPoint = { ...currentPoint }

    // Buscar puntos para alineación horizontal o vertical
    for (const point of points) {
      // Imantación vertical (misma coordenada X)
      if (Math.abs(currentPoint.x - point.x) <= snapTolerance) {
        snappedPoint.x = point.x
        break
      }

      // Imantación horizontal (misma coordenada Y)
      if (Math.abs(currentPoint.y - point.y) <= snapTolerance) {
        snappedPoint.y = point.y
        break
      }
    }

    // Asegurar que el punto final sigue siendo múltiplo de snapSize (1cm)
    return {
      x: Math.round(snappedPoint.x / snapSize) * snapSize,
      y: Math.round(snappedPoint.y / snapSize) * snapSize,
    }
  }

  // Función para ajustar ángulos a múltiplos de 5 grados con imantación fuerte en 0° y 90°
  const snapAngleToGrid = (startPoint: Point, endPoint: Point): Point => {
    if (!snapToGrid) return endPoint

    // Calcular el ángulo actual de la línea
    const deltaX = endPoint.x - startPoint.x
    const deltaY = endPoint.y - startPoint.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (distance < 10) return endPoint // Muy cerca, no aplicar snap

    // Ángulo en grados (0° = horizontal derecha, 90° = vertical arriba)
    let angle = Math.atan2(-deltaY, deltaX) * (180 / Math.PI)
    if (angle < 0) angle += 360

    // Zona de imantación fuerte para ángulos rectos (±15°)
    const strongSnapZone = 15
    // Zona de imantación normal para otros ángulos (±7°)
    const normalSnapZone = 7

    let targetAngle = angle

    // Imantación fuerte a 0°, 90°, 180°, 270°
    const rightAngles = [0, 90, 180, 270, 360]
    for (const rightAngle of rightAngles) {
      if (
        Math.abs(angle - rightAngle) <= strongSnapZone ||
        Math.abs(angle - rightAngle + 360) <= strongSnapZone ||
        Math.abs(angle - rightAngle - 360) <= strongSnapZone
      ) {
        targetAngle = rightAngle % 360
        break
      }
    }

    // Si no se aplicó imantación fuerte, aplicar snap a múltiplos de 5°
    if (targetAngle === angle) {
      const nearestFive = Math.round(angle / 5) * 5
      if (Math.abs(angle - nearestFive) <= normalSnapZone) {
        targetAngle = nearestFive % 360
      }
    }

    // Calcular la nueva posición del punto final
    const targetAngleRad = (targetAngle * Math.PI) / 180
    const newEndPoint = {
      x: startPoint.x + distance * Math.cos(targetAngleRad),
      y: startPoint.y - distance * Math.sin(targetAngleRad), // Negativo porque Y crece hacia abajo
    }

    // Asegurar que el resultado final sea múltiplo de snapSize (1cm)
    return {
      x: Math.round(newEndPoint.x / snapSize) * snapSize,
      y: Math.round(newEndPoint.y / snapSize) * snapSize,
    }
  }

  // Calcular distancia entre dos puntos en centímetros
  const calculateDistance = (p1: Point, p2: Point): number => {
    const pixelDistance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
    return pixelDistance / pixelsPerCm // Convertir píxeles a centímetros
  }

  // Calcular ángulo entre tres puntos (en grados)
  const calculateAngle = (p1: Point, p2: Point, p3: Point): number => {
    const vector1 = { x: p1.x - p2.x, y: p1.y - p2.y }
    const vector2 = { x: p3.x - p2.x, y: p3.y - p2.y }

    const dot = vector1.x * vector2.x + vector1.y * vector2.y
    const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y)
    const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y)

    const cosAngle = dot / (mag1 * mag2)
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)))
    return (angleRad * 180) / Math.PI
  }

  // Detectar si la línea va hacia arriba
  const isLineGoingUp = (p1: Point, p2: Point): boolean => {
    return p2.y < p1.y
  }

  // Verificar si el punto actual está cerca del punto inicial
  const isCloseToStart = (point: Point): boolean => {
    if (points.length < 3) return false
    const firstPoint = points[0]
    const distance = calculateDistance(point, firstPoint)
    return distance < 8 / zoom // Reducido de 25 a 8 - mucho más preciso
  }

  // Convertir coordenadas del canvas a coordenadas del mundo
  const canvasToWorld = (canvasPoint: Point): Point => {
    return {
      x: (canvasPoint.x - panOffset.x) / zoom,
      y: (canvasPoint.y - panOffset.y) / zoom,
    }
  }

  // Convertir coordenadas del mundo a coordenadas del canvas
  const worldToCanvas = (worldPoint: Point): Point => {
    return {
      x: worldPoint.x * zoom + panOffset.x,
      y: worldPoint.y * zoom + panOffset.y,
    }
  }

  // Función para dibujar la rejilla de 10cm x 10cm
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!showGrid) return

    ctx.save()
    ctx.strokeStyle = "#e2e8f0"
    ctx.lineWidth = 1

    // Rejilla principal de 10cm x 10cm
    const actualGridSize = gridSize * zoom

    // Calcular el desplazamiento de la rejilla basado en el panOffset
    const offsetX = panOffset.x % actualGridSize
    const offsetY = panOffset.y % actualGridSize

    // Dibujar líneas verticales principales (cada 10cm)
    for (let x = offsetX; x < width; x += actualGridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Dibujar líneas horizontales principales (cada 10cm)
    for (let y = offsetY; y < height; y += actualGridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Dibujar líneas secundarias más tenues (cada 1cm) solo si el zoom es suficiente
    if (zoom > 0.5) {
      ctx.strokeStyle = "#f1f5f9"
      ctx.lineWidth = 0.5

      const actualSnapSize = snapSize * zoom
      const snapOffsetX = panOffset.x % actualSnapSize
      const snapOffsetY = panOffset.y % actualSnapSize

      // Líneas verticales cada 1cm
      for (let x = snapOffsetX; x < width; x += actualSnapSize) {
        // Solo dibujar si no coincide con una línea principal
        if (Math.abs(x % actualGridSize) > 1) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, height)
          ctx.stroke()
        }
      }

      // Líneas horizontales cada 1cm
      for (let y = snapOffsetY; y < height; y += actualSnapSize) {
        // Solo dibujar si no coincide con una línea principal
        if (Math.abs(y % actualGridSize) > 1) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(width, y)
          ctx.stroke()
        }
      }
    }

    ctx.restore()
  }

  // Función para dibujar líneas guía de imantación
  const drawSnapGuides = (ctx: CanvasRenderingContext2D, currentPoint: Point) => {
    if (!snapToGrid || !currentPoint || points.length === 0) return

    ctx.save()
    ctx.strokeStyle = "#22c55e"
    ctx.lineWidth = 1 / zoom
    ctx.setLineDash([5 / zoom, 5 / zoom])

    const snapTolerance = 15 / zoom

    // Dibujar líneas guía para imantación
    for (const point of points) {
      // Línea guía vertical
      if (Math.abs(currentPoint.x - point.x) <= snapTolerance) {
        ctx.beginPath()
        ctx.moveTo(point.x, 0)
        ctx.lineTo(point.x, ctx.canvas.height / zoom)
        ctx.stroke()
      }

      // Línea guía horizontal
      if (Math.abs(currentPoint.y - point.y) <= snapTolerance) {
        ctx.beginPath()
        ctx.moveTo(0, point.y)
        ctx.lineTo(ctx.canvas.width / zoom, point.y)
        ctx.stroke()
      }
    }

    ctx.setLineDash([])
    ctx.restore()
  }

  // Función para dibujar en el canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpiar el canvas
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Dibujar la rejilla
    drawGrid(ctx, canvas.width, canvas.height)

    // Aplicar transformación para zoom y pan
    ctx.save()
    ctx.translate(panOffset.x, panOffset.y)
    ctx.scale(zoom, zoom)

    // Dibujar líneas guía de imantación si se está dibujando
    if (isDrawing && currentPoint && points.length > 0) {
      drawSnapGuides(ctx, currentPoint)
    }

    // Configurar el contexto para líneas
    ctx.lineWidth = 3 / zoom
    ctx.strokeStyle = "#0f172a"
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Dibujar los puntos y líneas rectas fijas
    const collinearGroups = groupCollinearLines(points)

    points.forEach((point, index) => {
      // Dibujar punto
      ctx.fillStyle = index === 0 ? "#22c55e" : "#0f172a"
      ctx.beginPath()
      ctx.arc(point.x, point.y, 4 / zoom, 0, Math.PI * 2)
      ctx.fill()

      // Dibujar línea recta si hay un punto anterior
      if (index > 0) {
        const prevPoint = points[index - 1]
        ctx.beginPath()
        ctx.moveTo(prevPoint.x, prevPoint.y)
        ctx.lineTo(point.x, point.y)
        ctx.stroke()

        // Verificar si esta línea es parte de un grupo colineal
        const isPartOfGroup = collinearGroups.some((group) => index > group.start && index <= group.end)

        // Solo mostrar medida individual si no es parte de un grupo
        if (!isPartOfGroup) {
          const length = calculateDistance(prevPoint, point)
          const midX = (prevPoint.x + point.x) / 2
          const midY = (prevPoint.y + point.y) / 2

          // Detectar si la línea va hacia arriba y ajustar posición
          const goingUp = isLineGoingUp(prevPoint, point)
          const textOffsetY = goingUp ? 15 / zoom : -15 / zoom

          // Ajustar el tamaño del texto según el zoom
          const fontSize = Math.max(12 / zoom, 8)
          ctx.font = `bold ${fontSize}px Arial`
          const textWidth = ctx.measureText(`${length.toFixed(0)} cm`).width
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
          ctx.fillRect(midX - textWidth / 2 - 4 / zoom, midY + textOffsetY - 10 / zoom, textWidth + 8 / zoom, 20 / zoom)

          // Comprobar si la medida se saldría por arriba del canvas
          const screenMidY = midY * zoom + panOffset.y + textOffsetY * zoom
          const finalOffsetY = screenMidY < 30 ? (goingUp ? 15 / zoom : 35 / zoom) : textOffsetY

          // Mostrar la medida
          ctx.fillStyle = "#0f172a"
          ctx.textAlign = "center"
          ctx.fillText(`${length.toFixed(0)} cm`, midX, midY + finalOffsetY + 5 / zoom)
        }

        // Dibujar ángulo si hay puntos suficientes y no es parte de un grupo
        if (index > 1 && !isPartOfGroup) {
          const p1 = points[index - 2]
          const p2 = points[index - 1]
          const p3 = point

          const angle = calculateAngle(p1, p2, p3)

          // Solo mostrar si no es aproximadamente 90°
          if (angle < 90 && Math.abs(angle - 90) > 5) {
            // Posición para mostrar el ángulo (cerca del vértice)
            const angleOffset = 25 / zoom
            const angleX = p2.x + angleOffset
            const angleY = p2.y - angleOffset

            // Dibujar fondo para el ángulo
            const fontSize = Math.max(10 / zoom, 6)
            ctx.font = `${fontSize}px Arial`
            const angleText = `${angle.toFixed(1)}°`
            const angleTextWidth = ctx.measureText(angleText).width

            ctx.fillStyle = "rgba(255, 255, 0, 0.8)" // Fondo amarillo para ángulos
            ctx.fillRect(
              angleX - angleTextWidth / 2 - 3 / zoom,
              angleY - 12 / zoom,
              angleTextWidth + 6 / zoom,
              16 / zoom,
            )

            // Mostrar el ángulo
            ctx.fillStyle = "#8b5cf6" // Púrpura para ángulos
            ctx.textAlign = "center"
            ctx.fillText(angleText, angleX, angleY - 2 / zoom)
          }
        }
      }
    })

    // Dibujar medidas para grupos de líneas colineales
    collinearGroups.forEach((group) => {
      const startPoint = points[group.start]
      const endPoint = points[group.end]

      // Determinar la dirección de la línea para posicionar el texto
      const goingUp = isLineGoingUp(startPoint, endPoint)
      const textOffsetY = goingUp ? 15 / zoom : -15 / zoom

      // Ajustar el tamaño del texto según el zoom
      const fontSize = Math.max(12 / zoom, 8)
      ctx.font = `bold ${fontSize}px Arial`
      const textWidth = ctx.measureText(`${group.totalLength.toFixed(0)} cm`).width

      // Fondo con color diferente para medidas agrupadas
      ctx.fillStyle = "rgba(34, 197, 94, 0.9)" // Verde para medidas agrupadas
      ctx.fillRect(
        group.midPoint.x - textWidth / 2 - 4 / zoom,
        group.midPoint.y + textOffsetY - 10 / zoom,
        textWidth + 8 / zoom,
        20 / zoom,
      )

      // Mostrar la medida total
      ctx.fillStyle = "#ffffff"
      ctx.textAlign = "center"
      ctx.fillText(`${group.totalLength.toFixed(0)} cm`, group.midPoint.x, group.midPoint.y + textOffsetY + 5 / zoom)
    })

    // Dibujar línea temporal mientras se arrastra
    if (isDrawing && currentPoint && points.length > 0) {
      const lastPoint = points[points.length - 1]
      let snappedCurrentPoint = snapToGrid ? snapPointToGrid(currentPoint) : currentPoint

      // Aplicar imantación a líneas paralelas ANTES del snap de ángulo
      if (snapToGrid && points.length > 0) {
        snappedCurrentPoint = snapToParallelLines(snappedCurrentPoint, lastPoint)
      }

      // Aplicar snap de ángulo después del snap de posición y paralelas
      if (snapToGrid && points.length > 0) {
        snappedCurrentPoint = snapAngleToGrid(lastPoint, snappedCurrentPoint)
      }

      // Línea temporal
      ctx.strokeStyle = "#3b82f6" // Azul para la línea temporal
      ctx.setLineDash([5 / zoom, 5 / zoom])
      ctx.beginPath()
      ctx.moveTo(lastPoint.x, lastPoint.y)
      ctx.lineTo(snappedCurrentPoint.x, snappedCurrentPoint.y)
      ctx.stroke()
      ctx.setLineDash([])

      // Mostrar la longitud temporal - siempre por encima del dedo
      const length = calculateDistance(lastPoint, snappedCurrentPoint)

      // Para línea temporal, mostrar cerca del punto final pero siempre arriba
      // Para línea temporal, detectar si estamos cerca del borde superior
      const screenY = snappedCurrentPoint.y * zoom + panOffset.y
      const isNearTop = screenY < 100
      const textX = snappedCurrentPoint.x
      const textY = isNearTop ? snappedCurrentPoint.y + 50 / zoom : snappedCurrentPoint.y - 35 / zoom

      const fontSize = Math.max(12 / zoom, 8)
      ctx.font = `bold ${fontSize}px Arial`
      const textWidth = ctx.measureText(`${length.toFixed(0)} cm`).width
      ctx.fillStyle = "rgba(59, 130, 246, 0.9)" // Fondo azul para medida temporal
      ctx.fillRect(textX - textWidth / 2 - 4 / zoom, textY - (isNearTop ? 5 / zoom : 16 / zoom), textWidth + 8 / zoom, 20 / zoom)

      ctx.fillStyle = "#ffffff"
      ctx.textAlign = "center"
      ctx.fillText(`${length.toFixed(0)} cm`, textX, textY + (isNearTop ? 10 / zoom : -5 / zoom))

      // Punto temporal
      ctx.fillStyle = "#3b82f6"
      ctx.beginPath()
      ctx.arc(snappedCurrentPoint.x, snappedCurrentPoint.y, 4 / zoom, 0, Math.PI * 2)
      ctx.fill()

      // Verificar si puede cerrar la figura
      if (isCloseToStart(snappedCurrentPoint)) {
        const firstPoint = points[0]

        // Línea de cierre temporal
        ctx.strokeStyle = "#22c55e"
        ctx.setLineDash([10 / zoom, 10 / zoom])
        ctx.beginPath()
        ctx.moveTo(snappedCurrentPoint.x, snappedCurrentPoint.y)
        ctx.lineTo(firstPoint.x, firstPoint.y)
        ctx.stroke()
        ctx.setLineDash([])

        // Resaltar el punto inicial
        ctx.fillStyle = "#22c55e"
        ctx.beginPath()
        ctx.arc(firstPoint.x, firstPoint.y, 8 / zoom, 0, Math.PI * 2)
        ctx.fill()
      }

      // Mostrar ángulo temporal si hay suficientes puntos y no es de 90°
      if (points.length >= 2) {
        const p1 = points[points.length - 2]
        const p2 = lastPoint
        const p3 = snappedCurrentPoint

        const angle = calculateAngle(p1, p2, p3)

        // Solo mostrar ángulos menores a 90° (excluyendo 90° exacto)
        if (angle < 90 && Math.abs(angle - 90) > 5) {
          // Posición para mostrar el ángulo temporal
          const angleOffset = 25 / zoom
          const angleX = p2.x + angleOffset
          const angleY = p2.y - angleOffset

          // Dibujar fondo para el ángulo temporal
          const fontSize = Math.max(10 / zoom, 6)
          ctx.font = `${fontSize}px Arial`
          const angleText = `${angle.toFixed(1)}°`
          const angleTextWidth = ctx.measureText(angleText).width

          ctx.fillStyle = "rgba(59, 130, 246, 0.8)" // Fondo azul para ángulo temporal
          ctx.fillRect(angleX - angleTextWidth / 2 - 3 / zoom, angleY - 12 / zoom, angleTextWidth + 6 / zoom, 16 / zoom)

          // Mostrar el ángulo temporal
          ctx.fillStyle = "#ffffff"
          ctx.textAlign = "center"
          ctx.fillText(angleText, angleX, angleY - 2 / zoom)
        }
      }
    }

    // Dibujar línea de cierre si la figura está cerrada
    if (isClosed && points.length > 2) {
      ctx.strokeStyle = "#0f172a"
      ctx.beginPath()
      ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y)
      ctx.lineTo(points[0].x, points[0].y)
      ctx.stroke()

      // Mostrar medida de la línea de cierre
      const lastPoint = points[points.length - 1]
      const firstPoint = points[0]
      const length = calculateDistance(lastPoint, firstPoint)
      const midX = (lastPoint.x + firstPoint.x) / 2
      const midY = (lastPoint.y + firstPoint.y) / 2

      // Detectar dirección para línea de cierre
      const goingUp = isLineGoingUp(lastPoint, firstPoint)
      const textOffsetY = goingUp ? 15 / zoom : -15 / zoom // Arriba si va hacia abajo, abajo si va hacia arriba

      const fontSize = Math.max(12 / zoom, 8)
      ctx.font = `bold ${fontSize}px Arial`
      const textWidth = ctx.measureText(`${length.toFixed(0)} cm`).width
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
      ctx.fillRect(midX - textWidth / 2 - 4 / zoom, midY + textOffsetY - 10 / zoom, textWidth + 8 / zoom, 20 / zoom)

      ctx.fillStyle = "#0f172a"
      ctx.textAlign = "center"
      ctx.fillText(`${length.toFixed(0)} cm`, midX, midY + textOffsetY + 5 / zoom)
    }

    // Resaltar punto inicial si hay puntos
    if (points.length > 0) {
      ctx.fillStyle = "#22c55e"
      ctx.beginPath()
      ctx.arc(points[0].x, points[0].y, 6 / zoom, 0, Math.PI * 2)
      ctx.fill()
    }

    // Resaltar último punto si no está cerrado
    if (points.length > 0 && !isClosed) {
      ctx.fillStyle = "#3b82f6"
      ctx.beginPath()
      ctx.arc(points[points.length - 1].x, points[points.length - 1].y, 6 / zoom, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  // Calcular área de un polígono usando la fórmula del área de Gauss
  const calculateArea = (points: Point[]): number => {
    if (points.length < 3) return 0

    let area = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      area += points[i].x * points[j].y
      area -= points[j].x * points[i].y
    }
    area = Math.abs(area) / 2
    return area / (pixelsPerCm * pixelsPerCm) // Convertir píxeles² a cm²
  }

  // Calcular perímetro
  const calculatePerimeter = (points: Point[]): number => {
    if (points.length < 2) return 0

    let perimeter = 0

    // Calcular todas las líneas entre puntos consecutivos
    for (let i = 0; i < points.length; i++) {
      const currentPoint = points[i]
      const nextPoint = points[(i + 1) % points.length]
      perimeter += calculateDistance(currentPoint, nextPoint)
    }

    return perimeter // Ya está en cm
  }

  // Cerrar la figura
  const closeFigure = () => {
    if (points.length < 3) return
    setIsClosed(true)
    setIsDrawing(false)
    setCurrentPoint(null)

    // Calcular área y perímetro
    const calculatedArea = calculateArea(points)
    const calculatedPerimeter = calculatePerimeter(points)

    setArea(calculatedArea)
    setPerimeter(calculatedPerimeter)

    // Notificar al componente padre con las medidas en metros
    if (onMeasurementsCalculated) {
      onMeasurementsCalculated(
        calculatedArea / 10000, // Convertir cm² a m²
        calculatedPerimeter / 100, // Convertir cm a m
      )
    }

    // Hacer scroll hacia los resultados con múltiples métodos para compatibilidad
    scrollToResults()
  }

  // Obtener la posición exacta del clic/toque en el canvas
  const getCanvasCoordinates = (clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: Math.round(clientX - rect.left),
      y: Math.round(clientY - rect.top),
    }
  }

  // Calcular distancia entre dos toques
  const getTouchDistance = (touches: TouchList | React.TouchList): number => {
    if (touches.length < 2) return 0
    const touch1 = touches[0]
    const touch2 = touches[1]
    return Math.sqrt(Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2))
  }

  // Calcular centro entre dos toques
  const getTouchCenter = (touches: TouchList | React.TouchList): Point => {
    if (touches.length < 2) return { x: 0, y: 0 }
    const touch1 = touches[0]
    const touch2 = touches[1]
    return getCanvasCoordinates((touch1.clientX + touch2.clientX) / 2, (touch1.clientY + touch2.clientY) / 2)
  }

  // Modificar los eventos del mouse para incluir pan cuando la figura esté cerrada
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasPoint = getCanvasCoordinates(e.clientX, e.clientY)

    if (isClosed) {
      // Si la figura está cerrada, iniciar pan
      setIsMousePanning(true)
      setLastMousePosition(canvasPoint)
      return
    }

    const worldPoint = canvasToWorld(canvasPoint)

    // Añadir un pequeño offset para que el cursor no tape los números
    const offsetWorldPoint = {
      x: worldPoint.x,
      y: worldPoint.y - 30 / zoom, // Offset hacia arriba
    }

    const snappedPoint = snapToGrid ? snapPointToGrid(offsetWorldPoint) : offsetWorldPoint

    // Si es el primer punto, añadirlo directamente
    if (points.length === 0) {
      setPoints([snappedPoint])
    }

    setIsDrawing(true)
    setCurrentPoint(snappedPoint)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasPoint = getCanvasCoordinates(e.clientX, e.clientY)

    if (isMousePanning && lastMousePosition && isClosed) {
      // Pan con mouse cuando la figura está cerrada
      const deltaX = canvasPoint.x - lastMousePosition.x
      const deltaY = canvasPoint.y - lastMousePosition.y

      setPanOffset({
        x: panOffset.x + deltaX,
        y: panOffset.y + deltaY,
      })

      setLastMousePosition(canvasPoint)
      return
    }

    if (!isDrawing || isClosed) return

    const worldPoint = canvasToWorld(canvasPoint)

    // Añadir el mismo offset
    const offsetWorldPoint = {
      x: worldPoint.x,
      y: worldPoint.y - 30 / zoom,
    }

    setCurrentPoint(offsetWorldPoint)
  }

  const handleMouseUp = () => {
    if (isMousePanning) {
      setIsMousePanning(false)
      setLastMousePosition(null)
      return
    }

    if (!isDrawing || !currentPoint || isClosed) return

    let snappedPoint = snapToGrid ? snapPointToGrid(currentPoint) : currentPoint

    // Aplicar imantación a líneas paralelas
    if (snapToGrid && points.length > 0) {
      const lastPoint = points[points.length - 1]
      snappedPoint = snapToParallelLines(snappedPoint, lastPoint)
    }

    // Aplicar snap de ángulo después del snap de posición y paralelas
    if (snapToGrid && points.length > 0) {
      const lastPoint = points[points.length - 1]
      snappedPoint = snapAngleToGrid(lastPoint, snappedPoint)
    }

    // Verificar si debe cerrar la figura
    if (points.length >= 3 && isCloseToStart(snappedPoint)) {
      closeFigure()
      return
    }

    // Aplicar snap final para asegurar múltiplos de snapSize (1cm)
    snappedPoint = {
      x: Math.round(snappedPoint.x / snapSize) * snapSize,
      y: Math.round(snappedPoint.y / snapSize) * snapSize,
    }

    // Añadir el nuevo punto
    setPoints((prev) => [...prev, snappedPoint])
    setIsDrawing(false)
    setCurrentPoint(null)
  }

  // Modificar el cursor según el estado
  const getCursorStyle = () => {
    if (isClosed) {
      return isMousePanning ? "grabbing" : "grab"
    }
    return "crosshair"
  }

  // Actualizar el canvas con el nuevo cursor
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault() // Prevenir el scroll/zoom del navegador
    e.stopPropagation() // Evitar que el evento se propague

    // Obtener la posición del cursor para hacer zoom centrado
    const canvasPoint = getCanvasCoordinates(e.clientX, e.clientY)
    const worldPoint = canvasToWorld(canvasPoint)

    // Calcular el factor de zoom basado en la dirección de la rueda
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 5)

    // Calcular el nuevo offset para mantener el punto bajo el cursor
    const newPanOffset = {
      x: canvasPoint.x - worldPoint.x * newZoom,
      y: canvasPoint.y - worldPoint.y * newZoom,
    }

    setZoom(newZoom)
    setPanOffset(newPanOffset)
  }

  // Función para deshacer el último trazo
  const handleUndo = () => {
    if (points.length > 0) {
      setPoints((prev) => prev.slice(0, -1))
      setArea(null)
      setPerimeter(null)
      setIsClosed(false)
    }
  }

  // Función para limpiar el canvas
  const handleClear = () => {
    setPoints([])
    setArea(null)
    setPerimeter(null)
    setIsClosed(false)
    setPanOffset({ x: 0, y: 0 })
    setZoom(0.3)
  }

  // Función para manejar el zoom in
  const handleZoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.1, 5))
  }

  // Función para manejar el zoom out
  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.1, 0.2))
  }

  // Función para resetear la vista
  const resetView = () => {
    setZoom(0.3)
    setPanOffset({ x: 0, y: 0 })
  }

  // Eventos táctiles
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    if (e.touches.length === 1) {
      // Un dedo: iniciar dibujo
      const touch = e.touches[0]
      const canvasPoint = getCanvasCoordinates(touch.clientX, touch.clientY)
      const worldPoint = canvasToWorld(canvasPoint)

      // Añadir un pequeño offset para que el cursor no tape los números
      const offsetWorldPoint = {
        x: worldPoint.x,
        y: worldPoint.y - 30 / zoom, // Offset hacia arriba
      }

      const snappedPoint = snapToGrid ? snapPointToGrid(offsetWorldPoint) : offsetWorldPoint

      // Si es el primer punto, añadirlo directamente
      if (points.length === 0) {
        setPoints([snappedPoint])
      }

      setIsDrawing(true)
      setCurrentPoint(snappedPoint)
    } else if (e.touches.length === 2) {
      // Dos dedos: iniciar zoom/pan
      const distance = getTouchDistance(e.touches)
      const center = getTouchCenter(e.touches)
      setLastTouchDistance(distance)
      setLastTouchCenter(center)
      setIsPanning(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    if (e.touches.length === 1) {
      // Un dedo: dibujar
      const touch = e.touches[0]
      const canvasPoint = getCanvasCoordinates(touch.clientX, touch.clientY)
      const worldPoint = canvasToWorld(canvasPoint)

      // Añadir el mismo offset
      const offsetWorldPoint = {
        x: worldPoint.x,
        y: worldPoint.y - 30 / zoom,
      }

      setCurrentPoint(offsetWorldPoint)
    } else if (e.touches.length === 2 && lastTouchDistance !== null && lastTouchCenter !== null) {
      // Dos dedos: zoom/pan
      const newDistance = getTouchDistance(e.touches)
      const newCenter = getTouchCenter(e.touches)

      // Calcular el factor de zoom
      const zoomFactor = newDistance / lastTouchDistance
      let newZoom = zoom * zoomFactor
      newZoom = Math.max(0.2, Math.min(newZoom, 5))

      // Calcular el desplazamiento del pan
      const panX = newCenter.x - lastTouchCenter.x
      const panY = newCenter.y - lastTouchCenter.y

      // Actualizar el estado
      setZoom(newZoom)
      setPanOffset({
        x: panOffset.x + panX,
        y: panOffset.y + panY,
      })

      // Actualizar las distancias y centros táctiles
      setLastTouchDistance(newDistance)
      setLastTouchCenter(newCenter)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    if (e.touches.length === 0 && isDrawing) {
      // Un dedo levantado: finalizar trazo
      if (!currentPoint) return

      let snappedPoint = snapToGrid ? snapPointToGrid(currentPoint) : currentPoint

      // Aplicar imantación a líneas paralelas
      if (snapToGrid && points.length > 0) {
        const lastPoint = points[points.length - 1]
        snappedPoint = snapToParallelLines(snappedPoint, lastPoint)
      }

      // Aplicar snap de ángulo después del snap de posición y paralelas
      if (snapToGrid && points.length > 0) {
        const lastPoint = points[points.length - 1]
        snappedPoint = snapAngleToGrid(lastPoint, snappedPoint)
      }

      // Verificar si debe cerrar la figura
      if (points.length >= 3 && isCloseToStart(snappedPoint)) {
        closeFigure()
        return
      }

      // Aplicar snap final para asegurar múltiplos de snapSize (1cm)
      snappedPoint = {
        x: Math.round(snappedPoint.x / snapSize) * snapSize,
        y: Math.round(snappedPoint.y / snapSize) * snapSize,
      }

      // Añadir el nuevo punto
      setPoints((prev) => [...prev, snappedPoint])
      setIsDrawing(false)
      setCurrentPoint(null)
    } else {
      // Finalizar zoom/pan
      setIsPanning(false)
      setLastTouchDistance(null)
      setLastTouchCenter(null)
    }
  }

  useEffect(() => {
    // Detectar si es un dispositivo táctil
    setIsTouchDevice("ontouchstart" in document.documentElement)

    const canvas = canvasRef.current
    if (!canvas) return

    // Ajustar el tamaño del canvas al tamaño del contenedor
    const resizeObserver = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      drawCanvas()
    })

    resizeObserver.observe(canvas.parentNode as HTMLDivElement)

    // Dibujar en el canvas cada vez que cambian los puntos
    drawCanvas()

    return () => {
      resizeObserver.disconnect()
    }
  }, [points, isDrawing, currentPoint, isClosed, showGrid, snapToGrid, zoom, panOffset, isMousePanning])

  // Agregar este useEffect después de los otros useEffect existentes

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Manejar el evento de rueda de manera más robusta
    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // Obtener la posición del cursor para hacer zoom centrado
      const rect = canvas.getBoundingClientRect()
      const canvasPoint = {
        x: Math.round(e.clientX - rect.left),
        y: Math.round(e.clientY - rect.top),
      }

      const worldPoint = {
        x: (canvasPoint.x - panOffset.x) / zoom,
        y: (canvasPoint.y - panOffset.y) / zoom,
      }

      // Calcular el factor de zoom basado en la dirección de la rueda
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 5)

      // Calcular el nuevo offset para mantener el punto bajo el cursor
      const newPanOffset = {
        x: canvasPoint.x - worldPoint.x * newZoom,
        y: canvasPoint.y - worldPoint.y * newZoom,
      }

      setZoom(newZoom)
      setPanOffset(newPanOffset)
    }

    // Agregar el event listener con passive: false para poder usar preventDefault
    canvas.addEventListener("wheel", handleWheelEvent, { passive: false })

    return () => {
      canvas.removeEventListener("wheel", handleWheelEvent)
    }
  }, [zoom, panOffset])

  // Modificar el cursor según el estado

  // Actualizar el canvas con el nuevo cursor
  return (
    <div ref={containerRef} className="w-full max-w-4xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleUndo} disabled={points.length === 0}>
              <Undo className="mr-2 h-4 w-4" /> Deshacer
            </Button>
            <Button variant="outline" onClick={handleClear} disabled={points.length === 0}>
              <Trash2 className="mr-2 h-4 w-4" /> Limpiar
            </Button>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center space-x-2">
              <Switch id="grid-switch" checked={showGrid} onCheckedChange={setShowGrid} />
              <Label htmlFor="grid-switch" className="flex items-center">
                <Grid className="h-4 w-4 mr-1" /> Rejilla (10cm)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="snap-switch" checked={snapToGrid} onCheckedChange={setSnapToGrid} disabled={!showGrid} />
              <Label htmlFor="snap-switch" className="flex items-center">
                <Magnet className="h-4 w-4 mr-1" /> Snap (1cm)
              </Label>
            </div>
          </div>
        </div>

        <div className="relative border rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            className="w-full h-[600px]"
            style={{
              touchAction: "none",
              cursor: getCursorStyle(),
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              if (isMousePanning) {
                setIsMousePanning(false)
                setLastMousePosition(null)
              } else {
                handleMouseUp()
              }
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          {points.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">Pizarra para habitaciones grandes (hasta 10m x 10m)</div>
                <div className="text-sm">
                  {isTouchDevice
                    ? "Un dedo: dibujar | Dos dedos: zoom y mover"
                    : "Clic y arrastra: dibujar | Rueda del ratón: zoom"}
                </div>
                <div className="text-xs mt-1">Rejilla: 10cm x 10cm | Precisión: 1cm</div>
              </div>
            </div>
          )}

          {isDrawing && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white px-4 py-2 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-2xl backdrop-blur-md z-10 pointer-events-none border border-white/10 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              {points.length >= 3 ? "Acércate al punto verde para cerrar" : "Dibujando..."}
            </div>
          )}
        </div>

        {/* Controles de zoom */}
        <div className="flex justify-center gap-2 bg-white p-2 rounded-lg shadow-md">
          <Button size="sm" variant="outline" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="text-xs flex items-center px-2">{Math.round(zoom * 100)}%</div>
          <Button size="sm" variant="outline" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={resetView}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {(area !== null || perimeter !== null) && (
          <Card ref={resultsRef}>
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-green-800 mb-3">¡Figura completada!</h3>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 mb-1">Área</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {area !== null ? formatNumber(area / 10000) : "0,00"} m²
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 mb-1">Perímetro</p>
                    <p className="text-2xl font-bold text-green-600">
                      {perimeter !== null ? formatNumber(perimeter / 100) : "0,00"} m
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Las medidas se han enviado al formulario principal</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isClosed && (
          <div className="text-sm text-gray-500 mt-2">
            <p>Instrucciones para habitaciones grandes (hasta 10m x 10m):</p>
            <ul className="list-disc pl-5">
              {isTouchDevice ? (
                <>
                  <li>
                    <strong>Un dedo:</strong> Presiona y arrastra para dibujar cada línea recta
                  </li>
                  <li>
                    <strong>Dos dedos:</strong> Pellizca para hacer zoom, arrastra para mover
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <strong>Ratón:</strong> Clic y arrastra para dibujar cada línea recta
                  </li>
                  <li>
                    <strong>Zoom:</strong> Usa la rueda del ratón, trackpad o los botones de zoom
                  </li>
                </>
              )}
              <li>El punto verde marca el inicio, el azul el final de la línea actual</li>
              <li>Para cerrar la figura, acércate al punto verde mientras arrastras</li>
              <li>
                <strong>Rejilla visual:</strong> Cada cuadro grande = 10cm x 10cm
              </li>
              <li>
                <strong>Precisión de movimiento:</strong> 1cm (snap automático)
              </li>
              <li>
                <strong>Imantación inteligente:</strong> Se alinea automáticamente a líneas paralelas
              </li>
            </ul>
          </div>
        )}

        {isClosed && (
          <div className="text-sm text-gray-500 mt-2">
            <p>Figura completada:</p>
            <ul className="list-disc pl-5">
              <li>
                <strong>Mover:</strong> Clic y arrastra para mover el dibujo
              </li>
              <li>
                <strong>Zoom:</strong> Usa la rueda del ratón, trackpad o los botones de zoom
              </li>
              <li>
                <strong>Deshacer:</strong> Usa el botón "Deshacer" para reabrir la figura
              </li>
              <li>
                <strong>Limpiar:</strong> Usa el botón "Limpiar" para empezar de nuevo
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
