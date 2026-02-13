"use client"
import React from "react"
import { Stage, Layer, Group, Line, Rect, Text, Circle, Arc as KonvaArc, Arrow } from "react-konva"
import { Grid } from "./Grid"
import { getClosestPointOnSegment, generateArcPoints, getLineIntersection } from "@/lib/utils/geometry"
import { Scissors, Plus, Pencil, Trash2, X, RotateCcw, Copy, FlipHorizontal, FlipVertical, SquareDashed, Spline, Check } from "lucide-react"

interface Point { x: number; y: number }
interface Wall { id: string; start: Point; end: Point; thickness: number; isInvisible?: boolean }

interface Room { id: string; name: string; polygon: Point[]; area: number; color: string; visualCenter?: Point }

interface Door { id: string; wallId: string; t: number; width: number; flipX?: boolean; flipY?: boolean; openType?: "single" | "double" | "sliding" }
interface Window { id: string; wallId: string; t: number; width: number; height: number; flipY?: boolean; openType?: "single" | "double" }
interface Shunt { id: string; x: number; y: number; width: number; height: number; rotation: number }

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
    title?: string
}

const MenuButton: React.FC<MenuButtonProps> = ({ icon, onClick, variant = "default", title }) => (
    <button
        onClick={onClick}
        onMouseDown={(e) => e.stopPropagation()}
        title={title}
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
    shunts?: Shunt[]
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
    onUpdateWallLength: (id: string, length: number, side: "left" | "right", faceNormal?: Point) => void
    onDeleteWall: (id: string) => void
    onSplitWall?: (id: string, point?: Point) => void,
    onUpdateWallThickness: (id: string, thickness: number) => void
    onUpdateWallInvisible: (id: string, isInvisible: boolean) => void
    onUpdateRoom: (id: string, updates: Partial<Room>) => void
    onDeleteRoom: (id: string) => void
    onCloneRoom: (id: string) => void
    selectedWallIds: string[]
    selectedRoomId: string | null
    onSelectRoom: (id: string | null) => void
    onStartDragWall: () => void
    onDragElement: (type: "door" | "window" | "shunt", id: string, pointer: Point) => void
    selectedElement: { type: "door" | "window" | "shunt", id: string } | null
    onSelectElement: (element: { type: "door" | "window" | "shunt", id: string } | null) => void
    onUpdateElement: (type: "door" | "window" | "shunt", id: string, updates: any) => void
    onCloneElement: (type: "door" | "window" | "shunt", id: string) => void
    onDeleteElement: (type: "door" | "window" | "shunt", id: string) => void
    onUpdateShunt?: (id: string, updates: Partial<Shunt>) => void
    wallSnapshot: Wall[] | null
    bgImage?: string | null
    bgConfig?: { opacity: number, scale: number, x: number, y: number, rotation?: number }
    onUpdateBgConfig?: (updates: any) => void
    isCalibrating?: boolean
    calibrationPoints?: { p1: Point, p2: Point }
    calibrationTargetValue?: number
    onUpdateCalibrationPoint?: (id: "p1" | "p2", point: Point) => void
    phantomArc?: { start: Point, end: Point, depth: number }
    touchOffset?: number
    forceTouchOffset?: boolean
    snappingEnabled?: boolean
    rulerPoints?: { start: Point, end: Point } | null
    onReady?: (api: CanvasEngineRef) => void
    gridRotation?: number
    onRotateGrid?: (angle: number) => void
    isAdvancedEnabled?: boolean
    hideFloatingUI?: boolean
    showAllQuotes?: boolean
}

export interface CanvasEngineRef {
    getSnapshot: () => string
}


// Memoized Shunt Item to prevent re-renders during drag (fixes stutter)
const ShuntItem = React.memo(({
    shunt, isSelected, activeTool, walls, snappingEnabled, zoom, shunts,
    setDragShuntState, onSelect, onDragEnd, onEditDimensions, isEditing
}: {
    shunt: Shunt, isSelected: boolean, activeTool: string,
    walls: Wall[], snappingEnabled: boolean, zoom: number, shunts: Shunt[],
    setDragShuntState: (state: { id: string, x: number, y: number } | null) => void,
    onSelect: () => void,
    onDragEnd: (id: string, x: number, y: number) => void,
    onEditDimensions: (e: any) => void,
    isEditing: boolean
}) => {
    return (
        <Group
            id={`shunt-${shunt.id}`}
            name={`shunt-${shunt.id}`}
            x={shunt.x}
            y={shunt.y}
            draggable={activeTool === "select"}
            onClick={(e) => { e.cancelBubble = true; onSelect() }}
            onTap={(e) => { e.cancelBubble = true; onSelect() }}
            onDragStart={(e) => { onSelect() }}
            onDragMove={(e) => {
                const node = e.target as any
                let x = node.x()
                let y = node.y()

                // Precision
                x = Math.round(x * 10) / 10
                y = Math.round(y * 10) / 10

                if (snappingEnabled) {
                    let bestDist = 20
                    let bestSnap: { x: number, y: number } | null = null

                    walls.forEach(w => {
                        const p = { x, y }
                        const { point: proj, t } = getClosestPointOnSegment(p, w.start, w.end)
                        if (t >= 0 && t <= 1) {
                            const isHorizontalWall = Math.abs(w.start.y - w.end.y) < 1
                            const rotation = (shunt.rotation || 0) % 180
                            const is90 = Math.abs(rotation - 90) < 1
                            const effW = is90 ? shunt.height : shunt.width
                            const effH = is90 ? shunt.width : shunt.height
                            const halfSize = isHorizontalWall ? effH / 2 : effW / 2

                            const distToAxis = Math.sqrt(Math.pow(p.x - proj.x, 2) + Math.pow(p.y - proj.y, 2))
                            const targetDist = (w.thickness / 2) + halfSize
                            if (Math.abs(distToAxis - targetDist) < bestDist) {
                                let v = { x: p.x - proj.x, y: p.y - proj.y }
                                const len = Math.sqrt(v.x * v.x + v.y * v.y)
                                if (len > 0.001) {
                                    v = { x: v.x / len, y: v.y / len }
                                    bestSnap = {
                                        x: proj.x + v.x * targetDist,
                                        y: proj.y + v.y * targetDist
                                    }
                                    bestDist = Math.abs(distToAxis - targetDist)
                                }
                            }
                        }
                    })
                    if (bestSnap) {
                        x = (bestSnap as any).x
                        y = (bestSnap as any).y
                    }

                    // --- SHUNT-TO-SHUNT MAGNETIC ALIGNMENT ---
                    const alignThreshold = 10 / zoom
                    let alignX: number | null = null
                    let alignY: number | null = null
                    let minDiffX = Infinity
                    let minDiffY = Infinity

                    shunts.forEach(s => {
                        if (s.id === shunt.id) return
                        const diffX = Math.abs(x - s.x)
                        if (diffX < alignThreshold && diffX < minDiffX) {
                            minDiffX = diffX
                            alignX = s.x
                        }
                        const diffY = Math.abs(y - s.y)
                        if (diffY < alignThreshold && diffY < minDiffY) {
                            minDiffY = diffY
                            alignY = s.y
                        }
                    })

                    if (alignX !== null) x = alignX
                    if (alignY !== null) y = alignY
                }

                node.x(x)
                node.y(y)
                setDragShuntState({ id: shunt.id, x, y })
            }}
            onDragEnd={(e) => {
                const node = e.target
                setDragShuntState(null)
                onDragEnd(shunt.id, node.x(), node.y())
            }}
        >
            <Rect
                width={shunt.width}
                height={shunt.height}
                offsetX={shunt.width / 2}
                offsetY={shunt.height / 2}
                fill="white"
                stroke={isSelected ? "#0ea5e9" : "#334155"}
                strokeWidth={2}
            />
            {isSelected && !isEditing && (
                <Text
                    x={0}
                    y={0}
                    text={`${shunt.width}x${shunt.height}`}
                    fontSize={12 / zoom}
                    fill="#334155"
                    align="center"
                    verticalAlign="middle"
                    width={120 / zoom}
                    height={30 / zoom}
                    offsetX={60 / zoom}
                    offsetY={15 / zoom}
                    onClick={(e) => { e.cancelBubble = true; onEditDimensions(e) }}
                    onTap={(e) => { e.cancelBubble = true; onEditDimensions(e) }}
                />
            )}
        </Group>
    )
}, (prev, next) => {
    // Only re-render if data changes (ignore parent render caused by drag state)
    // We treat walls as static for this purpose (or if they change we re-render)
    return prev.shunt.x === next.shunt.x &&
        prev.shunt.y === next.shunt.y &&
        prev.isSelected === next.isSelected &&
        prev.activeTool === next.activeTool &&
        prev.zoom === next.zoom && // zoom affects threshold logic
        prev.shunts === next.shunts &&
        prev.isEditing === next.isEditing
})

export const CanvasEngine = ({
    width, height, zoom, offset,
    walls, rooms, doors, windows, shunts = [],
    currentWall, activeTool, hoveredWallId, onPan, onZoom, onMouseDown, onMouseMove, onMouseUp, onHoverWall, onSelectWall, onDragWall, onDragEnd, onUpdateWallLength, onDeleteWall, onSplitWall, onUpdateWallThickness, onUpdateWallInvisible, onUpdateRoom, onDeleteRoom, onCloneRoom, selectedWallIds, selectedRoomId, onSelectRoom, onDragVertex, wallSnapshot, onStartDragWall, onDragElement, selectedElement, onSelectElement, onUpdateElement, onCloneElement, onDeleteElement, onUpdateShunt, bgImage, bgConfig, onUpdateBgConfig, isCalibrating, calibrationPoints, calibrationTargetValue, onUpdateCalibrationPoint,
    phantomArc,
    snappingEnabled = true,
    rulerPoints,
    onReady,
    gridRotation = 0,
    onRotateGrid,
    touchOffset = 40,
    forceTouchOffset = false,
    isAdvancedEnabled = false,
    hideFloatingUI = false,
    showAllQuotes = false
}: CanvasEngineProps) => {
    const stageRef = React.useRef<any>(null)
    const gridRef = React.useRef<any>(null)
    const [dragShuntState, setDragShuntState] = React.useState<{ id: string, x: number, y: number } | null>(null)
    const [image, setImage] = React.useState<HTMLImageElement | null>(null)

    // Generic Input State for Inline Editing (Shunts, Doors, Windows, Measures)
    const [editInputState, setEditInputState] = React.useState<{
        id: string, // Unique ID of the element/measurement being edited to hide the static text
        type: string, // "shunt-dist", "door-width", etc
        val: number,
        screenPos: { x: number, y: number },
        onCommit: (newVal: number) => void
    } | null>(null)

    const isSamePoint = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < 5.0
    const lastTapRef = React.useRef<number>(0)
    const dragOffsetRef = React.useRef<{ x: number, y: number } | null>(null)
    const lastClickedWallForEdit = React.useRef<string | null>(null)

    // Calculate the geometric center of all floor plan content
    const calculateFloorPlanCenter = React.useCallback(() => {
        if (walls.length === 0 && rooms.length === 0) {
            return { x: 0, y: 0 }
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

        walls.forEach(w => {
            minX = Math.min(minX, w.start.x, w.end.x)
            minY = Math.min(minY, w.start.y, w.end.y)
            maxX = Math.max(maxX, w.start.x, w.end.x)
            maxY = Math.max(maxY, w.start.y, w.end.y)
        })

        rooms.forEach(r => {
            r.polygon.forEach(p => {
                minX = Math.min(minX, p.x)
                minY = Math.min(minY, p.y)
                maxX = Math.max(maxX, p.x)
                maxY = Math.max(maxY, p.y)
            })
        })

        return {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2
        }
    }, [walls, rooms])

    const floorPlanCenter = calculateFloorPlanCenter()
    const displayedMeasures = new Set<string>()
    displayedMeasures.clear() // Explicitly clear to ensure no leak/stale data in specific React render scenarios

    const facadeChains = React.useMemo(() => {
        const currentWS = wallSnapshot || walls
        const facadeWalls = currentWS.filter(w => w.thickness === 20 && !w.isInvisible)
        if (facadeWalls.length === 0) return []

        const chains: { points: number[], closed: boolean }[] = []
        const visited = new Set<string>()

        facadeWalls.forEach(startWall => {
            if (visited.has(startWall.id)) return

            let currentChain: Point[] = [startWall.start, startWall.end]
            visited.add(startWall.id)

            // Grow forward
            let growing = true
            while (growing) {
                growing = false
                const lastP = currentChain[currentChain.length - 1]
                const nextWall = facadeWalls.find(w => !visited.has(w.id) && (isSamePoint(w.start, lastP) || isSamePoint(w.end, lastP)))
                if (nextWall) {
                    visited.add(nextWall.id)
                    const nextP = isSamePoint(nextWall.start, lastP) ? nextWall.end : nextWall.start
                    currentChain.push(nextP)
                    growing = true
                }
            }

            // Grow backward
            growing = true
            while (growing) {
                growing = false
                const firstP = currentChain[0]
                const prevWall = facadeWalls.find(w => !visited.has(w.id) && (isSamePoint(w.start, firstP) || isSamePoint(w.end, firstP)))
                if (prevWall) {
                    visited.add(prevWall.id)
                    const prevP = isSamePoint(prevWall.start, firstP) ? prevWall.end : prevWall.start
                    currentChain.unshift(prevP)
                    growing = true
                }
            }

            const isLoop = isSamePoint(currentChain[0], currentChain[currentChain.length - 1]) && currentChain.length > 2
            if (isLoop) currentChain.pop()

            chains.push({
                points: currentChain.flatMap(p => [p.x, p.y]),
                closed: isLoop
            })
        })

        return chains
    }, [walls, wallSnapshot])

    const getSnapshot = React.useCallback(() => {
        console.log("DEBUG: getSnapshot called")
        const stage = stageRef.current
        if (!stage) {
            console.log("DEBUG: Stage ref missing")
            return ""
        }

        // 1. Calculate Logical Bounds of content (Walls & Rooms)
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        let hasContent = false

        walls.forEach(w => {
            hasContent = true
            minX = Math.min(minX, w.start.x, w.end.x)
            minY = Math.min(minY, w.start.y, w.end.y)
            maxX = Math.max(maxX, w.start.x, w.end.x)
            maxY = Math.max(maxY, w.start.y, w.end.y)
        })

        rooms.forEach(r => {
            r.polygon.forEach(p => {
                hasContent = true
                minX = Math.min(minX, p.x)
                minY = Math.min(minY, p.y)
                maxX = Math.max(maxX, p.x)
                maxY = Math.max(maxY, p.y)
            })
        })

        console.log(`DEBUG: hasContent=${hasContent}, Bounds: ${minX},${minY} - ${maxX},${maxY}`)

        if (!hasContent) {
            return stage.toDataURL({ mimeType: "image/png" })
        }

        // Add padding (e.g. 50cm around)
        const PADDING = 50
        minX -= PADDING
        minY -= PADDING
        maxX += PADDING
        maxY += PADDING

        const logicalWidth = maxX - minX
        const logicalHeight = maxY - minY

        // 2. Convert to Screen Coordinates (using current zoom/offset)
        const screenX = minX * zoom + offset.x
        const screenY = minY * zoom + offset.y
        const screenWidth = logicalWidth * zoom
        const screenHeight = logicalHeight * zoom

        // --- SNAPSHOT PREPARATION ---
        const container = stage.container()
        const originalBg = container.style.backgroundColor
        const wasGridVisible = gridRef.current?.visible()

        // A. Set white background on container (more reliable than Rect)
        container.style.backgroundColor = 'white'

        // B. Hide Grid
        if (gridRef.current) gridRef.current.visible(false)

        // FORCE SYNCHRONOUS DRAW to apply changes before data extraction
        stage.batchDraw()

        // 3. Export specific area
        const dataUrl = stage.toDataURL({
            x: screenX,
            y: screenY,
            width: screenWidth,
            height: screenHeight,
            pixelRatio: 2,
            mimeType: "image/png"
        })
        console.log(`DEBUG: Snapshot generated, len=${dataUrl?.length}`)

        // --- RESTORE STATE ---
        container.style.backgroundColor = originalBg
        if (gridRef.current && wasGridVisible !== undefined) gridRef.current.visible(wasGridVisible)
        stage.batchDraw()

        return dataUrl
    }, [walls, rooms, zoom, offset])

    React.useEffect(() => {
        if (onReady) {
            console.log("DEBUG: Calling onReady with getSnapshot")
            onReady({ getSnapshot })
        } else {
            console.log("DEBUG: onReady prop missing in CanvasEngine")
        }
    }, [onReady, getSnapshot])

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
    const [editMode, setEditMode] = React.useState<"menu" | "length" | "thickness" | "room" | "room-custom" | null>(null)
    const [editLength, setEditLength] = React.useState<string>("")
    const [editHeight, setEditHeight] = React.useState<string>("")
    const [editThickness, setEditThickness] = React.useState<string>("")
    const [editFace, setEditFace] = React.useState<"center" | "interior" | "exterior">("interior")
    const dragStartPos = React.useRef<Point | null>(null)
    const dragStartPointerPos = React.useRef<Point | null>(null) // Para calcular delta del ratón sin saltos
    const isDraggingVertexRef = React.useRef(false) // Manual drag state
    const lastPointerPos = React.useRef<Point | null>(null) // Para el panning
    const isAimingDrawing = React.useRef(false) // Track if touch user is aiming before committing draw point
    const aimingStartPos = React.useRef<Point | null>(null) // Where touch started (for tap detection)
    const [isMobile, setIsMobile] = React.useState(false)

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768 || (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)))
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Componente Teclado Numérico Personalizado para Móvil - Estilo Bottom Sheet
    const NumericKeypad = ({ value, onChange, onConfirm, onCancel, title }: { value: string, onChange: (v: string) => void, onConfirm: (val: string) => void, onCancel: () => void, title: string }) => {
        // Use local state for editing - only send to parent on OK
        const [tempValue, setTempValue] = React.useState(value)
        const [isFirstInput, setIsFirstInput] = React.useState(true)

        // Reset when keypad opens (value changes from parent)
        React.useEffect(() => {
            setTempValue(value)
            setIsFirstInput(true)
        }, [value])

        const handleDigit = (digit: string) => {
            if (isFirstInput) {
                // First input replaces the entire value
                setTempValue(digit)
                setIsFirstInput(false)
            } else {
                // Subsequent inputs append
                if (tempValue.length < 5) setTempValue(tempValue + digit)
            }
        }

        const handleDelete = () => {
            if (isFirstInput) {
                // Delete all on first click
                setTempValue("")
                setIsFirstInput(false)
            } else {
                // Normal backspace
                setTempValue(tempValue.slice(0, -1))
            }
        }

        const handleConfirm = () => {
            // Send final value to parent
            onChange(tempValue)
            onConfirm(tempValue)
        }

        return (
            <div className="w-full bg-white border-t-2 border-slate-200 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                {/* Value Display */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-slate-800">{tempValue || "0"}</span>
                    </div>
                </div>

                {/* Keyboard Row */}
                <div className="flex items-center gap-0.5 p-1.5">
                    {/* Digits 0-9 */}
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map(digit => (
                        <button
                            key={digit}
                            onTouchStart={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDigit(digit)
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDigit(digit)
                            }}
                            className="flex-1 h-11 flex items-center justify-center rounded-md text-lg font-bold bg-slate-50 text-slate-800 hover:bg-slate-100 active:bg-sky-200 transition-all border border-slate-200"
                        >
                            {digit}
                        </button>
                    ))}

                    {/* Delete Button */}
                    <button
                        onTouchStart={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDelete()
                        }}
                        onTouchEnd={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                        }}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDelete()
                        }}
                        className="flex-1 h-11 flex items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-300 transition-all border border-red-200"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>

                    <button
                        onTouchStart={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleConfirm()
                        }}
                        onTouchEnd={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                        }}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleConfirm()
                        }}
                        className="flex-[1.2] h-11 flex items-center justify-center rounded-md bg-sky-500 text-white font-bold text-base hover:bg-sky-600 active:bg-sky-700 transition-all active:scale-95 shadow-lg shadow-sky-200"
                    >
                        OK
                    </button>
                </div>
            </div>
        )
    }

    const NumericInput = ({ label, value, setter, onEnter, placeholder, step = 1 }: { label?: string, value: string, setter: (v: string) => void, onEnter: (val?: string) => void, placeholder?: string, step?: number }) => {
        const [showKeypad, setShowKeypad] = React.useState(false)

        if (isMobile) {
            return (
                <div className="flex items-center gap-1">
                    <button
                        onPointerDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            // Only open on touch/pen, not mouse
                            if (e.pointerType === 'touch' || e.pointerType === 'pen') {
                                setShowKeypad(true)
                            }
                        }}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            // Fallback for mouse/desktop
                            setShowKeypad(true)
                        }}
                        className="min-w-[100px] h-10 px-3 bg-white border-2 border-sky-400 rounded-xl text-center text-lg font-black text-slate-800 hover:bg-sky-50 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1"
                    >
                        {value || placeholder || "0"}
                    </button>
                    {showKeypad && (
                        <div
                            className="fixed inset-0 z-[3000] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                            onTouchEnd={(e) => {
                                // Only close if touching the backdrop, not the keypad
                                if (e.target === e.currentTarget) {
                                    setShowKeypad(false)
                                }
                            }}
                            onClick={(e) => {
                                // Fallback for mouse
                                if (e.target === e.currentTarget) {
                                    setShowKeypad(false)
                                }
                            }}
                        >
                            <div className="fixed bottom-0 left-0 right-0 safe-area-inset-bottom" onTouchEnd={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                                <NumericKeypad
                                    title={label || "Introducir valor"}
                                    value={value}
                                    onChange={setter}
                                    onConfirm={(val) => {
                                        onEnter(val)
                                        setShowKeypad(false)
                                    }}
                                    onCancel={() => setShowKeypad(false)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )
        }

        return (
            <input
                type="text"
                inputMode="decimal"
                autoFocus
                value={value}
                onChange={(e) => {
                    // Normalize comma to dot
                    const val = e.target.value.replace(/,/g, '.')
                    // Allow only numbers and dots
                    if (/^[\d.]*$/.test(val)) {
                        setter(val)
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onEnter(value)
                }}
                onDoubleClick={(e) => e.currentTarget.select()}
                className="w-20 p-1.5 border-2 border-slate-200 rounded-lg text-center text-sm font-bold text-slate-800 focus:border-sky-500 focus:outline-none transition-colors"
                placeholder={placeholder}
            />
        )
    }

    const wallsRef = React.useRef(walls)
    const pointerTypeRef = React.useRef<string>("mouse")
    React.useEffect(() => {
        wallsRef.current = walls
    }, [walls])

    // Keyboard shortcuts for grid rotation
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!onRotateGrid) return

            // Check if user is typing in an input/textarea
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

            if (e.key === '[') {
                // Rotate counter-clockwise
                e.preventDefault()
                onRotateGrid(gridRotation - 15)
            } else if (e.key === ']') {
                // Rotate clockwise
                e.preventDefault()
                onRotateGrid(gridRotation + 15)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onRotateGrid, gridRotation])

    // Global listeners for MANUAL VERTEX DRAGGING (Fixes ghosting)
    React.useEffect(() => {
        const handleVertexMove = (e: PointerEvent) => {
            if (!isDraggingVertexRef.current || !dragStartPointerPos.current || !dragStartPos.current || !stageRef.current) return

            e.preventDefault()

            const stage = stageRef.current
            const transform = stage.getAbsoluteTransform().copy()
            transform.invert()

            const container = stage.container()
            const rect = container.getBoundingClientRect()

            let clientX = e.clientX
            let clientY = e.clientY

            // Apply vertical offset for touch to avoid finger covering the vertex
            if (e.pointerType === "touch" || forceTouchOffset) {
                clientY -= touchOffset
            }

            const pos = {
                x: clientX - rect.left,
                y: clientY - rect.top
            }
            const pointer = transform.point(pos)

            let totalDelta = {
                x: pointer.x - dragStartPointerPos.current.x,
                y: pointer.y - dragStartPointerPos.current.y
            }

            // --- SNAPPING LOGIC START ---
            const currentPos = {
                x: dragStartPos.current.x + totalDelta.x,
                y: dragStartPos.current.y + totalDelta.y
            }

            const SNAP_TOL = 15 // Pixels verification (in screen space? no, logic space) -> 15cm is good
            let bestSnapX: number | null = null
            let bestSnapY: number | null = null
            let minDiffX = SNAP_TOL
            let minDiffY = SNAP_TOL

            // Iterate all wall endpoints to find snapping candidates
            // We must exclude the vertices we are currently dragging to avoid self-snapping (trivial 0 distance)
            // draggingVertexWallIds contains IDs of walls affected.
            // A vertex is shared by multiple walls. simple exclusion:
            // exclude points that are "close enough" to startPos (meaning they are the point we are moving)
            // Actually, we want to snap to *other* vertices.

            // Use ref to get latest walls without re-binding listener
            wallsRef.current.forEach(w => {
                [w.start, w.end].forEach(p => {
                    // Don't snap to the point we are dragging (originally)
                    if (Math.abs(p.x - dragStartPos.current!.x) < 1 && Math.abs(p.y - dragStartPos.current!.y) < 1) return

                    // Vertical alignment (X match)
                    const diffX = Math.abs(currentPos.x - p.x)
                    if (diffX < minDiffX) {
                        minDiffX = diffX
                        bestSnapX = p.x
                    }

                    // Horizontal alignment (Y match)
                    const diffY = Math.abs(currentPos.y - p.y)
                    if (diffY < minDiffY) {
                        minDiffY = diffY
                        bestSnapY = p.y
                    }
                })
            })

            const guides: { x?: number, y?: number } = {}

            if (bestSnapX !== null) {
                totalDelta.x = bestSnapX - dragStartPos.current.x
                guides.x = bestSnapX
            }
            if (bestSnapY !== null) {
                totalDelta.y = bestSnapY - dragStartPos.current.y
                guides.y = bestSnapY
            }

            setAlignmentGuides(Object.keys(guides).length > 0 ? guides : null)
            // --- SNAPPING LOGIC END ---

            onDragVertex(dragStartPos.current, totalDelta, draggingVertexWallIds.current)
        }

        const handleVertexUp = (e: PointerEvent) => {
            if (isDraggingVertexRef.current) {
                isDraggingVertexRef.current = false
                dragStartPos.current = null
                dragStartPointerPos.current = null
                setAlignmentGuides(null) // Clear guides
                onDragEnd()
                document.body.style.cursor = 'default'
            }
        }

        window.addEventListener('pointermove', handleVertexMove)
        window.addEventListener('pointerup', handleVertexUp)

        return () => {
            window.removeEventListener('pointermove', handleVertexMove)
            window.removeEventListener('pointerup', handleVertexUp)
        }
    }, [onDragVertex, onDragEnd, touchOffset, forceTouchOffset]) // Added touchOffset and forceTouchOffset to dependencies

    const isPanning = React.useRef(false)
    const draggingVertexWallIds = React.useRef<string[]>([])
    // Pinch-to-zoom refs
    const lastDist = React.useRef<number>(0)
    const lastCenter = React.useRef<Point | null>(null)

    const getDistance = (p1: Point, p2: Point) => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
    }

    const getCenter = (p1: Point, p2: Point) => {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2,
        }
    }
    const [isPanningState, setIsPanningState] = React.useState(false)
    const [menuDragOffset, setMenuDragOffset] = React.useState<Point>({ x: 0, y: 0 })
    const [isDraggingMenuState, setIsDraggingMenuState] = React.useState(false) // State version for Effect
    const menuDragStart = React.useRef<Point | null>(null)
    const cellSize = 100 // 1 metro = 100 píxeles (1px = 1cm)

    // Global listeners for menu dragging to prevent "getting stuck"
    React.useEffect(() => {
        if (!isDraggingMenuState) return

        const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
            if (menuDragStart.current) {
                const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
                const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

                // IMPORTANTE: En móvil el scrolling puede interferir, prevenimos si estamos arrastrando menú
                if ('touches' in e) e.preventDefault()

                setMenuDragOffset({
                    x: clientX - menuDragStart.current.x,
                    y: clientY - menuDragStart.current.y
                })
            }
        }

        const handleGlobalEnd = () => {
            setIsDraggingMenuState(false)
            menuDragStart.current = null
        }

        window.addEventListener('mousemove', handleGlobalMove)
        window.addEventListener('mouseup', handleGlobalEnd)
        window.addEventListener('touchmove', handleGlobalMove, { passive: false })
        window.addEventListener('touchend', handleGlobalEnd)
        return () => {
            window.removeEventListener('mousemove', handleGlobalMove)
            window.removeEventListener('mouseup', handleGlobalEnd)
            window.removeEventListener('touchmove', handleGlobalMove)
            window.removeEventListener('touchend', handleGlobalEnd)
        }
    }, [isDraggingMenuState])

    const selectedWall = selectedWallIds.length === 1 ? walls.find(w => w.id === selectedWallIds[0]) : null
    const selectedRoom = rooms.find(r => r.id === selectedRoomId)

    const roomTypes = [
        "Salón", "Cocina", "Cocina Abierta", "Cocina Americana",
        "Baño", "Dormitorio", "Pasillo", "Hall", "Terraza",
        "Trastero", "Vestidor", "Otro"
    ]

    React.useEffect(() => {
        if (selectedWallIds.length === 1) {
            const wall = walls.find(w => w.id === selectedWallIds[0])
            if (wall) {
                const dx = wall.end.x - wall.start.x
                const dy = wall.end.y - wall.start.y
                setEditLength(Math.sqrt(dx * dx + dy * dy).toFixed(1))
                setEditThickness(wall.isInvisible ? "0" : wall.thickness.toString())
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
                : selectedElement.type === "window"
                    ? windows.find(w => w.id === selectedElement.id)
                    : shunts.find(s => s.id === selectedElement.id)

            if (el) {
                setEditLength(el.width.toFixed(1))
                if ('height' in el) setEditHeight(el.height.toFixed(1))
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
            : selectedElement.type === "window"
                ? windows.find(w => w.id === selectedElement.id)
                : shunts.find(s => s.id === selectedElement.id)

        if (!el) return null

        if (selectedElement.type === "shunt") {
            const shunt = el as Shunt
            return {
                x: shunt.x * zoom + offset.x,
                y: shunt.y * zoom + offset.y
            }
        }

        const wall = walls.find(w => w.id === (el as any).wallId)
        if (!wall) return null
        return {
            x: (wall.start.x + (el as any).t * (wall.end.x - wall.start.x)) * zoom + offset.x,
            y: (wall.start.y + (el as any).t * (wall.end.y - wall.start.y)) * zoom + offset.y
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
    const getRoomIdAt = (p: Point) => rooms.find(r => isPointInPolygon(p, r.polygon))?.id

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

    const getRawPointerPosition = (stage: any) => {
        const pointer = stage.getPointerPosition()
        if (!pointer) return { x: 0, y: 0 }
        return {
            x: (pointer.x - offset.x) / zoom,
            y: (pointer.y - offset.y) / zoom
        }
    }

    const getRelativePointerPosition = (stage: any, overridePos?: Point) => {
        const pointer = overridePos || stage.getPointerPosition()
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

        // 4. ROUNDING FINAL (1cm grid) -> Relaxed to 0.1 (1mm) for precision
        return {
            x: Math.round(point.x * 10) / 10,
            y: Math.round(point.y * 10) / 10
        }
    }

    const findTerminal = (startWall: Wall, startP: Point, visited: Set<string>, faceNormal: Point, isInterior: boolean) => {
        const TOL = 5.0
        let curr = startP
        let addedLen = 0
        let terminalWallId = startWall.id
        while (true) {
            const neighbors = walls.filter(w => !visited.has(w.id) && !w.isInvisible && (
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

            // NEW: Break chain if face status (Interior vs Exterior) changes.
            // This prevents "Exterior" chains from swallowing shared walls that are actually interior.
            const midP_cont = { x: (cont.start.x + cont.end.x) / 2, y: (cont.start.y + cont.end.y) / 2 }
            const testP_cont = { x: midP_cont.x + faceNormal.x * 12, y: midP_cont.y + faceNormal.y * 12 }
            const contIsInterior = isPointInAnyRoom(testP_cont)
            if (contIsInterior !== isInterior) {
                return { terminal: curr, addedLen, terminalWallId }
            }

            // Check if ANY other neighbor (perpendicular) blocks this specific face
            // FACADE FIX: If we are measuring facade (exterior), we IGNORE partitions.
            if (isInterior) {
                const isBlocked = neighbors.some(nw => {
                    const nwHorizontal = Math.abs(nw.start.y - nw.end.y) < 2.0
                    const nwVertical = Math.abs(nw.start.x - nw.end.x) < 2.0
                    const wallHorizontal = Math.abs(startWall.start.y - startWall.end.y) < 2.0
                    const wallVertical = Math.abs(startWall.start.x - startWall.end.x) < 2.0
                    const isPerpendicular = (nwHorizontal !== wallHorizontal || nwVertical !== wallVertical)

                    if (!isPerpendicular) return false

                    const pOther = Math.sqrt(Math.pow(nw.start.x - curr.x, 2) + Math.pow(nw.start.y - curr.y, 2)) < TOL ? nw.end : nw.start
                    const dir = { x: pOther.x - curr.x, y: pOther.y - curr.y }
                    const dotFace = dir.x * faceNormal.x + dir.y * faceNormal.y
                    return dotFace > 0.5 // Si un muro perpendicular sale hacia este lado, bloquea la cadena de medida
                })

                if (isBlocked) return { terminal: curr, addedLen, terminalWallId }
            }

            visited.add(cont.id)
            const segmentLen = Math.sqrt(Math.pow(cont.end.x - cont.start.x, 2) + Math.pow(cont.end.y - cont.start.y, 2))
            addedLen += segmentLen
            terminalWallId = cont.id
            curr = Math.sqrt(Math.pow(cont.start.x - curr.x, 2) + Math.pow(cont.start.y - curr.y, 2)) < TOL ? cont.end : cont.start
        }
    }

    const getFaceOffsetAt = (wall: Wall, point: Point, faceNormal: Point, ignoreIds: Set<string> = new Set(), isEnd: boolean) => {
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

            if (Math.abs(cross) < 0.05) {
                const dot = ux * nux + uy * nuy
                if (Math.abs(dot) > 0.95) hasContinuation = true
                return
            }

            const isAtStart = Math.sqrt(Math.pow(nw.start.x - point.x, 2) + Math.pow(nw.start.y - point.y, 2)) < TOL
            const isAtEnd = Math.sqrt(Math.pow(nw.end.x - point.x, 2) + Math.pow(nw.end.y - point.y, 2)) < TOL

            let blocksFace = false
            let localDotFace = 0
            if (!isAtStart && !isAtEnd) {
                blocksFace = true
            } else {
                const otherP = isAtStart ? nw.end : nw.start
                const dir = { x: otherP.x - point.x, y: otherP.y - point.y }
                localDotFace = dir.x * faceNormal.x + dir.y * faceNormal.y
                blocksFace = localDotFace > 0.5
            }

            if (blocksFace || (isConnectedPerpendicular(wall, nw) && localDotFace < -0.5)) {
                const D = wall.thickness / 2
                const K = nw.thickness / 2
                const nnx = -nuy, nny = nux

                const solveS = (targetK: number) => {
                    const rx = targetK * nnx - D * faceNormal.x
                    const ry = targetK * nny - D * faceNormal.y
                    return (rx * nuy - ry * nux) / cross
                }
                const s1 = solveS(K), s2 = solveS(-K)
                if (blocksFace) {
                    retractions.push(isEnd ? Math.min(s1, s2) : Math.max(s1, s2))
                } else {
                    extensions.push(isEnd ? Math.max(s1, s2) : Math.min(s1, s2))
                }
            }
        })

        if (retractions.length > 0) return isEnd ? Math.min(...retractions) : Math.max(...retractions)
        if (hasContinuation) return 0
        if (extensions.length > 0) return isEnd ? Math.max(...extensions) : Math.min(...extensions)
        return 0
    }

    // Sync editLength when editFace changes to match the visualized dimension
    React.useEffect(() => {
        if (!selectedWall || editMode !== "length") {
            lastClickedWallForEdit.current = null
            return
        }

        // If we just clicked a specific label, wait until the selection state matches
        // before allowing the automatic sync to overwrite anything.
        if (lastClickedWallForEdit.current && selectedWall.id !== lastClickedWallForEdit.current) {
            return
        }

        // Clear the lock once we have a match or if we are just toggling faces within the menu
        lastClickedWallForEdit.current = null

        const dx = selectedWall.end.x - selectedWall.start.x
        const dy = selectedWall.end.y - selectedWall.start.y
        const centerLength = Math.sqrt(dx * dx + dy * dy)

        let targetLen = centerLength
        if (editFace !== "center") {
            const nx = -dy / centerLength
            const ny = dx / centerLength
            const faceNormal = { x: nx * (editFace === "interior" ? 1 : -1), y: ny * (editFace === "interior" ? 1 : -1) }

            const isInterior = (editFace === "interior") || (() => {
                const midP = { x: (selectedWall.start.x + selectedWall.end.x) / 2, y: (selectedWall.start.y + selectedWall.end.y) / 2 }
                const testP = { x: midP.x + faceNormal.x * 12, y: midP.y + faceNormal.y * 12 }
                return isPointInAnyRoom(testP)
            })()
            const chainIds = new Set([selectedWall.id])

            // GLOBAL CHAIN LOGIC: Always sync with the total chain length (Interior or Exterior)
            // to maintain consistency with the visualized labels.
            const back = findTerminal(selectedWall, selectedWall.start, chainIds, faceNormal, isInterior)
            const forward = findTerminal(selectedWall, selectedWall.end, chainIds, faceNormal, isInterior)
            const chainLen = centerLength + back.addedLen + forward.addedLen

            const terminalStartWall = walls.find(w => w.id === back.terminalWallId) || selectedWall
            const terminalEndWall = walls.find(w => w.id === forward.terminalWallId) || selectedWall

            targetLen = chainLen +
                getFaceOffsetAt(terminalEndWall, forward.terminal, faceNormal, chainIds, true) -
                getFaceOffsetAt(terminalStartWall, back.terminal, faceNormal, chainIds, false)
        }

        setEditLength(targetLen.toFixed(1))
    }, [editFace, selectedWall, editMode])

    const renderWallMeasurement = (wall: Wall, offsetVal: number, forceColor?: string, forceInteractive?: boolean, overrideLength?: number) => {
        if (wall.id.startsWith("wall-arc-")) return null

        const dx = wall.end.x - wall.start.x
        const dy = wall.end.y - wall.start.y
        if (wall.isInvisible) return null
        const centerLength = Math.sqrt(dx * dx + dy * dy)

        const nx = -dy / centerLength
        const ny = dx / centerLength
        const faceNormal = { x: nx * Math.sign(offsetVal), y: ny * Math.sign(offsetVal) }

        // Deterministic face type based on offset side
        const faceType: "interior" | "exterior" = offsetVal > 0 ? "interior" : "exterior"
        const midP = { x: (wall.start.x + wall.end.x) / 2, y: (wall.start.y + wall.end.y) / 2 }
        const testP = { x: midP.x + faceNormal.x * 12, y: midP.y + faceNormal.y * 12 }
        const isInterior = (faceType === "interior") || isPointInAnyRoom(testP)

        // COLLINEAR CHAIN SEARCH
        const chainIds = new Set([wall.id])
        const back = findTerminal(wall, wall.start, chainIds, faceNormal, isInterior)
        const forward = findTerminal(wall, wall.end, chainIds, faceNormal, isInterior)

        const totalChainCenter = centerLength + back.addedLen + forward.addedLen
        const terminalStartWall = walls.find(w => w.id === back.terminalWallId) || wall
        const terminalEndWall = walls.find(w => w.id === forward.terminalWallId) || wall

        const finalOffStart = getFaceOffsetAt(terminalStartWall, back.terminal, faceNormal, chainIds, false)
        const finalOffEnd = getFaceOffsetAt(terminalEndWall, forward.terminal, faceNormal, chainIds, true)

        // CHAIN SELECTION & COLOR LOGIC
        const isAnyInChainSelected = Array.from(chainIds).some(id => selectedWallIds.includes(id))
        const isDragging = dragStartPos.current !== null

        // NEW VISIBILITY LOGIC
        let isVisible = false
        if (showAllQuotes || isAnyInChainSelected || isDragging) {
            isVisible = true
        } else if (selectedRoomId) {
            // Check if measurement is inside the selected room
            const selectedRoom = rooms.find(r => r.id === selectedRoomId)
            if (selectedRoom) {
                // If room is very small (< 2m²), do NOT show internal measurements to avoid clutter
                if (selectedRoom.area < 2) {
                    isVisible = false
                } else {
                    // In-line checks for simplicity or use existing helpers
                    // Ray-casting for Point in Polygon
                    let inside = false
                    const polygon = selectedRoom.polygon
                    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                        const xi = polygon[i].x, yi = polygon[i].y
                        const xj = polygon[j].x, yj = polygon[j].y
                        const intersect = ((yi > testP.y) !== (yj > testP.y)) &&
                            (testP.x < (xj - xi) * (testP.y - yi) / (yj - yi) + xi)
                        if (intersect) inside = !inside
                    }
                    if (inside) isVisible = true
                }
            }
        }

        if (!isVisible) return null

        const isInteractive = forceInteractive ?? isAnyInChainSelected
        const defaultColor = isInteractive
            ? (faceType === "interior" ? "#0ea5e9" : "#f59e0b")
            : "#64748b"
        const color = forceColor || defaultColor

        // LEADER LOGIC: Exactly one label per chain.
        const sortedIds = Array.from(chainIds).sort()
        const isLeader = wall.id === sortedIds[0]
        if (!isLeader) return null

        const calculatedLen = totalChainCenter + finalOffEnd - finalOffStart
        const displayLength = overrideLength !== undefined ? overrideLength : parseFloat(calculatedLen.toFixed(1))

        const ux = dx / centerLength
        const uy = dy / centerLength

        // Offset visual de la línea de medida - CLOSE TO WALL
        const isShortWall = displayLength < 60
        // Scale offset to ensure it never touches the wall
        const baseOffsetFactor = 1.4
        const visualOff = isShortWall ? offsetVal * (baseOffsetFactor + 0.5) : offsetVal * baseOffsetFactor

        const p1x = (back.terminal.x + ux * finalOffStart) + nx * visualOff
        const p1y = (back.terminal.y + uy * finalOffStart) + ny * visualOff
        const p2x = (forward.terminal.x + ux * finalOffEnd) + nx * visualOff
        const p2y = (forward.terminal.y + uy * finalOffEnd) + ny * visualOff

        // Base line positions
        const baseVisualOff = offsetVal * 0.8 // Base offset for leader origins
        const bp1x = (back.terminal.x + ux * finalOffStart) + nx * baseVisualOff
        const bp1y = (back.terminal.y + uy * finalOffStart) + ny * baseVisualOff
        const bp2x = (forward.terminal.x + ux * finalOffEnd) + nx * baseVisualOff
        const bp2y = (forward.terminal.y + uy * finalOffEnd) + ny * baseVisualOff

        const labelX = (p1x + p2x) / 2
        const labelY = (p1y + p2y) / 2

        // Leader line origin
        const originX = (bp1x + bp2x) / 2
        const originY = (bp1y + bp2y) / 2

        const capSize = 6 / zoom
        const capP1A = { x: p1x + nx * capSize, y: p1y + ny * capSize }
        const capP1B = { x: p1x - nx * capSize, y: p1y - ny * capSize }
        const capP2A = { x: p2x + nx * capSize, y: p2y + ny * capSize }
        const capP2B = { x: p2x - nx * capSize, y: p2y - ny * capSize }

        // DEDUPLICATION: Use wall geometry to ensure only one label per physical segment in global view
        const geomKey = [
            Math.round(back.terminal.x),
            Math.round(back.terminal.y),
            Math.round(forward.terminal.x),
            Math.round(forward.terminal.y)
        ].sort((a, b) => a - b).join(',') + `-${faceType}`

        if (showAllQuotes && displayedMeasures.has(geomKey)) {
            return null
        }
        displayedMeasures.add(geomKey)

        // REDUNDANCY FILTER: Avoid mirrored parallel measurements in simple rectangular rooms
        // If we are showing all quotes, we only show Top and Left faces to keep it clean,
        // UNLESS the room is complex (irregular, > 4 sides).
        if (showAllQuotes && !isAnyInChainSelected) {
            const normalizedAngle = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360
            const isHorizontal = normalizedAngle < 1 || Math.abs(normalizedAngle - 180) < 1
            const isVertical = Math.abs(normalizedAngle - 90) < 1 || Math.abs(normalizedAngle - 270) < 1

            if (isHorizontal || isVertical) {
                // Detect if any room containing this measurement is irregular (> 4 vertices)
                const roomsContainingTestP = rooms.filter(r => {
                    let inside = false
                    const poly = r.polygon
                    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                        const xi = poly[i].x, yi = poly[i].y
                        const xj = poly[j].x, yj = poly[j].y
                        const intersect = ((yi > testP.y) !== (yj > testP.y)) &&
                            (testP.x < (xj - xi) * (testP.y - yi) / (yj - yi) + xi)
                        if (intersect) inside = !inside
                    }
                    return inside
                })
                // HIDE EXTERNAL MEASUREMENTS (duplicates of internal)
                // If the measurement is not inside any room, we hide it in global view
                // to rely on the internal measurement of the room that "owns" the wall.
                if (roomsContainingTestP.length === 0) return null

                const room = roomsContainingTestP[0]

                // ROBUST RECTANGULARITY CHECK: Compare BBox Area vs Polygon Area
                // This handles collinear vertices (T-junctions) that shouldn't count as "shapes"
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
                room.polygon.forEach(p => {
                    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x)
                    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
                })
                const bboxArea = (maxX - minX) * (maxY - minY)

                let area = 0
                for (let i = 0; i < room.polygon.length; i++) {
                    const j = (i + 1) % room.polygon.length
                    area += room.polygon[i].x * room.polygon[j].y
                    area -= room.polygon[j].x * room.polygon[i].y
                }
                area = Math.abs(area / 2)

                // Allow tolerance for floating point / small deviations (200 units = 20cm^2 app error)
                const isRectangular = Math.abs(bboxArea - area) < 200

                // RECTANGULAR REDUNDANCY FILTER
                // If the room is a simple rectangle, we only want to show 1 Width and 1 Height.
                // Convention: Show Top and Left. Hide Bottom and Right.
                if (isRectangular) {
                    const room = roomsContainingTestP[0]
                    // Calculate Centroid
                    let cx = 0, cy = 0
                    room.polygon.forEach(p => { cx += p.x; cy += p.y })
                    cx /= room.polygon.length
                    cy /= room.polygon.length

                    // Check Wall Midpoint relative to Centroid
                    const wx = (back.terminal.x + forward.terminal.x) / 2
                    const wy = (back.terminal.y + forward.terminal.y) / 2

                    const dx = Math.abs(back.terminal.x - forward.terminal.x)
                    const dy = Math.abs(back.terminal.y - forward.terminal.y)
                    const isHorz = dx > dy

                    // Threshold to decide "side" (avoid jitter near center, though unlikely for walls)
                    if (isHorz) {
                        // If Wall Y is greater than Centroid Y => Bottom Wall => Hide
                        if (wy > cy + 10) return null
                    } else {
                        // If Wall X is greater than Centroid X => Right Wall => Hide
                        if (wx > cx + 10) return null
                    }
                }
            }
        }

        // LABEL OVERLAP JITTER: For very short chains, shift label slightly to avoid corner conflicts
        let finalLabelX = labelX
        let finalLabelY = labelY
        if (displayLength < 80) {
            // Use wall ID as seed for deterministic "jitter"
            const jitterSeed = wall.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
            const jitterScale = (jitterSeed % 10) - 5 // [-5, 4]
            finalLabelX += ux * jitterScale
            finalLabelY += uy * jitterScale
        }

        // CLUTTER REDUCTION: Hide extremely short measurements in global view
        if (showAllQuotes && displayLength < 40 && !isAnyInChainSelected) {
            return null
        }

        return (
            <Group>
                {/* Línea principal */}
                <Line
                    points={[p1x, p1y, p2x, p2y]}
                    stroke={color}
                    strokeWidth={1 / zoom}
                    opacity={isInteractive ? 1 : 0.35} // Reduced opacity for non-selected quotes
                />
                {/* Caps (Testigos) */}
                <Line
                    points={[capP1A.x, capP1A.y, capP1B.x, capP1B.y]}
                    stroke={color}
                    strokeWidth={1 / zoom}
                    opacity={isInteractive ? 1 : 0.35}
                />
                <Line
                    points={[capP2A.x, capP2A.y, capP2B.x, capP2B.y]}
                    stroke={color}
                    strokeWidth={1 / zoom}
                    opacity={isInteractive ? 1 : 0.35}
                />

                {isShortWall && (
                    <Line
                        points={[originX, originY, finalLabelX, finalLabelY]}
                        stroke={color}
                        strokeWidth={0.5 / zoom}
                        dash={[2, 2]}
                        opacity={0.8}
                    />
                )}

                <Group
                    name="measurement-group"
                    x={finalLabelX}
                    y={finalLabelY}
                    rotation={(Math.atan2(dy, dx) * 180 / Math.PI) > 90
                        ? (Math.atan2(dy, dx) * 180 / Math.PI) - 180
                        : ((Math.atan2(dy, dx) * 180 / Math.PI) < -90
                            ? (Math.atan2(dy, dx) * 180 / Math.PI) + 180
                            : Math.atan2(dy, dx) * 180 / Math.PI)}
                    onClick={(e) => {
                        e.cancelBubble = true
                        lastClickedWallForEdit.current = wall.id
                        if (!selectedWallIds.includes(wall.id)) {
                            onSelectWall(wall.id)
                        }
                        setEditFace(faceType)
                        setEditLength(displayLength.toFixed(1))
                        setEditMode("length")
                    }}
                    onTap={(e) => {
                        e.cancelBubble = true
                        lastClickedWallForEdit.current = wall.id
                        if (!selectedWallIds.includes(wall.id)) {
                            onSelectWall(wall.id)
                        }
                        setEditFace(faceType)
                        setEditLength(displayLength.toFixed(1))
                        setEditMode("length")
                    }}
                >
                    {/* HALO TEXT (For readability without backgrounds) */}
                    <Text
                        name="measurement-text-halo"
                        x={0}
                        y={-10 / zoom} // Moved slightly more "above" the line
                        text={`${typeof displayLength === 'number' ? displayLength.toFixed(1) : displayLength}`}
                        fontSize={14 / zoom}
                        fill="white"
                        stroke="white"
                        strokeWidth={4 / zoom}
                        align="center"
                        offsetX={28 / zoom}
                        fontStyle="bold"
                        width={56 / zoom}
                        listening={false}
                    />
                    <Text
                        name="measurement-text"
                        x={0}
                        y={-10 / zoom}
                        text={`${typeof displayLength === 'number' ? displayLength.toFixed(1) : displayLength}`}
                        fontSize={14 / zoom}
                        fill={isInteractive && editMode === "length" && editFace === faceType ? "#0ea5e9" : (showAllQuotes ? "#334155" : color)}
                        align="center"
                        offsetX={28 / zoom}
                        fontStyle="bold"
                        width={56 / zoom}
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

    const handleStagePointerDown = (e: any) => {
        const stage = e.target?.getStage?.()
        if (!stage) return

        const stagePos = stage.getPointerPosition()
        if (!stagePos) return

        let adjustedY = stagePos.y
        const isTouchInteraction = e.evt.pointerType === "touch" || forceTouchOffset
        if (isTouchInteraction) {
            adjustedY -= touchOffset
        }

        // Si es táctil, buscamos qué hay "bajo el puntero virtual" (80px arriba)
        // En vez de usar e.target directamente.
        let virtualTarget = isTouchInteraction ? stage.getIntersection({ x: stagePos.x, y: adjustedY }) : e.target
        if (virtualTarget && virtualTarget !== stage) {
            const name = virtualTarget.attrs?.name || virtualTarget.name?.() || ""
            if (!name) {
                const ancestor = virtualTarget.findAncestor?.((n: any) => !!(n.attrs?.name || n.name?.()))
                if (ancestor) virtualTarget = ancestor
            }
        }
        const targetName = virtualTarget?.attrs?.name || virtualTarget?.name?.() || ""
        const isBackground = !virtualTarget || virtualTarget === stage || targetName === "grid-rect"

        const isRightClick = e.evt.button === 2
        const isMiddleClick = e.evt.button === 1
        const isRoom = targetName.startsWith("room-")

        // Handle multi-touch for zoom (prevent drawing if 2 fingers)
        if (e.evt.pointerType === 'touch' && e.evt.isPrimary === false) {
            return
        }

        const isProtected = targetName.startsWith("wall-") ||
            targetName.startsWith("door-") ||
            targetName.startsWith("window-") ||
            targetName.startsWith("shunt-") ||
            targetName.startsWith("vertex-") ||
            targetName.startsWith("measurement-") ||
            targetName.startsWith("room-")

        if (isRightClick || isMiddleClick || isBackground || (activeTool === "select" && (!isProtected || isRoom))) {
            // Only deselect if we are NOT interacting with a room (unless it's a right/middle click which might imply context menu or pan anywhere)
            if (!isRoom || isRightClick || isMiddleClick) {
                if (!isRoom) { // Don't deselect everything if we clicked a room (let room onClick handle selection)
                    onSelectWall(null)
                    onSelectRoom(null)
                    onSelectElement(null)
                }
            }

            if (isRightClick || isMiddleClick || activeTool === "select") {
                isPanning.current = true
                setIsPanningState(true)
                lastPointerPos.current = stage.getPointerPosition()
                return
            }
        }

        if (e.evt.button !== 0 && e.evt.pointerType === 'mouse') return

        // Si pinchamos en algo (o cerca por el offset) y es táctil, disparamos su lógica
        if (isTouchInteraction && !isBackground) {
            if (activeTool === "select") {
                if (targetName.startsWith("wall-")) {
                    const wallId = targetName.split("wall-")[1]
                    onSelectWall(wallId, e.evt.ctrlKey)
                } else if (targetName.startsWith("door-")) {
                    const doorId = targetName.split("door-")[1]
                    onSelectElement({ type: "door", id: doorId })
                } else if (targetName.startsWith("window-")) {
                    const windowId = targetName.split("window-")[1]
                    onSelectElement({ type: "window", id: windowId })
                } else if (targetName.startsWith("shunt-")) {
                    const shuntId = targetName.split("shunt-")[1]
                    onSelectElement({ type: "shunt", id: shuntId })
                } else if (targetName === "room-poly" || targetName.startsWith("room-")) {
                    // Try to find roomId from ancestors or ID if encoded
                }
            }

            // Disparamos pointerdown para que Konva inicie draggables
            virtualTarget.fire('pointerdown', e, true)

            // Si es un vértice o una medida, evitamos que se empiece a dibujar un muro debajo
            if (targetName === "vertex-handle" || targetName.startsWith("measurement-")) {
                return
            }
        }

        if (isBackground) {
            onSelectWall(null)
            onSelectRoom(null)
            onSelectElement(null)
        }

        if (activeTool !== "wall" && activeTool !== "door" && activeTool !== "window" && activeTool !== "ruler" && activeTool !== "arc" && activeTool !== "shunt") return

        const pos = getRelativePointerPosition(stage, { x: stagePos.x, y: adjustedY })

        // NEW TOUCH-UP DRAWING LOGIC:
        // On touch devices with drawing tools, DELAY the click until finger is released
        // This allows users to "aim" using the crosshair and snapping guides
        const isDrawingTool = activeTool === "wall" || activeTool === "door" || activeTool === "window" || activeTool === "ruler" || activeTool === "arc" || activeTool === "shunt"
        if (isTouchInteraction && isDrawingTool) {
            isAimingDrawing.current = true
            aimingStartPos.current = { x: stagePos.x, y: adjustedY }
            // Update mouse position for preview but DON'T call onMouseDown yet
            setMousePos(pos)
            return
        }

        // Desktop: immediate click
        onMouseDown(pos)
    }

    const handleStagePointerMove = (e: any) => {
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

        const stagePos = stage.getPointerPosition()
        if (!stagePos) return

        let adjustedY = stagePos.y
        if (e.evt.pointerType === "touch" || forceTouchOffset) {
            adjustedY -= touchOffset
        }

        const pos = getRelativePointerPosition(stage, { x: stagePos.x, y: adjustedY })

        // Always update cursor position for preview (including during aiming phase)
        setMousePos(pos)

        // If we're in aiming mode, update the preview
        if (isAimingDrawing.current) {
            onMouseMove(pos)
        } else if ((activeTool === "wall" && currentWall) || (activeTool === "ruler") || (activeTool === "arc")) {
            onMouseMove(pos)
        }
    }

    const handleStagePointerUp = (e: any) => {
        if (isPanning.current) {
            isPanning.current = false
            setIsPanningState(false)
            return
        }

        const stage = e.target?.getStage?.()
        if (!stage) return
        const stagePos = stage.getPointerPosition()
        if (!stagePos) return

        let adjustedY = stagePos.y
        if (e.evt.pointerType === "touch" || forceTouchOffset) {
            adjustedY -= touchOffset
        }

        const pos = getRelativePointerPosition(stage, { x: stagePos.x, y: adjustedY })

        const isTouchOrPen = e.evt.pointerType === 'touch' || e.evt.pointerType === 'pen'

        // NEW TOUCH-UP DRAWING LOGIC:
        // If we were in aiming mode, commit the point NOW (on finger release)
        if (isAimingDrawing.current) {
            isAimingDrawing.current = false

            // Check if this was just a tap (no movement) or a drag
            const TAP_THRESHOLD = 10 // pixels
            let isTap = false
            if (aimingStartPos.current) {
                const dx = stagePos.x - aimingStartPos.current.x
                const dy = (adjustedY) - aimingStartPos.current.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                isTap = dist < TAP_THRESHOLD
            }
            aimingStartPos.current = null

            // Commit the point (first click equivalent)
            onMouseDown(pos)

            // For drag-to-draw on walls, also immediately confirm if user dragged
            // This creates the wall in one gesture: touch -> drag -> release
            if (!isTap && activeTool === "wall") {
                // Small delay to ensure state updates
                setTimeout(() => {
                    onMouseUp(pos)
                }, 10)
            }
            return
        }

        if ((activeTool === "wall" && currentWall) || activeTool === "ruler" || activeTool === "arc") {
            // Desktop: Click-Move-Click (Up does nothing initially, waits for 2nd click)
            // Mobile (Drag-to-Draw): Down (Start) -> Move -> Up (End/Confirm)

            // We call onMouseUp (which usually confirms the creation) IF it's touch/pen
            // AND we have moved enough to consider it a drag (to avoid completing on a simple tap)
            // BUT for walls even a simple tap might just start it.
            // Drag-to-Draw means:
            // 1. PointerDown starts it (already handled)
            // 2. PointerMove updates it
            // 3. PointerUp finishes it

            if (isTouchOrPen) {
                // For touch/pen, releasing the pointer should confirm the placement (2nd click)
                // We execute onMouseUp which handles the "Confirm" step in EditorContainer
                onMouseUp(pos)
            }
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

        if (newScale < 0.1 || newScale > 20) return

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        }

        onZoom(newScale)
        onPan(newPos.x, newPos.y)
    }

    // Touch handling is now mainly for Pinch-Zoom, drawing is handled by Pointer Events
    const handleTouchMove = (e: any) => {
        const touch1 = e.evt.touches[0]
        const touch2 = e.evt.touches[1]

        if (touch1 && touch2) {
            e.evt.preventDefault() // Stop browser zoom

            if (stageRef.current.isDragging()) {
                stageRef.current.stopDrag()
            }

            const p1 = { x: touch1.clientX, y: touch1.clientY }
            const p2 = { x: touch2.clientX, y: touch2.clientY }

            if (!lastCenter.current) {
                lastCenter.current = getCenter(p1, p2)
                return
            }

            const newCenter = getCenter(p1, p2)
            const dist = getDistance(p1, p2)

            if (!lastDist.current) {
                lastDist.current = dist
            }

            const pointTo = {
                x: (newCenter.x - stageRef.current.x()) / zoom,
                y: (newCenter.y - stageRef.current.y()) / zoom,
            }

            const scale = dist / lastDist.current
            const newScale = zoom * scale

            if (newScale >= 0.1 && newScale <= 20) {
                const dx = newCenter.x - lastCenter.current.x
                const dy = newCenter.y - lastCenter.current.y

                const newPos = {
                    x: newCenter.x - pointTo.x * newScale + dx,
                    y: newCenter.y - pointTo.y * newScale + dy,
                }

                onZoom(newScale)
                onPan(newPos.x, newPos.y)
            }

            lastDist.current = dist
            lastCenter.current = newCenter
        }
    }

    const handleTouchEnd = () => {
        lastDist.current = 0
        lastCenter.current = null
    }

    return (
        <div className="w-full h-full bg-slate-50 overflow-hidden" style={{ touchAction: 'none' }}>
            <Stage
                ref={stageRef}
                width={width}
                height={height}
                scaleX={1}
                scaleY={1}
                draggable={false}
                onWheel={handleWheel}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onPointerDown={handleStagePointerDown}
                onPointerMove={handleStagePointerMove}
                onPointerUp={handleStagePointerUp}
                onMouseLeave={handleMouseLeave}
                onContextMenu={(e: any) => e.evt.preventDefault()}
                style={{ cursor: isPanningState ? 'grabbing' : (activeTool === "wall" || activeTool === "arc" || activeTool === "ruler") ? 'crosshair' : 'default', touchAction: 'none' }}
            >
                <Layer>
                    <Group
                        ref={gridRef}
                        x={floorPlanCenter.x * zoom + offset.x}
                        y={floorPlanCenter.y * zoom + offset.y}
                        offsetX={floorPlanCenter.x * zoom + offset.x}
                        offsetY={floorPlanCenter.y * zoom + offset.y}
                        rotation={gridRotation}
                    >
                        <Grid
                            width={width}
                            height={height}
                            cellSize={cellSize}
                            zoom={zoom}
                            offsetX={offset.x}
                            offsetY={offset.y}
                        />
                    </Group>
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


                        {/* Renderizar habitaciones detectadas (SOLO FONDO) */}
                        {rooms.map((room: Room) => {
                            const points = room.polygon.flatMap((p: Point) => [p.x, p.y])

                            return (
                                <Group key={room.id}>
                                    {/* Capa base blanca para ocultar el grid */}
                                    <Line
                                        points={points}
                                        fill="#ffffff"
                                        stroke="transparent"
                                        closed={true}
                                        listening={false}
                                    />
                                    {/* Capa de color original (transparente pero sobre blanco = pastel) */}
                                    <Line
                                        name="room-poly"
                                        points={points}
                                        fill={selectedRoomId === room.id ? room.color + "60" : room.color + "40"}
                                        stroke={selectedRoomId === room.id ? "#0ea5e9" : "transparent"}
                                        strokeWidth={selectedRoomId === room.id ? 4 : 2}
                                        closed={true}
                                        onClick={(e) => { e.cancelBubble = true; onSelectRoom(room.id) }}
                                        onTap={(e) => { e.cancelBubble = true; onSelectRoom(room.id) }}
                                    />
                                </Group>
                            )
                        })}

                        {/* Renderizar muros guardados - AHORA ANTES de puertas/ventanas para que estas se puedan seleccionar mejor */}
                        {/* HIGH-QUALITY FACADE OVERLAY (Clean miter joins) */}
                        {facadeChains.map((chain, idx) => (
                            <Line
                                key={`facade-chain-${idx}`}
                                points={chain.points}
                                closed={chain.closed}
                                stroke="#334155"
                                strokeWidth={20}
                                lineJoin="miter"
                                miterLimit={2}
                                lineCap="butt"
                                listening={false}
                            />
                        ))}
                        {walls.map((wall: Wall) => {
                            const isHovered = hoveredWallId === wall.id
                            const isSelected = selectedWallIds.includes(wall.id)
                            const isHorizontal = Math.abs(wall.start.y - wall.end.y) < 1
                            const isVertical = Math.abs(wall.start.x - wall.end.x) < 1

                            const handleWallTap = (e: any) => {
                                e.cancelBubble = true
                                const now = Date.now()
                                if (now - lastTapRef.current < 300) {
                                    // Double tap -> Split
                                    if (activeTool === "select" && onSplitWall) {
                                        const stage = e.target.getStage()
                                        if (stage) {
                                            const pos = getRelativePointerPosition(stage)
                                            onSplitWall(wall.id, pos)
                                        }
                                    }
                                } else {
                                    // Single tap -> Select
                                    if (activeTool === "select") {
                                        onSelectWall(wall.id, false)
                                    }
                                }
                                lastTapRef.current = now
                            }

                            return (
                                <Group key={wall.id}>
                                    <Line
                                        name={`wall-${wall.id}`}
                                        points={[wall.start.x, wall.start.y, wall.end.x, wall.end.y]}
                                        stroke={wall.isInvisible ? "#0ea5e9" : (isHovered && !isSelected ? "#ef4444" : "#334155")}
                                        strokeWidth={wall.isInvisible ? (isSelected ? 4 : 2) : wall.thickness}
                                        dash={wall.isInvisible ? [5, 5] : undefined}
                                        hitStrokeWidth={30} // Increased from 20 for better mobile touch
                                        lineCap={wall.thickness === 20 ? "butt" : "round"}
                                        lineJoin={wall.thickness === 20 ? "miter" : "round"}
                                        draggable={activeTool === "select"}
                                        onClick={(e) => {
                                            e.cancelBubble = true
                                            if (activeTool === "select") {
                                                onSelectWall(wall.id, e.evt.ctrlKey)
                                            }
                                        }}
                                        onTap={handleWallTap}
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
                                    {isSelected && !wall.isInvisible && (() => {
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
                                    {/* Medidas duales SIEMPRE llamadas, filtrado interno */}
                                    {[25 / zoom, -25 / zoom].map((offsetVal, idx) => (
                                        <React.Fragment key={`wall-meas-${wall.id}-${idx}`}>
                                            {(() => {
                                                // De-duplication logic for global view:
                                                // If showAllQuotes is true, we want to avoid redundant parallel measurements.
                                                // For now, let's keep one side of the chain if they are identical.
                                                // But wait, the user said "dentro de una habitación".

                                                // Better de-duplication: For global view, only show "interior" measurements (offsetVal > 0)
                                                // UNLESS the chain is purely exterior (facade).
                                                // This significantly reduces clutter.
                                                // De-duplication logic for global view:
                                                // We rely on renderWallMeasurement internal logic to suppress clutter.
                                                // Removing the 'offsetVal < 0' check enables shared wall measurements and proper external dimensions.
                                                return renderWallMeasurement(wall, offsetVal)
                                            })()}
                                        </React.Fragment>
                                    ))}

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
                            // Helper to get connected wall thickness at a vertex
                            const getNeighborThickness = (p: { x: number, y: number }) => {
                                const neighbor = walls.find(w => w.id !== wall.id && (
                                    (Math.abs(w.start.x - p.x) < 1 && Math.abs(w.start.y - p.y) < 1) ||
                                    (Math.abs(w.end.x - p.x) < 1 && Math.abs(w.end.y - p.y) < 1)
                                ))
                                return neighbor ? neighbor.thickness : 0
                            }
                            const startThick = getNeighborThickness(wall.start)
                            const endThick = getNeighborThickness(wall.end)

                            // Distancias desde los bordes de la puerta
                            // FIX: Restar mitad del grosor del muro vecino para medir hasta la cara interior
                            const d1Val = Math.max(0, (door.t * wallLen) - (door.width / 2) - (startThick / 2))
                            const d2Val = Math.max(0, ((1 - door.t) * wallLen) - (door.width / 2) - (endThick / 2))
                            const d1 = d1Val.toFixed(1)
                            const d2 = d2Val.toFixed(1)

                            const isSelected = selectedElement?.id === door.id && selectedElement?.type === "door"

                            // Posiciones locales centradas en los huecos de pared a los lados de la puerta
                            const gap1CenterLocalX = (-door.t * wallLen - door.width / 2) / 2
                            const gap2CenterLocalX = ((1 - door.t) * wallLen + door.width / 2) / 2

                            return (
                                <Group
                                    key={door.id}
                                    name={`door-${door.id}`}
                                    x={pos.x} y={pos.y}
                                    rotation={wallAngle}
                                    draggable={activeTool === "select"}
                                    onClick={(e) => { e.cancelBubble = true; onSelectElement({ type: "door", id: door.id }) }}
                                    onTap={(e) => { e.cancelBubble = true; onSelectElement({ type: "door", id: door.id }) }}
                                    onDragStart={(e) => {
                                        onSelectElement({ type: "door", id: door.id })
                                        const stage = e.target.getStage()
                                        if (stage) {
                                            const transform = stage.getAbsoluteTransform().copy()
                                            transform.invert()
                                            const sp = stage.getPointerPosition()
                                            if (sp) {
                                                const cursorPos = transform.point(sp)
                                                // Store offset: Vector from Cursor to Element Center
                                                dragOffsetRef.current = {
                                                    x: pos.x - cursorPos.x,
                                                    y: pos.y - cursorPos.y
                                                }
                                            }
                                        }
                                    }}
                                    onDragMove={(e) => {
                                        const stage = e.target.getStage()
                                        if (!stage || !dragOffsetRef.current) return
                                        const transform = stage.getAbsoluteTransform().copy()
                                        transform.invert()
                                        const sp = stage.getPointerPosition()
                                        if (!sp) return
                                        const cursorPos = transform.point(sp)

                                        // 1. Desired Center (perfectly tracking cursor + offset)
                                        const virtualCenterX = cursorPos.x + dragOffsetRef.current.x
                                        const virtualCenterY = cursorPos.y + dragOffsetRef.current.y

                                        // 2. Find Closest Wall
                                        let closestWall: { wallId: string, t: number, projX: number, projY: number } | null = null
                                        let minDist = Infinity

                                        walls.forEach(w => {
                                            const dx = w.end.x - w.start.x
                                            const dy = w.end.y - w.start.y
                                            const lenSq = dx * dx + dy * dy
                                            if (lenSq === 0) return

                                            // Project virtualCenter onto wall segment
                                            const t = Math.max(0, Math.min(1, ((virtualCenterX - w.start.x) * dx + (virtualCenterY - w.start.y) * dy) / lenSq))
                                            const projX = w.start.x + t * dx
                                            const projY = w.start.y + t * dy
                                            const dist = Math.sqrt((virtualCenterX - projX) ** 2 + (virtualCenterY - projY) ** 2)

                                            if (dist < minDist) {
                                                minDist = dist
                                                closestWall = { wallId: w.id, t, projX, projY }
                                            }
                                        })

                                        // 3. STRICTLY snap to the closest wall.
                                        if (closestWall) {
                                            const cw = closestWall as { wallId: string, t: number, projX: number, projY: number }
                                            e.target.position({ x: cw.projX, y: cw.projY })

                                            let offX = virtualCenterX - cw.projX
                                            let offY = virtualCenterY - cw.projY
                                            const currentDist = Math.sqrt(offX * offX + offY * offY)

                                            let reportX = cw.projX
                                            let reportY = cw.projY

                                            if (currentDist > 0.001) {
                                                const scale = Math.min(currentDist, 10) / currentDist
                                                reportX += offX * scale
                                                reportY += offY * scale
                                            }

                                            onDragElement("door", door.id, { x: reportX, y: reportY })
                                        }
                                    }}
                                    onDragEnd={(e) => {
                                        dragOffsetRef.current = null
                                        // Ensure final state alignment
                                        e.target.position({ x: pos.x, y: pos.y })
                                    }}
                                >
                                    {/* Hit Area Rect - Increased size for mobile */}
                                    <Rect
                                        width={door.width + 20}
                                        height={wall.thickness + 30}
                                        x={-(door.width + 20) / 2}
                                        y={-(wall.thickness + 30) / 2}
                                        fill="transparent"
                                        listening={true}
                                    />
                                    <Rect
                                        width={door.width}
                                        height={wall.thickness + 4}
                                        x={-door.width / 2}
                                        y={-(wall.thickness + 4) / 2}
                                        fill={isSelected ? "#e0f2fe" : "#ffffff"}
                                        stroke={isSelected ? "#0ea5e9" : "#334155"}
                                        strokeWidth={isSelected ? 2 : 1}
                                        listening={false}
                                    />

                                    {/* Door Visuals based on Type */}
                                    {(!door.openType || door.openType === "single") && (
                                        <KonvaArc
                                            x={door.flipX ? -door.width / 2 : door.width / 2}
                                            y={door.flipY ? (wall.thickness + 4) / 2 : -(wall.thickness + 4) / 2}
                                            innerRadius={0}
                                            outerRadius={door.width}
                                            angle={90}
                                            rotation={door.flipY ? (door.flipX ? 0 : 90) : (door.flipX ? -90 : -180)}
                                            stroke={isSelected ? "#0ea5e9" : "#334155"}
                                            strokeWidth={isSelected ? 2 : 1}
                                            fill={isSelected ? "#0ea5e920" : "transparent"}
                                            listening={false}
                                        />
                                    )}
                                    {door.openType === "double" && (
                                        <>
                                            <KonvaArc
                                                x={-door.width / 2}
                                                y={door.flipY ? (wall.thickness + 4) / 2 : -(wall.thickness + 4) / 2}
                                                innerRadius={0}
                                                outerRadius={door.width / 2}
                                                angle={90}
                                                rotation={door.flipY ? 0 : -90}
                                                stroke={isSelected ? "#0ea5e9" : "#334155"}
                                                strokeWidth={isSelected ? 2 : 1}
                                                fill={isSelected ? "#0ea5e920" : "transparent"}
                                                listening={false}
                                            />
                                            <KonvaArc
                                                x={door.width / 2}
                                                y={door.flipY ? (wall.thickness + 4) / 2 : -(wall.thickness + 4) / 2}
                                                innerRadius={0}
                                                outerRadius={door.width / 2}
                                                angle={90}
                                                rotation={door.flipY ? 90 : 180}
                                                stroke={isSelected ? "#0ea5e9" : "#334155"}
                                                strokeWidth={isSelected ? 2 : 1}
                                                fill={isSelected ? "#0ea5e920" : "transparent"}
                                                listening={false}
                                            />
                                        </>
                                    )}
                                    {door.openType === "sliding" && (
                                        <Rect
                                            width={door.width}
                                            height={6} // Thin panel
                                            x={-door.width / 2}
                                            y={door.flipY ? (wall.thickness / 2) + 2 : -(wall.thickness / 2) - 8}
                                            fill={isSelected ? "#e0f2fe" : "#ffffff"}
                                            stroke={isSelected ? "#0ea5e9" : "#334155"}
                                            strokeWidth={1}
                                            cornerRadius={1}
                                            listening={false}
                                        />
                                    )}

                                    {/* Etiqueta de Dimensiones (Ancho) - Al pie/base del hueco */}
                                    {isSelected && editInputState?.id !== `door-width-${door.id}` && (
                                        <Group
                                            x={0}
                                            y={door.flipY ? (wall.thickness / 2 + 8) : -(wall.thickness / 2 + 8)}
                                            rotation={(() => {
                                                const normalized = ((wallAngle % 360) + 360) % 360
                                                return (normalized > 90 && normalized < 270) ? 180 : 0
                                            })()}>
                                            {/* HALO TEXT for Door Width */}
                                            <Text
                                                text={`${door.width}`}
                                                fontSize={12}
                                                fill="white"
                                                stroke="white"
                                                strokeWidth={3}
                                                align="center"
                                                width={door.width}
                                                offsetX={door.width / 2}
                                                offsetY={6}
                                                fontStyle="bold"
                                                listening={false}
                                            />
                                            <Text
                                                text={`${door.width}`}
                                                fontSize={12}
                                                fill="#475569"
                                                align="center"
                                                width={door.width}
                                                offsetX={door.width / 2}
                                                offsetY={6} // Centered vertically
                                                fontStyle="bold"
                                                onClick={(e) => {
                                                    e.cancelBubble = true
                                                    const absPos = e.currentTarget.getAbsolutePosition()
                                                    setEditInputState({
                                                        id: `door-width-${door.id}`,
                                                        type: 'door-width',
                                                        val: door.width,
                                                        screenPos: absPos,
                                                        onCommit: (val) => onUpdateElement('door', door.id, { width: val })
                                                    })
                                                }}
                                                onTap={(e) => {
                                                    e.cancelBubble = true
                                                    const absPos = e.currentTarget.getAbsolutePosition()
                                                    setEditInputState({
                                                        id: `door-width-${door.id}`,
                                                        type: 'door-width',
                                                        val: door.width,
                                                        screenPos: absPos,
                                                        onCommit: (val) => onUpdateElement('door', door.id, { width: val })
                                                    })
                                                }}
                                            />
                                        </Group>
                                    )}

                                    {/* Distancias dinámicas alineadas con el muro (Estilo HomeByMe) */}
                                    {isSelected && (
                                        <Group rotation={0}>
                                            {d1Val > 0 && editInputState?.id !== `door-d1-${door.id}` && (
                                                <Group x={gap1CenterLocalX} y={0}>
                                                    <Group rotation={(() => {
                                                        const normalized = ((wallAngle % 360) + 360) % 360
                                                        return (normalized > 90 && normalized < 270) ? 180 : 0
                                                    })()}>
                                                        <Rect
                                                            width={35} height={18} x={-17.5} y={-9}
                                                            fill="white" stroke="#0ea5e9" strokeWidth={0.5} cornerRadius={4}
                                                            shadowColor="black" shadowBlur={2} shadowOpacity={0.1}
                                                        />
                                                        <Text
                                                            text={`${d1}`} x={-17.5} y={-6} fontSize={10} fill="#0ea5e9" align="center" width={35} fontStyle="bold"
                                                            onClick={(e) => {
                                                                e.cancelBubble = true
                                                                const absPos = e.currentTarget.getAbsolutePosition()
                                                                setEditInputState({
                                                                    id: `door-d1-${door.id}`,
                                                                    type: 'door-d1',
                                                                    val: d1Val,
                                                                    screenPos: absPos,
                                                                    onCommit: (val) => {
                                                                        const newT = (val + door.width / 2) / wallLen
                                                                        if (newT >= 0 && newT <= 1) onUpdateElement('door', door.id, { t: newT })
                                                                    }
                                                                })
                                                            }}
                                                            onTap={(e) => {
                                                                e.cancelBubble = true
                                                                const absPos = e.currentTarget.getAbsolutePosition()
                                                                setEditInputState({
                                                                    id: `door-d1-${door.id}`,
                                                                    type: 'door-d1',
                                                                    val: d1Val,
                                                                    screenPos: absPos,
                                                                    onCommit: (val) => {
                                                                        const newT = (val + door.width / 2) / wallLen
                                                                        if (newT >= 0 && newT <= 1) onUpdateElement('door', door.id, { t: newT })
                                                                    }
                                                                })
                                                            }}
                                                        />
                                                    </Group>
                                                </Group>
                                            )}
                                            {d2Val > 0 && editInputState?.id !== `door-d2-${door.id}` && (
                                                <Group x={gap2CenterLocalX} y={0}>
                                                    <Group rotation={(() => {
                                                        const normalized = ((wallAngle % 360) + 360) % 360
                                                        return (normalized > 90 && normalized < 270) ? 180 : 0
                                                    })()}>
                                                        <Rect
                                                            width={35} height={18} x={-17.5} y={-9}
                                                            fill="white" stroke="#0ea5e9" strokeWidth={0.5} cornerRadius={4}
                                                            shadowColor="black" shadowBlur={2} shadowOpacity={0.1}
                                                        />
                                                        <Text
                                                            text={`${d2}`} x={-17.5} y={-6} fontSize={10} fill="#0ea5e9" align="center" width={35} fontStyle="bold"
                                                            onClick={(e) => {
                                                                e.cancelBubble = true
                                                                const absPos = e.currentTarget.getAbsolutePosition()
                                                                setEditInputState({
                                                                    id: `door-d2-${door.id}`,
                                                                    type: 'door-d2',
                                                                    val: d2Val,
                                                                    screenPos: absPos,
                                                                    onCommit: (val) => {
                                                                        // d2 is from END. t is from START.
                                                                        // d2 = (1-t)*L - W/2
                                                                        // val + W/2 = (1-t)*L
                                                                        // (val + W/2)/L = 1 - t
                                                                        // t = 1 - (val + W/2)/L
                                                                        const newT = 1 - (val + door.width / 2) / wallLen
                                                                        if (newT >= 0 && newT <= 1) onUpdateElement('door', door.id, { t: newT })
                                                                    }
                                                                })
                                                            }}
                                                            onTap={(e) => {
                                                                e.cancelBubble = true
                                                                const absPos = e.currentTarget.getAbsolutePosition()
                                                                setEditInputState({
                                                                    id: `door-d2-${door.id}`,
                                                                    type: 'door-d2',
                                                                    val: d2Val,
                                                                    screenPos: absPos,
                                                                    onCommit: (val) => {
                                                                        const newT = 1 - (val + door.width / 2) / wallLen
                                                                        if (newT >= 0 && newT <= 1) onUpdateElement('door', door.id, { t: newT })
                                                                    }
                                                                })
                                                            }}
                                                        />
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
                            // Helper to get connected wall thickness at a vertex
                            const getNeighborThickness = (p: { x: number, y: number }) => {
                                const neighbor = walls.find(w => w.id !== wall.id && (
                                    (Math.abs(w.start.x - p.x) < 1 && Math.abs(w.start.y - p.y) < 1) ||
                                    (Math.abs(w.end.x - p.x) < 1 && Math.abs(w.end.y - p.y) < 1)
                                ))
                                return neighbor ? neighbor.thickness : 0
                            }
                            const startThick = getNeighborThickness(wall.start)
                            const endThick = getNeighborThickness(wall.end)

                            // Distancias desde los bordes de la ventana
                            // FIX: Restar mitad del grosor del muro vecino para medir hasta la cara interior
                            const d1Val = Math.max(0, (window.t * wallLen) - (window.width / 2) - (startThick / 2))
                            const d2Val = Math.max(0, ((1 - window.t) * wallLen) - (window.width / 2) - (endThick / 2))
                            const d1 = d1Val.toFixed(1)
                            const d2 = d2Val.toFixed(1)

                            const isSelected = selectedElement?.id === window.id && selectedElement?.type === "window"

                            // Posiciones locales centradas en los huecos de pared
                            const gap1CenterLocalX = (-window.t * wallLen - window.width / 2) / 2
                            const gap2CenterLocalX = ((1 - window.t) * wallLen + window.width / 2) / 2

                            return (
                                <Group
                                    key={window.id}
                                    name={`window-${window.id}`}
                                    x={pos.x} y={pos.y}
                                    rotation={wallAngle}
                                    draggable={activeTool === "select"}
                                    onClick={(e) => { e.cancelBubble = true; onSelectElement({ type: "window", id: window.id }) }}
                                    onTap={(e) => { e.cancelBubble = true; onSelectElement({ type: "window", id: window.id }) }}
                                    onDragStart={(e) => {
                                        onSelectElement({ type: "window", id: window.id })
                                        const stage = e.target.getStage()
                                        if (stage) {
                                            const transform = stage.getAbsoluteTransform().copy()
                                            transform.invert()
                                            const sp = stage.getPointerPosition()
                                            if (sp) {
                                                const cursorPos = transform.point(sp)
                                                dragOffsetRef.current = {
                                                    x: pos.x - cursorPos.x,
                                                    y: pos.y - cursorPos.y
                                                }
                                            }
                                        }
                                    }}
                                    onDragMove={(e) => {
                                        const stage = e.target.getStage()
                                        if (!stage || !dragOffsetRef.current) return
                                        const transform = stage.getAbsoluteTransform().copy()
                                        transform.invert()
                                        const sp = stage.getPointerPosition()
                                        if (!sp) return
                                        const cursorPos = transform.point(sp)

                                        // 1. Desired Center
                                        const virtualCenterX = cursorPos.x + dragOffsetRef.current.x
                                        const virtualCenterY = cursorPos.y + dragOffsetRef.current.y

                                        // 2. Find Closest Wall
                                        let closestWall: { wallId: string, t: number, projX: number, projY: number } | null = null
                                        let minDist = Infinity

                                        walls.forEach(w => {
                                            const dx = w.end.x - w.start.x
                                            const dy = w.end.y - w.start.y
                                            const lenSq = dx * dx + dy * dy
                                            if (lenSq === 0) return

                                            const t = Math.max(0, Math.min(1, ((virtualCenterX - w.start.x) * dx + (virtualCenterY - w.start.y) * dy) / lenSq))
                                            const projX = w.start.x + t * dx
                                            const projY = w.start.y + t * dy
                                            const dist = Math.sqrt((virtualCenterX - projX) ** 2 + (virtualCenterY - projY) ** 2)

                                            if (dist < minDist) {
                                                minDist = dist
                                                closestWall = { wallId: w.id, t, projX, projY }
                                            }
                                        })

                                        // 3. Strict Snap
                                        if (closestWall) {
                                            const cw = closestWall as { wallId: string, t: number, projX: number, projY: number }
                                            e.target.position({ x: cw.projX, y: cw.projY })

                                            let offX = virtualCenterX - cw.projX
                                            let offY = virtualCenterY - cw.projY
                                            const currentDist = Math.sqrt(offX * offX + offY * offY)

                                            let reportX = cw.projX
                                            let reportY = cw.projY

                                            if (currentDist > 0.001) {
                                                const scale = Math.min(currentDist, 10) / currentDist
                                                reportX += offX * scale
                                                reportY += offY * scale
                                            }

                                            onDragElement("window", window.id, { x: reportX, y: reportY })
                                        }
                                    }}
                                    onDragEnd={(e) => {
                                        dragOffsetRef.current = null
                                        e.target.position({ x: pos.x, y: pos.y })
                                    }}
                                >
                                    {/* Hit Area Rect - Increased size for mobile */}
                                    <Rect
                                        width={window.width + 20}
                                        height={wall.thickness + 30}
                                        x={-(window.width + 20) / 2}
                                        y={-(wall.thickness + 30) / 2}
                                        fill="transparent"
                                        listening={true}
                                    />
                                    <Rect
                                        width={window.width}
                                        height={wall.thickness + 4}
                                        x={-window.width / 2}
                                        y={-(wall.thickness + 4) / 2}
                                        fill={isSelected ? "#e0f2fe" : "#ffffff"}
                                        stroke={isSelected ? "#0ea5e9" : "#0369a1"} // Distinct Blue for Windows
                                        strokeWidth={isSelected ? 2 : 1.5}
                                        listening={false}
                                    />

                                    {/* Visual Representation based on Leaves */}
                                    {(!window.openType || window.openType === "single") ? (
                                        // Single Leaf (1 Hoja) - Continuous Line
                                        <Line
                                            points={[-window.width / 2, 0, window.width / 2, 0]}
                                            stroke={isSelected ? "#0ea5e9" : "#0369a1"}
                                            strokeWidth={isSelected ? 2 : 1.5}
                                            listening={false}
                                        />
                                    ) : (
                                        // Double Leaf (2 Hojas) - Split Line with Tick
                                        <Group>
                                            <Line
                                                points={[-window.width / 2, 0, window.width / 2, 0]}
                                                stroke={isSelected ? "#0ea5e9" : "#0369a1"}
                                                strokeWidth={isSelected ? 2 : 1.5}
                                                listening={false}
                                            />
                                            {/* Mid tick */}
                                            <Line
                                                points={[0, -4, 0, 4]}
                                                stroke={isSelected ? "#0ea5e9" : "#0369a1"}
                                                strokeWidth={isSelected ? 2 : 1.5}
                                                listening={false}
                                            />
                                            {/* Quarter ticks for detail */}
                                            <Line
                                                points={[-window.width / 2, -2, -window.width / 2, 2]}
                                                stroke={isSelected ? "#0ea5e9" : "#0369a1"}
                                                strokeWidth={1}
                                                listening={false}
                                            />
                                            <Line
                                                points={[window.width / 2, -2, window.width / 2, 2]}
                                                stroke={isSelected ? "#0ea5e9" : "#0369a1"}
                                                strokeWidth={1}
                                                listening={false}
                                            />
                                        </Group>
                                    )}

                                    {/* Etiqueta de Dimensiones (WxH) */}
                                    {/* Etiqueta de Dimensiones (WxH) Unificada - Al pie del muro */}
                                    {isSelected && editInputState?.id !== `window-dims-${window.id}` && (
                                        <Group
                                            x={0}
                                            y={-(wall.thickness / 2 + 8)}
                                            rotation={(() => {
                                                const normalized = ((wallAngle % 360) + 360) % 360
                                                return (normalized >= 90 && normalized < 270) ? 180 : 0
                                            })()}>
                                            {/* HALO TEXT for Window Dims */}
                                            <Text
                                                text={`${window.width}x${window.height}`}
                                                fontSize={10}
                                                fill="white"
                                                stroke="white"
                                                strokeWidth={3}
                                                align="center"
                                                width={window.width}
                                                offsetX={window.width / 2}
                                                offsetY={6}
                                                fontStyle="bold"
                                                listening={false}
                                            />
                                            <Text
                                                text={`${window.width}x${window.height}`}
                                                fontSize={10}
                                                fill="#475569"
                                                align="center"
                                                width={window.width}
                                                offsetX={window.width / 2}
                                                offsetY={6}
                                                fontStyle="bold"
                                                onClick={(e) => {
                                                    e.cancelBubble = true
                                                    const absPos = e.currentTarget.getAbsolutePosition()
                                                    setEditInputState({
                                                        id: `window-dims-${window.id}`,
                                                        type: 'window-dimensions',
                                                        val: 0, // Dummy
                                                        props: { w: window.width, h: window.height },
                                                        screenPos: absPos,
                                                        // @ts-ignore
                                                        onCommit: ({ w, h }: { w: number, h: number }) => onUpdateElement('window', window.id, { width: w, height: h })
                                                    } as any)
                                                }}
                                                onTap={(e) => {
                                                    e.cancelBubble = true
                                                    const absPos = e.currentTarget.getAbsolutePosition()
                                                    setEditInputState({
                                                        id: `window-dims-${window.id}`,
                                                        type: 'window-dimensions',
                                                        val: 0, // Dummy
                                                        props: { w: window.width, h: window.height },
                                                        screenPos: absPos,
                                                        // @ts-ignore
                                                        onCommit: ({ w, h }: { w: number, h: number }) => onUpdateElement('window', window.id, { width: w, height: h })
                                                    } as any)
                                                }}
                                            />
                                        </Group>
                                    )}

                                    {/* Distancias dinámicas alineadas con el muro */}
                                    {isSelected && (
                                        <Group rotation={0}>
                                            {d1Val > 0 && editInputState?.id !== `window-d1-${window.id}` && (
                                                <Group x={gap1CenterLocalX} y={0}>
                                                    <Group rotation={(() => {
                                                        const normalized = ((wallAngle % 360) + 360) % 360
                                                        return (normalized > 90 && normalized < 270) ? 180 : 0
                                                    })()}>
                                                        <Rect
                                                            width={35} height={18} x={-17.5} y={-9}
                                                            fill="white" stroke="#0ea5e9" strokeWidth={0.5} cornerRadius={4}
                                                            shadowColor="black" shadowBlur={2} shadowOpacity={0.1}
                                                        />
                                                        <Text
                                                            text={`${d1}`} x={-17.5} y={-6} fontSize={10} fill="#0ea5e9" align="center" width={35} fontStyle="bold"
                                                            onClick={(e) => {
                                                                e.cancelBubble = true
                                                                const absPos = e.currentTarget.getAbsolutePosition()
                                                                setEditInputState({
                                                                    id: `window-d1-${window.id}`,
                                                                    type: 'window-d1',
                                                                    val: d1Val,
                                                                    screenPos: absPos,
                                                                    onCommit: (val) => {
                                                                        const newT = (val + window.width / 2) / wallLen
                                                                        if (newT >= 0 && newT <= 1) onUpdateElement('window', window.id, { t: newT })
                                                                    }
                                                                })
                                                            }}
                                                            onTap={(e) => {
                                                                e.cancelBubble = true
                                                                const absPos = e.currentTarget.getAbsolutePosition()
                                                                setEditInputState({
                                                                    id: `window-d1-${window.id}`,
                                                                    type: 'window-d1',
                                                                    val: d1Val,
                                                                    screenPos: absPos,
                                                                    onCommit: (val) => {
                                                                        const newT = (val + window.width / 2) / wallLen
                                                                        if (newT >= 0 && newT <= 1) onUpdateElement('window', window.id, { t: newT })
                                                                    }
                                                                })
                                                            }}
                                                        />
                                                    </Group>
                                                </Group>
                                            )}
                                            {d2Val > 0 && editInputState?.id !== `window-d2-${window.id}` && (
                                                <Group x={gap2CenterLocalX} y={0}>
                                                    <Group rotation={(() => {
                                                        const normalized = ((wallAngle % 360) + 360) % 360
                                                        return (normalized > 90 && normalized < 270) ? 180 : 0
                                                    })()}>
                                                        <Rect
                                                            width={35} height={18} x={-17.5} y={-9}
                                                            fill="white" stroke="#0ea5e9" strokeWidth={0.5} cornerRadius={4}
                                                            shadowColor="black" shadowBlur={2} shadowOpacity={0.1}
                                                        />
                                                        <Text
                                                            text={`${d2}`} x={-17.5} y={-6} fontSize={10} fill="#0ea5e9" align="center" width={35} fontStyle="bold"
                                                            onClick={(e) => {
                                                                e.cancelBubble = true
                                                                const absPos = e.currentTarget.getAbsolutePosition()
                                                                setEditInputState({
                                                                    id: `window-d2-${window.id}`,
                                                                    type: 'window-d2',
                                                                    val: d2Val,
                                                                    screenPos: absPos,
                                                                    onCommit: (val) => {
                                                                        const newT = 1 - (val + window.width / 2) / wallLen
                                                                        if (newT >= 0 && newT <= 1) onUpdateElement('window', window.id, { t: newT })
                                                                    }
                                                                })
                                                            }}
                                                            onTap={(e) => {
                                                                e.cancelBubble = true
                                                                const absPos = e.currentTarget.getAbsolutePosition()
                                                                setEditInputState({
                                                                    id: `window-d2-${window.id}`,
                                                                    type: 'window-d2',
                                                                    val: d2Val,
                                                                    screenPos: absPos,
                                                                    onCommit: (val) => {
                                                                        const newT = 1 - (val + window.width / 2) / wallLen
                                                                        if (newT >= 0 && newT <= 1) onUpdateElement('window', window.id, { t: newT })
                                                                    }
                                                                })
                                                            }}
                                                        />
                                                    </Group>
                                                </Group>
                                            )}
                                        </Group>
                                    )}
                                </Group>
                            )
                        })}


                        {/* Shunts (Nodes) - Memoized for smooth drag */}
                        {shunts.map(shunt => (
                            <ShuntItem
                                key={shunt.id}
                                shunt={shunt}
                                isSelected={selectedElement?.id === shunt.id && selectedElement?.type === "shunt"}
                                activeTool={activeTool}
                                walls={walls}
                                snappingEnabled={snappingEnabled}
                                zoom={zoom}
                                shunts={shunts}
                                setDragShuntState={setDragShuntState}
                                onSelect={() => onSelectElement({ type: "shunt", id: shunt.id })}
                                onDragEnd={(id, x, y) => onDragElement("shunt", id, { x, y })}
                                isEditing={editInputState?.id === `shunt-dimensions-${shunt.id}`}
                                onEditDimensions={(e) => {
                                    const stage = e.target.getStage()
                                    // Calculate center of shunt in screen coords
                                    // Use absolute position of the Text or Shunt group
                                    const absPos = e.target.getAbsolutePosition()
                                    // The text is offsets, so let's rely on event target or group
                                    // Shunt Group is target's parent probably.
                                    // Let's use event target absolute position which is the text center roughly.
                                    const screenPos = {
                                        x: (absPos.x),
                                        y: (absPos.y)
                                    }

                                    setEditInputState({
                                        id: `shunt-dimensions-${shunt.id}`,
                                        type: "shunt-dimensions",
                                        val: 0, // unused
                                        screenPos,
                                        // @ts-ignore
                                        props: {
                                            w: shunt.width,
                                            h: shunt.height,
                                            onCommit: (res: { w: number, h: number }) => {
                                                if (res.w !== shunt.width) onUpdateShunt?.(shunt.id, { width: res.w })
                                                if (res.h !== shunt.height) onUpdateShunt?.(shunt.id, { height: res.h })
                                            }
                                        },
                                        onCommit: () => { } // unused
                                    })
                                }}
                            />
                        ))}

                        {/* Renderizar etiquetas de habitación (CAPA SUPERIOR - Encima de shunts) */}
                        {rooms.map((room: Room) => {
                            const centroid = {
                                x: room.polygon.reduce((sum: number, p: Point) => sum + p.x, 0) / room.polygon.length,
                                y: room.polygon.reduce((sum: number, p: Point) => sum + p.y, 0) / room.polygon.length
                            }
                            const labelPos = room.visualCenter || centroid

                            // Dynamic Font Size Calculation
                            const bounds = room.polygon.reduce((acc, p) => ({
                                minX: Math.min(acc.minX, p.x),
                                maxX: Math.max(acc.maxX, p.x),
                                minY: Math.min(acc.minY, p.y),
                                maxY: Math.max(acc.maxY, p.y)
                            }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity })

                            const rW = bounds.maxX - bounds.minX
                            const rH = bounds.maxY - bounds.minY
                            const minDim = Math.min(rW, rH)

                            // Scale factor: Base 200px -> Scale 1. Range [0.8, 3.0]
                            const scale = Math.max(0.8, Math.min(3.0, minDim / 200))

                            return (
                                <Group
                                    key={`label-${room.id}`}
                                    name="room-label"
                                    x={labelPos.x} y={labelPos.y}
                                    onClick={(e) => { e.cancelBubble = true; onSelectRoom(room.id) }}
                                    onTap={(e) => { e.cancelBubble = true; onSelectRoom(room.id) }}
                                    listening={false}
                                >
                                    <Text
                                        name="room-label-text"
                                        y={-10 * scale}
                                        text={room.name}
                                        fontSize={18 * scale}
                                        fill="#1e293b"
                                        fontStyle="bold"
                                        align="center"
                                        offsetX={50 * scale}
                                        width={100 * scale}
                                    />
                                    <Text
                                        name="room-label-text"
                                        y={5 * scale}
                                        text={`${room.area.toFixed(2)} m²`}
                                        fontSize={14 * scale}
                                        fill="#64748b"
                                        align="center"
                                        offsetX={50 * scale}
                                        width={100 * scale}
                                    />
                                </Group>
                            )
                        })}

                        {/* Shunt Measurements - Global Overlay (Separate Layer) */}
                        {shunts.map(shunt => {
                            const isSelected = selectedElement?.id === shunt.id && selectedElement?.type === "shunt"
                            // if (!isSelected && editInputState?.id !== `shunt-meas-${shunt.id}-${idx}`) return null // Removed to fix idx error, logic moved to inner loop

                            // Use drag state if available (LIVE MEASUREMENTS)
                            const effectiveX = (dragShuntState?.id === shunt.id) ? dragShuntState.x : shunt.x
                            const effectiveY = (dragShuntState?.id === shunt.id) ? dragShuntState.y : shunt.y

                            const rays = [
                                { dir: { x: 0, y: -1 }, origin: { x: effectiveX, y: effectiveY - shunt.height / 2 }, label: "top" },
                                { dir: { x: 0, y: 1 }, origin: { x: effectiveX, y: effectiveY + shunt.height / 2 }, label: "bottom" },
                                { dir: { x: -1, y: 0 }, origin: { x: effectiveX - shunt.width / 2, y: effectiveY }, label: "left" },
                                { dir: { x: 1, y: 0 }, origin: { x: effectiveX + shunt.width / 2, y: effectiveY }, label: "right" }
                            ]

                            return rays.map((ray, idx) => {
                                const isEditingThis = editInputState?.id === `shunt-meas-${shunt.id}-${idx}`
                                if (!showAllQuotes && !isSelected && !isEditingThis) return null

                                const rayOrigin = ray.origin
                                const intersections: { wallId: string, pt: Point, dist: number, thickness: number }[] = []

                                walls.forEach(w => {
                                    const rayEnd = {
                                        x: rayOrigin.x + ray.dir.x * 5000,
                                        y: rayOrigin.y + ray.dir.y * 5000
                                    }
                                    const pt = getLineIntersection(w.start, w.end, rayOrigin, rayEnd)
                                    if (pt) {
                                        const dist = Math.sqrt(Math.pow(pt.x - rayOrigin.x, 2) + Math.pow(pt.y - rayOrigin.y, 2))
                                        intersections.push({ wallId: w.id, pt, dist, thickness: w.thickness })
                                    }
                                })
                                // Check other shunts
                                shunts.forEach(s => {
                                    if (s.id === shunt.id) return
                                    const halfW = s.width / 2
                                    const halfH = s.height / 2
                                    const corners = [
                                        { x: s.x - halfW, y: s.y - halfH },
                                        { x: s.x + halfW, y: s.y - halfH },
                                        { x: s.x + halfW, y: s.y + halfH },
                                        { x: s.x - halfW, y: s.y + halfH }
                                    ]
                                    const edges = [
                                        { start: corners[0], end: corners[1] },
                                        { start: corners[1], end: corners[2] },
                                        { start: corners[2], end: corners[3] },
                                        { start: corners[3], end: corners[0] }
                                    ]
                                    const rayEnd = { x: rayOrigin.x + ray.dir.x * 5000, y: rayOrigin.y + ray.dir.y * 5000 }
                                    edges.forEach(edge => {
                                        const pt = getLineIntersection(edge.start, edge.end, rayOrigin, rayEnd)
                                        if (pt) {
                                            const dist = Math.sqrt(Math.pow(pt.x - rayOrigin.x, 2) + Math.pow(pt.y - rayOrigin.y, 2))
                                            intersections.push({ wallId: s.id, pt, dist, thickness: 0 })
                                        }
                                    })
                                })

                                intersections.sort((a, b) => a.dist - b.dist)
                                if (intersections.length > 0 && intersections[0].dist < 500) {
                                    const best = intersections[0]
                                    const centerDist = best.dist
                                    const surfaceDist = Math.max(0, centerDist - best.thickness / 2)

                                    if (surfaceDist < 0.5 && !(editInputState?.id === `shunt-meas-${shunt.id}-${idx}`)) return null

                                    // Global coords for line endpoints
                                    const startX = rayOrigin.x
                                    const startY = rayOrigin.y
                                    const endX = best.pt.x - ray.dir.x * (best.thickness / 2)
                                    const endY = best.pt.y - ray.dir.y * (best.thickness / 2)

                                    const isEditing = editInputState?.id === `shunt-meas-${shunt.id}-${idx}`

                                    return (
                                        <Group
                                            key={`${shunt.id}-${idx}`}
                                            name={`measurement-${shunt.id}-${idx}`}
                                            onMouseDown={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); }}
                                            onPointerDown={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); }}
                                        >
                                            <Line
                                                points={[startX, startY, endX, endY]}
                                                stroke="#000000"
                                                strokeWidth={1.5}
                                                listening={false}
                                            />
                                            {/* Hide start circle for small shunts to avoid clutter */}
                                            {Math.min(shunt.width, shunt.height) >= 45 && (
                                                <Circle
                                                    x={startX} y={startY} radius={3.5} fill="white" stroke="#000000" strokeWidth={1.5}
                                                    listening={false}
                                                />
                                            )}
                                            <Circle
                                                x={endX} y={endY} radius={3.5} fill="white" stroke="#000000" strokeWidth={1.5}
                                                listening={false}
                                            />
                                            {!isEditing && (
                                                <Group
                                                    name={`measurement-${shunt.id}-${idx}`}
                                                    x={(startX + endX) / 2}
                                                    y={(startY + endY) / 2}
                                                    listening={true}
                                                    onMouseDown={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); }}
                                                    onPointerDown={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); }}
                                                    onMouseEnter={(e) => {
                                                        const container = e.target.getStage()?.container()
                                                        if (container) container.style.cursor = "pointer"
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        const container = e.target.getStage()?.container()
                                                        if (container) container.style.cursor = "default"
                                                    }}
                                                    onClick={(e) => {
                                                        e.cancelBubble = true
                                                        e.evt.stopPropagation()
                                                        const absPos = e.currentTarget.getAbsolutePosition()
                                                        setEditInputState({
                                                            id: `shunt-meas-${shunt.id}-${idx}`,
                                                            type: 'shunt-dist',
                                                            val: surfaceDist,
                                                            screenPos: absPos,
                                                            onCommit: (val) => {
                                                                if (onUpdateShunt) {
                                                                    const thicknessOffset = (best.thickness || 10) / 2
                                                                    const isHorizontal = Math.abs(ray.dir.x) > 0.5
                                                                    const rotation = (shunt.rotation || 0) % 180
                                                                    const is90Deg = Math.abs(rotation - 90) < 1
                                                                    const effW = is90Deg ? shunt.height : shunt.width
                                                                    const effH = is90Deg ? shunt.width : shunt.height
                                                                    const colHalf = isHorizontal ? effW / 2 : effH / 2
                                                                    const targetCenterDist = val + thicknessOffset + colHalf
                                                                    const newX = best.pt.x - ray.dir.x * targetCenterDist
                                                                    const newY = best.pt.y - ray.dir.y * targetCenterDist
                                                                    if (Math.abs(val - surfaceDist) > 0.05) {
                                                                        onUpdateShunt(shunt.id, { x: newX, y: newY })
                                                                    }
                                                                }
                                                            }
                                                        })
                                                    }}
                                                    onTap={(e) => {
                                                        e.cancelBubble = true
                                                        e.evt.stopPropagation()
                                                        const absPos = e.currentTarget.getAbsolutePosition()
                                                        setEditInputState({
                                                            id: `shunt-meas-${shunt.id}-${idx}`,
                                                            type: 'shunt-dist',
                                                            val: surfaceDist,
                                                            screenPos: absPos,
                                                            onCommit: (val) => {
                                                                if (onUpdateShunt) {
                                                                    const thicknessOffset = (best.thickness || 10) / 2
                                                                    const isHorizontal = Math.abs(ray.dir.x) > 0.5
                                                                    const rotation = (shunt.rotation || 0) % 180
                                                                    const is90Deg = Math.abs(rotation - 90) < 1
                                                                    const effW = is90Deg ? shunt.height : shunt.width
                                                                    const effH = is90Deg ? shunt.width : shunt.height
                                                                    const colHalf = isHorizontal ? effW / 2 : effH / 2
                                                                    const targetCenterDist = val + thicknessOffset + colHalf
                                                                    const newX = best.pt.x - ray.dir.x * targetCenterDist
                                                                    const newY = best.pt.y - ray.dir.y * targetCenterDist
                                                                    if (Math.abs(val - surfaceDist) > 0.05) {
                                                                        onUpdateShunt(shunt.id, { x: newX, y: newY })
                                                                    }
                                                                }
                                                            }
                                                        })
                                                    }}
                                                >
                                                    <Rect
                                                        width={100} height={60} x={-50} y={-30}
                                                        fill="rgba(255,255,255,0.01)"
                                                        listening={true}
                                                    />
                                                    {/* HALO TEXT for Shunts */}
                                                    <Text
                                                        text={`${surfaceDist.toFixed(1)}`}
                                                        width={60 / zoom} x={-30 / zoom} y={-5 / zoom} align="center"
                                                        fontSize={11 / zoom} fontStyle="bold" fill="white"
                                                        stroke="white" strokeWidth={3 / zoom}
                                                        listening={false}
                                                    />
                                                    <Text
                                                        text={`${surfaceDist.toFixed(1)}`}
                                                        width={60 / zoom} x={-30 / zoom} y={-5 / zoom} align="center"
                                                        fontSize={11 / zoom} fontStyle="bold" fill="#000000"
                                                    />
                                                </Group>
                                            )}
                                        </Group>
                                    )
                                }
                                return null
                            })
                        })}

                        {/* Renderizar muro actual (fantasma) con medida */}
                        {currentWall && (() => {
                            const dx = currentWall.end.x - currentWall.start.x
                            const dy = currentWall.end.y - currentWall.start.y
                            const lengthPx = Math.sqrt(dx * dx + dy * dy)
                            const lengthCm = lengthPx // Was Math.round(lengthPx)

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
                                            listening={false}
                                        />
                                    )}
                                    {isHorizontal && (
                                        <Line
                                            points={[-5000, currentWall.start.y, 5000, currentWall.start.y]}
                                            stroke="#0284c7"
                                            strokeWidth={1 / zoom}
                                            dash={[10, 10]}
                                            opacity={0.3}
                                            listening={false}
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
                                    {/* HALO TEXT for Current Wall */}
                                    <Text
                                        x={(currentWall.start.x + currentWall.end.x) / 2}
                                        y={(currentWall.start.y + currentWall.end.y) / 2 - 20 / zoom}
                                        text={`${lengthCm.toFixed(1)}`}
                                        fontSize={14 / zoom}
                                        fill="white"
                                        stroke="white"
                                        strokeWidth={3 / zoom}
                                        fontStyle="bold"
                                        align="center"
                                        offsetX={25 / zoom}
                                        width={50 / zoom}
                                        listening={false}
                                    />
                                    <Text
                                        x={(currentWall.start.x + currentWall.end.x) / 2}
                                        y={(currentWall.start.y + currentWall.end.y) / 2 - 20 / zoom}
                                        text={`${lengthCm.toFixed(1)}`}
                                        fontSize={14 / zoom}
                                        fill="#0284c7"
                                        fontStyle="bold"
                                        align="center"
                                        offsetX={25 / zoom}
                                        width={50 / zoom}
                                    />
                                </Group>
                            )
                        })()}

                        {/* Guías inteligentes de alineación */}
                        {alignmentGuides && mousePos && (
                            <Group listening={false}>
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
                                    const dist = Math.sqrt(
                                        Math.pow(rulerPoints.end.x - rulerPoints.start.x, 2) +
                                        Math.pow(rulerPoints.end.y - rulerPoints.start.y, 2)
                                    ).toFixed(1)
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
                                                text={`${dist}`}
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
                            const vertexGroups: { point: Point, connections: { wallId: string, type: 's' | 'e' }[] }[] = [];
                            const UI_MERGE_TOLERANCE = 3;

                            walls.forEach(w => {
                                [{ p: w.start, type: 's' as const }, { p: w.end, type: 'e' as const }].forEach(({ p, type }) => {
                                    const existing = vertexGroups.find(v =>
                                        Math.abs(v.point.x - p.x) < UI_MERGE_TOLERANCE &&
                                        Math.abs(v.point.y - p.y) < UI_MERGE_TOLERANCE
                                    );
                                    if (existing) {
                                        existing.connections.push({ wallId: w.id, type });
                                    } else {
                                        vertexGroups.push({ point: p, connections: [{ wallId: w.id, type }] });
                                    }
                                });
                            });

                            return vertexGroups.filter(({ connections }) => {
                                return connections.some(c => selectedWallIds.includes(c.wallId) || c.wallId === hoveredWallId);
                            }).map(({ point, connections }, idx) => {
                                const isSelected = connections.some(c => selectedWallIds.includes(c.wallId));
                                // Generate a stable and unique key using sorted connections
                                const vertexKey = `v-${connections.map(c => `${c.wallId}-${c.type}`).sort().join('-')}`;

                                return (
                                    <Circle
                                        key={vertexKey}
                                        name="vertex-handle"
                                        x={point.x}
                                        y={point.y}
                                        radius={(isSelected ? 10 : 7) / zoom}
                                        fill="#1e293b"
                                        stroke="#ffffff"
                                        strokeWidth={2 / zoom}
                                        hitStrokeWidth={20 / zoom}
                                        draggable={false}
                                        onPointerDown={(e) => {
                                            e.cancelBubble = true
                                            const stage = e.target.getStage()
                                            if (stage) {
                                                stageRef.current = stage // Capture stage reference

                                                onStartDragWall()
                                                isDraggingVertexRef.current = true
                                                dragStartPos.current = { ...point }

                                                const transform = stage.getAbsoluteTransform().copy()
                                                transform.invert()
                                                const pos = stage.getPointerPosition()

                                                // PointerEvent available in e.evt for react-konva
                                                const nativeEvent = (e.evt as PointerEvent)
                                                pointerTypeRef.current = nativeEvent.pointerType

                                                if (pos) {
                                                    // Determinar si aplicamos offset
                                                    const isTouch = nativeEvent.pointerType === "touch" || forceTouchOffset

                                                    let adjustedY = pos.y
                                                    if (isTouch) {
                                                        adjustedY -= touchOffset
                                                    }

                                                    // Use adjusted position for start to maintain distance from finger
                                                    dragStartPointerPos.current = transform.point({ x: pos.x, y: adjustedY })
                                                }

                                                // Determine walls to move
                                                const selectedConnections = connections.filter(c => selectedWallIds.includes(c.wallId)).map(c => c.wallId)
                                                draggingVertexWallIds.current = selectedConnections.length > 0 ? selectedConnections : connections.map(c => c.wallId)

                                                if (nativeEvent.pointerType !== "touch") {
                                                    document.body.style.cursor = 'move'
                                                }
                                            }
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
                                        text={`${calibrationTargetValue || 0}`}
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
                    {/* Phantom Arc Guide */}
                    {/* RENDERIZAR ARCO FANTASMA (PHANTOM ARC) */}
                    {
                        phantomArc && (() => {
                            const points = generateArcPoints(phantomArc.start, phantomArc.end, phantomArc.depth)
                            const flatPoints: number[] = []
                            points.forEach(p => flatPoints.push(p.x * zoom + offset.x, p.y * zoom + offset.y))

                            // Visual style like Calibration Tool
                            const handleRadius = 15 / zoom
                            const lineWidth = 4 / zoom
                            const color = "#fbbf24" // Calibration yellow/orange

                            return (
                                <Group>
                                    {/* The Arc Curve */}
                                    <Line
                                        points={flatPoints}
                                        stroke={color}
                                        strokeWidth={lineWidth}
                                        dash={[10, 5]}
                                        opacity={0.8}
                                    />
                                    {/* The Chord (dashed line between start and end) */}
                                    <Line
                                        points={[
                                            phantomArc.start.x * zoom + offset.x, phantomArc.start.y * zoom + offset.y,
                                            phantomArc.end.x * zoom + offset.x, phantomArc.end.y * zoom + offset.y
                                        ]}
                                        stroke={color}
                                        strokeWidth={2 / zoom}
                                        dash={[10, 5]}
                                        opacity={0.5}
                                    />

                                    {/* Start Handle */}
                                    <Group
                                        x={phantomArc.start.x * zoom + offset.x}
                                        y={phantomArc.start.y * zoom + offset.y}
                                    >
                                        <Circle
                                            radius={handleRadius}
                                            fill="white"
                                            stroke={color}
                                            strokeWidth={lineWidth}
                                            shadowBlur={10 / zoom}
                                            shadowOpacity={0.4}
                                            shadowColor="rgba(0,0,0,0.5)"
                                        />
                                        <Line points={[-handleRadius * 1.5, 0, handleRadius * 1.5, 0]} stroke={color} strokeWidth={2 / zoom} />
                                        <Line points={[0, -handleRadius * 1.5, 0, handleRadius * 1.5]} stroke={color} strokeWidth={2 / zoom} />
                                    </Group>

                                    {/* End Handle (only if different from start) */}
                                    {(phantomArc.end.x !== phantomArc.start.x || phantomArc.end.y !== phantomArc.start.y) && (
                                        <Group
                                            x={phantomArc.end.x * zoom + offset.x}
                                            y={phantomArc.end.y * zoom + offset.y}
                                        >
                                            <Circle
                                                radius={handleRadius}
                                                fill="white"
                                                stroke={color}
                                                strokeWidth={lineWidth}
                                                shadowBlur={10 / zoom}
                                                shadowOpacity={0.4}
                                                shadowColor="rgba(0,0,0,0.5)"
                                            />
                                            <Line points={[-handleRadius * 1.5, 0, handleRadius * 1.5, 0]} stroke={color} strokeWidth={2 / zoom} />
                                            <Line points={[0, -handleRadius * 1.5, 0, handleRadius * 1.5]} stroke={color} strokeWidth={2 / zoom} />
                                        </Group>
                                    )}

                                    {/* Mid/Control Handle (at the peak of the arc) */}
                                    {(phantomArc.end.x !== phantomArc.start.x || phantomArc.end.y !== phantomArc.start.y) && (() => {
                                        // Find midpoint of chord
                                        const midX = (phantomArc.start.x + phantomArc.end.x) / 2
                                        const midY = (phantomArc.start.y + phantomArc.end.y) / 2

                                        // Direction vector
                                        const dx = phantomArc.end.x - phantomArc.start.x
                                        const dy = phantomArc.end.y - phantomArc.start.y
                                        const len = Math.sqrt(dx * dx + dy * dy)

                                        // Normal vector (normalized)
                                        const nx = -dy / len
                                        const ny = dx / len

                                        // Peak point
                                        const peakX = midX + nx * (phantomArc.depth || 0)
                                        const peakY = midY + ny * (phantomArc.depth || 0)

                                        return (
                                            <Group
                                                x={peakX * zoom + offset.x}
                                                y={peakY * zoom + offset.y}
                                            >
                                                <Circle
                                                    radius={handleRadius * 0.8}
                                                    fill={color}
                                                    stroke="white"
                                                    strokeWidth={2 / zoom}
                                                    shadowBlur={10 / zoom}
                                                    shadowOpacity={0.4}
                                                    shadowColor="rgba(0,0,0,0.5)"
                                                />
                                                {/* Label for Step 3 */}
                                                <Text
                                                    x={15 / zoom}
                                                    y={-10 / zoom}
                                                    text="3"
                                                    fontSize={14 / zoom}
                                                    fill={color}
                                                    fontStyle="bold"
                                                />
                                            </Group>
                                        )
                                    })()}

                                    {/* Labels for Step 1 & 2 */}
                                    <Text
                                        x={phantomArc.start.x * zoom + offset.x - 25 / zoom}
                                        y={phantomArc.start.y * zoom + offset.y - 25 / zoom}
                                        text="1"
                                        fontSize={14 / zoom}
                                        fill={color}
                                        fontStyle="bold"
                                    />
                                    {(phantomArc.end.x !== phantomArc.start.x || phantomArc.end.y !== phantomArc.start.y) && (
                                        <Text
                                            x={phantomArc.end.x * zoom + offset.x + 10 / zoom}
                                            y={phantomArc.end.y * zoom + offset.y - 25 / zoom}
                                            text="2"
                                            fontSize={14 / zoom}
                                            fill={color}
                                            fontStyle="bold"
                                        />
                                    )}
                                </Group>
                            )
                        })()
                    }

                </Layer>
            </Stage>

            {
                ((selectedWall && uiPos) || selectedRoom || (selectedElement && currentEPos)) && editMode && !editInputState && !hideFloatingUI && (
                    <div
                        onMouseDown={(e) => {
                            e.stopPropagation()
                            setIsDraggingMenuState(true)
                            menuDragStart.current = { x: e.clientX - menuDragOffset.x, y: e.clientY - menuDragOffset.y }
                        }}
                        onTouchStart={(e) => {
                            e.stopPropagation()
                            setIsDraggingMenuState(true)
                            const touch = e.touches[0]
                            menuDragStart.current = { x: touch.clientX - menuDragOffset.x, y: touch.clientY - menuDragOffset.y }
                        }}
                        className="flex flex-col"
                        style={{
                            position: 'absolute',
                            left: Math.max(100, Math.min(window.innerWidth - 100, (selectedRoom
                                ? (calculatePolygonCentroid(selectedRoom.polygon).x * zoom + offset.x)
                                : (selectedElement && currentEPos)
                                    ? currentEPos.x
                                    : uiPos?.x || 0
                            ) + menuDragOffset.x)),
                            top: Math.max(80, Math.min(window.innerHeight - 80, (selectedRoom
                                ? (calculatePolygonCentroid(selectedRoom.polygon).y * zoom + offset.y - 40)
                                : (selectedElement && currentEPos)
                                    ? currentEPos.y - 80
                                    : (uiPos ? uiPos.y - 100 : 0)
                            ) + menuDragOffset.y)),
                            transform: 'translateX(-50%) translateY(-100%)', // Anchor bottom-center
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(12px)',
                            padding: '2px 4px',
                            borderRadius: '12px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
                            zIndex: 1000,
                            pointerEvents: 'auto',
                            cursor: isDraggingMenuState ? 'grabbing' : 'grab',
                            animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            minWidth: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}
                    >
                        {/* Drag Handle Bar */}
                        <div className="w-full h-3 flex justify-center items-center mb-0.5 cursor-grab active:cursor-grabbing">
                            <div className="w-8 h-1 bg-slate-200 rounded-full hover:bg-slate-300 transition-colors" />
                        </div>

                        <div className="flex items-center gap-0.5">
                            {editMode === "menu" ? (
                                <>
                                    {selectedWall && (
                                        <>
                                            <MenuButton
                                                icon={<Scissors className="h-3 w-3" />}
                                                onClick={() => onSplitWall?.(selectedWall.id)}
                                                title="Dividir tabique"
                                            />
                                            <MenuButton
                                                icon={<SquareDashed className={`h-3 w-3 ${selectedWall.isInvisible ? 'text-sky-500 fill-sky-50' : ''}`} />}
                                                onClick={() => onUpdateWallInvisible(selectedWall.id, !selectedWall.isInvisible)}
                                                title="Separador de estancias"
                                            />
                                        </>
                                    )}
                                    {selectedElement && (
                                        <>
                                            <MenuButton
                                                icon={<Copy className="h-3 w-3" />}
                                                onClick={() => onCloneElement(selectedElement.type, selectedElement.id)}
                                            />
                                            {selectedElement.type === "door" && (
                                                <>
                                                    <MenuButton
                                                        icon={<FlipHorizontal className="h-3 w-3" />}
                                                        onClick={() => {
                                                            const el = doors.find(d => d.id === selectedElement.id)
                                                            if (el) onUpdateElement("door", el.id, { flipX: !el.flipX })
                                                        }}
                                                    />
                                                    <MenuButton
                                                        icon={<FlipVertical className="h-3 w-3" />}
                                                        onClick={() => {
                                                            const el = doors.find(d => d.id === selectedElement.id)
                                                            if (el) onUpdateElement("door", el.id, { flipY: !el.flipY })
                                                        }}
                                                    />
                                                    <MenuButton
                                                        icon={<Spline className="h-3 w-3" />}
                                                        onClick={() => {
                                                            const el = doors.find(d => d.id === selectedElement.id)
                                                            if (el) {
                                                                const types = ["single", "double", "sliding"] as const
                                                                // @ts-ignore
                                                                const currentIdx = types.indexOf(el.openType || "single")
                                                                const nextType = types[(currentIdx + 1) % types.length]

                                                                let newWidth = el.width || 82
                                                                if (nextType === "double") {
                                                                    newWidth = (el.width || 82) * 2
                                                                } else if (el.openType === "double") {
                                                                    newWidth = (el.width || 164) / 2
                                                                }

                                                                // @ts-ignore
                                                                onUpdateElement("door", el.id, { openType: nextType, width: newWidth })
                                                            }
                                                        }}
                                                        title="Cambiar tipo apertura"
                                                    />
                                                </>
                                            )}
                                            {selectedElement.type === "window" && (
                                                <MenuButton
                                                    icon={<Spline className="h-3 w-3" />}
                                                    onClick={() => {
                                                        const el = windows.find(w => w.id === selectedElement.id)
                                                        if (el) {
                                                            const nextType = (!el.openType || el.openType === "single") ? "double" : "single"
                                                            // @ts-ignore
                                                            onUpdateElement("window", el.id, { openType: nextType })
                                                        }
                                                    }}
                                                    title="Cambiar hojas (1 o 2)"
                                                />
                                            )}
                                        </>
                                    )}
                                    <MenuButton
                                        icon={<Pencil className="h-3 w-3" />}
                                        onClick={() => setEditMode(selectedWall ? "thickness" : selectedElement ? "length" : "room")}
                                        title="Editar"
                                    />
                                    <div className="w-px h-4 bg-slate-100 mx-0.5" />
                                    {selectedRoomId && (
                                        <>
                                            {isAdvancedEnabled && (
                                                <>
                                                    <MenuButton
                                                        icon={<Copy className="h-3 w-3" />}
                                                        onClick={() => onCloneRoom(selectedRoomId)}
                                                        title="Clonar Habitación"
                                                    />
                                                    <div className="w-px h-4 bg-slate-100 mx-0.5" />
                                                </>
                                            )}
                                            <MenuButton
                                                icon={<Trash2 className="h-3 w-3" />}
                                                onClick={() => onDeleteRoom(selectedRoomId)}
                                                variant="danger"
                                                title="Eliminar Habitación"
                                            />
                                            <div className="w-px h-4 bg-slate-100 mx-0.5" />
                                        </>
                                    )}
                                    {(selectedWall || selectedElement) && (
                                        <MenuButton
                                            icon={<Trash2 className="h-3 w-3" />}
                                            onClick={() => {
                                                if (selectedWall) onDeleteWall(selectedWall.id)
                                                else if (selectedElement) onDeleteElement(selectedElement.type, selectedElement.id)
                                            }}
                                            variant="danger"
                                            title="Eliminar"
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
                                        <X className="h-2.5 w-2.5" />
                                    </button>
                                </>
                            ) : editMode === "room" || editMode === "room-custom" ? (
                                <div className="flex flex-col gap-2 p-2 min-w-[180px]">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{editMode === "room-custom" ? "Nombre Personalizado" : "Tipo de Habitación"}</span>
                                        <button onClick={() => setEditMode("menu")} className="text-slate-400 hover:text-slate-600">
                                            <X className="h-2.5 w-2.5" />
                                        </button>
                                    </div>

                                    {editMode === "room" ? (
                                        <div className="grid grid-cols-2 gap-1">
                                            {roomTypes.map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => {
                                                        if (selectedRoomId) {
                                                            if (type === "Otro") {
                                                                setEditMode("room-custom")
                                                                setEditLength("") // Usamos editLength para el nombre personalizado
                                                                return
                                                            }

                                                            // Logic for smart numbering
                                                            // 1. Find other rooms of the SAME type
                                                            const others = rooms.filter(r => r.id !== selectedRoomId && r.name.startsWith(type))

                                                            if (others.length === 0) {
                                                                // First one is just "Type" (e.g. "Cocina")
                                                                onUpdateRoom(selectedRoomId, { name: type })
                                                            } else {
                                                                // There are others. We need to assign a number.
                                                                // Check if there is a "plain" room (e.g. just "Cocina") that needs to become "Cocina 1"
                                                                const plainRoom = others.find(r => r.name === type)
                                                                if (plainRoom) {
                                                                    onUpdateRoom(plainRoom.id, { name: `${type} 1` })
                                                                }

                                                                // Find next available number
                                                                const usedNumbers = others.map(r => {
                                                                    const match = r.name.match(/\d+$/)
                                                                    // If it has a number, use it. If it's plain "Name", treat as 1 (since we just renamed it implicitly)
                                                                    return match ? parseInt(match[0]) : (r.name === type ? 1 : 0)
                                                                }).filter(n => n > 0)

                                                                // If we found a plain room, we definitely used 1
                                                                if (plainRoom && !usedNumbers.includes(1)) usedNumbers.push(1)

                                                                let nextNum = 1
                                                                while (usedNumbers.includes(nextNum)) nextNum++

                                                                onUpdateRoom(selectedRoomId, { name: `${type} ${nextNum}` })
                                                            }

                                                            setEditMode(null)
                                                            onSelectRoom(null)
                                                        }
                                                    }}
                                                    className="text-[11px] px-2 py-1.5 bg-slate-50 hover:bg-sky-50 hover:text-sky-600 rounded-md text-left transition-colors"
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <input
                                                type="text"
                                                autoFocus
                                                value={editLength}
                                                placeholder="Ej: Despensa..."
                                                onChange={(e) => setEditLength(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && selectedRoomId) {
                                                        onUpdateRoom(selectedRoomId, { name: editLength })
                                                        setEditMode(null)
                                                        onSelectRoom(null)
                                                    }
                                                    if (e.key === 'Escape') setEditMode("room")
                                                }}
                                                className="w-full p-2 border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:border-sky-500 focus:outline-none transition-colors"
                                            />
                                            <div className="flex gap-1 justify-end">
                                                <button
                                                    onClick={() => setEditMode("room")}
                                                    className="text-[10px] px-2 py-1 text-slate-400 hover:text-slate-600"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (selectedRoomId) {
                                                            onUpdateRoom(selectedRoomId, { name: editLength })
                                                            setEditMode(null)
                                                            onSelectRoom(null)
                                                        }
                                                    }}
                                                    className="text-[10px] bg-sky-500 text-white px-2 py-1 rounded-md font-bold"
                                                >
                                                    Guardar
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {editMode === "room" && (
                                        <button
                                            onClick={() => setEditMode("menu")}
                                            className="mt-1 text-[11px] font-medium text-sky-600 hover:text-sky-700 underline text-center"
                                        >
                                            Volver al menú
                                        </button>
                                    )}
                                </div>
                            ) : editMode === "thickness" ? (
                                <div className="flex items-center gap-3 px-3 py-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Grosor pared</span>
                                    <div className="flex items-center gap-1">
                                        <NumericInput
                                            label="Grosor de pared"
                                            value={editThickness}
                                            step={0.1}
                                            setter={setEditThickness}
                                            onEnter={(val) => {
                                                const finalVal = val !== undefined ? val : editThickness
                                                if (selectedWall) {
                                                    onUpdateWallThickness(selectedWall.id, parseFloat(finalVal))
                                                    setEditMode("menu")
                                                }
                                            }}
                                        />
                                        {/* Unit removed per user request */}
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
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                    {editFace === "interior" ? "Lado Azul" : "Lado Naranja"}
                                                </span>
                                                <div className="flex gap-1">
                                                    <button onClick={() => setEditFace("interior")} className={`w-3 h-3 rounded-full border ${editFace === 'interior' ? 'bg-sky-500 border-sky-600' : 'bg-slate-200 border-slate-300'}`} title="Lado Azul (Interior)" />
                                                    <button onClick={() => setEditFace("exterior")} className={`w-3 h-3 rounded-full border ${editFace === 'exterior' ? 'bg-amber-500 border-amber-600' : 'bg-slate-200 border-slate-300'}`} title="Lado Naranja (Exterior)" />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-2 py-1">
                                                <button
                                                    onClick={() => {
                                                        const targetLen = parseFloat(editLength)
                                                        if (isNaN(targetLen)) return

                                                        // FIXED: Start/Up Arrow Logic (Single Segment)
                                                        const dx = selectedWall.end.x - selectedWall.start.x
                                                        const dy = selectedWall.end.y - selectedWall.start.y
                                                        const centerLength = Math.sqrt(dx * dx + dy * dy)

                                                        const chainIds = new Set([selectedWall.id])
                                                        let currentTotal = centerLength
                                                        let faceNormal: Point | undefined = undefined

                                                        if (editFace !== "center") {
                                                            const nx = -dy / centerLength
                                                            const ny = dx / centerLength
                                                            faceNormal = { x: nx * (editFace === "interior" ? 1 : -1), y: ny * (editFace === "interior" ? 1 : -1) }

                                                            const midP = { x: (selectedWall.start.x + selectedWall.end.x) / 2, y: (selectedWall.start.y + selectedWall.end.y) / 2 }
                                                            const testP = { x: midP.x + faceNormal.x * 12, y: midP.y + faceNormal.y * 12 }
                                                            const isInterior = (editFace === "interior") || isPointInAnyRoom(testP)

                                                            const back = findTerminal(selectedWall, selectedWall.start, chainIds, faceNormal, isInterior)
                                                            const forward = findTerminal(selectedWall, selectedWall.end, chainIds, faceNormal, isInterior)
                                                            const chainLen = centerLength + back.addedLen + forward.addedLen

                                                            const terminalStartWall = walls.find(w => w.id === back.terminalWallId) || selectedWall
                                                            const terminalEndWall = walls.find(w => w.id === forward.terminalWallId) || selectedWall

                                                            currentTotal = chainLen +
                                                                getFaceOffsetAt(terminalEndWall, forward.terminal, faceNormal, chainIds, true) -
                                                                getFaceOffsetAt(terminalStartWall, back.terminal, faceNormal, chainIds, false)
                                                        }

                                                        const delta = targetLen - currentTotal
                                                        if (selectedWall && Math.abs(delta) > 0.01) {
                                                            onUpdateWallLength(selectedWall.id, centerLength + delta, "left", faceNormal)
                                                        }

                                                        setEditMode("menu")
                                                    }}
                                                    className="p-1.5 bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-600 rounded-md transition-all"
                                                >
                                                    {Math.abs(selectedWall.start.y - selectedWall.end.y) < 1 ? "←" : "↑"}
                                                </button>
                                                <div className="flex items-center gap-1 bg-white border-2 border-slate-100 rounded-lg px-2 py-1">
                                                    <NumericInput
                                                        label={editFace === "interior" ? "Medida Azul" : "Medida Naranja"}
                                                        value={editLength}
                                                        step={0.1}
                                                        setter={setEditLength}
                                                        onEnter={(val) => {
                                                            const finalVal = val !== undefined ? val : editLength
                                                            const targetLen = parseFloat(finalVal)
                                                            if (isNaN(targetLen) || !selectedWall) return

                                                            const dx = selectedWall.end.x - selectedWall.start.x
                                                            const dy = selectedWall.end.y - selectedWall.start.y
                                                            const centerLength = Math.sqrt(dx * dx + dy * dy)
                                                            const chainIds = new Set([selectedWall.id])
                                                            let currentTotal = centerLength
                                                            let faceNormal: Point | undefined = undefined

                                                            if (editFace !== "center") {
                                                                const nx = -dy / centerLength
                                                                const ny = dx / centerLength
                                                                faceNormal = { x: nx * (editFace === "interior" ? 1 : -1), y: ny * (editFace === "interior" ? 1 : -1) }

                                                                const midP = { x: (selectedWall.start.x + selectedWall.end.x) / 2, y: (selectedWall.start.y + selectedWall.end.y) / 2 }
                                                                const testP = { x: midP.x + faceNormal.x * 12, y: midP.y + faceNormal.y * 12 }
                                                                const isInterior = (editFace === "interior") || isPointInAnyRoom(testP)

                                                                const back = findTerminal(selectedWall, selectedWall.start, chainIds, faceNormal, isInterior)
                                                                const forward = findTerminal(selectedWall, selectedWall.end, chainIds, faceNormal, isInterior)
                                                                const chainLen = centerLength + back.addedLen + forward.addedLen

                                                                const terminalStartWall = walls.find(w => w.id === back.terminalWallId) || selectedWall
                                                                const terminalEndWall = walls.find(w => w.id === forward.terminalWallId) || selectedWall

                                                                currentTotal = chainLen +
                                                                    getFaceOffsetAt(terminalEndWall, forward.terminal, faceNormal, chainIds, true) -
                                                                    getFaceOffsetAt(terminalStartWall, back.terminal, faceNormal, chainIds, false)
                                                            }

                                                            const delta = targetLen - currentTotal
                                                            if (selectedWall && Math.abs(delta) > 0.01) {
                                                                onUpdateWallLength(selectedWall.id, centerLength + delta, "right", faceNormal)
                                                            }
                                                            setEditMode("menu")
                                                        }}
                                                    />
                                                    {/* Unit removed per user request */}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const targetLen = parseFloat(editLength)
                                                        if (isNaN(targetLen) || !selectedWall) return

                                                        const dx = selectedWall.end.x - selectedWall.start.x
                                                        const dy = selectedWall.end.y - selectedWall.start.y
                                                        const centerLength = Math.sqrt(dx * dx + dy * dy)
                                                        const chainIds = new Set([selectedWall.id])

                                                        const nx = -dy / centerLength
                                                        const ny = dx / centerLength
                                                        const faceNormal = { x: nx * (editFace === "interior" ? 1 : -1), y: ny * (editFace === "interior" ? 1 : -1) }

                                                        const midP = { x: (selectedWall.start.x + selectedWall.end.x) / 2, y: (selectedWall.start.y + selectedWall.end.y) / 2 }
                                                        const testP = { x: midP.x + faceNormal.x * 12, y: midP.y + faceNormal.y * 12 }
                                                        const isInterior = (editFace === "interior") || isPointInAnyRoom(testP)

                                                        const back = findTerminal(selectedWall, selectedWall.start, chainIds, faceNormal, isInterior)
                                                        const forward = findTerminal(selectedWall, selectedWall.end, chainIds, faceNormal, isInterior)
                                                        const chainLen = centerLength + back.addedLen + forward.addedLen

                                                        const terminalStartWall = walls.find(w => w.id === back.terminalWallId) || selectedWall
                                                        const terminalEndWall = walls.find(w => w.id === forward.terminalWallId) || selectedWall

                                                        let currentTotal = chainLen +
                                                            getFaceOffsetAt(terminalEndWall, forward.terminal, faceNormal, chainIds, true) -
                                                            getFaceOffsetAt(terminalStartWall, back.terminal, faceNormal, chainIds, false)

                                                        const delta = targetLen - currentTotal
                                                        if (selectedWall && Math.abs(delta) > 0.01) {
                                                            onUpdateWallLength(selectedWall.id, centerLength + delta, "right", faceNormal)
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
                                                <NumericInput
                                                    label="Ancho"
                                                    value={editLength}
                                                    step={0.1}
                                                    setter={setEditLength}
                                                    onEnter={(val) => {
                                                        const finalVal = val !== undefined ? val : editLength
                                                        const updates: any = { width: parseFloat(finalVal) }
                                                        if ((selectedElement.type === "window" || selectedElement.type === "shunt") && editHeight) updates.height = parseFloat(editHeight)
                                                        onUpdateElement(selectedElement.type, selectedElement.id, updates)
                                                        setEditMode("menu")
                                                    }}
                                                />
                                                {/* Unit removed per user request */}
                                            </div>
                                            {(selectedElement.type === "window" || selectedElement.type === "shunt") && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase w-8">Alto</span>
                                                    <NumericInput
                                                        label="Alto"
                                                        value={editHeight}
                                                        setter={setEditHeight}
                                                        onEnter={(val) => {
                                                            const finalVal = val !== undefined ? val : editHeight
                                                            onUpdateElement(selectedElement.type, selectedElement.id, {
                                                                width: parseFloat(editLength),
                                                                height: parseFloat(finalVal)
                                                            })
                                                            setEditMode("menu")
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            <button
                                                onClick={() => {
                                                    const updates: any = { width: parseFloat(editLength) }
                                                    if (selectedElement.type === "window" || selectedElement.type === "shunt") updates.height = parseFloat(editHeight)
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
                    </div >
                )
            }
            {/* Generic Measurement Input Overlay */}
            {
                editInputState && (() => {
                    if (editInputState.type === 'window-dimensions' || editInputState.type === 'shunt-dimensions') {
                        const handleCommit = (wRaw: string, hRaw: string) => {
                            const w = parseFloat(wRaw.replace(/,/g, '.'))
                            const h = parseFloat(hRaw.replace(/,/g, '.'))
                            if (!isNaN(w) && !isNaN(h)) {
                                // @ts-ignore
                                editInputState.onCommit({ w, h })
                            }
                            setEditInputState(null)
                        }
                        // @ts-ignore
                        const { w, h } = editInputState.props || { w: 0, h: 0 }

                        return (
                            <div
                                style={{
                                    position: "absolute",
                                    left: editInputState.screenPos.x,
                                    top: editInputState.screenPos.y,
                                    transform: "translate(-50%, -50%)",
                                    zIndex: 100
                                }}
                                className="flex items-center gap-1 p-1 bg-white rounded shadow-md border border-slate-200"
                            >
                                <div className="flex items-center gap-1">
                                    <input
                                        autoFocus
                                        ref={(input) => { if (input) input.select() }}
                                        type="text"
                                        inputMode="decimal"
                                        defaultValue={w}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault()
                                                // Focus next input
                                                const next = e.currentTarget.parentElement?.nextElementSibling?.nextElementSibling as HTMLInputElement // skip spacer
                                                if (next && next.tagName === 'INPUT') next.focus()
                                                else {
                                                    // Fallback if structure changes, just try referencing nearby input
                                                    const inputs = e.currentTarget.closest('div')?.parentElement?.querySelectorAll('input')
                                                    if (inputs && inputs[1]) inputs[1].focus()
                                                }
                                            } else if (e.key === "Escape") {
                                                setEditInputState(null)
                                            }
                                        }}
                                        className="w-12 px-1 py-0.5 text-center text-xs font-bold border border-slate-300 rounded focus:outline-none ring-2 focus:ring-sky-500"
                                        placeholder="Ancho"
                                    />
                                    <span className="text-xs font-bold text-slate-400">x</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        defaultValue={h}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault()
                                                const inputs = e.currentTarget.closest('div')?.parentElement?.querySelectorAll('input')
                                                if (inputs && inputs.length === 2) {
                                                    handleCommit(inputs[0].value, inputs[1].value)
                                                }
                                            } else if (e.key === "Escape") {
                                                setEditInputState(null)
                                            }
                                        }}
                                        className="w-12 px-1 py-0.5 text-center text-xs font-bold border border-slate-300 rounded focus:outline-none ring-2 focus:ring-sky-500"
                                        placeholder="Alto"
                                    />
                                </div>
                                <button
                                    onClick={(e) => {
                                        const inputs = e.currentTarget.parentElement?.querySelectorAll('input')
                                        if (inputs && inputs.length === 2) {
                                            handleCommit(inputs[0].value, inputs[1].value)
                                        }
                                    }}
                                    className="bg-green-500 text-white p-0.5 rounded shadow-sm flex items-center justify-center hover:bg-green-600 w-6 h-6 ml-1"
                                >
                                    <Check className="h-4 w-4" />
                                </button>
                            </div>
                        )
                    }

                    const handleCommit = (rawVal: string) => {
                        const val = parseFloat(rawVal.replace(/,/g, '.'))
                        if (!isNaN(val)) {
                            editInputState.onCommit(val)
                        }
                        setEditInputState(null)
                    }

                    return (
                        <div
                            style={{
                                position: "absolute",
                                left: editInputState.screenPos.x,
                                top: editInputState.screenPos.y,
                                transform: "translate(-50%, -50%)",
                                zIndex: 100
                            }}
                            className="flex items-center gap-1"
                        >
                            <input
                                autoFocus
                                ref={(input) => { if (input) input.select() }}
                                type="text"
                                inputMode="decimal"
                                defaultValue={editInputState.val.toFixed(1)}
                                onBlur={(e) => handleCommit(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleCommit(e.currentTarget.value)
                                    } else if (e.key === "Escape") {
                                        setEditInputState(null)
                                    }
                                }}
                                className="w-16 px-1 py-0.5 text-center text-xs font-bold border border-black rounded shadow-sm focus:outline-none ring-2 ring-sky-500 bg-white"
                            />
                            {/* Mobile/Touch Confirm Button */}
                            <button
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement
                                    if (input) handleCommit(input.value)
                                }}
                                className="bg-green-500 text-white p-0.5 rounded shadow-sm flex items-center justify-center hover:bg-green-600 w-6 h-6"
                            >
                                <Check className="h-4 w-4" />
                            </button>
                        </div>
                    )
                })()
            }

        </div >
    )
}

CanvasEngine.displayName = "CanvasEngine"
