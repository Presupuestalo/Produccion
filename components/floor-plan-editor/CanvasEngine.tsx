"use client"
import React from "react"
import { Stage, Layer, Group, Line, Rect, Text, Circle, Arc, Arrow } from "react-konva"
import { Grid } from "./Grid"
import { getClosestPointOnSegment } from "@/lib/utils/geometry"
import { Scissors, Plus, Pencil, Trash2, X, RotateCcw, Copy, FlipHorizontal, FlipVertical } from "lucide-react"

interface Point { x: number; y: number }
interface Wall { id: string; start: Point; end: Point; thickness: number }

interface Room { id: string; name: string; polygon: Point[]; area: number; color: string; visualCenter?: Point }

interface Door { id: string; wallId: string; t: number; width: number; flipX?: boolean; flipY?: boolean }
interface Window { id: string; wallId: string; t: number; width: number; height: number; flipY?: boolean }

function calculatePolygonCentroid(points: Point[]): Point {
    let sx = 0, sy = 0
    points.forEach(p => { sx += p.x; sy += p.y })
    return { x: sx / points.length, y: sy / points.length }
}

interface MenuButtonProps {
    icon: React.ReactNode
    label?: string
    onClick: () => void
    variant?: "default" | "danger"
}

const MenuButton: React.FC<MenuButtonProps> = ({ icon, onClick, variant = "default" }) => (
    <button
        onClick={onClick}
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex items-center justify-center p-1.5 rounded-lg transition-all duration-200 ${variant === "danger"
            ? "text-red-500 hover:bg-red-50"
            : "text-slate-600 hover:bg-slate-50 hover:text-sky-600"
            }`}
    >
        {icon}
    </button>
)

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
    onSelectWall: (id: string | null, isMultiSelect?: boolean) => void
    onDragWall: (id: string, delta: { x: number; y: number }) => void
    onDragVertex: (originalPoint: Point, delta: Point, activeIds?: string[]) => void
    onDragEnd: () => void
    onUpdateWallLength: (id: string, length: number, side: "left" | "right") => void
    onDeleteWall: (id: string) => void
    onSplitWall?: (id: string, point?: Point) => void,
    onUpdateWallThickness: (id: string, thickness: number) => void
    onUpdateRoom: (id: string, updates: Partial<Room>) => void
    selectedWallIds: string[]
    selectedRoomId: string | null
    onSelectRoom: (id: string | null) => void
    onStartDragWall: () => void
    onDragElement: (type: "door" | "window", id: string, pointer: Point) => void
    selectedElement: { type: "door" | "window", id: string } | null
    onSelectElement: (element: { type: "door" | "window", id: string } | null) => void
    onUpdateElement: (type: "door" | "window", id: string, updates: any) => void
    onCloneElement: (type: "door" | "window", id: string) => void
    onDeleteElement: (type: "door" | "window", id: string) => void
    wallSnapshot: Wall[] | null
    bgImage?: string | null
    bgConfig?: { opacity: number, scale: number, x: number, y: number, rotation?: number }
    onUpdateBgConfig?: (updates: any) => void
    isCalibrating?: boolean
    calibrationPoints?: { p1: Point, p2: Point }
    calibrationTargetValue?: number
    onUpdateCalibrationPoint?: (id: "p1" | "p2", point: Point) => void
    snappingEnabled?: boolean
    rulerPoints?: { start: Point, end: Point } | null
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
    selectedWallIds,
    selectedRoomId,
    onSelectRoom,
    onDragVertex,
    wallSnapshot,
    onStartDragWall,
    onDragElement,
    selectedElement,
    onSelectElement,
    onUpdateElement,
    onCloneElement,
    onDeleteElement,
    bgImage,
    bgConfig,
    onUpdateBgConfig,
    isCalibrating,
    calibrationPoints,
    calibrationTargetValue,
    onUpdateCalibrationPoint,
    snappingEnabled = true,
    rulerPoints
}) => {
    const stageRef = React.useRef<any>(null)
    const [image, setImage] = React.useState<HTMLImageElement | null>(null)
    const isSamePoint = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < 5.0

    React.useEffect(() => {
        if (bgImage) {
            const img = new Image()
            img.src = bgImage
            img.onload = () => setImage(img)
        } else {
            setImage(null)
        }
    }, [bgImage])
    const [mousePos, setMousePos] = React.useState<Point | null>(null)
    const [alignmentGuides, setAlignmentGuides] = React.useState<{ x?: number, y?: number } | null>(null)
    const [editMode, setEditMode] = React.useState<"menu" | "length" | "thickness" | "room" | null>(null)
    const [editLength, setEditLength] = React.useState<string>("")
    const [editHeight, setEditHeight] = React.useState<string>("")
    const [editThickness, setEditThickness] = React.useState<string>("")
    const [editFace, setEditFace] = React.useState<"center" | "interior" | "exterior">("center")
    const dragStartPos = React.useRef<Point | null>(null)
    const lastPointerPos = React.useRef<Point | null>(null) // Para el panning
    const isPanning = React.useRef(false)
    const draggingVertexWallIds = React.useRef<string[]>([])
    const [isPanningState, setIsPanningState] = React.useState(false)
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

    const selectedWall = selectedWallIds.length === 1 ? walls.find(w => w.id === selectedWallIds[0]) : null
    const selectedRoom = rooms.find(r => r.id === selectedRoomId)

    const roomTypes = [
        "Salón", "Cocina", "Dormitorio", "Baño", "Pasillo", "Terraza", "Lavadero", "Entrada"
    ]

    React.useEffect(() => {
        if (selectedWallIds.length === 1) {
            const wall = walls.find(w => w.id === selectedWallIds[0])
            if (wall) {
                const dx = wall.end.x - wall.start.x
                const dy = wall.end.y - wall.start.y
                setEditLength(Math.round(Math.sqrt(dx * dx + dy * dy)).toString())
                setEditThickness(wall.thickness.toString())
                if (!editMode) setEditMode("menu")
            }
        } else if (selectedWallIds.length > 1) {
            // Multi-selection: typically hide property menu or show batch actions
            setEditMode(null)
        } else if (selectedRoomId) {
            if (!editMode) setEditMode("menu")
        } else if (selectedElement) {
            if (!editMode) setEditMode("menu")
            const el = selectedElement.type === "door"
                ? doors.find(d => d.id === selectedElement.id)
                : windows.find(w => w.id === selectedElement.id)
            if (el) {
                setEditLength(el.width.toString())
                if ('height' in el) setEditHeight(el.height.toString())
                else setEditHeight("")
            }
        } else {
            setEditMode(null)
            setMenuDragOffset({ x: 0, y: 0 })
        }
    }, [selectedWallIds, selectedRoomId, selectedElement, walls, doors, windows])

    const getElementPos = () => {
        if (!selectedElement) return null
        const el = selectedElement.type === "door"
            ? doors.find(d => d.id === selectedElement.id)
            : windows.find(w => w.id === selectedElement.id)
        if (!el) return null
        const wall = walls.find(w => w.id === el.wallId)
        if (!wall) return null
        return {
            x: (wall.start.x + el.t * (wall.end.x - wall.start.x)) * zoom + offset.x,
            y: (wall.start.y + el.t * (wall.end.y - wall.start.y)) * zoom + offset.y
        }
    }

    const currentEPos = getElementPos()

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

        if (!snappingEnabled) return point
        const vertexThreshold = 6 / zoom
        const vertex = findNearestVertex(point, vertexThreshold)
        if (vertex) return vertex

        // 2. ALINEACIONES Y ORTOGONALIDAD
        const alignThreshold = 8 / zoom
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
            const edgeThreshold = 8 / zoom
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

    const findTerminal = (startWall: Wall, startP: Point, visited: Set<string>, faceNormal: Point) => {
        const TOL = 5.0
        let curr = startP
        let addedLen = 0
        let terminalWallId = startWall.id
        while (true) {
            const neighbors = walls.filter(w => !visited.has(w.id) && (
                Math.sqrt(Math.pow(w.start.x - curr.x, 2) + Math.pow(w.start.y - curr.y, 2)) < TOL ||
                Math.sqrt(Math.pow(w.end.x - curr.x, 2) + Math.pow(w.end.y - curr.y, 2)) < TOL
            ))

            // Buscar un muro que sea continuación colineal
            const cont = neighbors.find(nw => {
                const nwHorizontal = Math.abs(nw.start.y - nw.end.y) < 2.0
                const nwVertical = Math.abs(nw.start.x - nw.end.x) < 2.0
                const wallHorizontal = Math.abs(startWall.start.y - startWall.end.y) < 2.0
                const wallVertical = Math.abs(startWall.start.x - startWall.end.x) < 2.0
                const isCollinear = (nwHorizontal === wallHorizontal && nwVertical === wallVertical)
                return isCollinear && !isConnectedPerpendicular(startWall, nw)
            })

            if (!cont) return { terminal: curr, addedLen, terminalWallId }

            // Check if ANY other neighbor (perpendicular) blocks this specific face
            const isBlocked = neighbors.some(nw => {
                const pOther = Math.sqrt(Math.pow(nw.start.x - curr.x, 2) + Math.pow(nw.start.y - curr.y, 2)) < TOL ? nw.end : nw.start
                const dir = { x: pOther.x - curr.x, y: pOther.y - curr.y }
                const dotFace = dir.x * faceNormal.x + dir.y * faceNormal.y
                return dotFace > 0.5 // Si un muro perpendicular sale hacia este lado, bloquea la cadena de medida
            })

            if (isBlocked) return { terminal: curr, addedLen, terminalWallId }

            visited.add(cont.id)
            const segmentLen = Math.sqrt(Math.pow(cont.end.x - cont.start.x, 2) + Math.pow(cont.end.y - cont.start.y, 2))
            addedLen += segmentLen
            terminalWallId = cont.id
            curr = Math.sqrt(Math.pow(cont.start.x - curr.x, 2) + Math.pow(cont.start.y - curr.y, 2)) < TOL ? cont.end : cont.start
        }
    }

    const getFaceOffsetAt = (wall: Wall, point: Point, faceNormal: Point, ignoreIds: Set<string> = new Set()) => {
        const TOL = 5.0
        const neighbors = walls.filter(w => !ignoreIds.has(w.id) && w.id !== wall.id && (() => {
            const closestObj = getClosestPointOnSegment(point, w.start, w.end)
            const dist = Math.sqrt(Math.pow(closestObj.point.x - point.x, 2) + Math.pow(closestObj.point.y - point.y, 2))
            return dist < TOL
        })())

        const dx = wall.end.x - wall.start.x
        const dy = wall.end.y - wall.start.y
        const centerLength = Math.max(0.1, Math.sqrt(dx * dx + dy * dy))
        const ux = dx / centerLength
        const uy = dy / centerLength

        // Recolectamos todas las influencias de los vecinos
        const retractions: number[] = [];
        const extensions: number[] = [];
        let hasContinuation = false;

        neighbors.forEach(nw => {
            const nwDx = nw.end.x - nw.start.x
            const nwDy = nw.end.y - nw.start.y
            const nL = Math.max(0.1, Math.sqrt(nwDx * nwDx + nwDy * nwDy))
            const nux = nwDx / nL
            const nuy = nwDy / nL

            const cross = ux * nuy - uy * nux

            // Si son colineales, no hay offset (es una continuación)
            if (Math.abs(cross) < 0.05) {
                const dot = ux * nux + uy * nuy
                if (Math.abs(dot) > 0.95) hasContinuation = true
                return
            }

            // Caso 2: Perpendiculares o Angulados
            const isAtStart = Math.sqrt(Math.pow(nw.start.x - point.x, 2) + Math.pow(nw.start.y - point.y, 2)) < TOL
            const isAtEnd = Math.sqrt(Math.pow(nw.end.x - point.x, 2) + Math.pow(nw.end.y - point.y, 2)) < TOL

            let blocksFace = false
            let localDotFace = 0
            if (!isAtStart && !isAtEnd) {
                // T-Junction: el punto está en medio del muro vecino
                blocksFace = true
            } else {
                const otherP = isAtStart ? nw.end : nw.start
                const dir = { x: otherP.x - point.x, y: otherP.y - point.y }
                localDotFace = dir.x * faceNormal.x + dir.y * faceNormal.y
                blocksFace = localDotFace > 0.5
            }

            if (blocksFace) {
                const D = wall.thickness / 2
                const K = nw.thickness / 2
                const nnx = -nuy, nny = nux

                const solveS = (targetK: number) => {
                    const rx = targetK * nnx - D * faceNormal.x
                    const ry = targetK * nny - D * faceNormal.y
                    return (rx * nuy - ry * nux) / cross
                }
                const s1 = solveS(K), s2 = solveS(-K)
                retractions.push(Math.min(s1, s2))
            } else if (isConnectedPerpendicular(wall, nw) && localDotFace < -0.5) {
                extensions.push(wall.thickness / 2)
            }
        })

        // Aplicamos prioridad: Retracción > Continuación > Extensión > Punta libre
        if (retractions.length > 0) return Math.min(...retractions)
        if (hasContinuation) return 0
        if (extensions.length > 0) return Math.max(...extensions)

        return wall.thickness / 2
    }

    const renderWallMeasurement = (wall: Wall, offsetVal: number, color: string = "#64748b", isInteractive: boolean = false) => {
        const dx = wall.end.x - wall.start.x
        const dy = wall.end.y - wall.start.y
        const centerLength = Math.sqrt(dx * dx + dy * dy)

        if (centerLength < 5) return null

        if (!selectedWallIds.includes(wall.id) && !dragStartPos.current && centerLength < 30) return null


        const nx = -dy / centerLength
        const ny = dx / centerLength
        const faceNormal = { x: nx * Math.sign(offsetVal), y: ny * Math.sign(offsetVal) }

        const midX = (wall.start.x + wall.end.x) / 2
        const midY = (wall.start.y + wall.end.y) / 2

        const probeDist = 8.0 // coordinate-fixed probe (8cm)
        const pointSlightlyOff = { x: midX + nx * Math.sign(offsetVal) * probeDist, y: midY + ny * Math.sign(offsetVal) * probeDist }
        const pointsIntoRoom = isPointInAnyRoom(pointSlightlyOff)
        const faceType: "interior" | "exterior" = pointsIntoRoom ? "interior" : "exterior"

        // COLLINEAR CHAIN SEARCH
        const chainIds = new Set([wall.id])
        const back = findTerminal(wall, wall.start, chainIds, faceNormal)
        const forward = findTerminal(wall, wall.end, chainIds, faceNormal)

        const totalChainCenter = centerLength + back.addedLen + forward.addedLen
        const finalOffStart = getFaceOffsetAt(wall, back.terminal, faceNormal, chainIds)
        const finalOffEnd = getFaceOffsetAt(wall, forward.terminal, faceNormal, chainIds)

        const sortedIds = Array.from(chainIds).sort()
        const isLeader = wall.id === sortedIds[0]
        const shouldShowLabel = isLeader

        // Interior length is segment-specific (face-to-face inside room)
        // Exterior length is chain-specific (total facade)
        const displayLength = Math.round(totalChainCenter + finalOffStart + finalOffEnd)

        if (!shouldShowLabel) return null

        const ux = dx / centerLength
        const uy = dy / centerLength

        // Offset visual de la línea de medida
        const visualOff = offsetVal * 0.8
        const p1x = (back.terminal.x + ux * (-finalOffStart)) + nx * visualOff
        const p1y = (back.terminal.y + uy * (-finalOffStart)) + ny * visualOff
        const p2x = (forward.terminal.x + ux * (finalOffEnd)) + nx * visualOff
        const p2y = (forward.terminal.y + uy * (finalOffEnd)) + ny * visualOff

        const labelX = (p1x + p2x) / 2
        const labelY = (p1y + p2y) / 2

        // Líneas de testigo (Witness lines / Caps)
        const capSize = 6 / zoom
        const capP1A = { x: p1x + nx * capSize, y: p1y + ny * capSize }
        const capP1B = { x: p1x - nx * capSize, y: p1y - ny * capSize }
        const capP2A = { x: p2x + nx * capSize, y: p2y + ny * capSize }
        const capP2B = { x: p2x - nx * capSize, y: p2y - ny * capSize }

        return (
            <Group>
                {/* Línea principal */}
                <Line
                    points={[p1x, p1y, p2x, p2y]}
                    stroke={color}
                    strokeWidth={1 / zoom}
                    opacity={isInteractive ? 1 : 0.6}
                />
                {/* Caps (Testigos) */}
                <Line
                    points={[capP1A.x, capP1A.y, capP1B.x, capP1B.y]}
                    stroke={color}
                    strokeWidth={1 / zoom}
                    opacity={isInteractive ? 1 : 0.6}
                />
                <Line
                    points={[capP2A.x, capP2A.y, capP2B.x, capP2B.y]}
                    stroke={color}
                    strokeWidth={1 / zoom}
                    opacity={isInteractive ? 1 : 0.6}
                />

                <Group
                    onClick={(e) => {
                        if (isInteractive) {
                            e.cancelBubble = true
                            setEditFace(faceType)
                            setEditLength(displayLength.toString())
                            setEditMode("length")
                        }
                    }}
                    onTap={(e) => {
                        if (isInteractive) {
                            e.cancelBubble = true
                            setEditFace(faceType)
                            setEditLength(displayLength.toString())
                            setEditMode("length")
                        }
                    }}
                >
                    <Rect
                        x={labelX - 25 / zoom}
                        y={labelY - 10 / zoom}
                        width={50 / zoom}
                        height={20 / zoom}
                        fill="white"
                        stroke={isInteractive && editMode === "length" && editFace === faceType ? "#0ea5e9" : "#e2e8f0"}
                        strokeWidth={isInteractive ? 1 / zoom : 0.5 / zoom}
                        cornerRadius={4 / zoom}
                    />
                    <Text
                        x={labelX}
                        y={labelY - 5 / zoom}
                        text={`${displayLength} cm`}
                        fontSize={10 / zoom}
                        fill={isInteractive && editMode === "length" && editFace === faceType ? "#0ea5e9" : color}
                        align="center"
                        offsetX={25 / zoom}
                        fontStyle={isInteractive ? "bold" : "normal"}
                        width={50 / zoom}
                    />
                </Group>
            </Group>
        )
    }
    const isConnectedPerpendicular = (w1: Wall, w2: Wall) => {
        const dx1 = w1.end.x - w1.start.x
        const dy1 = w1.end.y - w1.start.y
        const dx2 = w2.end.x - w2.start.x
        const dy2 = w2.end.y - w2.start.y
        const L1 = Math.max(0.1, Math.sqrt(dx1 * dx1 + dy1 * dy1))
        const L2 = Math.max(0.1, Math.sqrt(dx2 * dx2 + dy2 * dy2))

        const TOL = 5.0
        const isSame = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL
        const shareVertex = isSame(w1.start, w2.start) || isSame(w1.start, w2.end) ||
            isSame(w1.end, w2.start) || isSame(w1.end, w2.end)
        if (!shareVertex) return false

        // Dot product of directions near 0 means they are perpendicular
        const dot = (dx1 / L1) * (dx2 / L2) + (dy1 / L1) * (dy2 / L2)
        return Math.abs(dot) < 0.2 // Supports near-perpendicular inclined walls
    }

    const handleStageMouseDown = (e: any) => {
        const stage = e.target?.getStage?.()
        if (!stage) return
        const isRightClick = e.evt.button === 2
        const isMiddleClick = e.evt.button === 1
        const isBackground = e.target === stage
        const targetName = e.target.name() || ""
        const isRoom = targetName.startsWith("room-")

        if (isRightClick || isMiddleClick || (activeTool === "select" && (isBackground || isRoom))) {
            if (isBackground) {
                onSelectWall(null)
                onSelectRoom(null)
                onSelectElement(null)
            }
            isPanning.current = true
            setIsPanningState(true)
            lastPointerPos.current = stage.getPointerPosition()
            return
        }

        // Solo dibujar con click izquierdo y herramienta correcta que inicie acción al pulsar
        if (e.evt.button !== 0) return

        // Click fuera de cualquier objeto detectable (Stage directamente)
        if (e.target === stage) {
            onSelectWall(null)
            onSelectRoom(null)
            onSelectElement(null)
        }

        if (activeTool !== "wall" && activeTool !== "door" && activeTool !== "window" && activeTool !== "ruler") return

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
        if ((activeTool === "wall" && currentWall) || (activeTool === "ruler")) {
            onMouseMove(pos)
        }
    }

    const handleStageMouseUp = (e: any) => {
        if (isPanning.current) {
            isPanning.current = false
            setIsPanningState(false)
            return
        }

        if ((activeTool === "wall" && currentWall) || activeTool === "ruler") {
            const stage = e.target?.getStage?.()
            if (!stage) return
            const pos = getRelativePointerPosition(stage)
            onMouseUp(pos)
        }
    }

    const handleMouseLeave = () => {
        isPanning.current = false
        setIsPanningState(false)
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
                style={{ cursor: isPanningState ? 'grabbing' : activeTool === "wall" ? 'crosshair' : 'default' }}
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
                        {/* Imagen de fondo / Plantilla */}
                        {image && bgConfig && (
                            <Rect
                                x={bgConfig.x}
                                y={bgConfig.y}
                                width={image.width * bgConfig.scale}
                                height={image.height * bgConfig.scale}
                                fillPatternImage={image}
                                fillPatternScaleX={bgConfig.scale}
                                fillPatternScaleY={bgConfig.scale}
                                rotation={bgConfig.rotation || 0}
                                opacity={bgConfig.opacity}
                                listening={false}
                            />
                        )}


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
                                        name="room-poly"
                                        points={points}
                                        fill={selectedRoomId === room.id ? room.color + "60" : room.color + "40"}
                                        stroke={selectedRoomId === room.id ? room.color : "transparent"}
                                        strokeWidth={2}
                                        closed={true}
                                        onClick={() => onSelectRoom(room.id)}
                                        onTap={() => onSelectRoom(room.id)}
                                    />
                                    <Group
                                        name="room-label"
                                        x={labelPos.x} y={labelPos.y}
                                        onClick={() => onSelectRoom(room.id)}
                                        onTap={() => onSelectRoom(room.id)}
                                    >
                                        <Text
                                            name="room-label-text"
                                            y={-10}
                                            text={room.name}
                                            fontSize={12}
                                            fill="#1e293b"
                                            fontStyle="bold"
                                            align="center"
                                            offsetX={30}
                                        />
                                        <Text
                                            name="room-label-text"
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

                        {/* Renderizar muros guardados - AHORA ANTES de puertas/ventanas para que estas se puedan seleccionar mejor */}
                        {walls.map((wall: Wall) => {
                            const isHovered = hoveredWallId === wall.id
                            const isSelected = selectedWallIds.includes(wall.id)
                            const isHorizontal = Math.abs(wall.start.y - wall.end.y) < 1
                            const isVertical = Math.abs(wall.start.x - wall.end.x) < 1

                            return (
                                <Group key={wall.id}>
                                    <Line
                                        points={[wall.start.x, wall.start.y, wall.end.x, wall.end.y]}
                                        stroke={isHovered && !isSelected ? "#ef4444" : "#334155"}
                                        strokeWidth={wall.thickness}
                                        hitStrokeWidth={30}
                                        lineCap="round"
                                        lineJoin="round"
                                        draggable={activeTool === "select"}
                                        onClick={(e) => {
                                            if (activeTool === "select") {
                                                onSelectWall(wall.id, e.evt.ctrlKey)
                                                // @ts-ignore
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
                                        onDblClick={(e) => {
                                            if (activeTool === "select" && onSplitWall) {
                                                const stage = e.target.getStage()
                                                if (stage) {
                                                    const pos = getRelativePointerPosition(stage)
                                                    onSplitWall(wall.id, pos)
                                                }
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
                                    {/* Trimmed Selection Highlight (HomeByMe Style) */}
                                    {isSelected && (() => {
                                        const midX = (wall.start.x + wall.end.x) / 2
                                        const midY = (wall.start.y + wall.end.y) / 2
                                        const dx = wall.end.x - wall.start.x
                                        const dy = wall.end.y - wall.start.y
                                        const len = Math.sqrt(dx * dx + dy * dy)
                                        if (len === 0) return null
                                        const ux = dx / len
                                        const uy = dy / len
                                        const nx = -uy
                                        const ny = ux

                                        // Use the exact same logic as interior measurements for the highlight
                                        const pointSlightlyOff = { x: midX + nx * 5, y: midY + ny * 5 }
                                        const pointsIntoRoom = isPointInAnyRoom(pointSlightlyOff)
                                        const faceNormal = { x: nx * (pointsIntoRoom ? 1 : -1), y: ny * (pointsIntoRoom ? 1 : -1) }

                                        const getCornerAdjustment = (p: Point) => {
                                            const TOL = 5.0
                                            const neighbors = walls.filter(w => w.id !== wall.id && (
                                                Math.sqrt(Math.pow(w.start.x - p.x, 2) + Math.pow(w.start.y - p.y, 2)) < TOL ||
                                                Math.sqrt(Math.pow(w.end.x - p.x, 2) + Math.pow(w.end.y - p.y, 2)) < TOL
                                            ))
                                            const perps = neighbors.filter(nw => isConnectedPerpendicular(wall, nw))
                                            const maxT = perps.length > 0 ? Math.max(...perps.map(nw => nw.thickness)) : 0

                                            const blocksThisFace = perps.some(nw => {
                                                const otherP = Math.sqrt(Math.pow(nw.start.x - p.x, 2) + Math.pow(nw.start.y - p.y, 2)) < TOL ? nw.end : nw.start
                                                const dir = { x: otherP.x - p.x, y: otherP.y - p.y }
                                                return (dir.x * faceNormal.x + dir.y * faceNormal.y) > 0.5
                                            })

                                            if (blocksThisFace && maxT > 0) return maxT / 2

                                            const isContinuation = neighbors.some(nw => {
                                                const nwHorizontal = Math.abs(nw.start.y - nw.end.y) < 5.0
                                                const nwVertical = Math.abs(nw.start.x - nw.end.x) < 5.0
                                                const wallHorizontal = Math.abs(wall.start.y - wall.end.y) < 5.0
                                                const wallVertical = Math.abs(wall.start.x - wall.end.x) < 5.0
                                                return (nwHorizontal === wallHorizontal && nwVertical === wallVertical) && !isConnectedPerpendicular(wall, nw)
                                            })
                                            if (isContinuation) return 0

                                            return maxT > 0 ? -maxT / 2 : 0
                                        }

                                        const adjStart = getCornerAdjustment(wall.start)
                                        const adjEnd = getCornerAdjustment(wall.end)

                                        const trimmedStart = { x: wall.start.x + ux * adjStart, y: wall.start.y + uy * adjStart }
                                        const trimmedEnd = { x: wall.end.x - ux * adjEnd, y: wall.end.y - uy * adjEnd }

                                        return (
                                            <Line
                                                points={[trimmedStart.x, trimmedStart.y, trimmedEnd.x, trimmedEnd.y]}
                                                stroke="#0ea5e9"
                                                strokeWidth={wall.thickness + 0.5}
                                                lineCap="butt"
                                                listening={false}
                                            />
                                        )
                                    })()}
                                    {/* Medidas duales para pared seleccionada */}
                                    {isSelected && (
                                        <>
                                            {renderWallMeasurement(wall, 25 / zoom, "#0ea5e9", true)}
                                            {renderWallMeasurement(wall, -25 / zoom, "#0ea5e9", true)}
                                        </>
                                    )}
                                    {/* Medida durante el arrastre (si no está seleccionada por algún motivo) */}
                                    {dragStartPos.current && isHovered && !isSelected && renderWallMeasurement(wall, 25 / zoom)}
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


                        {/* Renderizar puertas y ventanas SOBRE los muros */}
                        {doors.map(door => {
                            const wall = walls.find(w => w.id === door.wallId)
                            if (!wall) return null
                            const wallAngle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * (180 / Math.PI)
                            const pos = {
                                x: wall.start.x + door.t * (wall.end.x - wall.start.x),
                                y: wall.start.y + door.t * (wall.end.y - wall.start.y)
                            }

                            const wallLen = Math.sqrt(Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.y - wall.start.y, 2))
                            // Distancias desde los bordes de la puerta
                            const d1Val = Math.max(0, (door.t * wallLen) - (door.width / 2))
                            const d2Val = Math.max(0, ((1 - door.t) * wallLen) - (door.width / 2))
                            const d1 = d1Val.toFixed(0)
                            const d2 = d2Val.toFixed(0)

                            const isSelected = selectedElement?.id === door.id && selectedElement?.type === "door"

                            // Posiciones locales centradas en los huecos de pared a los lados de la puerta
                            const gap1CenterLocalX = (-door.t * wallLen - door.width / 2) / 2
                            const gap2CenterLocalX = ((1 - door.t) * wallLen + door.width / 2) / 2

                            return (
                                <Group
                                    key={door.id}
                                    x={pos.x} y={pos.y}
                                    rotation={wallAngle}
                                    draggable={activeTool === "select"}
                                    onClick={() => onSelectElement({ type: "door", id: door.id })}
                                    onDragMove={(e) => {
                                        const stage = e.target.getStage()
                                        if (!stage) return
                                        const pointer = getRelativePointerPosition(stage)
                                        onDragElement("door", door.id, pointer)
                                        e.target.x(pos.x)
                                        e.target.y(pos.y)
                                    }}
                                >
                                    <Rect
                                        width={door.width}
                                        height={wall.thickness + 4}
                                        x={-door.width / 2}
                                        y={-(wall.thickness + 4) / 2}
                                        fill={isSelected ? "#e0f2fe" : "#ffffff"}
                                        stroke={isSelected ? "#0ea5e9" : "#334155"}
                                        strokeWidth={isSelected ? 2 : 1}
                                    />

                                    <Arc
                                        x={door.flipX ? -door.width / 2 : door.width / 2}
                                        y={door.flipY ? (wall.thickness + 4) / 2 : -(wall.thickness + 4) / 2}
                                        innerRadius={0}
                                        outerRadius={door.width}
                                        angle={90}
                                        rotation={door.flipY ? (door.flipX ? 0 : 90) : (door.flipX ? -90 : -180)}
                                        stroke={isSelected ? "#0ea5e9" : "#334155"}
                                        strokeWidth={isSelected ? 2 : 1}
                                        fill={isSelected ? "#0ea5e920" : "transparent"}
                                    />

                                    {/* Distancias dinámicas alineadas con el muro (Estilo HomeByMe) */}
                                    {isSelected && (
                                        <Group rotation={0}>
                                            {d1Val > 5 && (
                                                <Group x={gap1CenterLocalX} y={20 + wall.thickness / 2}>
                                                    <Group rotation={-wallAngle % 180 === 0 ? 0 : (Math.abs(wallAngle) > 90 ? 180 : 0)}>
                                                        <Rect
                                                            width={35} height={16} x={-17.5} y={-8}
                                                            fill="white" stroke="#0ea5e9" strokeWidth={0.5} cornerRadius={4}
                                                            shadowColor="black" shadowBlur={2} shadowOpacity={0.1}
                                                        />
                                                        <Text text={`${d1} cm`} x={-17.5} y={-5} fontSize={9} fill="#0ea5e9" align="center" width={35} fontStyle="bold" />
                                                    </Group>
                                                </Group>
                                            )}
                                            {d2Val > 5 && (
                                                <Group x={gap2CenterLocalX} y={20 + wall.thickness / 2}>
                                                    <Group rotation={-wallAngle % 180 === 0 ? 0 : (Math.abs(wallAngle) > 90 ? 180 : 0)}>
                                                        <Rect
                                                            width={35} height={16} x={-17.5} y={-8}
                                                            fill="white" stroke="#0ea5e9" strokeWidth={0.5} cornerRadius={4}
                                                            shadowColor="black" shadowBlur={2} shadowOpacity={0.1}
                                                        />
                                                        <Text text={`${d2} cm`} x={-17.5} y={-5} fontSize={9} fill="#0ea5e9" align="center" width={35} fontStyle="bold" />
                                                    </Group>
                                                </Group>
                                            )}
                                        </Group>
                                    )}
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
                            // Distancias desde los bordes de la ventana
                            const d1Val = Math.max(0, (window.t * wallLen) - (window.width / 2))
                            const d2Val = Math.max(0, ((1 - window.t) * wallLen) - (window.width / 2))
                            const d1 = d1Val.toFixed(0)
                            const d2 = d2Val.toFixed(0)

                            const isSelected = selectedElement?.id === window.id && selectedElement?.type === "window"

                            // Posiciones locales centradas en los huecos de pared
                            const gap1CenterLocalX = (-window.t * wallLen - window.width / 2) / 2
                            const gap2CenterLocalX = ((1 - window.t) * wallLen + window.width / 2) / 2

                            return (
                                <Group
                                    key={window.id}
                                    x={pos.x} y={pos.y}
                                    rotation={wallAngle}
                                    draggable={activeTool === "select"}
                                    onClick={() => onSelectElement({ type: "window", id: window.id })}
                                    onDragMove={(e) => {
                                        const stage = e.target.getStage()
                                        if (!stage) return
                                        const pointer = getRelativePointerPosition(stage)
                                        onDragElement("window", window.id, pointer)
                                        e.target.x(pos.x)
                                        e.target.y(pos.y)
                                    }}
                                >
                                    <Rect
                                        width={window.width}
                                        height={wall.thickness + 4}
                                        x={-window.width / 2}
                                        y={-(wall.thickness + 4) / 2}
                                        fill={isSelected ? "#e0f2fe" : "#ffffff"}
                                        stroke={isSelected ? "#0ea5e9" : "#334155"}
                                        strokeWidth={isSelected ? 2 : 1}
                                    />
                                    <Line points={[-window.width / 2, 0, window.width / 2, 0]} stroke={isSelected ? "#0ea5e9" : "#334155"} strokeWidth={isSelected ? 2 : 1} />

                                    {/* Etiqueta de Dimensiones (WxH) */}
                                    {isSelected && (
                                        <Group x={0} y={0} rotation={-wallAngle % 180 === 0 ? 0 : (Math.abs(wallAngle) > 90 ? 180 : 0)}>
                                            <Text
                                                text={`${window.width}x${window.height}`}
                                                fontSize={7}
                                                fill="#475569"
                                                align="center"
                                                width={window.width}
                                                offsetX={window.width / 2}
                                                offsetY={-2}
                                                fontStyle="bold"
                                            />
                                        </Group>
                                    )}

                                    {/* Distancias dinámicas alineadas con el muro */}
                                    {isSelected && (
                                        <Group rotation={0}>
                                            {d1Val > 5 && (
                                                <Group x={gap1CenterLocalX} y={20 + wall.thickness / 2}>
                                                    <Group rotation={-wallAngle % 180 === 0 ? 0 : (Math.abs(wallAngle) > 90 ? 180 : 0)}>
                                                        <Rect
                                                            width={35} height={16} x={-17.5} y={-8}
                                                            fill="white" stroke="#0ea5e9" strokeWidth={0.5} cornerRadius={4}
                                                            shadowColor="black" shadowBlur={2} shadowOpacity={0.1}
                                                        />
                                                        <Text text={`${d1} cm`} x={-17.5} y={-5} fontSize={9} fill="#0ea5e9" align="center" width={35} fontStyle="bold" />
                                                    </Group>
                                                </Group>
                                            )}
                                            {d2Val > 5 && (
                                                <Group x={gap2CenterLocalX} y={20 + wall.thickness / 2}>
                                                    <Group rotation={-wallAngle % 180 === 0 ? 0 : (Math.abs(wallAngle) > 90 ? 180 : 0)}>
                                                        <Rect
                                                            width={35} height={16} x={-17.5} y={-8}
                                                            fill="white" stroke="#0ea5e9" strokeWidth={0.5} cornerRadius={4}
                                                            shadowColor="black" shadowBlur={2} shadowOpacity={0.1}
                                                        />
                                                        <Text text={`${d2} cm`} x={-17.5} y={-5} fontSize={9} fill="#0ea5e9" align="center" width={35} fontStyle="bold" />
                                                    </Group>
                                                </Group>
                                            )}
                                        </Group>
                                    )}
                                </Group>
                            )
                        })}

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

                            if (!snappingEnabled || (!isWallTool && !isDragging)) return null

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
                        {/* Prop cursor */}
                        {activeTool === "ruler" && mousePos && (
                            <Circle x={mousePos.x} y={mousePos.y} radius={2 / zoom} fill="#f97316" listening={false} />
                        )}

                        {/* RENDERIZAR REGLA (RULER) */}
                        {rulerPoints && (
                            <Group>
                                <Arrow
                                    points={[rulerPoints.start.x, rulerPoints.start.y, rulerPoints.end.x, rulerPoints.end.y]}
                                    stroke="#f97316"
                                    strokeWidth={2 / zoom}
                                    pointerLength={10 / zoom}
                                    pointerWidth={10 / zoom}
                                    fill="#f97316"
                                    pointerAtBeginning={true}
                                    dash={[10, 5]}
                                />
                                {(() => {
                                    const dist = Math.round(Math.sqrt(
                                        Math.pow(rulerPoints.end.x - rulerPoints.start.x, 2) +
                                        Math.pow(rulerPoints.end.y - rulerPoints.start.y, 2)
                                    ))
                                    const midX = (rulerPoints.start.x + rulerPoints.end.x) / 2
                                    const midY = (rulerPoints.start.y + rulerPoints.end.y) / 2
                                    return (
                                        <Group x={midX} y={midY - 15 / zoom}>
                                            <Rect
                                                width={60 / zoom}
                                                height={20 / zoom}
                                                fill="#f97316"
                                                cornerRadius={4 / zoom}
                                                offsetX={30 / zoom}
                                                offsetY={10 / zoom}
                                            />
                                            <Text
                                                text={`${dist} cm`}
                                                fontSize={12 / zoom}
                                                fill="white"
                                                fontStyle="bold"
                                                width={60 / zoom}
                                                align="center"
                                                offsetX={30 / zoom}
                                                offsetY={6 / zoom}
                                            />
                                        </Group>
                                    )
                                })()}
                            </Group>
                        )}

                        {/* ================================================================== */}
                        {/* CAPA FINAL: TIRADORES Y CALIBRACIÓN (SIEMPRE ENCIMA DE TODO) */}
                        {/* ================================================================== */}

                        {/* 1. Tiradores de selección de muros */}
                        {/* 1. Tiradores de selección de muros (Agrupados y con mejor hit-area) */}
                        {(() => {
                            const uniqueVertices = new Map<string, { point: Point, connectedWalls: Wall[] }>();

                            walls.forEach(w => {
                                [w.start, w.end].forEach(p => {
                                    const key = `${Math.round(p.x)},${Math.round(p.y)}`;
                                    if (!uniqueVertices.has(key)) {
                                        uniqueVertices.set(key, { point: p, connectedWalls: [] });
                                    }
                                    uniqueVertices.get(key)!.connectedWalls.push(w);
                                });
                            });

                            return Array.from(uniqueVertices.values()).filter(({ connectedWalls }) => {
                                return connectedWalls.some(w => selectedWallIds.includes(w.id) || w.id === hoveredWallId);
                            }).map(({ point, connectedWalls }, idx) => {
                                const isSelected = connectedWalls.some(w => selectedWallIds.includes(w.id));
                                // Stable key based on vertex coordinate (rounded to prevent minor float drift)
                                const vertexKey = `v-${Math.round(point.x)}-${Math.round(point.y)}`;

                                return (
                                    <Circle
                                        key={vertexKey}
                                        x={point.x}
                                        y={point.y}
                                        radius={(isSelected ? 10 : 7) / zoom}
                                        fill="#1e293b"
                                        stroke="#ffffff"
                                        strokeWidth={2 / zoom}
                                        hitStrokeWidth={20 / zoom}
                                        draggable
                                        onDragStart={(e) => {
                                            e.cancelBubble = true;
                                            onStartDragWall();
                                            dragStartPos.current = { ...point };

                                            // Si no hay selección, movemos todos los tabiques conectados.
                                            // Si hay selección, solo los tabiques seleccionados que compartan este vértice.
                                            const movingWalls = selectedWallIds.length > 0
                                                ? connectedWalls.filter(w => selectedWallIds.includes(w.id))
                                                : connectedWalls;

                                            draggingVertexWallIds.current = movingWalls.map(w => w.id);
                                        }}
                                        onDragMove={(e) => {
                                            const stage = e.target.getStage();
                                            if (!stage || !dragStartPos.current || !wallSnapshot) return;

                                            const pos = getRelativePointerPosition(stage);
                                            const totalDelta = {
                                                x: pos.x - dragStartPos.current.x,
                                                y: pos.y - dragStartPos.current.y
                                            };

                                            if (Math.abs(totalDelta.x) > 0.01 || Math.abs(totalDelta.y) > 0.01) {
                                                onDragVertex(dragStartPos.current, totalDelta, draggingVertexWallIds.current);
                                            }
                                            e.target.position({ x: 0, y: 0 });
                                        }}
                                        onDragEnd={() => {
                                            dragStartPos.current = null;
                                            onDragEnd();
                                        }}
                                        onMouseEnter={(e: any) => {
                                            const stage = e.target.getStage();
                                            if (stage) stage.container().style.cursor = 'move';
                                        }}
                                        onMouseLeave={(e: any) => {
                                            const stage = e.target.getStage();
                                            if (stage) stage.container().style.cursor = 'default';
                                        }}
                                    />
                                );
                            });
                        })()}

                        {/* 2. Herramienta de Calibración (Ultima posición para máxima visibilidad) */}
                        {isCalibrating && calibrationPoints && (
                            <Group>
                                <Line
                                    points={[calibrationPoints.p1.x, calibrationPoints.p1.y, calibrationPoints.p2.x, calibrationPoints.p2.y]}
                                    stroke="#fbbf24"
                                    strokeWidth={4 / zoom}
                                    dash={[10, 5]}
                                    shadowBlur={4 / zoom}
                                    shadowColor="rgba(0,0,0,0.3)"
                                />
                                <Group
                                    x={calibrationPoints.p1.x}
                                    y={calibrationPoints.p1.y}
                                    draggable
                                    onDragMove={(e) => onUpdateCalibrationPoint?.("p1", { x: e.target.x(), y: e.target.y() })}
                                >
                                    <Circle
                                        radius={15 / zoom}
                                        fill="white"
                                        stroke="#fbbf24"
                                        strokeWidth={4 / zoom}
                                        shadowBlur={10 / zoom}
                                        shadowOpacity={0.4}
                                        shadowColor="rgba(0,0,0,0.5)"
                                    />
                                    <Line points={[-22 / zoom, 0, 22 / zoom, 0]} stroke="#fbbf24" strokeWidth={2 / zoom} />
                                    <Line points={[0, -22 / zoom, 0, 22 / zoom]} stroke="#fbbf24" strokeWidth={2 / zoom} />
                                </Group>
                                <Group
                                    x={calibrationPoints.p2.x}
                                    y={calibrationPoints.p2.y}
                                    draggable
                                    onDragMove={(e) => onUpdateCalibrationPoint?.("p2", { x: e.target.x(), y: e.target.y() })}
                                >
                                    <Circle
                                        radius={15 / zoom}
                                        fill="white"
                                        stroke="#fbbf24"
                                        strokeWidth={4 / zoom}
                                        shadowBlur={10 / zoom}
                                        shadowOpacity={0.4}
                                        shadowColor="rgba(0,0,0,0.5)"
                                    />
                                    <Line points={[-22 / zoom, 0, 22 / zoom, 0]} stroke="#fbbf24" strokeWidth={2 / zoom} />
                                    <Line points={[0, -22 / zoom, 0, 22 / zoom]} stroke="#fbbf24" strokeWidth={2 / zoom} />
                                </Group>
                                <Group
                                    x={(calibrationPoints.p1.x + calibrationPoints.p2.x) / 2}
                                    y={(calibrationPoints.p1.y + calibrationPoints.p2.y) / 2}
                                >
                                    <Rect
                                        width={100 / zoom}
                                        height={28 / zoom}
                                        fill="#fbbf24"
                                        cornerRadius={6 / zoom}
                                        offsetX={50 / zoom}
                                        offsetY={45 / zoom}
                                        shadowBlur={10 / zoom}
                                        shadowOpacity={0.2}
                                    />
                                    <Text
                                        text={`${calibrationTargetValue || 0} cm`}
                                        fontSize={16 / zoom}
                                        fill="white"
                                        fontStyle="bold"
                                        width={100 / zoom}
                                        align="center"
                                        offsetX={50 / zoom}
                                        offsetY={39 / zoom}
                                    />
                                </Group>
                            </Group>
                        )}
                    </Group>
                </Layer>
            </Stage>

            {
                ((selectedWall && uiPos) || selectedRoom || (selectedElement && currentEPos)) && editMode && (
                    <div
                        onMouseDown={(e) => {
                            e.stopPropagation()
                            setIsDraggingMenuState(true)
                            menuDragStart.current = { x: e.clientX - menuDragOffset.x, y: e.clientY - menuDragOffset.y }
                        }}
                        className="flex flex-col"
                        style={{
                            position: 'absolute',
                            left: (selectedRoom
                                ? (calculatePolygonCentroid(selectedRoom.polygon).x * zoom + offset.x)
                                : (selectedElement && currentEPos)
                                    ? currentEPos.x
                                    : uiPos?.x || 0
                            ) + menuDragOffset.x,
                            top: (selectedRoom
                                ? (calculatePolygonCentroid(selectedRoom.polygon).y * zoom + offset.y - 40)
                                : (selectedElement && currentEPos)
                                    ? currentEPos.y - 80
                                    : (uiPos ? uiPos.y - 100 : 0)
                            ) + menuDragOffset.y,
                            transform: 'translateX(-50%)',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(12px)',
                            padding: '2px',
                            borderRadius: '10px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
                            zIndex: 1000,
                            pointerEvents: 'auto',
                            cursor: isDraggingMenuState ? 'grabbing' : 'grab',
                            animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            minWidth: 'auto'
                        }}
                    >
                        {/* Drag Handle Bar */}
                        <div className="w-full h-1 flex justify-center items-center mb-0.5 group cursor-grab">
                            <div className="w-6 h-0.5 bg-slate-200 rounded-full group-hover:bg-slate-300 transition-colors" />
                        </div>

                        <div className="flex items-center gap-0.5">
                            {editMode === "menu" ? (
                                <>
                                    {selectedWall && (
                                        <MenuButton
                                            icon={<Scissors className="h-3.5 w-3.5" />}
                                            onClick={() => onSplitWall?.(selectedWall.id)}
                                        />
                                    )}
                                    {selectedElement && (
                                        <>
                                            <MenuButton
                                                icon={<Copy className="h-3.5 w-3.5" />}
                                                onClick={() => onCloneElement(selectedElement.type, selectedElement.id)}
                                            />
                                            {selectedElement.type === "door" && (
                                                <>
                                                    <MenuButton
                                                        icon={<FlipHorizontal className="h-3.5 w-3.5" />}
                                                        onClick={() => {
                                                            const el = doors.find(d => d.id === selectedElement.id)
                                                            if (el) onUpdateElement("door", el.id, { flipX: !el.flipX })
                                                        }}
                                                    />
                                                    <MenuButton
                                                        icon={<FlipVertical className="h-3.5 w-3.5" />}
                                                        onClick={() => {
                                                            const el = doors.find(d => d.id === selectedElement.id)
                                                            if (el) onUpdateElement("door", el.id, { flipY: !el.flipY })
                                                        }}
                                                    />
                                                </>
                                            )}
                                        </>
                                    )}
                                    <MenuButton
                                        icon={<Pencil className="h-3.5 w-3.5" />}
                                        onClick={() => setEditMode(selectedWall ? "thickness" : selectedElement ? "length" : "room")}
                                    />
                                    <div className="w-px h-4 bg-slate-100 mx-0.5" />
                                    {(selectedWall || selectedElement) && (
                                        <MenuButton
                                            icon={<Trash2 className="h-3.5 w-3.5" />}
                                            onClick={() => {
                                                if (selectedWall) onDeleteWall(selectedWall.id)
                                                else if (selectedElement) onDeleteElement(selectedElement.type, selectedElement.id)
                                            }}
                                            variant="danger"
                                        />
                                    )}
                                    <div className="w-px h-4 bg-slate-100 mx-0.5" />
                                    <button
                                        onClick={() => {
                                            onSelectWall(null)
                                            onSelectRoom(null)
                                            onSelectElement(null)
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
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
                                                        const currentMatch = selectedRoom?.name.match(/\d+$/)
                                                        const roomNumber = currentMatch ? currentMatch[0] : (rooms.indexOf(selectedRoom!) + 1)
                                                        onUpdateRoom(selectedRoomId, { name: `${type} ${roomNumber}` })
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
                                                if (e.key === 'Enter' && selectedWall) {
                                                    onUpdateWallThickness(selectedWall.id, parseInt(editThickness))
                                                    setEditMode("menu")
                                                }
                                                if (e.key === 'Escape') setEditMode("menu")
                                            }}
                                            className="w-14 p-1.5 border-2 border-slate-200 rounded-lg text-center text-sm font-bold text-slate-800 focus:border-sky-500 focus:outline-none transition-colors"
                                        />
                                        <span className="text-[10px] font-semibold text-slate-400">cm</span>
                                    </div>
                                    <button
                                        onClick={() => setEditMode("menu")}
                                        className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ) : editMode === "length" ? (
                                <div className="flex flex-col items-center gap-1 min-w-[160px]">
                                    {selectedWall && (
                                        <>
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
                                                        const targetLen = parseInt(editLength)
                                                        if (isNaN(targetLen)) return

                                                        // Accurate terminal/chain detection for menu update logic
                                                        const chainIds = new Set([selectedWall.id])
                                                        const dx = selectedWall.end.x - selectedWall.start.x
                                                        const dy = selectedWall.end.y - selectedWall.start.y
                                                        const centerLength = Math.sqrt(dx * dx + dy * dy)
                                                        const nx = -dy / centerLength
                                                        const ny = dx / centerLength
                                                        const faceNormal = { x: nx * (editFace === "interior" ? 1 : -1), y: ny * (editFace === "interior" ? 1 : -1) }

                                                        const back = findTerminal(selectedWall, selectedWall.start, chainIds, faceNormal)
                                                        const fwd = findTerminal(selectedWall, selectedWall.end, chainIds, faceNormal)
                                                        const totalChainCenter = centerLength + back.addedLen + fwd.addedLen

                                                        let currentTotal = totalChainCenter
                                                        if (editFace !== "center") {
                                                            currentTotal += getFaceOffsetAt(selectedWall, back.terminal, faceNormal, chainIds) +
                                                                getFaceOffsetAt(selectedWall, fwd.terminal, faceNormal, chainIds)
                                                        }

                                                        const delta = targetLen - currentTotal
                                                        if (selectedWall && Math.abs(delta) > 0.01) {
                                                            const targetWall = walls.find(w => w.id === back.terminalWallId) || selectedWall
                                                            const isTerminalStart = Math.sqrt(Math.pow(targetWall.start.x - back.terminal.x, 2) + Math.pow(targetWall.start.y - back.terminal.y, 2)) < 5.0
                                                            const side = isTerminalStart ? "left" : "right"
                                                            const currentTargetLen = Math.sqrt(Math.pow(targetWall.start.x - targetWall.end.x, 2) + Math.pow(targetWall.start.y - targetWall.end.y, 2))
                                                            onUpdateWallLength(targetWall.id, currentTargetLen + delta, side)
                                                        }

                                                        setEditMode("menu")
                                                    }}
                                                    className="p-1.5 bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-600 rounded-md transition-all"
                                                >
                                                    {Math.abs(selectedWall.start.y - selectedWall.end.y) < 1 ? "←" : "↑"}
                                                </button>
                                                <div className="flex items-center gap-1 bg-white border-2 border-slate-100 rounded-lg px-2 py-1">
                                                    <input
                                                        type="number"
                                                        autoFocus
                                                        value={editLength}
                                                        onChange={(e) => setEditLength(e.target.value)}
                                                        className="w-16 text-center text-lg font-bold text-slate-800 focus:outline-none"
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-400">cm</span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const targetLen = parseInt(editLength)
                                                        if (isNaN(targetLen)) return

                                                        // Accurate terminal/chain detection for menu update logic
                                                        const chainIds = new Set([selectedWall.id])
                                                        const dx = selectedWall.end.x - selectedWall.start.x
                                                        const dy = selectedWall.end.y - selectedWall.start.y
                                                        const centerLength = Math.sqrt(dx * dx + dy * dy)
                                                        const nx = -dy / centerLength
                                                        const ny = dx / centerLength
                                                        const faceNormal = { x: nx * (editFace === "interior" ? 1 : -1), y: ny * (editFace === "interior" ? 1 : -1) }


                                                        const back = findTerminal(selectedWall, selectedWall.start, chainIds, faceNormal)
                                                        const fwd = findTerminal(selectedWall, selectedWall.end, chainIds, faceNormal)
                                                        const totalChainCenter = centerLength + back.addedLen + fwd.addedLen

                                                        let currentTotal = totalChainCenter
                                                        if (editFace !== "center") {
                                                            currentTotal += getFaceOffsetAt(selectedWall, back.terminal, faceNormal, chainIds) +
                                                                getFaceOffsetAt(selectedWall, fwd.terminal, faceNormal, chainIds)
                                                        }

                                                        const delta = targetLen - currentTotal
                                                        if (selectedWall && Math.abs(delta) > 0.01) {
                                                            const targetWall = walls.find(w => w.id === fwd.terminalWallId) || selectedWall
                                                            const isTerminalStart = Math.sqrt(Math.pow(targetWall.start.x - fwd.terminal.x, 2) + Math.pow(targetWall.start.y - fwd.terminal.y, 2)) < 5.0
                                                            const side = isTerminalStart ? "left" : "right"
                                                            const currentTargetLen = Math.sqrt(Math.pow(targetWall.start.x - targetWall.end.x, 2) + Math.pow(targetWall.start.y - targetWall.end.y, 2))
                                                            onUpdateWallLength(targetWall.id, currentTargetLen + delta, side)
                                                        }

                                                        setEditMode("menu")
                                                    }}
                                                    className="p-1.5 bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-600 rounded-md transition-all"
                                                >
                                                    {Math.abs(selectedWall.start.y - selectedWall.end.y) < 1 ? "→" : "↓"}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                    {selectedElement && (
                                        <div className="flex flex-col gap-1.5 px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase w-8">Ancho</span>
                                                <input
                                                    type="number"
                                                    autoFocus
                                                    value={editLength}
                                                    onChange={(e) => setEditLength(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const updates: any = { width: parseInt(editLength) }
                                                            if (selectedElement.type === "window" && editHeight) updates.height = parseInt(editHeight)
                                                            onUpdateElement(selectedElement.type, selectedElement.id, updates)
                                                            setEditMode("menu")
                                                        }
                                                        if (e.key === 'Escape') setEditMode("menu")
                                                    }}
                                                    className="w-16 p-1 border-b border-slate-200 text-center text-xs font-bold text-slate-800 focus:border-sky-500 focus:outline-none transition-colors"
                                                />
                                                <span className="text-[9px] font-bold text-slate-400">cm</span>
                                            </div>
                                            {selectedElement.type === "window" && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase w-8">Alto</span>
                                                    <input
                                                        type="number"
                                                        value={editHeight}
                                                        onChange={(e) => setEditHeight(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                onUpdateElement(selectedElement.type, selectedElement.id, {
                                                                    width: parseInt(editLength),
                                                                    height: parseInt(editHeight)
                                                                })
                                                                setEditMode("menu")
                                                            }
                                                            if (e.key === 'Escape') setEditMode("menu")
                                                        }}
                                                        className="w-16 p-1 border-b border-slate-200 text-center text-xs font-bold text-slate-800 focus:border-sky-500 focus:outline-none transition-colors"
                                                    />
                                                    <span className="text-[9px] font-bold text-slate-400">cm</span>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => {
                                                    const updates: any = { width: parseInt(editLength) }
                                                    if (selectedElement.type === "window") updates.height = parseInt(editHeight)
                                                    onUpdateElement(selectedElement.type, selectedElement.id, updates)
                                                    setEditMode("menu")
                                                }}
                                                className="mt-1 w-full py-1 bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-bold rounded transition-colors"
                                            >
                                                Guardar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                        <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translate(-50%, 15px) scale(0.95); }
                            to { opacity: 1; transform: translate(-50%, 0) scale(1); }
                        }
                    `}</style>
                    </div>
                )
            }
        </div >
    )
}
