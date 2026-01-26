"use client"
import React from "react"
import { Stage, Layer, Group, Line, Rect, Text, Circle, Arc } from "react-konva"
import { Grid } from "./Grid"
import { getClosestPointOnSegment } from "@/lib/utils/geometry"
import { Scissors, Plus, Pencil, Trash2, X } from "lucide-react"

interface Point { x: number; y: number }
interface Wall { id: string; start: Point; end: Point; thickness: number }

interface Room { id: string; name: string; polygon: Point[]; area: number; color: string; visualCenter?: Point }

interface Door { id: string; wallId: string; t: number; width: number; flip?: boolean }
interface Window { id: string; wallId: string; t: number; width: number; height: number }

interface CanvasEngineProps {
    width: number
    height: number
    zoom: number
    offset: { x: number; y: number }
    walls: Wall[]
    rooms: Room[]
    doors: Door[]
    windows: Window[]
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
    onStartDragWall: () => void
    onDragElement: (type: "door" | "window", id: string, newT: number) => void
    wallSnapshot: Wall[] | null
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
    wallSnapshot,
    onStartDragWall,
    onDragElement,
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

    const findNearestVertex = (point: Point, threshold: number = 15): Point | null => {
        let nearest: Point | null = null
        let minDist = threshold

        // Usar snapshot si existe para que los puntos de imán sean estáticos durante el arrastre
        const candidates: Point[] = []
        const snapshotWalls = wallSnapshot || walls
        snapshotWalls.forEach((w: Wall) => {
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

    const isPointInPolygon = (p: Point, poly: Point[]) => {
        let inside = false
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const pi = poly[i], pj = poly[j]
            if (((pi.y > p.y) !== (pj.y > p.y)) && (p.x < (pj.x - pi.x) * (p.y - pi.y) / (pj.y - pi.y) + pi.x)) inside = !inside
        }
        return inside
    }

    const isPointInAnyRoom = (p: Point) => rooms.some(r => isPointInPolygon(p, r.polygon))

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

        const rawX = (pointer.x - offset.x) / zoom
        const rawY = (pointer.y - offset.y) / zoom
        let point = { x: rawX, y: rawY }

        setAlignmentGuides(null)

        // 1. VERTEX SNAP (Prioridad Máxima, Umbral 10)
        const vertexThreshold = 10 / zoom
        const vertex = findNearestVertex(point, vertexThreshold)
        if (vertex) return vertex

        // 2. ALINEACIONES Y ORTOGONALIDAD
        const alignThreshold = 35 / zoom
        const currentWS = wallSnapshot || walls
        const candidates: Point[] = []
        currentWS.forEach(w => { candidates.push(w.start); candidates.push(w.end) })
        rooms.forEach(r => r.polygon.forEach(p => candidates.push(p)))

        // También alinear con el punto de inicio de la acción actual
        const startPoint = currentWall?.start || dragStartPos.current
        if (startPoint) {
            candidates.push(startPoint)
        }

        let sX: number | null = null
        let sY: number | null = null

        if (startPoint) {
            if (Math.abs(point.x - startPoint.x) < alignThreshold) sX = startPoint.x
            if (Math.abs(point.y - startPoint.y) < alignThreshold) sY = startPoint.y
        }

        candidates.forEach(p => {
            if (sX === null && Math.abs(point.x - p.x) < alignThreshold) sX = p.x
            if (sY === null && Math.abs(point.y - p.y) < alignThreshold) sY = p.y
        })

        const snappedX = sX
        const snappedY = sY

        // Aplicar alineaciones
        if (snappedX !== null || snappedY !== null) {
            setAlignmentGuides({ x: snappedX ?? undefined, y: snappedY ?? undefined })
            if (snappedX !== null) point.x = snappedX
            if (snappedY !== null) point.y = snappedY

            // Si snapamos ambos ejes es virtualmente un vértice, retornamos ya
            if (snappedX !== null && snappedY !== null) return point
        }

        // 3. EDGE SNAP (Si no hay alineación fuerte de ejes)
        if (snappedX === null || snappedY === null) {
            const edgeThreshold = 15 / zoom
            let nearestEdge: Point | null = null
            let minEdgeDist = edgeThreshold
            currentWS.forEach(w => {
                const projected = projectPointOnSegment(point, w.start, w.end)
                const d = Math.sqrt(Math.pow(point.x - projected.x, 2) + Math.pow(point.y - projected.y, 2))
                if (d < minEdgeDist) {
                    minEdgeDist = d
                    nearestEdge = projected
                }
            })
            if (nearestEdge) return nearestEdge
        }

        // 4. ROUNDING FINAL (1cm grid)
        return {
            x: Math.round(point.x),
            y: Math.round(point.y)
        }
    }

    const renderWallMeasurement = (wall: Wall, offsetVal: number, color: string = "#64748b", isInteractive: boolean = false) => {
        const dx = wall.end.x - wall.start.x
        const dy = wall.end.y - wall.start.y
        const centerLength = Math.sqrt(dx * dx + dy * dy)

        if (centerLength < 5) return null

        if (selectedWallId !== wall.id && !dragStartPos.current && centerLength < 30) return null

        const isSamePoint = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < 1.0

        const nx = -dy / centerLength
        const ny = dx / centerLength
        const faceNormal = { x: nx * Math.sign(offsetVal), y: ny * Math.sign(offsetVal) }

        const getFaceOffsetAt = (point: Point, fn: Point, isInteriorFace: boolean) => {
            const neighbors = walls.filter(w => w.id !== wall.id && (isSamePoint(w.start, point) || isSamePoint(w.end, point)))
            if (neighbors.length === 0) return wall.thickness / 2

            const isContinuation = neighbors.some(nw => {
                const isNWVertical = Math.abs(nw.start.x - nw.end.x) < 1
                const isWVertical = Math.abs(wall.start.x - wall.end.x) < 1
                return isNWVertical === isWVertical && !isConnectedPerpendicular(wall, nw)
            })
            if (isContinuation) return 0

            const perp = neighbors.filter(nw => isConnectedPerpendicular(wall, nw))
            const blocksFace = perp.some(nw => {
                const otherP = isSamePoint(nw.start, point) ? nw.end : nw.start
                const dir = { x: otherP.x - point.x, y: otherP.y - point.y }
                return (dir.x * fn.x + dir.y * fn.y) > 5
            })

            if (blocksFace) {
                // If it's an interior face (points into a room), retreat to show clear space
                // If it's exterior, we usually stop at the joint cap (0 offset)
                const maxT = perp.length > 0 ? Math.max(...perp.map(n => n.thickness)) : wall.thickness
                return isInteriorFace ? -maxT / 2 : 0
            }
            return 0
        }

        const midX = (wall.start.x + wall.end.x) / 2
        const midY = (wall.start.y + wall.end.y) / 2

        const pointSlightlyOff = { x: midX + nx * Math.sign(offsetVal) * 5, y: midY + ny * Math.sign(offsetVal) * 5 }
        const pointsIntoRoom = isPointInAnyRoom(pointSlightlyOff)

        // Final face type and offset calculation
        const faceType: "interior" | "exterior" = pointsIntoRoom ? "interior" : "exterior"
        const offStart = getFaceOffsetAt(wall.start, faceNormal, pointsIntoRoom)
        const offEnd = getFaceOffsetAt(wall.end, faceNormal, pointsIntoRoom)
        const length = Math.round(centerLength + offStart + offEnd)

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

                        {/* Renderizar puertas y ventanas */}
                        {doors.map(door => {
                            const wall = walls.find(w => w.id === door.wallId)
                            if (!wall) return null
                            const wallAngle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * (180 / Math.PI)
                            const pos = {
                                x: wall.start.x + door.t * (wall.end.x - wall.start.x),
                                y: wall.start.y + door.t * (wall.end.y - wall.start.y)
                            }

                            const wallLen = Math.sqrt(Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.y - wall.start.y, 2))
                            const d1 = (door.t * wallLen).toFixed(0)
                            const d2 = ((1 - door.t) * wallLen).toFixed(0)

                            return (
                                <Group
                                    key={door.id}
                                    x={pos.x} y={pos.y}
                                    rotation={wallAngle}
                                    draggable={activeTool === "select"}
                                    onDragMove={(e) => {
                                        const stage = e.target.getStage()
                                        if (!stage) return
                                        const pointer = getRelativePointerPosition(stage)
                                        const { t } = getClosestPointOnSegment(pointer, wall.start, wall.end)
                                        onDragElement("door", door.id, t)
                                        // Reset position to override Konva's default drag behavior
                                        e.target.x(pos.x)
                                        e.target.y(pos.y)
                                    }}
                                >
                                    {/* Símbolo de puerta */}
                                    <Rect width={door.width} height={wall.thickness} x={-door.width / 2} y={-wall.thickness / 2} fill="#ffffff" stroke="#334155" strokeWidth={1} />
                                    <Arc
                                        x={door.width / 2} y={-wall.thickness / 2}
                                        innerRadius={0} outerRadius={door.width}
                                        angle={90} rotation={-180}
                                        stroke="#334155" strokeWidth={1}
                                    />

                                    {/* Distancias a los lados en tiempo real */}
                                    <Group rotation={-wallAngle}>
                                        <Text text={`${d1} cm`} x={-50} y={20} fontSize={10} fill="#0ea5e9" align="center" width={100} />
                                        <Text text={`${d2} cm`} x={-50} y={-30} fontSize={10} fill="#0ea5e9" align="center" width={100} />
                                    </Group>
                                </Group>
                            )
                        })}

                        {windows.map(window => {
                            const wall = walls.find(w => w.id === window.wallId)
                            if (!wall) return null
                            const wallAngle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * (180 / Math.PI)
                            const pos = {
                                x: wall.start.x + window.t * (wall.end.x - wall.start.x),
                                y: wall.start.y + window.t * (wall.end.y - wall.start.y)
                            }

                            const wallLen = Math.sqrt(Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.y - wall.start.y, 2))
                            const d1 = (window.t * wallLen).toFixed(0)
                            const d2 = ((1 - window.t) * wallLen).toFixed(0)

                            return (
                                <Group
                                    key={window.id}
                                    x={pos.x} y={pos.y}
                                    rotation={wallAngle}
                                    draggable={activeTool === "select"}
                                    onDragMove={(e) => {
                                        const stage = e.target.getStage()
                                        if (!stage) return
                                        const pointer = getRelativePointerPosition(stage)
                                        const { t } = getClosestPointOnSegment(pointer, wall.start, wall.end)
                                        onDragElement("window", window.id, t)
                                        // Reset position to override Konva's default drag behavior
                                        e.target.x(pos.x)
                                        e.target.y(pos.y)
                                    }}
                                >
                                    {/* Símbolo de ventana */}
                                    <Rect width={window.width} height={wall.thickness} x={-window.width / 2} y={-wall.thickness / 2} fill="#ffffff" stroke="#334155" strokeWidth={1} />
                                    <Line points={[-window.width / 2, 0, window.width / 2, 0]} stroke="#334155" strokeWidth={1} />

                                    {/* Distancias a los lados en tiempo real */}
                                    <Group rotation={-wallAngle}>
                                        <Text text={`${d1} cm`} x={-50} y={20} fontSize={10} fill="#0ea5e9" align="center" width={100} />
                                        <Text text={`${d2} cm`} x={-50} y={-30} fontSize={10} fill="#0ea5e9" align="center" width={100} />
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
                                        onDragStart={(e) => {
                                            const stage = e.target.getStage()
                                            if (stage) dragStartPos.current = getRelativePointerPosition(stage)
                                            onStartDragWall()
                                        }}
                                        onDragMove={(e) => {
                                            const stage = e.target.getStage()
                                            if (!stage || !dragStartPos.current || !wallSnapshot) return

                                            const pos = getRelativePointerPosition(stage)
                                            const totalDelta = {
                                                x: Math.round(pos.x - dragStartPos.current.x),
                                                y: Math.round(pos.y - dragStartPos.current.y)
                                            }

                                            if (isHorizontal) totalDelta.x = 0
                                            else if (isVertical) totalDelta.y = 0

                                            if (totalDelta.x !== 0 || totalDelta.y !== 0) {
                                                onDragWall(wall.id, totalDelta)
                                            }

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
                                                        onStartDragWall()
                                                        dragStartPos.current = { ...p }
                                                    }}
                                                    onDragMove={(e) => {
                                                        const stage = e.target.getStage()
                                                        if (!stage || !dragStartPos.current || !wallSnapshot) return

                                                        const pos = getRelativePointerPosition(stage)
                                                        const totalDelta = {
                                                            x: Math.round(pos.x - dragStartPos.current.x),
                                                            y: Math.round(pos.y - dragStartPos.current.y)
                                                        }

                                                        if (totalDelta.x !== 0 || totalDelta.y !== 0) {
                                                            onDragVertex(p, totalDelta)
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
                                        stroke="#0ea5e9"
                                        strokeWidth={1.5 / zoom}
                                        dash={[10, 5]}
                                        opacity={0.8}
                                    />
                                )}
                                {alignmentGuides.y !== undefined && (
                                    <Line
                                        points={[-5000, alignmentGuides.y, 5000, alignmentGuides.y]}
                                        stroke="#0ea5e9"
                                        strokeWidth={1.5 / zoom}
                                        dash={[10, 5]}
                                        opacity={0.8}
                                    />
                                )}
                            </Group>
                        )}

                        {/* Indicador visual de Snapping */}
                        {(() => {
                            const p = mousePos
                            if (!p) return null
                            const isWallTool = activeTool === "wall"
                            const isDragging = !!wallSnapshot

                            if (!isWallTool && !isDragging) return null

                            // 1. Prioridad: Vértice
                            const vertex = findNearestVertex(p, 15 / zoom)
                            if (vertex) {
                                return (
                                    <Circle
                                        x={vertex.x}
                                        y={vertex.y}
                                        radius={8 / zoom}
                                        stroke="#0ea5e9"
                                        strokeWidth={3 / zoom}
                                        fill="white"
                                        opacity={0.9}
                                        listening={false}
                                    />
                                )
                            }

                            // 2. Fallback: Edge (Borde de muro)
                            const edgeThreshold = 15 / zoom
                            let nearestEdge: Point | null = null
                            const snapWS = wallSnapshot || walls
                            snapWS.forEach(w => {
                                const projected = projectPointOnSegment(p, w.start, w.end)
                                const d = Math.sqrt(Math.pow(p.x - projected.x, 2) + Math.pow(p.y - projected.y, 2))
                                if (d < edgeThreshold) nearestEdge = projected
                            })

                            if (nearestEdge) {
                                const ne = nearestEdge as Point
                                return (
                                    <Rect
                                        x={ne.x - 5 / zoom}
                                        y={ne.y - 5 / zoom}
                                        width={10 / zoom}
                                        height={10 / zoom}
                                        stroke="#0ea5e9"
                                        strokeWidth={2 / zoom}
                                        fill="white"
                                        rotation={45}
                                        offsetX={0}
                                        offsetY={0}
                                        opacity={0.8}
                                        listening={false}
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
