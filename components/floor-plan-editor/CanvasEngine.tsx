"use client"
import React from "react"
import { Stage, Layer, Group, Line, Rect, Text, Circle, Arc as KonvaArc, Arrow } from "react-konva"
import { Grid } from "./Grid"
import { getClosestPointOnSegment, generateArcPoints } from "@/lib/utils/geometry"
import { Scissors, Plus, Pencil, Trash2, X, RotateCcw, Copy, FlipHorizontal, FlipVertical, SquareDashed, Spline } from "lucide-react"

interface Point { x: number; y: number }
interface Wall { id: string; start: Point; end: Point; thickness: number; isInvisible?: boolean }

interface Room { id: string; name: string; polygon: Point[]; area: number; color: string; visualCenter?: Point }

interface Door { id: string; wallId: string; t: number; width: number; flipX?: boolean; flipY?: boolean; openType?: "single" | "double" | "sliding" }
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
    onUpdateWallInvisible: (id: string, isInvisible: boolean) => void
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
    phantomArc?: { start: Point, end: Point, depth: number }
    touchOffset?: number
    forceTouchOffset?: boolean
    snappingEnabled?: boolean
    rulerPoints?: { start: Point, end: Point } | null
    onReady?: (api: CanvasEngineRef) => void
    gridRotation?: number
    onRotateGrid?: (angle: number) => void
}

export interface CanvasEngineRef {
    getSnapshot: () => string
}

export const CanvasEngine = ({
    width, height, zoom, offset,
    walls, rooms, doors, windows,
    currentWall, activeTool, hoveredWallId, onPan, onZoom, onMouseDown, onMouseMove, onMouseUp, onHoverWall, onSelectWall, onDragWall, onDragEnd, onUpdateWallLength, onDeleteWall, onSplitWall, onUpdateWallThickness, onUpdateWallInvisible, onUpdateRoom, selectedWallIds, selectedRoomId, onSelectRoom, onDragVertex, wallSnapshot, onStartDragWall, onDragElement, selectedElement, onSelectElement, onUpdateElement, onCloneElement, onDeleteElement, bgImage, bgConfig, onUpdateBgConfig, isCalibrating, calibrationPoints, calibrationTargetValue, onUpdateCalibrationPoint,
    phantomArc,
    snappingEnabled = true,
    rulerPoints,
    onReady,
    gridRotation = 0,
    onRotateGrid,
    touchOffset = 40,
    forceTouchOffset = false
}: CanvasEngineProps) => {
    const stageRef = React.useRef<any>(null)
    const gridRef = React.useRef<any>(null)
    const [image, setImage] = React.useState<HTMLImageElement | null>(null)
    const isSamePoint = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < 5.0
    const lastTapRef = React.useRef<number>(0)
    const dragOffsetRef = React.useRef<{ x: number, y: number } | null>(null)

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
    const [editFace, setEditFace] = React.useState<"center" | "interior" | "exterior">("center")
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
    const NumericKeypad = ({ value, onChange, onConfirm, onCancel, title }: { value: string, onChange: (v: string) => void, onConfirm: () => void, onCancel: () => void, title: string }) => {
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
            onConfirm()
        }

        return (
            <div className="w-full bg-white border-t-2 border-slate-200 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                {/* Value Display */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-slate-800">{tempValue || "0"}</span>
                        <span className="text-sm text-slate-400">cm</span>
                    </div>
                </div>

                {/* Keyboard Row */}
                <div className="flex items-center gap-0.5 p-1.5">
                    {/* Digits 0-9 */}
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map(digit => (
                        <button
                            key={digit}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDigit(digit)
                            }}
                            className="flex-1 h-11 flex items-center justify-center rounded-md text-lg font-bold bg-slate-50 text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-all active:scale-95 border border-slate-200"
                        >
                            {digit}
                        </button>
                    ))}

                    {/* Delete Button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDelete()
                        }}
                        className="flex-1 h-11 flex items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 transition-all active:scale-95 border border-red-200"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>

                    {/* OK Button */}
                    <button
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

    const NumericInput = ({ label, value, setter, onEnter, placeholder }: { label?: string, value: string, setter: (v: string) => void, onEnter: () => void, placeholder?: string }) => {
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
                        <span className="text-xs font-bold text-sky-500 uppercase">cm</span>
                    </button>
                    {showKeypad && (
                        <div className="fixed inset-0 z-[3000] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowKeypad(false)}>
                            <div className="fixed bottom-0 left-0 right-0 safe-area-inset-bottom" onClick={e => e.stopPropagation()}>
                                <NumericKeypad
                                    title={label || "Introducir valor"}
                                    value={value}
                                    onChange={setter}
                                    onConfirm={() => {
                                        onEnter()
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
                type="number"
                autoFocus
                value={value}
                onChange={(e) => setter(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onEnter()
                }}
                className="w-16 p-1.5 border-2 border-slate-200 rounded-lg text-center text-sm font-bold text-slate-800 focus:border-sky-500 focus:outline-none transition-colors"
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
                setEditLength(Math.round(Math.sqrt(dx * dx + dy * dy)).toString())
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

    // Sync editLength when editFace changes to match the visualized dimension
    React.useEffect(() => {
        if (!selectedWall || !editMode) return

        const dx = selectedWall.end.x - selectedWall.start.x
        const dy = selectedWall.end.y - selectedWall.start.y
        const centerLength = Math.sqrt(dx * dx + dy * dy)

        let targetLen = centerLength
        if (editFace !== "center") {
            const nx = -dy / centerLength
            const ny = dx / centerLength
            // Use same faceNormal logic as in renderWallMeasurement/Buttons
            const faceNormal = { x: nx * (editFace === "interior" ? 1 : -1), y: ny * (editFace === "interior" ? 1 : -1) }

            // Use Segment-Only logic (no chain) to match editing behavior
            const chainIds = new Set([selectedWall.id])

            targetLen += getFaceOffsetAt(selectedWall, selectedWall.start, faceNormal, chainIds) +
                getFaceOffsetAt(selectedWall, selectedWall.end, faceNormal, chainIds)
        }

        setEditLength(Math.round(targetLen).toString())
    }, [editFace, selectedWall, editMode])

    const renderWallMeasurement = (wall: Wall, offsetVal: number, color: string = "#64748b", isInteractive: boolean = false, overrideLength?: number) => {
        const dx = wall.end.x - wall.start.x
        const dy = wall.end.y - wall.start.y
        if (wall.isInvisible) return null
        const centerLength = Math.sqrt(dx * dx + dy * dy)

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
        const displayLength = overrideLength !== undefined ? overrideLength : Math.round(totalChainCenter + finalOffStart + finalOffEnd)

        if (!shouldShowLabel) return null

        const ux = dx / centerLength
        const uy = dy / centerLength

        // Offset visual de la línea de medida
        const isShortWall = displayLength < 60
        // Use a larger offset for short walls to push text out of the corner
        const visualOff = isShortWall ? offsetVal * 3.5 : offsetVal * 0.8

        const p1x = (back.terminal.x + ux * (-finalOffStart)) + nx * visualOff
        const p1y = (back.terminal.y + uy * (-finalOffStart)) + ny * visualOff
        const p2x = (forward.terminal.x + ux * (finalOffEnd)) + nx * visualOff
        const p2y = (forward.terminal.y + uy * (finalOffEnd)) + ny * visualOff

        // Base line positions (where the main dimension line sits)
        const baseVisualOff = offsetVal * 0.8
        const bp1x = (back.terminal.x + ux * (-finalOffStart)) + nx * baseVisualOff
        const bp1y = (back.terminal.y + uy * (-finalOffStart)) + ny * baseVisualOff
        const bp2x = (forward.terminal.x + ux * (finalOffEnd)) + nx * baseVisualOff
        const bp2y = (forward.terminal.y + uy * (finalOffEnd)) + ny * baseVisualOff

        const labelX = (p1x + p2x) / 2
        const labelY = (p1y + p2y) / 2

        // Leader line origin (center of the standard dimension line)
        const originX = (bp1x + bp2x) / 2
        const originY = (bp1y + bp2y) / 2

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

                {isShortWall && (
                    <Line
                        points={[originX, originY, labelX, labelY]}
                        stroke={color}
                        strokeWidth={0.5 / zoom}
                        dash={[2, 2]}
                        opacity={0.8}
                    />
                )}

                <Group
                    name="measurement-group"
                    x={labelX}
                    y={labelY}
                    rotation={(Math.atan2(dy, dx) * 180 / Math.PI) > 90
                        ? (Math.atan2(dy, dx) * 180 / Math.PI) - 180
                        : ((Math.atan2(dy, dx) * 180 / Math.PI) < -90
                            ? (Math.atan2(dy, dx) * 180 / Math.PI) + 180
                            : Math.atan2(dy, dx) * 180 / Math.PI)}
                    onClick={(e) => {
                        e.cancelBubble = true
                        if (!selectedWallIds.includes(wall.id)) {
                            onSelectWall(wall.id)
                        }
                        setEditFace(faceType)
                        setEditLength(displayLength.toString())
                        setEditMode("length")
                    }}
                    onTap={(e) => {
                        e.cancelBubble = true
                        if (!selectedWallIds.includes(wall.id)) {
                            onSelectWall(wall.id)
                        }
                        setEditFace(faceType)
                        setEditLength(displayLength.toString())
                        setEditMode("length")
                    }}
                >
                    <Rect
                        name="measurement-bg"
                        x={-25 / zoom}
                        y={-10 / zoom}
                        width={50 / zoom}
                        height={20 / zoom}
                        fill="white"
                        stroke={isInteractive && editMode === "length" && editFace === faceType ? "#0ea5e9" : "#e2e8f0"}
                        strokeWidth={isInteractive ? 1 / zoom : 0.5 / zoom}
                        cornerRadius={4 / zoom}
                    />
                    <Text
                        name="measurement-text"
                        x={0}
                        y={-5 / zoom}
                        text={`${displayLength} cm`}
                        fontSize={14 / zoom}
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
        const virtualTarget = isTouchInteraction ? stage.getIntersection({ x: stagePos.x, y: adjustedY }) : e.target
        const targetName = virtualTarget?.name() || ""
        const isBackground = !virtualTarget || virtualTarget === stage

        const isRightClick = e.evt.button === 2
        const isMiddleClick = e.evt.button === 1
        const isRoom = targetName.startsWith("room-")

        // Handle multi-touch for zoom (prevent drawing if 2 fingers)
        if (e.evt.pointerType === 'touch' && e.evt.isPrimary === false) {
            return
        }

        if (isRightClick || isMiddleClick || isBackground || (activeTool === "select" && !targetName.startsWith("wall-") && !targetName.startsWith("door-") && !targetName.startsWith("window-") && !targetName.startsWith("vertex-") && !targetName.startsWith("measurement-"))) {
            onSelectWall(null)
            onSelectRoom(null)
            onSelectElement(null)

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

        if (activeTool !== "wall" && activeTool !== "door" && activeTool !== "window" && activeTool !== "ruler" && activeTool !== "arc") return

        const pos = getRelativePointerPosition(stage, { x: stagePos.x, y: adjustedY })

        // NEW TOUCH-UP DRAWING LOGIC:
        // On touch devices with drawing tools, DELAY the click until finger is released
        // This allows users to "aim" using the crosshair and snapping guides
        const isDrawingTool = activeTool === "wall" || activeTool === "door" || activeTool === "window" || activeTool === "ruler" || activeTool === "arc"
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
                                        onClick={(e) => { e.cancelBubble = true; onSelectRoom(room.id) }}
                                        onTap={(e) => { e.cancelBubble = true; onSelectRoom(room.id) }}
                                    />
                                    <Group
                                        name="room-label"
                                        x={labelPos.x} y={labelPos.y}
                                        onClick={(e) => { e.cancelBubble = true; onSelectRoom(room.id) }}
                                        onTap={(e) => { e.cancelBubble = true; onSelectRoom(room.id) }}
                                    >
                                        <Text
                                            name="room-label-text"
                                            y={-10}
                                            text={room.name}
                                            fontSize={18}
                                            fill="#1e293b"
                                            fontStyle="bold"
                                            align="center"
                                            offsetX={30}
                                        />
                                        <Text
                                            name="room-label-text"
                                            y={5}
                                            text={`${room.area.toFixed(2)} m²`}
                                            fontSize={14}
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
                                        lineCap="round"
                                        lineJoin="round"
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
                                    {/* Medidas duales para pared seleccionada */}
                                    {isSelected && (
                                        <>
                                            {renderWallMeasurement(wall, 25 / zoom, "#0ea5e9", true)}
                                            {renderWallMeasurement(wall, -25 / zoom, "#0ea5e9", true)}
                                        </>
                                    )}

                                    {/* Mostrar medida si la habitación está seleccionada (y el muro no, para no duplicar) */}
                                    {/* Measurements removed on room selection */}
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
                                    name={`door-${door.id}`}
                                    x={pos.x} y={pos.y}
                                    rotation={wallAngle}
                                    draggable={activeTool === "select"}
                                    onClick={(e) => { e.cancelBubble = true; onSelectElement({ type: "door", id: door.id }) }}
                                    onTap={(e) => { e.cancelBubble = true; onSelectElement({ type: "door", id: door.id }) }}
                                    onDragStart={(e) => {
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
                                        //    We do NOT allow free movement. Element must be on a wall.
                                        if (closestWall) {
                                            // Force visual position to be EXACTLY on the wall projection
                                            e.target.position({ x: closestWall.projX, y: closestWall.projY })

                                            // 4. Update state with "Side" Preservation
                                            //    Pass a slightly offset position so internal logic finds the same wall AND correct side
                                            let offX = virtualCenterX - closestWall.projX
                                            let offY = virtualCenterY - closestWall.projY
                                            const currentDist = Math.sqrt(offX * offX + offY * offY)

                                            let reportX = closestWall.projX
                                            let reportY = closestWall.projY

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

                                    {/* Etiqueta de Dimensiones (Ancho) */}
                                    {isSelected && (
                                        <Group x={0} y={0} rotation={-wallAngle % 180 === 0 ? 0 : (Math.abs(wallAngle) > 90 ? 180 : 0)}>
                                            {/* Fix rotation logic: ensure text is always readable (not upside down) */}
                                            {/* Actually the Group rotation above might be erratic. Let's simplify. */}
                                            {/* If we rotate 180, we flip content. */}
                                            <Text
                                                text={`${door.width} cm`}
                                                fontSize={11} // Increased from 7
                                                fill="#475569"
                                                align="center"
                                                width={door.width}
                                                offsetX={door.width / 2}
                                                offsetY={-5} // Moved up slightly
                                                fontStyle="bold"
                                            />
                                        </Group>
                                    )}

                                    {/* Distancias dinámicas alineadas con el muro (Estilo HomeByMe) */}
                                    {isSelected && (
                                        <Group rotation={0}>
                                            {d1Val > 5 && (
                                                <Group x={gap1CenterLocalX} y={20 + wall.thickness / 2}>
                                                    <Group rotation={-wallAngle % 180 === 0 ? 0 : (Math.abs(wallAngle) > 90 ? 180 : 0)}>
                                                        <Rect
                                                            width={35} height={18} x={-17.5} y={-9}
                                                            fill="white" stroke="#0ea5e9" strokeWidth={0.5} cornerRadius={4}
                                                            shadowColor="black" shadowBlur={2} shadowOpacity={0.1}
                                                        />
                                                        <Text text={`${d1} cm`} x={-17.5} y={-6} fontSize={10} fill="#0ea5e9" align="center" width={35} fontStyle="bold" />
                                                    </Group>
                                                </Group>
                                            )}
                                            {d2Val > 5 && (
                                                <Group x={gap2CenterLocalX} y={20 + wall.thickness / 2}>
                                                    <Group rotation={-wallAngle % 180 === 0 ? 0 : (Math.abs(wallAngle) > 90 ? 180 : 0)}>
                                                        <Rect
                                                            width={35} height={18} x={-17.5} y={-9}
                                                            fill="white" stroke="#0ea5e9" strokeWidth={0.5} cornerRadius={4}
                                                            shadowColor="black" shadowBlur={2} shadowOpacity={0.1}
                                                        />
                                                        <Text text={`${d2} cm`} x={-17.5} y={-6} fontSize={10} fill="#0ea5e9" align="center" width={35} fontStyle="bold" />
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
                                    name={`window-${window.id}`}
                                    x={pos.x} y={pos.y}
                                    rotation={wallAngle}
                                    draggable={activeTool === "select"}
                                    onClick={(e) => { e.cancelBubble = true; onSelectElement({ type: "window", id: window.id }) }}
                                    onTap={(e) => { e.cancelBubble = true; onSelectElement({ type: "window", id: window.id }) }}
                                    onDragStart={(e) => {
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
                                            e.target.position({ x: closestWall.projX, y: closestWall.projY })

                                            // 4. Update state with "Side" Preservation
                                            let offX = virtualCenterX - closestWall.projX
                                            let offY = virtualCenterY - closestWall.projY
                                            const currentDist = Math.sqrt(offX * offX + offY * offY)

                                            let reportX = closestWall.projX
                                            let reportY = closestWall.projY

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
                                        stroke={isSelected ? "#0ea5e9" : "#334155"}
                                        strokeWidth={isSelected ? 2 : 1}
                                        listening={false}
                                    />
                                    <Line points={[-window.width / 2, 0, window.width / 2, 0]} stroke={isSelected ? "#0ea5e9" : "#334155"} strokeWidth={isSelected ? 2 : 1} listening={false} />

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
                    {/* Phantom Arc Guide */}
                    {/* RENDERIZAR ARCO FANTASMA (PHANTOM ARC) */}
                    {phantomArc && (() => {
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
                    })()}

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
                            padding: '4px',
                            borderRadius: '16px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
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
                        <div className="w-full h-4 flex justify-center items-center mb-1 cursor-grab active:cursor-grabbing">
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full hover:bg-slate-300 transition-colors" />
                        </div>

                        <div className="flex items-center gap-0.5">
                            {editMode === "menu" ? (
                                <>
                                    {selectedWall && (
                                        <>
                                            <MenuButton
                                                icon={<Scissors className="h-3.5 w-3.5" />}
                                                onClick={() => onSplitWall?.(selectedWall.id)}
                                                title="Dividir tabique"
                                            />
                                            <MenuButton
                                                icon={<SquareDashed className={`h-3.5 w-3.5 ${selectedWall.isInvisible ? 'text-sky-500 fill-sky-50' : ''}`} />}
                                                onClick={() => onUpdateWallInvisible(selectedWall.id, !selectedWall.isInvisible)}
                                                title="Separador de estancias"
                                            />
                                        </>
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
                                                    <MenuButton
                                                        icon={<Spline className="h-3.5 w-3.5" />}
                                                        onClick={() => {
                                                            const el = doors.find(d => d.id === selectedElement.id)
                                                            if (el) {
                                                                const types = ["single", "double", "sliding"] as const
                                                                // @ts-ignore
                                                                const currentIdx = types.indexOf(el.openType || "single")
                                                                const nextType = types[(currentIdx + 1) % types.length]
                                                                // @ts-ignore
                                                                onUpdateElement("door", el.id, { openType: nextType })
                                                            }
                                                        }}
                                                        title="Cambiar tipo apertura"
                                                    />
                                                </>
                                            )}
                                        </>
                                    )}
                                    <MenuButton
                                        icon={<Pencil className="h-3.5 w-3.5" />}
                                        onClick={() => setEditMode(selectedWall ? "thickness" : selectedElement ? "length" : "room")}
                                        title="Editar"
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
                                        <X className="h-3 w-3" />
                                    </button>
                                </>
                            ) : editMode === "room" || editMode === "room-custom" ? (
                                <div className="flex flex-col gap-2 p-2 min-w-[180px]">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{editMode === "room-custom" ? "Nombre Personalizado" : "Tipo de Habitación"}</span>
                                        <button onClick={() => setEditMode("menu")} className="text-slate-400 hover:text-slate-600">
                                            <X className="h-3 w-3" />
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
                                            setter={setEditThickness}
                                            onEnter={() => {
                                                if (selectedWall) {
                                                    onUpdateWallThickness(selectedWall.id, parseInt(editThickness))
                                                    setEditMode("menu")
                                                }
                                            }}
                                        />
                                        {!isMobile && <span className="text-[10px] font-semibold text-slate-400">cm</span>}
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

                                                        // FIXED: Start/Up Arrow Logic (Single Segment)
                                                        const dx = selectedWall.end.x - selectedWall.start.x
                                                        const dy = selectedWall.end.y - selectedWall.start.y
                                                        const centerLength = Math.sqrt(dx * dx + dy * dy)

                                                        const chainIds = new Set([selectedWall.id])
                                                        let currentTotal = centerLength
                                                        if (editFace !== "center") {
                                                            const nx = -dy / centerLength
                                                            const ny = dx / centerLength
                                                            const faceNormal = { x: nx * (editFace === "interior" ? 1 : -1), y: ny * (editFace === "interior" ? 1 : -1) }
                                                            currentTotal += getFaceOffsetAt(selectedWall, selectedWall.start, faceNormal, chainIds) +
                                                                getFaceOffsetAt(selectedWall, selectedWall.end, faceNormal, chainIds)
                                                        }

                                                        const delta = targetLen - currentTotal
                                                        if (selectedWall && Math.abs(delta) > 0.01) {
                                                            onUpdateWallLength(selectedWall.id, centerLength + delta, "left")
                                                        }

                                                        setEditMode("menu")
                                                    }}
                                                    className="p-1.5 bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-600 rounded-md transition-all"
                                                >
                                                    {Math.abs(selectedWall.start.y - selectedWall.end.y) < 1 ? "←" : "↑"}
                                                </button>
                                                <div className="flex items-center gap-1 bg-white border-2 border-slate-100 rounded-lg px-2 py-1">
                                                    <NumericInput
                                                        label={`Medida ${editFace}`}
                                                        value={editLength}
                                                        setter={setEditLength}
                                                        onEnter={() => {
                                                            const targetLen = parseInt(editLength)
                                                            if (isNaN(targetLen) || !selectedWall) return

                                                            const dx = selectedWall.end.x - selectedWall.start.x
                                                            const dy = selectedWall.end.y - selectedWall.start.y
                                                            const centerLength = Math.sqrt(dx * dx + dy * dy)
                                                            const chainIds = new Set([selectedWall.id])
                                                            let currentTotal = centerLength
                                                            if (editFace !== "center") {
                                                                const nx = -dy / centerLength
                                                                const ny = dx / centerLength
                                                                const faceNormal = { x: nx * (editFace === "interior" ? 1 : -1), y: ny * (editFace === "interior" ? 1 : -1) }
                                                                currentTotal += getFaceOffsetAt(selectedWall, selectedWall.start, faceNormal, chainIds) +
                                                                    getFaceOffsetAt(selectedWall, selectedWall.end, faceNormal, chainIds)
                                                            }
                                                            const delta = targetLen - currentTotal
                                                            onUpdateWallLength(selectedWall.id, centerLength + delta, "right")
                                                            setEditMode("menu")
                                                        }}
                                                    />
                                                    {!isMobile && <span className="text-[10px] font-bold text-slate-400">cm</span>}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const targetLen = parseInt(editLength)
                                                        if (isNaN(targetLen)) return

                                                        // FIXED: End/Down Arrow Logic (Single Segment)
                                                        const dx = selectedWall.end.x - selectedWall.start.x
                                                        const dy = selectedWall.end.y - selectedWall.start.y
                                                        const centerLength = Math.sqrt(dx * dx + dy * dy)

                                                        const chainIds = new Set([selectedWall.id])
                                                        let currentTotal = centerLength
                                                        if (editFace !== "center") {
                                                            const nx = -dy / centerLength
                                                            const ny = dx / centerLength
                                                            const faceNormal = { x: nx * (editFace === "interior" ? 1 : -1), y: ny * (editFace === "interior" ? 1 : -1) }
                                                            currentTotal += getFaceOffsetAt(selectedWall, selectedWall.start, faceNormal, chainIds) +
                                                                getFaceOffsetAt(selectedWall, selectedWall.end, faceNormal, chainIds)
                                                        }

                                                        const delta = targetLen - currentTotal
                                                        if (selectedWall && Math.abs(delta) > 0.01) {
                                                            onUpdateWallLength(selectedWall.id, centerLength + delta, "right")
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
                                                    setter={setEditLength}
                                                    onEnter={() => {
                                                        const updates: any = { width: parseInt(editLength) }
                                                        if (selectedElement.type === "window" && editHeight) updates.height = parseInt(editHeight)
                                                        onUpdateElement(selectedElement.type, selectedElement.id, updates)
                                                        setEditMode("menu")
                                                    }}
                                                />
                                                {!isMobile && <span className="text-[9px] font-bold text-slate-400">cm</span>}
                                            </div>
                                            {selectedElement.type === "window" && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase w-8">Alto</span>
                                                    <NumericInput
                                                        label="Alto"
                                                        value={editHeight}
                                                        setter={setEditHeight}
                                                        onEnter={() => {
                                                            onUpdateElement(selectedElement.type, selectedElement.id, {
                                                                width: parseInt(editLength),
                                                                height: parseInt(editHeight)
                                                            })
                                                            setEditMode("menu")
                                                        }}
                                                    />
                                                    {!isMobile && <span className="text-[9px] font-bold text-slate-400">cm</span>}
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

CanvasEngine.displayName = "CanvasEngine"
