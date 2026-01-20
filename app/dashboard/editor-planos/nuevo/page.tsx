"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Square, Minus, Move, Trash2, Save, Sparkles, Undo, Redo, ZoomIn, ZoomOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Tool = "select" | "wall" | "door" | "window" | "room"

interface Point {
  x: number
  y: number
}

interface Wall {
  id: string
  start: Point
  end: Point
  thickness: number
}

interface Door {
  id: string
  position: Point
  width: number
  angle: number
}

interface Window {
  id: string
  position: Point
  width: number
  angle: number
}

interface Room {
  id: string
  name: string
  walls: string[]
  area: number
}

export default function NuevoPlanoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>("select")
  const [walls, setWalls] = useState<Wall[]>([])
  const [doors, setDoors] = useState<Door[]>([])
  const [windows, setWindows] = useState<Window[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [planName, setPlanName] = useState("Nuevo Plano")
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const router = useRouter()

  useEffect(() => {
    drawCanvas()
  }, [walls, doors, windows, rooms, scale, offset])

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Aplicar transformaciones
    ctx.save()
    ctx.translate(offset.x, offset.y)
    ctx.scale(scale, scale)

    // Dibujar grid
    drawGrid(ctx, canvas.width, canvas.height)

    // Dibujar paredes
    ctx.strokeStyle = "#1f2937"
    ctx.lineWidth = 3
    walls.forEach((wall) => {
      ctx.beginPath()
      ctx.moveTo(wall.start.x, wall.start.y)
      ctx.lineTo(wall.end.x, wall.end.y)
      ctx.stroke()
    })

    // Dibujar puertas
    ctx.strokeStyle = "#8b5cf6"
    ctx.lineWidth = 2
    doors.forEach((door) => {
      ctx.save()
      ctx.translate(door.position.x, door.position.y)
      ctx.rotate(door.angle)
      ctx.beginPath()
      ctx.arc(0, 0, door.width / 2, 0, Math.PI)
      ctx.stroke()
      ctx.restore()
    })

    // Dibujar ventanas
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    windows.forEach((window) => {
      ctx.save()
      ctx.translate(window.position.x, window.position.y)
      ctx.rotate(window.angle)
      ctx.strokeRect(-window.width / 2, -5, window.width, 10)
      ctx.restore()
    })

    // Dibujar habitaciones detectadas
    ctx.fillStyle = "rgba(249, 115, 22, 0.1)"
    ctx.strokeStyle = "#f97316"
    ctx.lineWidth = 1
    rooms.forEach((room) => {
      // Aquí se dibujarían las habitaciones detectadas
    })

    ctx.restore()
  }

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 0.5

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - offset.x) / scale
    const y = (e.clientY - rect.top - offset.y) / scale

    if (tool === "wall") {
      if (!isDrawing) {
        setStartPoint({ x, y })
        setIsDrawing(true)
      } else {
        if (startPoint) {
          const newWall: Wall = {
            id: Math.random().toString(36).substring(7),
            start: startPoint,
            end: { x, y },
            thickness: 0.15,
          }
          setWalls([...walls, newWall])
        }
        setIsDrawing(false)
        setStartPoint(null)
      }
    } else if (tool === "door") {
      const newDoor: Door = {
        id: Math.random().toString(36).substring(7),
        position: { x, y },
        width: 40,
        angle: 0,
      }
      setDoors([...doors, newDoor])
    } else if (tool === "window") {
      const newWindow: Window = {
        id: Math.random().toString(36).substring(7),
        position: { x, y },
        width: 60,
        angle: 0,
      }
      setWindows([...windows, newWindow])
    }
  }

  const handleDetectRooms = async () => {
    try {
      const response = await fetch("/api/editor-planos/detect-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walls, doors, windows }),
      })

      const data = await response.json()
      setRooms(data.rooms)
    } catch (error) {
      console.error("Error detecting rooms:", error)
      alert("Error al detectar habitaciones")
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch("/api/editor-planos/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: planName,
          walls,
          doors,
          windows,
          rooms,
        }),
      })

      const data = await response.json()
      router.push(`/dashboard/editor-planos/editar/${data.id}`)
    } catch (error) {
      console.error("Error saving plan:", error)
      alert("Error al guardar plano")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard/editor-planos">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <Input
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="w-64"
              placeholder="Nombre del plano"
            />
            <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700">
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Toolbar */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Herramientas</h3>
              <div className="space-y-2">
                <Button
                  variant={tool === "select" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setTool("select")}
                >
                  <Move className="h-4 w-4 mr-2" />
                  Seleccionar
                </Button>
                <Button
                  variant={tool === "wall" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setTool("wall")}
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Pared
                </Button>
                <Button
                  variant={tool === "door" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setTool("door")}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Puerta
                </Button>
                <Button
                  variant={tool === "window" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setTool("window")}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Ventana
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Acciones</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleDetectRooms}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Detectar habitaciones
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Undo className="h-4 w-4 mr-2" />
                  Deshacer
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Redo className="h-4 w-4 mr-2" />
                  Rehacer
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 bg-transparent"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar todo
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Vista</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setScale(Math.min(scale + 0.1, 3))}
                >
                  <ZoomIn className="h-4 w-4 mr-2" />
                  Acercar
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setScale(Math.max(scale - 0.1, 0.5))}
                >
                  <ZoomOut className="h-4 w-4 mr-2" />
                  Alejar
                </Button>
              </div>
            </Card>

            {rooms.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Habitaciones ({rooms.length})</h3>
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <div key={room.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="font-medium">{room.name}</div>
                      <div className="text-gray-600">{room.area.toFixed(2)} m²</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Canvas */}
          <div className="lg:col-span-3">
            <Card className="p-4">
              <canvas
                ref={canvasRef}
                width={1000}
                height={700}
                className="border border-gray-300 rounded-lg cursor-crosshair bg-white"
                onClick={handleCanvasClick}
              />
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <div>
                  Herramienta activa: <span className="font-semibold">{tool}</span>
                </div>
                <div>
                  Zoom: <span className="font-semibold">{(scale * 100).toFixed(0)}%</span>
                </div>
                <div>
                  Elementos: <span className="font-semibold">{walls.length + doors.length + windows.length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
