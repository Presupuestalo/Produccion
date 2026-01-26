"use client"
import React from "react"
import { Stage, Layer, Group, Line, Rect, Text, Circle } from "react-konva"
import { Grid } from "./Grid"
import { Scissors, Plus, Pencil, Trash2, X } from "lucide-react"

interface Point { x: number; y: number }
interface Wall { id: string; start: Point; end: Point; thickness: number }

interface Room { id: string; name: string; polygon: Point[]; area: number; color: string; visualCenter?: Point }

interface CanvasEngineProps {
    width: number
    height: number
    zoom: number
    offset: { x: number; y: number }
    walls: Wall[]
    rooms: Room[]
    doors: any[]
    windows: any[]
    currentWall: { start: Point; end: Point } | null
    activeTool: string
    hoveredWallId: string | null
    onPan: (x: number, y: number) => void
    onZoom: (newZoom: number) => void
    onMouseDown: (point: Point) => void
    onMouseMove: (point: Point) => void
    onMouseUp: (point: Point) => void
    onHoverWall: (id: string | null) => void
    onSelectWall: (id: string | null) => void
    onDragWall: (id: string, delta: { x: number; y: number }) => void
    onDragVertex: (originalPoint: Point, delta: Point) => void
    onDragEnd: () => void
    onUpdateWallLength: (id: string, length: number, side: "left" | "right") => void
    onDeleteWall: (id: string) => void
    onSplitWall?: (id: string) => void
    onUpdateWallThickness: (id: string, thickness: number) => void
    onUpdateRoom: (id: string, updates: Partial<Room>) => void
    selectedWallId: string | null
    selectedRoomId: string | null
    onSelectRoom: (id: string | null) => void
}

export const CanvasEngine: React.FC<CanvasEngineProps> = ({
    width,
    height,
    zoom,
    offset,
    walls,
    rooms,
    doors,
    windows,
    currentWall,
    activeTool,
    hoveredWallId,
    onPan,
    onZoom,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onHoverWall,
    onSelectWall,
    onDragWall,
    onDragEnd,
    onUpdateWallLength,
    onDeleteWall,
    onSplitWall,
    onUpdateWallThickness,
    onUpdateRoom,
    selectedWallId,
    selectedRoomId,
    onSelectRoom,
    onDragVertex,
}) => {
    const [mousePos, setMousePos] = React.useState<Point | null>(null)
    const [alignmentGuides, setAlignmentGuides] = React.useState<{ x?: number, y?: number } | null>(null)
    const [editMode, setEditMode] = React.useState<"menu" | "length" | "thickness" | "room" | null>(null)
    const [editLength, setEditLength] = React.useState<string>("")
    const [editThickness, setEditThickness] = React.useState<string>("")
    const [editFace, setEditFace] = React.useState<"center" | "interior" | "exterior">("center")
    const dragStartPos = React.useRef<Point | null>(null)
    const lastPointerPos = React.useRef<Point | null>(null) // Para el panning
    const isPanning = React.useRef(false)
    const [menuDragOffset, setMenuDragOffset] = React.useState<Point>({ x: 0, y: 0 })
    const [isDraggingMenuState, setIsDraggingMenuState] = React.useState(false) // State version for Effect
    const menuDragStart = React.useRef<Point | null>(null)
    const cellSize = 100 // 1 metro = 100 píxeles (1px = 1cm)

    // Global listeners for menu dragging to prevent "getting stuck"
    React.useEffect(() => {
        if (!isDraggingMenuState) return

        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (menuDragStart.current) {
                setMenuDragOffset({
                    x: e.clientX - menuDragStart.current.x,
                    y: e.clientY - menuDragStart.current.y
                })
            }
        }

        const handleGlobalMouseUp = () => {
            setIsDraggingMenuState(false)
            menuDragStart.current = null
        }

        window.addEventListener('mousemove', handleGlobalMouseMove)
        window.addEventListener('mouseup', handleGlobalMouseUp)
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove)
            window.removeEventListener('mouseup', handleGlobalMouseUp)
        }
    }, [isDraggingMenuState])

    const selectedWall = walls.find(w => w.id === selectedWallId)
    const selectedRoom = rooms.find(r => r.id === selectedRoomId)

    const roomTypes = [
        "Salón", "Cocina", "Dormitorio", "Baño", "Pasillo", "Terraza", "Lavadero", "Entrada"
    ]

    React.useEffect(() => {
        if (selectedWallId) {
            const wall = walls.find(w => w.id === selectedWallId)
            if (wall) {
                const dx = wall.end.x - wall.start.x
                const dy = wall.end.y - wall.start.y
                setEditLength(Math.round(Math.sqrt(dx * dx + dy * dy)).toString())
                setEditThickness(wall.thickness.toString())
                if (!editMode) setEditMode("menu")
            }
        } else if (selectedRoomId) {
            if (!editMode) setEditMode("menu")
        } else {
            setEditMode(null)
            setMenuDragOffset({ x: 0, y: 0 }) // Reset offset when menu closes/changes
        }
    }, [selectedWallId, selectedRoomId, walls])

    const uiPos = selectedWall ? {
        x: ((selectedWall.start.x + selectedWall.end.x) / 2 * zoom) + offset.x,
        y: ((selectedWall.start.y + selectedWall.end.y) / 2 * zoom) + offset.y
    } : null

    const findNearestVertex = (point: Point, threshold: number = 12): Point | null => {
        let nearest: Point | null = null
        let minDist = threshold

        // Coleccionar todos los puntos potenciales (extremos de muros y esquinas de recintos)
        const candidates: Point[] = []
        walls.forEach((w: Wall) => {
            candidates.push(w.start)
            candidates.push(w.end)
        })
        rooms.forEach((r: Room) => {
            r.polygon.forEach((p: Point) => candidates.push(p))
        })

        // Buscar el más cercano con distancia euclidiana
        candidates.forEach(p => {
            const d = Math.sqrt(Math.pow(point.x - p.x, 2) + Math.pow(point.y - p.y, 2))
            if (d < minDist) {
                minDist = d
                nearest = p
            }
        })

        return nearest
    }

    const projectPointOnSegment = (p: Point, a: Point, b: Point): Point => {
        const l2 = Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2)
        if (l2 === 0) return a
        let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2
        t = Math.max(0, Math.min(1, t))
        return {
            x: a.x + t * (b.x - a.x),
            y: a.y + t * (b.y - a.y)
        }
    }

    const getRelativePointerPosition = (stage: any) => {
        const pointer = stage.getPointerPosition()
        if (!pointer) return { x: 0, y: 0 }

        // Transformar coordenada de pantalla a coordenada del mundo
        const rawX = (pointer.x - offset.x) / zoom
        const rawY = (pointer.y - offset.y) / zoom

        let point = { x: rawX, y: rawY }
        setAlignmentGuides(null)

        // 1. Snapping a vértices exactos (prioridad máxima pero umbral reducido)
        const vertexThreshold = 12 / zoom
        const vertex = findNearestVertex(point, vertexThreshold)
        if (vertex) return vertex

        // 2. BLOQUEO ORTOGONAL (Predominancia de líneas rectas)
        if (activeTool === "wall" && currentWall) {
            const start = currentWall.start
            const dx = Math.abs(point.x - start.x)
            const dy = Math.abs(point.y - start.y)
            const lockThreshold = 30 / zoom
            const alignThreshold = 12 / zoom

            // Coleccionar candidatos para alineación
            const candidates: Point[] = []
            walls.forEach((w: Wall) => { candidates.push(w.start); candidates.push(w.end) })
            rooms.forEach((r: Room) => r.polygon.forEach((p: Point) => candidates.push(p)))

            if (dy < lockThreshold) {
                // Forzar Horizontal
                point.y = start.y

                // Buscar si hay algún vértice con el que alinear en X
                let snappedX: number | null = null
                candidates.forEach(p => {
                    if (Math.abs(point.x - p.x) < alignThreshold) snappedX = p.x
                })

                if (snappedX !== null) {
                    point.x = snappedX
                    setAlignmentGuides({ x: snappedX, y: start.y })
                }
                return point
            } else if (dx < lockThreshold) {
                // Forzar Vertical
                point.x = start.x

                // Buscar si hay algún vértice con el que alinear en Y
                let snappedY: number | null = null
                candidates.forEach(p => {
                    if (Math.abs(point.y - p.y) < alignThreshold) snappedY = p.y
                })

                if (snappedY !== null) {
                    point.y = snappedY
                    setAlignmentGuides({ x: start.x, y: snappedY })
                }
                return point
            }
        }

        // 3. FALLBACKS y GUÍAS GENERALES
        const edgeThreshold = 15 / zoom
        let nearestEdgePoint: Point | null = null
        let minEdgeDist = edgeThreshold
        walls.forEach((w: Wall) => {
            const projected = projectPointOnSegment(point, w.start, w.end)
            const d = Math.sqrt(Math.pow(point.x - projected.x, 2) + Math.pow(point.y - projected.y, 2))
            if (d < minEdgeDist) {
                minEdgeDist = d
                nearestEdgePoint = projected
            }
        })
        if (nearestEdgePoint) return nearestEdgePoint

        const alignThreshold = 12 / zoom
        const candidates: Point[] = []
        walls.forEach((w: Wall) => { candidates.push(w.start); candidates.push(w.end) })
        rooms.forEach((r: Room) => r.polygon.forEach((p: Point) => candidates.push(p)))

        let snappedX: number | null = null
        let snappedY: number | null = null
        candidates.forEach((p: Point) => {
            if (Math.abs(point.x - p.x) < alignThreshold) snappedX = p.x
            if (Math.abs(point.y - p.y) < alignThreshold) snappedY = p.y
        })

        if (snappedX !== null || snappedY !== null) {
            setAlignmentGuides({ x: snappedX ?? undefined, y: snappedY ?? undefined })
            if (snappedX !== null) point.x = snappedX
            if (snappedY !== null) point.y = snappedY
            return point
        }

        // Grid snap (1px = 1cm)
        return {
            x: Math.round(point.x),
            y: Math.round(point.y)
        }
    }

    const renderWallMeasurement = (wall: Wall, offsetVal: number, color: string = "#64748b", isInteractive: boolean = false) => {
        const dx = wall.end.x - wall.start.x
        const dy = wall.end.y - wall.start.y
        const centerLength = Math.sqrt(dx * dx + dy * dy)

        if (centerLength < 5) return null // Ignorar segmentos invisibles

        // Ocultar etiquetas automáticas para segmentos pequeños (ruido visual)
        if (selectedWallId !== wall.id && !dragStartPos.current && centerLength < 30) return null

        const isSamePoint = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < 1.0

        const nx = -dy / centerLength
        const ny = dx / centerLength

        // La normal hacia la cara que estamos midiendo
        const faceNormal = { x: nx * Math.sign(offsetVal), y: ny * Math.sign(offsetVal) }

        const getFaceOffsetAt = (point: Point, fn: Point) => {
            const neighbors = walls.filter(w => w.id !== wall.id && (isSamePoint(w.start, point) || isSamePoint(w.end, point)))

            // 1. Standalone wall / Free end (measures to structural boundary)
            if (neighbors.length === 0) return wall.thickness / 2

            // 2. Wall continuation (stays on same line)
            const isContinuation = neighbors.some(nw => {
                const isNWVertical = Math.abs(nw.start.x - nw.end.x) < 1
                const isWVertical = Math.abs(wall.start.x - wall.end.x) < 1
                return isNWVertical === isWVertical && !isConnectedPerpendicular(wall, nw)
            })
            if (isContinuation) return 0

            const perp = neighbors.filter(nw => isConnectedPerpendicular(wall, nw))

            // 3. Corner/T-junction blocking detection
            const blocksFace = perp.some(nw => {
                const otherP = isSamePoint(nw.start, point) ? nw.end : nw.start
                const dir = { x: otherP.x - point.x, y: otherP.y - point.y }
                return (dir.x * fn.x + dir.y * fn.y) > 5
            })

            if (blocksFace) {
                // Inner Corner / T-junction blocked side: Retreat to clear space
                const maxT = perp.length > 0 ? Math.max(...perp.map(n => n.thickness)) : wall.thickness
                return offsetVal < 0 ? -maxT / 2 : 0
            } else {
                // Outer Corner / Joint cap: User says it "stops" if there's a wall
                return 0
            }
        }

        const offStart = getFaceOffsetAt(wall.start, faceNormal)
        const offEnd = getFaceOffsetAt(wall.end, faceNormal)

        const length = Math.round(centerLength + offStart + offEnd)
        const faceType = offsetVal > 0 ? "exterior" : "interior"

        const midX = (wall.start.x + wall.end.x) / 2
        const midY = (wall.start.y + wall.end.y) / 2

        const labelX = midX + nx * offsetVal
        const labelY = midY + ny * offsetVal

        return (
            <Group>
                <Line
                    points={[
                        wall.start.x + nx * (offsetVal * 0.7), wall.start.y + ny * (offsetVal * 0.7),
                        wall.end.x + nx * (offsetVal * 0.7), wall.end.y + ny * (offsetVal * 0.7)
                    ]}
                    stroke={color}
                    strokeWidth={0.5 / zoom}
                    opacity={0.4}
                />
                <Group
                    onClick={(e) => {
                        if (isInteractive) {
                            e.cancelBubble = true
                            setEditFace(faceType)
                            setEditLength(length.toString())
                            setEditMode("length")
                        }
                    }}
                    onTap={(e) => {
                        if (isInteractive) {
                            e.cancelBubble = true
                            setEditFace(faceType)
                            setEditLength(length.toString())
                            setEditMode("length")
                        }
                    }}
                >
                    <Rect
                        x={labelX - 25 / zoom}
                        y={labelY - 15 / zoom}
                        width={50 / zoom}
                        height={20 / zoom}
                        fill="white"
                        stroke={isInteractive && editMode === "length" && editFace === faceType ? "#0ea5e9" : "#e2e8f0"}
                        strokeWidth={isInteractive ? 1 / zoom : 0}
                        cornerRadius={4 / zoom}
                        opacity={isInteractive ? 1 : 0}
                    />
                    <Text
                        x={labelX}
                        y={labelY - 5 / zoom}
                        text={`${length} cm`}
                        fontSize={10 / zoom}
                        fill={isInteractive && editMode === "length" && editFace === faceType ? "#0ea5e9" : color}
                        align="center"
                        offsetX={20 / zoom}
                        fontStyle={isInteractive ? "bold" : "normal"}
                    />
                </Group>
            </Group>
        )
    }

    const isConnectedPerpendicular = (w1: Wall, w2: Wall) => {
        const isW1Horizontal = Math.abs(w1.start.y - w1.end.y) < 1
        const isW1Vertical = Math.abs(w1.start.x - w1.end.x) < 1
        const isW2Horizontal = Math.abs(w2.start.y - w2.end.y) < 1
        const isW2Vertical = Math.abs(w2.start.x - w2.end.x) < 1

        const TOL = 1.0
        const isSame = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL

        const shareVertex = isSame(w1.start, w2.start) || isSame(w1.start, w2.end) ||
            isSame(w1.end, w2.start) || isSame(w1.end, w2.end)

        if (!shareVertex) return false

        return (isW1Horizontal && isW2Vertical) || (isW1Vertical && isW2Horizontal)
    }

    const handleStageMouseDown = (e: any) => {
        const stage = e.target?.getStage?.()
        if (!stage) return
        const isRightClick = e.evt.button === 2
        const isMiddleClick = e.evt.button === 1
        const isBackground = e.target === stage

        if (isRightClick || isMiddleClick || (activeTool === "select" && isBackground)) {
            if (isBackground) {
                onSelectWall(null)
                onSelectRoom(null)
            }
            isPanning.current = true
            lastPointerPos.current = stage.getPointerPosition()
            return
        }

        // Solo dibujar con click izquierdo y herramienta correcta que inicie acción al pulsar
        if (e.evt.button !== 0) return

        // Click fuera de cualquier objeto detectable (Stage directamente)
        if (e.target === stage) {
            onSelectWall(null)
            onSelectRoom(null)
        }

        if (activeTool !== "wall" && activeTool !== "door" && activeTool !== "window") return

        const pos = getRelativePointerPosition(stage)
        onMouseDown(pos)
    }

    const handleStageMouseMove = (e: any) => {
        const stage = e.target?.getStage?.()
        if (!stage) return
        const pointer = stage.getPointerPosition()

        if (isPanning.current && pointer && lastPointerPos.current) {
            const dx = pointer.x - lastPointerPos.current.x
            const dy = pointer.y - lastPointerPos.current.y
            onPan(offset.x + dx, offset.y + dy)
            lastPointerPos.current = pointer
            return
        }

        const pos = getRelativePointerPosition(stage)
        setMousePos(pos)
        if (activeTool === "wall" && currentWall) {
            onMouseMove(pos)
        }
    }

    const handleStageMouseUp = (e: any) => {
        if (isPanning.current) {
            isPanning.current = false
            return
        }

        if (activeTool === "wall" && currentWall) {
            const stage = e.target?.getStage?.()
            if (!stage) return
            const pos = getRelativePointerPosition(stage)
            onMouseUp(pos)
        }
    }

    const handleMouseLeave = () => {
        isPanning.current = false
        setMousePos(null)
        setAlignmentGuides(null)
    }
    const handleWheel = (e: any) => {
        e.evt.preventDefault()
        const scaleBy = 1.1
        const stage = e.target.getStage()
        const oldScale = zoom
        const pointer = stage.getPointerPosition()

        const mousePointTo = {
            x: (pointer.x - offset.x) / oldScale,
            y: (pointer.y - offset.y) / oldScale,
        }

        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy

        // Limitar zoom
        if (newScale < 0.1 || newScale > 20) return

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        }

        onZoom(newScale)
        onPan(newPos.x, newPos.y)
    }

    const handleDragEnd = (e: any) => {
        onPan(e.target.x(), e.target.y())
    }

    return (
        <div className="w-full h-full bg-slate-50 overflow-hidden">
            <Stage
                width={width}
                height={height}
                scaleX={1}
                scaleY={1}
                draggable={false}
                onWheel={handleWheel}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleStageMouseUp}
                onMouseLeave={handleMouseLeave}
                onContextMenu={(e: any) => e.evt.preventDefault()}
                style={{ cursor: activeTool === "wall" ? 'crosshair' : 'default' }}
            >
                <Layer>
                    <Grid
                        width={width}
                        height={height}
                        cellSize={cellSize}
                        zoom={zoom}
                        offsetX={offset.x}
                        offsetY={offset.y}
                    />
                    <Group x={offset.x} y={offset.y} scaleX={zoom} scaleY={zoom}>
                        {/* Renderizar habitaciones detectadas */}
                        {rooms.map((room: Room) => {
                            const points = room.polygon.flatMap((p: Point) => [p.x, p.y])
                            const centroid = {
                                x: room.polygon.reduce((sum: number, p: Point) => sum + p.x, 0) / room.polygon.length,
                                y: room.polygon.reduce((sum: number, p: Point) => sum + p.y, 0) / room.polygon.length
                            }
                            const labelPos = room.visualCenter || centroid

                            return (
                                <Group key={room.id}>
                                    <Line
                                        points={points}
                                        fill={selectedRoomId === room.id ? room.color + "60" : room.color + "40"}
                                        stroke={selectedRoomId === room.id ? room.color : "transparent"}
                                        strokeWidth={2}
                                        closed={true}
                                        onClick={() => onSelectRoom(room.id)}
                                        onTap={() => onSelectRoom(room.id)}
                                    />
                                    <Group
                                        x={labelPos.x} y={labelPos.y}
                                        onClick={() => onSelectRoom(room.id)}
                                        onTap={() => onSelectRoom(room.id)}
                                    >
                                        <Text
                                            y={-10}
                                            text={room.name}
                                            fontSize={12}
                                            fill="#1e293b"
                                            fontStyle="bold"
                                            align="center"
                                            offsetX={30}
                                        />
                                        <Text
                                            y={5}
                                            text={`${room.area.toFixed(2)} m²`}
                                            fontSize={10}
                                            fill="#64748b"
                                            align="center"
                                            offsetX={30}
                                        />
                                    </Group>
                                </Group>
                            )
                        })}

                        {/* Renderizar muros guardados */}
                        {walls.map((wall: Wall) => {
                            const isHovered = hoveredWallId === wall.id
                            const isSelected = selectedWallId === wall.id
                            const isHorizontal = Math.abs(wall.start.y - wall.end.y) < 1
                            const isVertical = Math.abs(wall.start.x - wall.end.x) < 1

                            return (
                                <Group key={wall.id}>
                                    <Line
                                        points={[wall.start.x, wall.start.y, wall.end.x, wall.end.y]}
                                        stroke={isSelected ? "#0ea5e9" : (isHovered ? "#ef4444" : "#334155")}
                                        strokeWidth={wall.thickness}
                                        hitStrokeWidth={30}
                                        lineCap="round"
                                        lineJoin="round"
                                        draggable={activeTool === "select"}
                                        onDragStart={(e) => {
                                            const stage = e.target.getStage()
                                            const pointer = stage?.getPointerPosition()
                                            if (stage && pointer) {
                                                dragStartPos.current = {
                                                    x: (pointer.x - offset.x) / zoom,
                                                    y: (pointer.y - offset.y) / zoom
                                                }
                                            }
                                            // Asegurar que la pared esté seleccionada al arrastrar
                                            if (selectedWallId !== wall.id) {
                                                onSelectWall(wall.id)
                                                const room = rooms.find(r =>
                                                    r.polygon.some((p, i) => {
                                                        const next = r.polygon[(i + 1) % r.polygon.length]
                                                        const TOL = 3.0
                                                        const isShared = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL
                                                        return (isShared(p, wall.start) && isShared(next, wall.end)) ||
                                                            (isShared(p, wall.end) && isShared(next, wall.start))
                                                    })
                                                )
                                                if (room) onSelectRoom(room.id)
                                            }
                                        }}
                                        onClick={() => {
                                            if (activeTool === "select") {
                                                onSelectWall(wall.id)
                                                const room = rooms.find(r =>
                                                    r.polygon.some((p, i) => {
                                                        const next = r.polygon[(i + 1) % r.polygon.length]
                                                        const TOL = 3.0
                                                        const isShared = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL
                                                        return (isShared(p, wall.start) && isShared(next, wall.end)) ||
                                                            (isShared(p, wall.end) && isShared(next, wall.start))
                                                    })
                                                )
                                                if (room) onSelectRoom(room.id)
                                            }
                                        }}
                                        onMouseDown={(e) => {
                                            // No llamamos a stopPropagation para permitir el drag
                                            // Pero seleccionamos para feedback inmediato
                                            if (activeTool === "select") {
                                                onSelectWall(wall.id)
                                            }
                                        }}
                                        onMouseEnter={() => activeTool === "erase" && onHoverWall(wall.id)}
                                        onMouseLeave={() => activeTool === "erase" && onHoverWall(null)}
                                        onDragMove={(e) => {
                                            const stage = e.target.getStage()
                                            const pointer = stage?.getPointerPosition()
                                            if (!dragStartPos.current || !stage || !pointer) return

                                            const currentPos = {
                                                x: (pointer.x - offset.x) / zoom,
                                                y: (pointer.y - offset.y) / zoom
                                            }

                                            // Delta acumulado desde el inicio del drag
                                            let delta = {
                                                x: Math.round(currentPos.x - dragStartPos.current.x),
                                                y: Math.round(currentPos.y - dragStartPos.current.y)
                                            }

                                            if (isHorizontal) delta.x = 0
                                            else if (isVertical) delta.y = 0

                                            if (delta.x !== 0 || delta.y !== 0) {
                                                onDragWall(wall.id, delta)
                                                // Una vez aplicado el delta, el wall en el estado cambia.
                                                // Resetear el punto de inicio para que el siguiente movimiento sea incremental
                                                // y evitar el efecto "doble" si el estado tarda en actualizar.
                                                dragStartPos.current.x += delta.x
                                                dragStartPos.current.y += delta.y
                                            }

                                            // Resetear posición visual de Konva para que no se desplace el objeto
                                            e.target.position({ x: 0, y: 0 })
                                        }}
                                        onDragEnd={() => {
                                            dragStartPos.current = null
                                            onDragEnd()
                                        }}
                                    />
                                    {/* Medidas duales para pared seleccionada */}
                                    {isSelected && (
                                        <>
                                            {renderWallMeasurement(wall, 25 / zoom, "#0ea5e9", true)}
                                            {renderWallMeasurement(wall, -25 / zoom, "#0ea5e9", true)}
                                        </>
                                    )}
                                    {/* Medida durante el arrastre (si no está seleccionada por algún motivo) */}
                                    {dragStartPos.current && isHovered && !isSelected && renderWallMeasurement(wall, 25 / zoom)}

                                    {/* TIRADORES DE VERTICES (Solo si está seleccionada) */}
                                    {isSelected && onDragVertex && (
                                        <>
                                            {[wall.start, wall.end].map((p, i) => (
                                                <Circle
                                                    key={`handle-${wall.id}-${i}`}
                                                    x={p.x}
                                                    y={p.y}
                                                    radius={6 / zoom}
                                                    fill="#0ea5e9"
                                                    stroke="white"
                                                    strokeWidth={2 / zoom}
                                                    draggable
                                                    onDragStart={() => {
                                                        dragStartPos.current = { ...p }
                                                    }}
                                                    onDragMove={(e) => {
                                                        const stage = e.target.getStage()
                                                        const pointer = stage?.getPointerPosition()
                                                        if (!dragStartPos.current || !pointer) return

                                                        const currentPos = {
                                                            x: (pointer.x - offset.x) / zoom,
                                                            y: (pointer.y - offset.y) / zoom
                                                        }

                                                        const delta = {
                                                            x: Math.round(currentPos.x - dragStartPos.current.x),
                                                            y: Math.round(currentPos.y - dragStartPos.current.y)
                                                        }

                                                        if (delta.x !== 0 || delta.y !== 0) {
                                                            onDragVertex(p, delta)
                                                            dragStartPos.current.x += delta.x
                                                            dragStartPos.current.y += delta.y
                                                        }
                                                        e.target.position({ x: 0, y: 0 })
                                                    }}
                                                    onDragEnd={() => {
                                                        dragStartPos.current = null
                                                        onDragEnd()
                                                    }}
                                                    onMouseEnter={(e: any) => {
                                                        const container = e.target.getStage().container()
                                                        container.style.cursor = "nwse-resize"
                                                    }}
                                                    onMouseLeave={(e: any) => {
                                                        const container = e.target.getStage().container()
                                                        container.style.cursor = "default"
                                                    }}
                                                />
                                            ))}
                                        </>
                                    )}

                                    {/* MEDIDAS PERPENDICULARES DINÁMICAS */}
                                    {(isSelected || dragStartPos.current) && (
                                        walls.filter(otherW => isConnectedPerpendicular(wall, otherW)).map(perpWall => (
                                            <React.Fragment key={`perp-${perpWall.id}`}>
                                                {renderWallMeasurement(perpWall, 25 / zoom, "#0284c7")}
                                            </React.Fragment>
                                        ))
                                    )}
                                </Group>
                            )
                        })}

                        {/* Renderizar puertas */}
                        {doors.map((door: any) => (
                            <Group key={door.id} x={door.position.x} y={door.position.y} rotation={door.angle}>
                                <Line
                                    points={[0, 0, door.width, 0]}
                                    stroke="#8b5cf6"
                                    strokeWidth={4}
                                />
                                <Line
                                    points={[0, 0, 0, -door.width]}
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    dash={[2, 2]}
                                />
                                <Line
                                    points={[0, -door.width, door.width, 0]}
                                    stroke="#8b5cf6"
                                    strokeWidth={1}
                                    dash={[4, 4]}
                                />
                            </Group>
                        ))}

                        {/* Renderizar ventanas */}
                        {windows.map((window: any) => (
                            <Group key={window.id} x={window.position.x} y={window.position.y} rotation={window.angle}>
                                <Rect
                                    x={0}
                                    y={-5}
                                    width={window.width}
                                    height={10}
                                    fill="#3b82f640"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                />
                                <Line
                                    points={[0, 0, window.width, 0]}
                                    stroke="#3b82f6"
                                    strokeWidth={1}
                                />
                            </Group>
                        ))}

                        {/* Renderizar muro actual (fantasma) con medida */}
                        {currentWall && (() => {
                            const dx = currentWall.end.x - currentWall.start.x
                            const dy = currentWall.end.y - currentWall.start.y
                            const lengthPx = Math.sqrt(dx * dx + dy * dy)
                            const lengthCm = Math.round(lengthPx)

                            const isVertical = Math.abs(currentWall.end.x - currentWall.start.x) < 0.1
                            const isHorizontal = Math.abs(currentWall.end.y - currentWall.start.y) < 0.1

                            return (
                                <Group>
                                    {/* Guías de alineación */}
                                    {isVertical && (
                                        <Line
                                            points={[currentWall.start.x, -5000, currentWall.start.x, 5000]}
                                            stroke="#0284c7"
                                            strokeWidth={1 / zoom}
                                            dash={[10, 10]}
                                            opacity={0.3}
                                        />
                                    )}
                                    {isHorizontal && (
                                        <Line
                                            points={[-5000, currentWall.start.y, 5000, currentWall.start.y]}
                                            stroke="#0284c7"
                                            strokeWidth={1 / zoom}
                                            dash={[10, 10]}
                                            opacity={0.3}
                                        />
                                    )}
                                    <Line
                                        points={[currentWall.start.x, currentWall.start.y, currentWall.end.x, currentWall.end.y]}
                                        stroke="#0284c7"
                                        strokeWidth={15}
                                        opacity={0.8}
                                        lineCap="round"
                                        lineJoin="round"
                                    />
                                    <Text
                                        x={(currentWall.start.x + currentWall.end.x) / 2}
                                        y={(currentWall.start.y + currentWall.end.y) / 2 - 20}
                                        text={`${lengthCm} cm`}
                                        fontSize={14}
                                        fill="#0284c7"
                                        fontStyle="bold"
                                        align="center"
                                    />
                                </Group>
                            )
                        })()}

                        {/* Guías inteligentes de alineación */}
                        {alignmentGuides && mousePos && (
                            <Group>
                                {alignmentGuides.x !== undefined && (
                                    <Line
                                        points={[alignmentGuides.x, -5000, alignmentGuides.x, 5000]}
                                        stroke="#0284c7"
                                        strokeWidth={1 / zoom}
                                        dash={[5, 5]}
                                        opacity={0.4}
                                    />
                                )}
                                {alignmentGuides.y !== undefined && (
                                    <Line
                                        points={[-5000, alignmentGuides.y, 5000, alignmentGuides.y]}
                                        stroke="#0284c7"
                                        strokeWidth={1 / zoom}
                                        dash={[5, 5]}
                                        opacity={0.4}
                                    />
                                )}
                            </Group>
                        )}

                        {/* Indicador visual de Snapping */}
                        {(() => {
                            if (!mousePos || activeTool !== "wall") return null

                            // Verificar si el punto actual está "snappeado" a un vértice
                            const vertexThreshold = 12 / zoom
                            const vertex = findNearestVertex(mousePos, vertexThreshold)

                            if (vertex) {
                                return (
                                    <Circle
                                        x={vertex.x}
                                        y={vertex.y}
                                        radius={8 / zoom}
                                        stroke="#0284c7"
                                        strokeWidth={2 / zoom}
                                        fill="white"
                                        opacity={0.8}
                                    />
                                )
                            }
                            return null
                        })()}
                    </Group>
                </Layer>
            </Stage>

            {((selectedWall && uiPos) || (selectedRoom)) && editMode && (
                <div
                    onMouseDown={(e) => {
                        e.stopPropagation()
                        setIsDraggingMenuState(true)
                        menuDragStart.current = { x: e.clientX - menuDragOffset.x, y: e.clientY - menuDragOffset.y }
                    }}
                    className="flex flex-col"
                    style={{
                        position: 'absolute',
                        left: (selectedRoom ? (calculatePolygonCentroid(selectedRoom.polygon).x * zoom + offset.x) : uiPos?.x || 0) + menuDragOffset.x,
                        top: (selectedRoom ? (calculatePolygonCentroid(selectedRoom.polygon).y * zoom + offset.y - 40) : (uiPos ? uiPos.y - 100 : 0)) + menuDragOffset.y,
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(12px)',
                        padding: '4px',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
                        zIndex: 1000,
                        pointerEvents: 'auto',
                        cursor: isDraggingMenuState ? 'grabbing' : 'grab',
                        animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        minWidth: '120px'
                    }}
                >
                    {/* Drag Handle Bar */}
                    <div className="w-full h-1.5 flex justify-center items-center mb-1 group cursor-grab">
                        <div className="w-8 h-1 bg-slate-200 rounded-full group-hover:bg-slate-300 transition-colors" />
                    </div>

                    <div className="flex items-center gap-1">
                        {editMode === "menu" ? (
                            <>
                                {selectedWall && (
                                    <>
                                        <MenuButton
                                            icon={<Scissors className="h-3.5 w-3.5" />}
                                            label="Split"
                                            onClick={() => onSplitWall?.(selectedWall.id)}
                                        />
                                    </>
                                )}
                                <MenuButton
                                    icon={<Pencil className="h-3.5 w-3.5" />}
                                    label="Editar"
                                    onClick={() => setEditMode(selectedWall ? "thickness" : "room")}
                                />
                                <div className="w-px h-6 bg-slate-100 mx-1" />
                                {selectedWall && (
                                    <MenuButton
                                        icon={<Trash2 className="h-3.5 w-3.5" />}
                                        label="Delete"
                                        onClick={() => onDeleteWall(selectedWall.id)}
                                        variant="danger"
                                    />
                                )}
                                <button
                                    onClick={() => {
                                        onSelectWall(null)
                                        onSelectRoom(null)
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="p-1 px-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </>
                        ) : editMode === "room" ? (
                            <div className="flex flex-col gap-2 p-2 min-w-[150px]">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tipo de Habitación</span>
                                    <button onClick={() => setEditMode("menu")} className="text-slate-400 hover:text-slate-600">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                    {roomTypes.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                if (selectedRoomId) {
                                                    // Extraer el número actual si existe (ej. "Habitación 1" -> "1")
                                                    const currentMatch = selectedRoom?.name.match(/\d+$/)
                                                    const roomNumber = currentMatch ? currentMatch[0] : (rooms.indexOf(selectedRoom!) + 1)

                                                    onUpdateRoom(selectedRoomId, {
                                                        name: `${type} ${roomNumber}`
                                                    })
                                                    setEditMode(null)
                                                    onSelectRoom(null)
                                                }
                                            }}
                                            className="text-[11px] px-2 py-1.5 bg-slate-50 hover:bg-sky-50 hover:text-sky-600 rounded-md text-left transition-colors"
                                        >
                                            {type}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setEditMode("menu")}
                                        className="text-[11px] font-medium text-sky-600 hover:text-sky-700 underline"
                                    >
                                        Volver al menú
                                    </button>
                                </div>
                            </div>
                        ) : editMode === "thickness" ? (
                            <div className="flex items-center gap-3 px-3 py-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Grosor pared</span>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        autoFocus
                                        value={editThickness}
                                        onChange={(e) => setEditThickness(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                onUpdateWallThickness(selectedWallId!, parseInt(editThickness))
                                                setEditMode("menu")
                                            }
                                            if (e.key === 'Escape') setEditMode("menu")
                                        }}
                                        className="w-14 p-1.5 border-2 border-slate-200 rounded-lg text-center text-sm font-bold text-slate-800 focus:border-sky-500 focus:outline-none transition-colors"
                                    />
                                    <span className="text-[10px] font-semibold text-slate-400">cm</span>
                                </div>
                                <button
                                    onClick={() => {
                                        onUpdateWallThickness(selectedWallId!, parseInt(editThickness))
                                        setEditMode("menu")
                                    }}
                                    className="px-2 py-1.5 bg-sky-500 text-white rounded-lg text-[10px] font-bold hover:bg-sky-600 transition-colors"
                                >
                                    OK
                                </button>
                                <button
                                    onClick={() => setEditMode("menu")}
                                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : (selectedWall && (
                            <div className="flex flex-col items-center gap-1 min-w-[160px]">
                                <div className="flex items-center justify-between w-full px-2 mb-1">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Cota {editFace}</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => setEditFace("interior")} className={`w-3 h-3 rounded-full border ${editFace === 'interior' ? 'bg-sky-500 border-sky-600' : 'bg-slate-200 border-slate-300'}`} title="Cara Interior" />
                                        <button onClick={() => setEditFace("center")} className={`w-3 h-3 rounded-full border ${editFace === 'center' ? 'bg-slate-400 border-slate-500' : 'bg-slate-200 border-slate-300'}`} title="Eje Central" />
                                        <button onClick={() => setEditFace("exterior")} className={`w-3 h-3 rounded-full border ${editFace === 'exterior' ? 'bg-amber-500 border-amber-600' : 'bg-slate-200 border-slate-300'}`} title="Cara Exterior" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-2 py-1">
                                    <button
                                        onClick={() => {
                                            // Al actualizar longitud, convertimos el valor de la cara a longitud de centro
                                            const targetLen = parseInt(editLength)
                                            if (isNaN(targetLen)) return

                                            let centerAdj = 0
                                            if (editFace !== "center") {
                                                const isSameP = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < 1.0
                                                const getPThickness = (p: Point) => {
                                                    const neighbors = walls.filter(w => w.id !== selectedWall.id && (isSameP(w.start, p) || isSameP(w.end, p)))
                                                    const perp = neighbors.filter(nw => isConnectedPerpendicular(selectedWall, nw))
                                                    return perp.length > 0 ? Math.max(...perp.map(n => n.thickness)) : 0
                                                }
                                                const sumThick = (getPThickness(selectedWall.start) / 2 + getPThickness(selectedWall.end) / 2)
                                                centerAdj = editFace === "exterior" ? -sumThick : sumThick
                                            }

                                            onUpdateWallLength(selectedWall.id, targetLen + centerAdj, "left")
                                            setEditMode("menu")
                                        }}
                                        className="p-1.5 bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-600 rounded-md transition-all"
                                    >
                                        {Math.abs(selectedWall.start.y - selectedWall.end.y) < 1 ? "←" : "↑"}
                                    </button>

                                    <div className="flex items-center gap-1 bg-white border-2 border-slate-100 rounded-lg px-2 py-1 focus-within:border-sky-500 transition-colors">
                                        <input
                                            type="number"
                                            autoFocus
                                            value={editLength}
                                            onChange={(e) => setEditLength(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const targetLen = parseInt(editLength)
                                                    if (!isNaN(targetLen)) {
                                                        let centerAdj = 0
                                                        if (editFace !== "center") {
                                                            const isSameP = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < 1.0
                                                            const getPThickness = (p: Point) => {
                                                                const neighbors = walls.filter(w => w.id !== selectedWall.id && (isSameP(w.start, p) || isSameP(w.end, p)))
                                                                const perp = neighbors.filter(nw => isConnectedPerpendicular(selectedWall, nw))
                                                                return perp.length > 0 ? Math.max(...perp.map(n => n.thickness)) : 0
                                                            }
                                                            const sumThick = (getPThickness(selectedWall.start) / 2 + getPThickness(selectedWall.end) / 2)
                                                            centerAdj = editFace === "exterior" ? -sumThick : sumThick
                                                        }
                                                        onUpdateWallLength(selectedWall.id, targetLen + centerAdj, "right")
                                                    }
                                                    setEditMode("menu")
                                                }
                                                if (e.key === 'Escape') setEditMode("menu")
                                            }}
                                            className="w-16 text-center text-lg font-bold text-slate-800 focus:outline-none"
                                        />
                                        <span className="text-[10px] font-bold text-slate-400">cm</span>
                                    </div>

                                    <button
                                        onClick={() => {
                                            const targetLen = parseInt(editLength)
                                            if (isNaN(targetLen)) return
                                            let centerAdj = 0
                                            if (editFace !== "center") {
                                                const isSameP = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < 1.0
                                                const getPThickness = (p: Point) => {
                                                    const neighbors = walls.filter(w => w.id !== selectedWall.id && (isSameP(w.start, p) || isSameP(w.end, p)))
                                                    const perp = neighbors.filter(nw => isConnectedPerpendicular(selectedWall, nw))
                                                    return perp.length > 0 ? Math.max(...perp.map(n => n.thickness)) : 0
                                                }
                                                const sumThick = (getPThickness(selectedWall.start) / 2 + getPThickness(selectedWall.end) / 2)
                                                centerAdj = editFace === "exterior" ? -sumThick : sumThick
                                            }
                                            onUpdateWallLength(selectedWall.id, targetLen + centerAdj, "right")
                                            setEditMode("menu")
                                        }}
                                        className="p-1.5 bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-600 rounded-md transition-all"
                                    >
                                        {Math.abs(selectedWall.start.y - selectedWall.end.y) < 1 ? "→" : "↓"}
                                    </button>
                                </div>
                            </div>
                        ))}

                        <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translate(-50%, 15px) scale(0.95); }
                            to { opacity: 1; transform: translate(-50%, 0) scale(1); }
                        }
                    `}</style>
                    </div>
                </div>
            )}
        </div>
    )
}

function calculatePolygonCentroid(points: Point[]): Point {
    let x = 0, y = 0
    points.forEach(p => { x += p.x; y += p.y })
    return { x: x / points.length, y: y / points.length }
}

interface MenuButtonProps {
    icon: React.ReactNode
    label: string
    onClick: () => void
    variant?: "default" | "danger"
}

const MenuButton: React.FC<MenuButtonProps> = ({ icon, label, onClick, variant = "default" }) => (
    <button
        onClick={onClick}
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-200 ${variant === "danger"
            ? "text-red-500 hover:bg-red-50"
            : "text-slate-600 hover:bg-slate-50 hover:text-sky-600"
            }`}
    >
        <div className="p-0.5">{icon}</div>
        <span className="text-[9px] font-medium uppercase tracking-wider">{label}</span>
    </button>
)
