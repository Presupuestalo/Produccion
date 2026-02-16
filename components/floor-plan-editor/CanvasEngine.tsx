"use client"
import React from "react"
import { Stage, Layer, Group, Line, Rect, Text, Circle, Arc as KonvaArc, Arrow } from "react-konva"
import { Grid } from "./Grid"
import { getClosestPointOnSegment, generateArcPoints, getLineIntersection } from "@/lib/utils/geometry"
import { Scissors, Plus, Pencil, Trash2, X, RotateCcw, Copy, FlipHorizontal, FlipVertical, SquareDashed, Spline, Check, Delete, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react"
import { NumericInput } from "./NumericInput"
import { UnifiedWallEditor } from "./UnifiedWallEditor"


interface Point { x: number; y: number }
interface Wall { id: string; start: Point; end: Point; thickness: number; isInvisible?: boolean; offsetMode?: 'center' | 'outward' | 'inward' }

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
    onUpdateCalibrationValue?: (val: number) => void
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
    showRoomNames?: boolean
    onDblClick?: (point: Point) => void
    onDblTap?: (point: Point) => void
    showAreas?: boolean
}

export interface CanvasEngineRef {
    getSnapshot: () => string
}


// Memoized Shunt Item to prevent re-renders during drag (fixes stutter)
const ShuntItem = React.memo(({
    shunt, isSelected, activeTool, walls, snappingEnabled, zoom, shunts,
    setDragShuntState, onSelect, onDragEnd, onEditDimensions, isEditing,
    showAllQuotes
}: {
    shunt: Shunt, isSelected: boolean, activeTool: string,
    walls: Wall[], snappingEnabled: boolean, zoom: number, shunts: Shunt[],
    setDragShuntState: (state: { id: string, x: number, y: number } | null) => void,
    onSelect: () => void,
    onDragEnd: (id: string, x: number, y: number) => void,
    onEditDimensions: (e: any) => void,
    isEditing: boolean,
    showAllQuotes?: boolean
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
            {/* INVISIBLE HIT AREA FOR MOBILE DRAGGING */}
            <Rect
                name={`shunt-${shunt.id}`}
                width={Math.max(shunt.width, 100 / zoom)}
                height={Math.max(shunt.height, 100 / zoom)}
                offsetX={Math.max(shunt.width, 100 / zoom) / 2}
                offsetY={Math.max(shunt.height, 100 / zoom) / 2}
                fill="rgba(255,255,255,0.01)"
                listening={activeTool === "select"}
            />
            <Rect
                name={`shunt-${shunt.id}`}
                width={shunt.width}
                height={shunt.height}
                offsetX={shunt.width / 2}
                offsetY={shunt.height / 2}
                fill="white"
                stroke={isSelected ? "#0ea5e9" : "#334155"}
                strokeWidth={2}
            />
            {((isSelected || showAllQuotes) && !isEditing) && (
                <Text
                    x={0}
                    y={0}
                    text={`${shunt.width.toString().replace('.', ',')}x${shunt.height.toString().replace('.', ',')}`}
                    fontSize={12 / zoom}
                    fill={isSelected ? "#0ea5e9" : "#334155"}
                    align="center"
                    verticalAlign="middle"
                    width={120 / zoom}
                    height={30 / zoom}
                    name="measurement-label"
                    offsetX={60 / zoom}
                    offsetY={15 / zoom}
                    fontStyle="bold"
                    onClick={(e) => { e.cancelBubble = true; if (e.evt) e.evt.stopPropagation(); onEditDimensions(e) }}
                    onTap={(e) => { e.cancelBubble = true; if (e.evt) e.evt.stopPropagation(); onEditDimensions(e) }}
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

// Helper Components outside main component to avoid re-mounting on every render
const SingleInputWrapper = ({ val, screenPos, onCommit, onClose, isMobile }: any) => {
    const [localVal, setLocalVal] = React.useState(val.toFixed(1))

    const commit = (v?: string) => {
        const final = parseFloat((v || localVal).toString().replace(',', '.'))
        if (!isNaN(final)) {
            onCommit(final)
        }
        onClose()
    }

    return (
        <>
            <div className="fixed inset-0 z-[9998] bg-transparent pointer-events-auto" onClick={onClose} />
            <div
                style={{
                    position: "absolute",
                    left: screenPos.x,
                    top: screenPos.y,
                    transform: "translate(-50%, -50%)",
                    zIndex: 9999
                }}
                className="flex items-center gap-1 bg-amber-400 p-1.5 rounded-lg shadow-md border border-amber-500 pointer-events-auto animate-in fade-in zoom-in duration-100 origin-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div onPointerDown={(e) => e.stopPropagation()}>
                    <NumericInput
                        isMobile={isMobile}
                        value={localVal}
                        setter={setLocalVal}
                        onEnter={commit}
                        placeholder="0"
                    />
                </div>
                <button
                    onMouseDown={(e) => {
                        e.preventDefault()
                        commit()
                    }}
                    className="bg-white/20 text-white p-1 rounded hover:bg-white/30 w-8 h-8 flex items-center justify-center transition-colors shadow-sm active:scale-95 mx-0.5"
                    title="Aceptar"
                >
                    <Check className="w-5 h-5" />
                </button>
                <button
                    onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onClose()
                    }}
                    className="bg-red-500/80 text-white p-1 rounded hover:bg-red-600 w-8 h-8 flex items-center justify-center transition-colors shadow-sm active:scale-95 ml-0.5"
                    title="Cancelar"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </>
    )
}

const DualInputWrapper = ({ valObj, screenPos, onCommit, onClose, isMobile }: any) => {
    const [w, setW] = React.useState(valObj.width?.toString() || "0")
    const [h, setH] = React.useState(valObj.height?.toString() || "0")

    const commit = () => {
        const wNum = parseFloat(w.replace(',', '.'))
        const hNum = parseFloat(h.replace(',', '.'))
        if (!isNaN(wNum) && !isNaN(hNum)) {
            onCommit({ width: wNum, height: hNum })
        }
        onClose()
    }

    return (
        <div className={`fixed inset-0 z-[9998] flex ${isMobile ? "items-start pt-4 lg:pt-24" : "items-center"} justify-center pointer-events-none`}>
            {isMobile && <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] pointer-events-auto" onClick={onClose} />}
            <div
                style={{
                    position: isMobile ? "relative" : "absolute",
                    left: isMobile ? "auto" : screenPos.x,
                    top: isMobile ? "auto" : screenPos.y,
                    transform: isMobile ? "none" : "translate(-50%, -50%)",
                    zIndex: 9999
                }}
                className="flex items-center gap-1 bg-white p-2 rounded-xl shadow-2xl border border-slate-200 pointer-events-auto animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <NumericInput
                    isMobile={isMobile}
                    value={w}
                    setter={setW}
                    onEnter={() => { }}
                    placeholder="Ancho"
                    label="Ancho (cm)"
                />
                <span className="text-xs font-bold text-slate-400 mx-1">x</span>
                <NumericInput
                    isMobile={isMobile}
                    value={h}
                    setter={setH}
                    onEnter={() => { }}
                    placeholder="Alto/Largo"
                    label="Alto / Largo (cm)"
                />
                <button
                    onClick={commit}
                    className="bg-green-500 text-white p-1 rounded-lg shadow-sm flex items-center justify-center hover:bg-green-600 w-9 h-9 active:scale-90 transition-all ml-2"
                    title="Aceptar"
                >
                    <Check className="h-5 w-5" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="bg-red-500 text-white p-1 rounded-lg shadow-sm flex items-center justify-center hover:bg-red-600 w-9 h-9 active:scale-90 transition-all ml-1"
                    title="Cancelar"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    )
}

export const CanvasEngine = ({
    width, height, zoom, offset,
    walls, rooms, doors, windows, shunts = [],
    currentWall, activeTool, hoveredWallId, onPan, onZoom, onMouseDown, onMouseMove, onMouseUp, onHoverWall, onSelectWall, onDragWall, onDragEnd, onUpdateWallLength, onDeleteWall, onSplitWall, onUpdateWallThickness, onUpdateWallInvisible, onUpdateRoom, onDeleteRoom, onCloneRoom, selectedWallIds, selectedRoomId, onSelectRoom, onDragVertex, wallSnapshot, onStartDragWall, onDragElement, selectedElement, onSelectElement, onUpdateElement, onCloneElement, onDeleteElement, onUpdateShunt, bgImage, bgConfig, onUpdateBgConfig, isCalibrating, calibrationPoints, calibrationTargetValue, onUpdateCalibrationPoint, onUpdateCalibrationValue,
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
    showAllQuotes = false,
    showRoomNames = true,
    showAreas = true,
    onDblClick,
    onDblTap
}: CanvasEngineProps) => {
    const stageRef = React.useRef<any>(null)
    const gridRef = React.useRef<any>(null)
    const [dragShuntState, setDragShuntState] = React.useState<{ id: string, x: number, y: number } | null>(null)
    const [image, setImage] = React.useState<HTMLImageElement | null>(null)

    // Generic Input State for Inline Editing (Shunts, Doors, Windows, Measures)
    const [editInputState, setEditInputState] = React.useState<{
        id: string,
        type: string,
        val: number | any,
        props?: any,
        screenPos: { x: number, y: number },
        onCommit: (newVal: any) => void
    } | null>(null)

    const isSamePoint = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < 5.0
    const lastTapRef = React.useRef<number>(0)
    const dragOffsetRef = React.useRef<{ x: number, y: number } | null>(null)
    const lastClickedWallForEdit = React.useRef<string | null>(null)
    const touchStartPos = React.useRef<{ x: number, y: number } | null>(null)
    const currentDynamicOffset = React.useRef<number>(0)

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

    const getWallOffset = (wall: Wall): Point => {
        if (!wall.offsetMode || wall.offsetMode === 'center') return { x: 0, y: 0 }

        const dx = wall.end.x - wall.start.x
        const dy = wall.end.y - wall.start.y
        const len = Math.sqrt(dx * dx + dy * dy)
        if (len === 0) return { x: 0, y: 0 }

        // Normal unit vector
        const nx = -dy / len
        const ny = dx / len

        // Test which side is the room - Use a larger distance for robust detection
        const midP = { x: (wall.start.x + wall.end.x) / 2, y: (wall.start.y + wall.end.y) / 2 }
        const testP = { x: midP.x + nx * 20, y: midP.y + ny * 20 }
        const isRoomOnNormalSide = isPointInAnyRoom(testP)

        // For 'outward', we want to shift AWAY from the room
        const multiplier = wall.offsetMode === 'outward'
            ? (isRoomOnNormalSide ? -1 : 1)
            : (isRoomOnNormalSide ? 1 : -1)

        // We shift by (thickness - 10)/2 to keep the inner face at exactly 5cm from skeleton
        // This ensures internal room dimensions are preserved
        const shiftDist = Math.max(0, (wall.thickness - 10) / 2)
        return { x: nx * multiplier * shiftDist, y: ny * multiplier * shiftDist }
    }

    const calculateLineIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {
        const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y
        const x3 = p3.x, y3 = p3.y, x4 = p4.x, y4 = p4.y
        const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
        if (Math.abs(denom) < 0.001) return null // Parallel
        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom
        return {
            x: x1 + ua * (x2 - x1),
            y: y1 + ua * (y2 - y1)
        }
    }

    const facadeChains = React.useMemo(() => {
        const currentWS = wallSnapshot || walls
        const facadeWalls = currentWS.filter(w => w.thickness === 20 && !w.isInvisible)
        if (facadeWalls.length === 0) return []

        const chains: { points: number[], closed: boolean }[] = []
        const visited = new Set<string>()

        facadeWalls.forEach(startWall => {
            if (visited.has(startWall.id)) return

            let wallChain: Wall[] = [startWall]
            visited.add(startWall.id)

            const isSamePointLocal = (p1: Point, p2: Point) => Math.abs(p1.x - p2.x) < 2 && Math.abs(p1.y - p2.y) < 2

            // Grow forward
            let growing = true
            while (growing) {
                growing = false
                const lastWall = wallChain[wallChain.length - 1]
                const lastP = lastWall.end
                const nextWall = facadeWalls.find(w => !visited.has(w.id) && (isSamePointLocal(w.start, lastP) || isSamePointLocal(w.end, lastP)))
                if (nextWall) {
                    visited.add(nextWall.id)
                    if (isSamePointLocal(nextWall.end, lastP)) {
                        wallChain.push({ ...nextWall, start: nextWall.end, end: nextWall.start })
                    } else {
                        wallChain.push(nextWall)
                    }
                    growing = true
                }
            }

            // Grow backward
            growing = true
            while (growing) {
                growing = false
                const firstWall = wallChain[0]
                const firstP = firstWall.start
                const prevWall = facadeWalls.find(w => !visited.has(w.id) && (isSamePointLocal(w.start, firstP) || isSamePointLocal(w.end, firstP)))
                if (prevWall) {
                    visited.add(prevWall.id)
                    if (isSamePointLocal(prevWall.start, firstP)) {
                        wallChain.unshift({ ...prevWall, start: prevWall.end, end: prevWall.start })
                    } else {
                        wallChain.unshift(prevWall)
                    }
                    growing = true
                }
            }

            const isLoop = isSamePointLocal(wallChain[0].start, wallChain[wallChain.length - 1].end) && wallChain.length > 1

            // Compute offset segments for each wall
            const segments = wallChain.map(w => {
                const off = getWallOffset(w)
                return {
                    p1: { x: w.start.x + off.x, y: w.start.y + off.y },
                    p2: { x: w.end.x + off.x, y: w.end.y + off.y }
                }
            })

            const chainPoints: number[] = []
            if (isLoop) {
                // For loops, every point is a joint
                for (let i = 0; i < segments.length; i++) {
                    const curr = segments[i]
                    const next = segments[(i + 1) % segments.length]
                    const inter = calculateLineIntersection(curr.p1, curr.p2, next.p1, next.p2)
                    const joint = inter || curr.p2
                    chainPoints.push(joint.x, joint.y)
                }
            } else {
                // For open chains
                // Start point of first wall
                chainPoints.push(segments[0].p1.x, segments[0].p1.y)
                // Intermediate joints
                for (let i = 0; i < segments.length - 1; i++) {
                    const curr = segments[i]
                    const next = segments[i + 1]
                    const inter = calculateLineIntersection(curr.p1, curr.p2, next.p1, next.p2)
                    const joint = inter || curr.p2
                    chainPoints.push(joint.x, joint.y)
                }
                // End point of last wall
                const last = segments[segments.length - 1]
                chainPoints.push(last.p2.x, last.p2.y)
            }

            chains.push({
                points: chainPoints,
                closed: isLoop
            })
        })

        return chains
    }, [walls, wallSnapshot, rooms])

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
            onReady({ getSnapshot })
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
    const dragStartPointerPos = React.useRef<Point | null>(null) // Para calcular delta del ratÃ³n sin saltos
    const isDraggingVertexRef = React.useRef(false) // Manual drag state
    const isPanning = React.useRef(false)
    const isAimingDrawing = React.useRef(false) // Track if touch user is aiming before committing draw point
    const spacePressed = React.useRef(false)
    const autoPanRaf = React.useRef<number | null>(null)
    const panDeltaRef = React.useRef<{ dx: number, dy: number }>({ dx: 0, dy: 0 })
    const isPotentialSustainedPan = React.useRef(false)
    const didSustainedPanOccur = React.useRef(false)
    const lastPointerPos = React.useRef<Point | null>(null) // Para el panning
    const pointerDownPos = React.useRef<Point | null>(null)
    const pointerDownTime = React.useRef<number>(0)
    const aimingStartPos = React.useRef<Point | null>(null) // Where touch started (for tap detection)
    const [isMobile, setIsMobile] = React.useState(false)

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1200 || (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)))
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Keyboard shortcuts for grid rotation

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

    // Spacebar Panning 
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !spacePressed.current) {
                const target = e.target as HTMLElement
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
                e.preventDefault()
                spacePressed.current = true
                setIsPanningState(true)
            }
        }
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                spacePressed.current = false
                if (!isPanning.current) {
                    setIsPanningState(false)
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [])

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
    const cellSize = 100 // 1 metro = 100 pÃ­xeles (1px = 1cm)

    // Global listeners for menu dragging to prevent "getting stuck"
    React.useEffect(() => {
        if (!isDraggingMenuState) return

        const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
            if (menuDragStart.current) {
                const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
                const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

                // IMPORTANTE: En mÃ³vil el scrolling puede interferir, prevenimos si estamos arrastrando menÃº
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
        "SalÃ³n", "Cocina", "Cocina Abierta", "Cocina Americana",
        "BaÃ±o", "Dormitorio", "Pasillo", "Hall", "Terraza",
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

        // Usar snapshot si existe para que los puntos de imÃ¡n sean estÃ¡ticos durante el arrastre
        const candidates: Point[] = []
        const snapshotWalls = wallSnapshot || walls
        snapshotWalls.forEach((w: Wall) => {
            candidates.push(w.start)
            candidates.push(w.end)
        })
        rooms.forEach((r: Room) => {
            r.polygon.forEach((p: Point) => candidates.push(p))
        })

        // Buscar el mÃ¡s cercano con distancia euclidiana
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

        // TambiÃ©n alinear con el punto de inicio de la acciÃ³n actual
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

            // Si snapamos ambos ejes es virtualmente un vÃ©rtice, retornamos ya
            if (snappedX !== null && snappedY !== null) return point
        }

        // 3. EDGE SNAP (Si no hay alineaciÃ³n fuerte de ejes)
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

            // Buscar un muro que sea continuaciÃ³n colineal
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
            // BUT: If we are measuring EXTERIOR, we want to proceed even if the next segment is technically 
            // part of a room (interior) as long as it's collinear and we are on the outside face.

            // Logic: 
            // 1. If we are Interior, we MUST stay Interior.
            // 2. If we are Exterior, we can cross into "Interior" segments IF they form a straight line
            //    and the face we are measuring is still effectively outside (which is hard to know locally).
            //    However, usually "Exterior" measurement implies the whole facade line.

            const midP_cont = { x: (cont.start.x + cont.end.x) / 2, y: (cont.start.y + cont.end.y) / 2 }
            const testP_cont = { x: midP_cont.x + faceNormal.x * 12, y: midP_cont.y + faceNormal.y * 12 }
            const contIsInterior = isPointInAnyRoom(testP_cont)

            if (isInterior && contIsInterior !== isInterior) {
                return { terminal: curr, addedLen, terminalWallId }
            }

            // Check if ANY other neighbor (perpendicular) blocks this specific face
            // FACADE FIX: If we are measuring facade (exterior), we IGNORE partitions.
            // i.e., we only stop at perpendicular walls if we are inside a room.
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
        const TOL_NEIGHBOR = 10.0
        const neighbors = walls.filter(w => !ignoreIds.has(w.id) && w.id !== wall.id && (() => {
            const closestObj = getClosestPointOnSegment(point, w.start, w.end)
            const dist = Math.sqrt(Math.pow(closestObj.point.x - point.x, 2) + Math.pow(closestObj.point.y - point.y, 2))
            return dist < TOL_NEIGHBOR
        })())

        const dx = wall.end.x - wall.start.x
        const dy = wall.end.y - wall.start.y
        const centerLength = Math.max(0.1, Math.sqrt(dx * dx + dy * dy))
        const ux = dx / centerLength
        const uy = dy / centerLength

        const retractions: number[] = [];
        const extensions: number[] = [];
        let hasContinuation = false;

        const wallOff = getWallOffset(wall)
        // Actual distance from skeleton to the face we are calculating
        const D = (wallOff.x * faceNormal.x + wallOff.y * faceNormal.y) + wall.thickness / 2

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

            const isAtStart = Math.sqrt(Math.pow(nw.start.x - point.x, 2) + Math.pow(nw.start.y - point.y, 2)) < TOL_NEIGHBOR
            const isAtEnd = Math.sqrt(Math.pow(nw.end.x - point.x, 2) + Math.pow(nw.end.y - point.y, 2)) < TOL_NEIGHBOR

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
                const nwOff = getWallOffset(nw)
                const nnx = -nuy, nny = nux
                // Face distances for neighbor
                const K1 = (nwOff.x * nnx + nwOff.y * nny) + nw.thickness / 2
                const K2 = (nwOff.x * nnx + nwOff.y * nny) - nw.thickness / 2

                const solveS = (targetK: number) => {
                    const rx = targetK * nnx - D * faceNormal.x
                    const ry = targetK * nny - D * faceNormal.y
                    return (rx * nuy - ry * nux) / cross
                }
                const s1 = solveS(K1), s2 = solveS(K2)
                if (blocksFace) {
                    retractions.push(isEnd ? Math.min(s1, s2) : Math.max(s1, s2))
                } else {
                    extensions.push(isEnd ? Math.max(s1, s2) : Math.min(s1, s2))
                }
            }
        })

        if (retractions.length > 0) return isEnd ? Math.min(...retractions) : Math.max(...retractions)
        if (extensions.length > 0) return isEnd ? Math.max(...extensions) : Math.min(...extensions)
        if (hasContinuation) return 0
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
                const safeOffset = (selectedWall.thickness / 2) + 10
                const testP = { x: midP.x + faceNormal.x * safeOffset, y: midP.y + faceNormal.y * safeOffset }
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
        // Use a fixed distance that is always outside the wall for robust detection
        const testP_dist = (wall.thickness / 2) + 8
        const testP = { x: midP.x + faceNormal.x * testP_dist, y: midP.y + faceNormal.y * testP_dist }
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
                    isVisible = isPointInPolygon(testP, selectedRoom.polygon)
                }
            }
        }

        if (!isVisible) return null

        const isInteractive = forceInteractive ?? isAnyInChainSelected
        const isActuallyInterior = isInterior // Calculated earlier via testP

        const defaultColor = isInteractive
            ? (isActuallyInterior ? "#0ea5e9" : "#f59e0b")
            : (isActuallyInterior ? "#334155" : "#94a3b8")
        const color = forceColor || defaultColor

        // LEADER LOGIC: Exactly one label per chain.
        const sortedIds = Array.from(chainIds).sort()
        const isLeader = wall.id === sortedIds[0]
        if (!isLeader) return null

        const calculatedLen = totalChainCenter + finalOffEnd - finalOffStart
        const displayLength = overrideLength !== undefined ? overrideLength : parseFloat(calculatedLen.toFixed(1))

        const ux = dx / centerLength
        const uy = dy / centerLength

        // Offset visual de la lÃ­nea de medida - CLOSE TO WALL
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

        const p1 = back.terminal
        const p2 = forward.terminal
        const geomKeyBase = (p1.x < p2.x || (p1.x === p2.x && p1.y < p2.y))
            ? `${Math.round(p1.x)},${Math.round(p1.y)}-${Math.round(p2.x)},${Math.round(p2.y)}`
            : `${Math.round(p2.x)},${Math.round(p2.y)}-${Math.round(p1.x)},${Math.round(p1.y)}`

        const geomKeyWithFace = `${geomKeyBase}-${faceType}`

        if (showAllQuotes && !isAnyInChainSelected) {
            // FACE-BASED DEDUPLICATION: We only hide if the EXACT same face (geom + side) was rendered.
            // This ensures shared walls show interior measurements for BOTH rooms.
            if (displayedMeasures.has(geomKeyWithFace)) {
                return null
            }
        }

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
                    // ROBUST TEST POINT: Use a distance that is ALWAYS outside the wall regardless of zoom
                    const safeOffset = (wall.thickness / 2) + 10
                    const testP_robust = { x: midP.x + nx * (faceType === "interior" ? safeOffset : -safeOffset), y: midP.y + ny * (faceType === "interior" ? safeOffset : -safeOffset) }

                    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                        const xi = poly[i].x, yi = poly[i].y
                        const xj = poly[j].x, yj = poly[j].y
                        const intersect = ((yi > testP_robust.y) !== (yj > testP_robust.y)) &&
                            (testP_robust.x < (xj - xi) * (testP_robust.y - yi) / (yj - yi) + xi)
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
                    // ROBUST CENTROID: Use BBox center instead of vertex average to handle split segments
                    const cx = (minX + maxX) / 2
                    const cy = (minY + maxY) / 2

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

        // REGISTRATION: Only register if we actually rendered
        if (showAllQuotes) {
            displayedMeasures.add(geomKeyWithFace)
        }

        return (
            <Group>
                {/* LÃ­nea principal */}
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
                    onPointerDown={(e) => {
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
                        text={`${displayLength.toFixed(1).replace('.', ',')}`}
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
                        text={`${displayLength.toFixed(1).replace('.', ',')}`}
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

        const TOL_VERTEX = 10.0 // Increased from 5.0
        const isSame = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL_VERTEX
        const shareVertex = isSame(w1.start, w2.start) || isSame(w1.start, w2.end) ||
            isSame(w1.end, w2.start) || isSame(w1.end, w2.end)
        if (!shareVertex) return false

        // Dot product should be near 0 for perpendicularity. 
        // Tolerance 0.5 supports up to 30 degrees of deviation.
        const dot = (dx1 / L1) * (dx2 / L2) + (dy1 / L1) * (dy2 / L2)
        return Math.abs(dot) < 0.5
    }

    const handleStagePointerDown = (e: any) => {
        // RE-ENTRY GUARD: Prevent recursion loops if we manually fire pointerdown on targets
        if (e.evt && (e.evt as any)._stagePointerHandled) return
        if (e.evt) (e.evt as any)._stagePointerHandled = true

        const stage = e.target?.getStage?.()
        if (!stage) return

        const stagePos = stage.getPointerPosition()
        if (!stagePos) return

        pointerDownPos.current = { ...stagePos }
        pointerDownTime.current = Date.now()

        const isTouchInteraction = (e.evt as any).pointerType === "touch" || forceTouchOffset

        // IMPROVED: If we tapped exactly on a "protected" element (like a measurement label), 
        // use it directly instead of applying the 80px offset.
        const originalTarget = e.target
        let namedAncestor = originalTarget
        let originalName = namedAncestor?.attrs?.name || namedAncestor?.name?.() || ""

        if (!originalName) {
            const found = originalTarget.findAncestor?.((n: any) => !!(n.attrs?.name || n.name?.()))
            if (found) {
                namedAncestor = found
                originalName = found.attrs?.name || found.name?.() || ""
            }
        }

        const isOriginalProtected = originalName.startsWith("wall-") ||
            originalName.startsWith("door-") ||
            originalName.startsWith("window-") ||
            originalName.startsWith("shunt-") ||
            originalName.startsWith("vertex-") ||
            originalName.startsWith("measurement-") ||
            originalName === "measurement-label" ||
            originalName.startsWith("room-")

        let adjustedY = stagePos.y
        if (isTouchInteraction) {
            // WALL TOOL: Progressive offset starts at 0
            if (activeTool === "wall") {
                touchStartPos.current = { x: stagePos.x, y: stagePos.y }
                currentDynamicOffset.current = 0
            } else {
                // If we hit a protected element directly, don't offset (accuracy priority)
                if (isOriginalProtected) {
                    currentDynamicOffset.current = 0
                } else {
                    adjustedY -= touchOffset
                    currentDynamicOffset.current = touchOffset
                }
                touchStartPos.current = null
            }
        } else {
            touchStartPos.current = null
            currentDynamicOffset.current = 0
        }

        // Si es tÃ¡ctil, buscamos quÃ© hay "bajo el puntero virtual" (con offset bajado si no hubo hit directo)
        let virtualTarget = (isTouchInteraction && !isOriginalProtected) ? stage.getIntersection({ x: stagePos.x, y: adjustedY }) : originalTarget
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
        if ((e.evt as any).pointerType === 'touch' && e.evt.isPrimary === false) {
            return
        }

        const isProtected = targetName.startsWith("wall-") ||
            targetName.startsWith("door-") ||
            targetName.startsWith("window-") ||
            targetName.startsWith("shunt-") ||
            targetName.startsWith("vertex-") ||
            targetName.startsWith("measurement-") ||
            targetName === "measurement-label" ||
            targetName.startsWith("room-")

        if (isRightClick || isMiddleClick || isBackground || spacePressed.current || (activeTool === "select" && (!isProtected || isRoom))) {
            // Only deselect if we are NOT interacting with a room (unless it's a right/middle click which might imply context menu or pan anywhere)
            if (!isRoom || isRightClick || isMiddleClick || spacePressed.current) {
                if (!isRoom) { // Don't deselect everything if we clicked a room (let room onClick handle selection)
                    onSelectWall(null)
                    onSelectRoom(null)
                    onSelectElement(null)
                }
            }

            if (isRightClick || isMiddleClick || spacePressed.current || activeTool === "select") {
                isPanning.current = true
                setIsPanningState(true)
                lastPointerPos.current = stage.getPointerPosition()
                return
            }
        }

        const isPrimaryClick = e.evt.button === 0
        const isDrawingTool = activeTool === "wall" || activeTool === "door" || activeTool === "window" || activeTool === "ruler" || activeTool === "arc" || activeTool === "shunt"

        // SPECIAL CASE: Sustained Click-to-Pan while drawing
        if (isDrawingTool && isPrimaryClick && !isTouchInteraction) {
            // If we are drawing a wall (currentWall exists) or using ruler/arc tool
            if (currentWall || activeTool === "ruler" || activeTool === "arc") {
                isPotentialSustainedPan.current = true
                didSustainedPanOccur.current = false
                return
            }
        }

        if (e.evt.button !== 0 && (e.evt as any).pointerType === 'mouse') return

        // Si pinchamos en algo (o cerca por el offset) y es tÃ¡ctil, disparamos su lÃ³gica
        if (isTouchInteraction && !isBackground) {
            if (activeTool === "select") {
                if (targetName.startsWith("wall-")) {
                    const wallId = targetName.split("wall-")[1].split("-")[0]
                    onSelectWall(wallId, e.evt.ctrlKey)
                } else if (targetName.startsWith("door-")) {
                    const doorId = targetName.split("door-")[1].split("-")[0]
                    onSelectElement({ type: "door", id: doorId })
                } else if (targetName.startsWith("window-")) {
                    const windowId = targetName.split("window-")[1].split("-")[0]
                    onSelectElement({ type: "window", id: windowId })
                } else if (targetName.startsWith("shunt-")) {
                    const shuntId = targetName.split("shunt-")[1].split("-")[0]
                    onSelectElement({ type: "shunt", id: shuntId })
                } else if (targetName === "room-poly" || targetName.startsWith("room-")) {
                    // Try to find roomId from ancestors or ID if encoded
                }

                // Disparamos pointerdown para que Konva inicie draggables SOLO si cambiamos de target
                if (virtualTarget && virtualTarget !== originalTarget) {
                    virtualTarget.fire('pointerdown', e, true)
                }

                // Si es un vÃ©rtice o una medida, evitamos que se empiece a dibujar un muro debajo
                if (targetName === "vertex-handle" || targetName.startsWith("measurement-")) {
                    return
                }
            } else {
                // Para otras herramientas (door, window, etc.), permitir el flujo normal
                // Solo disparar evento para elementos draggables si es necesario
                if (targetName === "vertex-handle" || targetName.startsWith("measurement-")) {
                    virtualTarget.fire('pointerdown', e, true)
                    return
                }
            }
        }

        if (isBackground) {
            onSelectWall(null)
            onSelectRoom(null)
            onSelectElement(null)
        }

        if (activeTool !== "wall" && activeTool !== "door" && activeTool !== "window" && activeTool !== "ruler" && activeTool !== "arc" && activeTool !== "shunt") return

        const pos = getRelativePointerPosition(stage, { x: stagePos.x, y: adjustedY })

        // REMOVED DELAY LOGIC FOR IMMEDIATE DRAWING
        // const isDrawingTool = activeTool === "wall" || activeTool === "door" || activeTool === "window" || activeTool === "ruler" || activeTool === "arc" || activeTool === "shunt"
        // if (isTouchInteraction && isDrawingTool) { ... }


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

        if (isPotentialSustainedPan.current && pointer && pointerDownPos.current) {
            const dist = Math.sqrt(
                Math.pow(pointer.x - pointerDownPos.current.x, 2) +
                Math.pow(pointer.y - pointerDownPos.current.y, 2)
            )
            if (dist > 5) {
                isPanning.current = true
                didSustainedPanOccur.current = true
                setIsPanningState(true)
                lastPointerPos.current = pointer
                return
            }
        }

        const stagePos = stage.getPointerPosition()
        if (!stagePos) return

        let adjustedY = stagePos.y
        if (e.evt.pointerType === "touch" || forceTouchOffset) {
            if (touchStartPos.current && activeTool === "wall") {
                // Calculate distance moved
                const dist = Math.sqrt(
                    Math.pow(stagePos.x - touchStartPos.current.x, 2) +
                    Math.pow(stagePos.y - touchStartPos.current.y, 2)
                )
                // Linear interpolation: 0 to touchOffset over 50px
                const factor = Math.min(1, dist / 50)
                currentDynamicOffset.current = factor * touchOffset
                adjustedY -= currentDynamicOffset.current
            } else {
                adjustedY -= touchOffset
            }
        }

        const pos = getRelativePointerPosition(stage, { x: stagePos.x, y: adjustedY })

        // Always update cursor position for preview (including during aiming phase)
        setMousePos(pos)

        // --- EDGE AUTO-PANNING ---
        const isDrawingTool = (activeTool === "wall" && currentWall) || activeTool === "ruler" || activeTool === "arc"
        if (isDrawingTool && e.evt.pointerType === "mouse") {
            const edgePadding = 40
            const panSpeed = 8 / zoom // Scale pan speed with zoom? No, fixed screen speed is usually better but let's see
            const rect = stage.container().getBoundingClientRect()
            const mouseX = e.evt.clientX - rect.left
            const mouseY = e.evt.clientY - rect.top

            let dx = 0
            let dy = 0

            if (mouseX < edgePadding) dx = panSpeed
            else if (mouseX > width - edgePadding) dx = -panSpeed
            if (mouseY < edgePadding) dy = panSpeed
            else if (mouseY > height - edgePadding) dy = -panSpeed

            if (dx !== 0 || dy !== 0) {
                panDeltaRef.current = { dx, dy }
                if (!autoPanRaf.current) {
                    const step = () => {
                        onPan(offset.x + panDeltaRef.current.dx, offset.y + panDeltaRef.current.dy)
                        autoPanRaf.current = requestAnimationFrame(step)
                    }
                    autoPanRaf.current = requestAnimationFrame(step)
                }
            } else {
                if (autoPanRaf.current) {
                    cancelAnimationFrame(autoPanRaf.current)
                    autoPanRaf.current = null
                }
                panDeltaRef.current = { dx: 0, dy: 0 }
            }
        } else {
            if (autoPanRaf.current) {
                cancelAnimationFrame(autoPanRaf.current)
                autoPanRaf.current = null
            }
        }

        // If we're in aiming mode, update the preview
        if ((activeTool === "wall" && currentWall) || (activeTool === "ruler") || (activeTool === "arc")) {
            onMouseMove(pos)
        }
    }

    const handleStagePointerUp = (e: any) => {
        if (autoPanRaf.current) {
            cancelAnimationFrame(autoPanRaf.current)
            autoPanRaf.current = null
        }

        if (isPanning.current) {
            isPanning.current = false
            if (!spacePressed.current) {
                setIsPanningState(false)
            }
            // If it was a sustained click pan, we consume the event and don't draw
            if (didSustainedPanOccur.current) {
                isPotentialSustainedPan.current = false
                didSustainedPanOccur.current = false
                return
            }
        }

        const stage = e.target?.getStage?.()
        if (!stage) return
        const stagePos = stage.getPointerPosition()
        if (!stagePos) return

        let adjustedY = stagePos.y
        if (e.evt.pointerType === "touch" || forceTouchOffset) {
            if (touchStartPos.current && activeTool === "wall") {
                adjustedY -= currentDynamicOffset.current
            } else {
                adjustedY -= touchOffset
            }
        }

        // Reset for next interaction
        touchStartPos.current = null

        const pos = getRelativePointerPosition(stage, { x: stagePos.x, y: adjustedY })

        // If we were waiting to see if it was a sustained pan or a click...
        if (isPotentialSustainedPan.current) {
            isPotentialSustainedPan.current = false
            // Since didSustainedPanOccur was false (otherwise we'd have returned above),
            // it means it was a simple click. Trigger the standard onMouseDown flow.
            onMouseDown(pos)
            return
        }

        const isTouchOrPen = e.evt.pointerType === 'touch' || e.evt.pointerType === 'pen'

        // REMOVED AIMING COMMIT LOGIC
        /*
        if (isAimingDrawing.current) {
             // ...
        }
        */

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

        // SIMULATED CLICK/TAP for mobile crosshair targets
        // If it was a short tap (minimal move and short time), fire click/tap on the virtual target
        const now = Date.now()
        const clickDuration = now - pointerDownTime.current
        const dist = pointerDownPos.current ? Math.sqrt(
            Math.pow(stagePos.x - pointerDownPos.current.x, 2) +
            Math.pow(stagePos.y - pointerDownPos.current.y, 2)
        ) : 100

        if (isTouchOrPen && clickDuration < 400 && dist < 15) {
            // Find what's under the crosshair (virtual target)
            let adjustedY_forClick = stagePos.y
            const isOriginalProtected = e.target?.name?.()?.startsWith("wall-") ||
                e.target?.name?.()?.startsWith("door-") ||
                e.target?.name?.()?.startsWith("window-") ||
                e.target?.name?.()?.startsWith("shunt-") ||
                e.target?.name?.()?.startsWith("vertex-") ||
                e.target?.name?.()?.startsWith("measurement-") ||
                e.target?.name?.()?.startsWith("room-")

            if (!isOriginalProtected) {
                adjustedY_forClick -= currentDynamicOffset.current
            }

            let virtualTarget = isOriginalProtected ? e.target : stage.getIntersection({ x: stagePos.x, y: adjustedY_forClick })
            if (virtualTarget && virtualTarget !== stage) {
                const name = virtualTarget.attrs?.name || virtualTarget.name?.() || ""
                if (!name) {
                    const ancestor = virtualTarget.findAncestor?.((n: any) => !!(n.attrs?.name || n.name?.()))
                    if (ancestor) virtualTarget = ancestor
                }

                // If we found a target, fire clinical events
                // ONLY fire click, and cancel bubble to avoid stage/background logic
                virtualTarget.fire('click', { ...e, cancelBubble: true }, true)
            }
        }
    }

    const handleMouseLeave = () => {
        if (autoPanRaf.current) {
            cancelAnimationFrame(autoPanRaf.current)
            autoPanRaf.current = null
        }
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
                onDblClick={(e) => {
                    const stage = e.target.getStage()
                    if (stage) {
                        const pos = getRelativePointerPosition(stage)
                        onDblClick?.(pos)
                    }
                }}
                onDblTap={(e) => {
                    const stage = e.target.getStage()
                    if (stage) {
                        const pos = getRelativePointerPosition(stage)
                        onDblTap?.(pos)
                    }
                }}
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
                                    {/* Capa base blanca para ocultar el grid - SOLO si NO hay imagen de fondo */}
                                    {!bgImage && (
                                        <Line
                                            points={points}
                                            fill="#ffffff"
                                            stroke="transparent"
                                            closed={true}
                                            listening={false}
                                        />
                                    )}
                                    {/* Capa de color original */}
                                    {/* Si hay bgImage, bajamos aÃºn mÃ¡s la opacidad para que se vea el plano debajo */}
                                    <Line
                                        name="room-poly"
                                        points={points}
                                        fill={bgImage
                                            ? (selectedRoomId === room.id ? room.color + "30" : room.color + "15")
                                            : (selectedRoomId === room.id ? room.color + "60" : room.color + "40")
                                        }
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

                            const offsetVal = getWallOffset(wall)
                            const renderPoints = [
                                wall.start.x + offsetVal.x,
                                wall.start.y + offsetVal.y,
                                wall.end.x + offsetVal.x,
                                wall.end.y + offsetVal.y
                            ]

                            return (
                                <Group key={wall.id}>
                                    <Line
                                        name={`wall-${wall.id}`}
                                        points={renderPoints}
                                        stroke={wall.isInvisible ? "#0ea5e9" : (wall.thickness === 20 ? "transparent" : (isHovered && !isSelected ? "#ef4444" : "#334155"))}
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

                                        const wallOff = getWallOffset(wall)
                                        const pointSlightlyOff = { x: midX + nx * 20, y: midY + ny * 20 }
                                        const pointsIntoRoom = isPointInAnyRoom(pointSlightlyOff)
                                        const faceNormal = { x: nx * (pointsIntoRoom ? 1 : -1), y: ny * (pointsIntoRoom ? 1 : -1) }

                                        const adjStart = getFaceOffsetAt(wall, wall.start, faceNormal, new Set(), false)
                                        const adjEnd = getFaceOffsetAt(wall, wall.end, faceNormal, new Set(), true)

                                        const trimmedStart = { x: wall.start.x + ux * adjStart, y: wall.start.y + uy * adjStart }
                                        const trimmedEnd = { x: wall.end.x + ux * adjEnd, y: wall.end.y + uy * adjEnd }

                                        // Apply offset to the selection highlight as well
                                        const renderPoints = [
                                            trimmedStart.x + wallOff.x, trimmedStart.y + wallOff.y,
                                            trimmedEnd.x + wallOff.x, trimmedEnd.y + wallOff.y
                                        ]

                                        return (
                                            <Line
                                                points={renderPoints}
                                                stroke="#0ea5e9"
                                                strokeWidth={wall.thickness + 0.5}
                                                lineCap="butt"
                                                listening={false}
                                            />
                                        )
                                    })()}
                                    {/* Medidas duales SIEMPRE llamadas, filtrado interno */}
                                    {/* Medidas duales SIEMPRE llamadas, filtrado interno */}
                                    {(() => {
                                        // PRIORITIZE INTERIOR: Process interior face first so it survives deduplication in global view
                                        const midP = { x: (wall.start.x + wall.end.x) / 2, y: (wall.start.y + wall.end.y) / 2 }
                                        const dx = wall.end.x - wall.start.x
                                        const dy = wall.end.y - wall.start.y
                                        const lenSq = dx * dx + dy * dy
                                        const nx = -dy / Math.sqrt(lenSq)
                                        const ny = dx / Math.sqrt(lenSq)
                                        const faceNormal = { x: nx, y: ny }
                                        const safeOffset = (wall.thickness / 2) + 10
                                        const testP = { x: midP.x + faceNormal.x * safeOffset, y: midP.y + faceNormal.y * safeOffset }
                                        const isOffsetValPosInterior = isPointInAnyRoom(testP)

                                        const offsets = isOffsetValPosInterior ? [30 / zoom, -30 / zoom] : [-30 / zoom, 30 / zoom]

                                        // In GLOBAL VIEW (!isSelected), only show the INTERIOR face to reduce clutter
                                        const finalOffsets = (showAllQuotes && !isSelected) ? [30 / zoom, -30 / zoom].filter(ov => { const tP = { x: midP.x + nx * (ov > 0 ? 12 : -12), y: midP.y + ny * (ov > 0 ? 12 : -12) }; return isPointInAnyRoom(tP); }) : offsets

                                        return finalOffsets.map((offsetVal, idx) => (
                                            <React.Fragment key={`wall-meas-${wall.id}-${idx}`}>
                                                {renderWallMeasurement(wall, offsetVal)}
                                            </React.Fragment>
                                        ))
                                    })()}

                                    {/* MEDIDAS PERPENDICULARES DINÃMICAS */}
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
                            const d1 = d1Val.toFixed(1).replace('.', ',')
                            const d2 = d2Val.toFixed(1).replace('.', ',')

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
                                                if (((e.evt as any).pointerType === 'touch' || forceTouchOffset) && touchOffset) sp.y -= touchOffset;
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
                                        if (((e.evt as any).pointerType === 'touch' || forceTouchOffset) && touchOffset) sp.y -= touchOffset;
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
                                        // 3. SNAPPING: Visual vs Logic reporting
                                        if (closestWall) {
                                            const cw = closestWall as { wallId: string, t: number, projX: number, projY: number }

                                            // STRICT visual snap
                                            e.target.position({ x: cw.projX, y: cw.projY })

                                            // RESTORED: Report an offset to parent for flip logic
                                            let offX = virtualCenterX - cw.projX
                                            let offY = virtualCenterY - cw.projY
                                            const currentDist = Math.sqrt(offX * offX + offY * offY)

                                            let reportX = cw.projX
                                            let reportY = cw.projY

                                            if (currentDist > 0.001) {
                                                // Pull the reporting point slightly towards cursor (max 10px) 
                                                // so det calculation in EditorContainer works
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
                                        fill={isSelected ? "#e0f2fe" : "#fffbeb"}
                                        stroke={isSelected ? "#0ea5e9" : "#d97706"}
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
                                            stroke={isSelected ? "#0ea5e9" : "#d97706"}
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
                                                stroke={isSelected ? "#0ea5e9" : "#d97706"}
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
                                                stroke={isSelected ? "#0ea5e9" : "#d97706"}
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
                                            stroke={isSelected ? "#0ea5e9" : "#d97706"}
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
                                            })()}
                                            listening={true}
                                        >
                                            {/* HALO TEXT for Door Width */}
                                            <Text
                                                text={`${door.width.toString().replace('.', ',')}`}
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
                                                text={`${door.width.toString().replace('.', ',')}`}
                                                fontSize={12}
                                                fill="#475569"
                                                align="center"
                                                width={door.width}
                                                offsetX={door.width / 2}
                                                offsetY={6} // Centered vertically
                                                name="measurement-label"
                                                fontStyle="bold"
                                                onClick={(e) => {
                                                    e.cancelBubble = true
                                                    if (e.evt) e.evt.stopPropagation()
                                                    const absPos = e.currentTarget.getAbsolutePosition()
                                                    setEditInputState({
                                                        id: `door-width-${door.id}`,
                                                        type: 'door-width',
                                                        val: door.width,
                                                        screenPos: absPos,
                                                        onCommit: (val: any) => onUpdateElement('door', door.id, { width: val })
                                                    })
                                                }}
                                                onTap={(e) => {
                                                    e.cancelBubble = true
                                                    if (e.evt) e.evt.stopPropagation()
                                                    const absPos = e.currentTarget.getAbsolutePosition()
                                                    setEditInputState({
                                                        id: `door-width-${door.id}`,
                                                        type: 'door-width',
                                                        val: door.width,
                                                        screenPos: absPos,
                                                        onCommit: (val: any) => onUpdateElement('door', door.id, { width: val })
                                                    })
                                                }}
                                            />
                                        </Group>
                                    )}

                                    {/* Distancias dinÃ¡micas alineadas con el muro (Estilo HomeByMe) */}
                                    {isSelected && (
                                        <Group rotation={0} listening={true}>
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
                                                            name="measurement-label"
                                                            text={`${d1}`} x={-17.5} y={-6} fontSize={10} fill="#0ea5e9" align="center" width={35} fontStyle="bold"
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
                                                            name="measurement-label"
                                                            text={`${d2}`} x={-17.5} y={-6} fontSize={10} fill="#0ea5e9" align="center" width={35} fontStyle="bold"
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
                            const d1 = d1Val.toFixed(1).replace('.', ',')
                            const d2 = d2Val.toFixed(1).replace('.', ',')

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
                                                if (((e.evt as any).pointerType === 'touch' || forceTouchOffset) && touchOffset) sp.y -= touchOffset;
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
                                        if (((e.evt as any).pointerType === 'touch' || forceTouchOffset) && touchOffset) sp.y -= touchOffset;
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

                                            // STRICT visual snap
                                            e.target.position({ x: cw.projX, y: cw.projY })

                                            // RESTORED: Report an offset to parent for flip/orientation logic
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
                                        fill={isSelected ? "#e0f2fe" : "#f0f9ff"}
                                        stroke={isSelected ? "#0ea5e9" : "#38bdf8"} // Light Blue for Windows
                                        strokeWidth={isSelected ? 2 : 1.5}
                                        listening={false}
                                    />

                                    {/* Visual Representation based on Leaves */}
                                    {(!window.openType || window.openType === "single") ? (
                                        // Single Leaf (1 Hoja) - Continuous Line
                                        <Line
                                            points={[-window.width / 2, 0, window.width / 2, 0]}
                                            stroke={isSelected ? "#0ea5e9" : "#38bdf8"}
                                            strokeWidth={isSelected ? 2 : 1.5}
                                            listening={false}
                                        />
                                    ) : (
                                        // Double Leaf (2 Hojas) - Split Line with Tick
                                        <Group>
                                            <Line
                                                points={[-window.width / 2, 0, window.width / 2, 0]}
                                                stroke={isSelected ? "#0ea5e9" : "#38bdf8"}
                                                strokeWidth={isSelected ? 2 : 1.5}
                                                listening={false}
                                            />
                                            {/* Mid tick - Full Switch */}
                                            <Line
                                                points={[0, -(wall.thickness + 4) / 2, 0, (wall.thickness + 4) / 2]}
                                                stroke={isSelected ? "#0ea5e9" : "#38bdf8"}
                                                strokeWidth={isSelected ? 2 : 1.5}
                                                listening={false}
                                            />
                                            {/* Quarter ticks for detail */}
                                            <Line
                                                points={[-window.width / 2, -2, -window.width / 2, 2]}
                                                stroke={isSelected ? "#0ea5e9" : "#38bdf8"}
                                                strokeWidth={1}
                                                listening={false}
                                            />
                                            <Line
                                                points={[window.width / 2, -2, window.width / 2, 2]}
                                                stroke={isSelected ? "#0ea5e9" : "#38bdf8"}
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
                                            })()}
                                            listening={true}
                                        >
                                            {/* HALO TEXT for Window Dims */}
                                            <Text
                                                text={`${window.width.toString().replace('.', ',')}x${window.height.toString().replace('.', ',')}`}
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
                                                text={`${window.width.toString().replace('.', ',')}x${window.height.toString().replace('.', ',')}`}
                                                fontSize={10}
                                                fill="#475569"
                                                align="center"
                                                width={window.width}
                                                offsetX={window.width / 2}
                                                offsetY={6}
                                                name="measurement-label"
                                                fontStyle="bold"
                                                onClick={(e) => {
                                                    e.cancelBubble = true
                                                    if (e.evt) e.evt.stopPropagation()
                                                    const absPos = e.currentTarget.getAbsolutePosition()
                                                    setEditInputState({
                                                        id: `window-dims-${window.id}`,
                                                        type: 'window-dimensions',
                                                        val: { width: window.width, height: window.height },
                                                        screenPos: absPos,
                                                        onCommit: (vals: any) => onUpdateElement('window', window.id, { width: vals.width, height: vals.height })
                                                    })
                                                }}
                                                onTap={(e) => {
                                                    e.cancelBubble = true
                                                    if (e.evt) e.evt.stopPropagation()
                                                    const absPos = e.currentTarget.getAbsolutePosition()
                                                    setEditInputState({
                                                        id: `window-dims-${window.id}`,
                                                        type: 'window-dimensions',
                                                        val: { width: window.width, height: window.height },
                                                        screenPos: absPos,
                                                        onCommit: (vals: any) => onUpdateElement('window', window.id, { width: vals.width, height: vals.height })
                                                    })
                                                }}
                                            />
                                        </Group>
                                    )}

                                    {/* Distancias dinÃ¡micas alineadas con el muro */}
                                    {isSelected && (
                                        <Group rotation={0} listening={true}>
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
                                                            name="measurement-label"
                                                            text={`${d1}`} x={-17.5} y={-6} fontSize={10} fill="#0ea5e9" align="center" width={35} fontStyle="bold"
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
                                                            name="measurement-label"
                                                            text={`${d2}`} x={-17.5} y={-6} fontSize={10} fill="#0ea5e9" align="center" width={35} fontStyle="bold"
                                                        />
                                                    </Group>
                                                </Group>
                                            )}
                                        </Group>
                                    )}
                                </Group>
                            )
                        })}



                        {/* Shunt Measurements (Rays to Walls) - RESTORED for move/select interaction */}
                        {(selectedElement?.type === "shunt" || dragShuntState) && (() => {
                            const shunt = shunts.find(s => s.id === (dragShuntState?.id || selectedElement?.id))
                            if (!shunt) return null

                            // Use drag state if available for real-time update
                            const sx = dragShuntState ? dragShuntState.x : shunt.x
                            const sy = dragShuntState ? dragShuntState.y : shunt.y

                            const directions = [
                                { dx: 1, dy: 0, faceX: sx + shunt.width / 2, faceY: sy },   // Right
                                { dx: -1, dy: 0, faceX: sx - shunt.width / 2, faceY: sy },  // Left
                                { dx: 0, dy: 1, faceX: sx, faceY: sy + shunt.height / 2 },  // Down
                                { dx: 0, dy: -1, faceX: sx, faceY: sy - shunt.height / 2 }  // Up
                            ]

                            return directions.map((dir, dIdx) => {
                                let minDist = Infinity
                                let targetPoint: Point | null = null
                                let targetWall: Wall | null = null
                                let targetShunt: Shunt | null = null

                                // 1. Raycast to Walls
                                for (const w of walls) {
                                    if (w.isInvisible) continue
                                    if (dir.dy === 0) { // Horizontal ray
                                        const yMin = Math.min(w.start.y, w.end.y)
                                        const yMax = Math.max(w.start.y, w.end.y)
                                        if (dir.faceY >= yMin - 1 && dir.faceY <= yMax + 1) {
                                            const isHorizWall = Math.abs(w.end.y - w.start.y) < 1
                                            if (isHorizWall) continue
                                            const t = (dir.faceY - w.start.y) / (w.end.y - w.start.y)
                                            const ix = w.start.x + t * (w.end.x - w.start.x)
                                            const dist = dir.dx > 0 ? (ix - dir.faceX) : (dir.faceX - ix)
                                            if (dist > 0 && dist < minDist) {
                                                minDist = dist
                                                targetPoint = { x: ix, y: dir.faceY }
                                                targetWall = w
                                                targetShunt = null
                                            }
                                        }
                                    } else { // Vertical ray
                                        const xMin = Math.min(w.start.x, w.end.x)
                                        const xMax = Math.max(w.start.x, w.end.x)
                                        if (dir.faceX >= xMin - 1 && dir.faceX <= xMax + 1) {
                                            const isVertWall = Math.abs(w.end.x - w.start.x) < 1
                                            if (isVertWall) continue
                                            const t = (dir.faceX - w.start.x) / (w.end.x - w.start.x)
                                            const iy = w.start.y + t * (w.end.y - w.start.y)
                                            const dist = dir.dy > 0 ? (iy - dir.faceY) : (dir.faceY - iy)
                                            if (dist > 0 && dist < minDist) {
                                                minDist = dist
                                                targetPoint = { x: dir.faceX, y: iy }
                                                targetWall = w
                                                targetShunt = null
                                            }
                                        }
                                    }
                                }

                                // 2. Raycast to other Shunts
                                for (const os of shunts) {
                                    if (os.id === shunt.id) continue
                                    const osHalfW = os.width / 2
                                    const osHalfH = os.height / 2

                                    if (dir.dy === 0) { // Horizontal ray
                                        if (dir.faceY >= os.y - osHalfH && dir.faceY <= os.y + osHalfH) {
                                            const ix = dir.dx > 0 ? (os.x - osHalfW) : (os.x + osHalfW)
                                            const dist = dir.dx > 0 ? (ix - dir.faceX) : (dir.faceX - ix)
                                            if (dist > 0 && dist < minDist) {
                                                minDist = dist
                                                targetPoint = { x: ix, y: dir.faceY }
                                                targetShunt = os
                                                targetWall = null
                                            }
                                        }
                                    } else { // Vertical ray
                                        if (dir.faceX >= os.x - osHalfW && dir.faceX <= os.x + osHalfW) {
                                            const iy = dir.dy > 0 ? (os.y - osHalfH) : (os.y + osHalfH)
                                            const dist = dir.dy > 0 ? (iy - dir.faceY) : (dir.faceY - iy)
                                            if (dist > 0 && dist < minDist) {
                                                minDist = dist
                                                targetPoint = { x: dir.faceX, y: iy }
                                                targetShunt = os
                                                targetWall = null
                                            }
                                        }
                                    }
                                }

                                if (!targetPoint) return null

                                // Correction to face (only for walls)
                                const finalDist = targetWall ? Math.max(0, minDist - targetWall.thickness / 2) : minDist
                                if (finalDist < 1) return null

                                const endP = {
                                    x: dir.faceX + dir.dx * finalDist,
                                    y: dir.faceY + dir.dy * finalDist
                                }

                                const labelId = `shunt-ray-${shunt.id}-${dIdx}`
                                const isEditing = editInputState?.id === labelId

                                return (
                                    <Group key={labelId}>
                                        <Line
                                            points={[dir.faceX, dir.faceY, endP.x, endP.y]}
                                            stroke="#0ea5e9"
                                            strokeWidth={1 / zoom}
                                            dash={[5, 5]}
                                            opacity={0.6}
                                        />
                                        <Group
                                            x={(dir.faceX + endP.x) / 2}
                                            y={(dir.faceY + endP.y) / 2}
                                            onClick={(e) => {
                                                if (dragShuntState) return
                                                const absPos = e.target.getAbsolutePosition()
                                                setEditInputState({
                                                    id: labelId,
                                                    type: 'shunt-ray',
                                                    val: finalDist.toFixed(1),
                                                    screenPos: { x: absPos.x, y: absPos.y },
                                                    onCommit: (val: any) => {
                                                        const num = parseFloat(val.replace(',', '.'))
                                                        if (!isNaN(num) && onUpdateShunt) {
                                                            const delta = num - finalDist
                                                            // Move shunt AWAY from target by delta
                                                            onUpdateShunt(shunt.id, {
                                                                x: shunt.x - dir.dx * delta,
                                                                y: shunt.y - dir.dy * delta
                                                            })
                                                        }
                                                        setEditInputState(null)
                                                    }
                                                })
                                            }}
                                            onTap={(e) => {
                                                // Handle touch tap for editing
                                                const absPos = e.target.getAbsolutePosition()
                                                setEditInputState({
                                                    id: labelId,
                                                    type: 'shunt-ray',
                                                    val: finalDist.toFixed(1),
                                                    screenPos: { x: absPos.x, y: absPos.y },
                                                    onCommit: (val: any) => {
                                                        const num = parseFloat(val.replace(',', '.'))
                                                        if (!isNaN(num) && onUpdateShunt) {
                                                            const delta = num - finalDist
                                                            onUpdateShunt(shunt.id, {
                                                                x: shunt.x - dir.dx * delta,
                                                                y: shunt.y - dir.dy * delta
                                                            })
                                                        }
                                                        setEditInputState(null)
                                                    }
                                                })
                                            }}
                                        >
                                            {!isEditing && (
                                                <>
                                                    <Rect
                                                        width={32 / zoom}
                                                        height={16 / zoom}
                                                        fill="white"
                                                        stroke="#0ea5e9"
                                                        strokeWidth={0.5 / zoom}
                                                        cornerRadius={2 / zoom}
                                                        offsetX={16 / zoom}
                                                        offsetY={8 / zoom}
                                                        shadowBlur={2 / zoom}
                                                        shadowOpacity={0.2}
                                                    />
                                                    <Text
                                                        text={`${finalDist.toFixed(1).replace('.', ',')}`}
                                                        fontSize={10 / zoom}
                                                        fill="#0ea5e9"
                                                        fontStyle="bold"
                                                        align="center"
                                                        width={32 / zoom}
                                                        offsetX={16 / zoom}
                                                        offsetY={5 / zoom}
                                                    />
                                                </>
                                            )}
                                        </Group>
                                    </Group>
                                )
                            })
                        })()}

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
                                showAllQuotes={showAllQuotes}
                                isEditing={editInputState?.id === `shunt-dimensions-${shunt.id}`}
                                onEditDimensions={(e) => {
                                    const absPos = e.target.getAbsolutePosition()
                                    setEditInputState({
                                        id: `shunt-dimensions-${shunt.id}`,
                                        type: "shunt-dimensions",
                                        val: { width: shunt.width, height: shunt.height },
                                        screenPos: absPos,
                                        onCommit: (vals: any) => {
                                            if (vals.width !== shunt.width) onUpdateShunt?.(shunt.id, { width: vals.width })
                                            if (vals.height !== shunt.height) onUpdateShunt?.(shunt.id, { height: vals.height })
                                        }
                                    })
                                }}
                            />
                        ))}

                        {/* Renderizar etiquetas de habitaciÃ³n (CAPA SUPERIOR - Encima de shunts) */}
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
                                    {showRoomNames && (
                                        <Text
                                            name="room-label-text"
                                            y={-14 * scale}
                                            text={room.name}
                                            fontSize={18 * scale}
                                            fill="#1e293b"
                                            fontStyle="bold"
                                            align="center"
                                            offsetX={50 * scale}
                                            width={100 * scale}
                                        />
                                    )}
                                    {showAreas && (
                                        <Text
                                            name="room-label-text"
                                            y={10 * scale}
                                            text={`${room.area.toFixed(2).replace('.', ',')} m²`}
                                            fontSize={14 * scale}
                                            fill="#64748b"
                                            align="center"
                                            offsetX={50 * scale}
                                            width={100 * scale}
                                        />
                                    )}
                                </Group>
                            )
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
                                    {/* GuÃ­as de alineaciÃ³n */}
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
                                        text={`${lengthCm.toFixed(1).replace('.', ',')}`}
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
                                        text={`${lengthCm.toFixed(1).replace('.', ',')}`}
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

                        {/* GuÃ­as inteligentes de alineaciÃ³n */}
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

                            // 1. Prioridad: VÃ©rtice
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
                                        x={ne.x}
                                        y={ne.y}
                                        width={10 / zoom}
                                        height={10 / zoom}
                                        stroke="#0ea5e9"
                                        strokeWidth={2 / zoom}
                                        fill="white"
                                        rotation={45}
                                        offsetX={5 / zoom}
                                        offsetY={5 / zoom}
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
                                    ).toFixed(1).replace('.', ',')
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
                        {/* CAPA FINAL: TIRADORES Y CALIBRACIÃ“N (SIEMPRE ENCIMA DE TODO) */}
                        {/* ================================================================== */}

                        {/* 1. Tiradores de selecciÃ³n de muros */}
                        {/* 1. Tiradores de selecciÃ³n de muros (Agrupados y con mejor hit-area) */}
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
                                        draggable={activeTool === "select" && isSelected}
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

                        {/* 2. Herramienta de CalibraciÃ³n (Ultima posiciÃ³n para mÃ¡xima visibilidad) */}
                        {isCalibrating && calibrationPoints && (
                            <Group>
                                {calibrationPoints.p1 && calibrationPoints.p2 && (
                                    <Line
                                        points={[calibrationPoints.p1.x, calibrationPoints.p1.y, calibrationPoints.p2.x, calibrationPoints.p2.y]}
                                        stroke="#fbbf24"
                                        strokeWidth={4 / zoom}
                                        dash={[10, 5]}
                                        shadowBlur={4 / zoom}
                                        shadowColor="rgba(0,0,0,0.3)"
                                    />
                                )}
                                {calibrationPoints.p1 && (
                                    <Group
                                        x={calibrationPoints.p1.x}
                                        y={calibrationPoints.p1.y}
                                        draggable
                                        onDragMove={(e) => onUpdateCalibrationPoint?.("p1", { x: e.target.x(), y: e.target.y() })}
                                    >
                                        <Circle
                                            radius={15 / zoom}
                                            fill="rgba(255,255,255,0.2)"
                                            stroke="#fbbf24"
                                            strokeWidth={4 / zoom}
                                            shadowBlur={10 / zoom}
                                            shadowOpacity={0.4}
                                            shadowColor="rgba(0,0,0,0.5)"
                                        />
                                        <Line points={[-22 / zoom, 0, 22 / zoom, 0]} stroke="#fbbf24" strokeWidth={2 / zoom} />
                                        <Line points={[0, -22 / zoom, 0, 22 / zoom]} stroke="#fbbf24" strokeWidth={2 / zoom} />
                                    </Group>
                                )}
                                {calibrationPoints.p2 && (
                                    <Group
                                        x={calibrationPoints.p2.x}
                                        y={calibrationPoints.p2.y}
                                        draggable
                                        onDragMove={(e) => onUpdateCalibrationPoint?.("p2", { x: e.target.x(), y: e.target.y() })}
                                    >
                                        <Circle
                                            radius={15 / zoom}
                                            fill="rgba(255,255,255,0.2)"
                                            stroke="#fbbf24"
                                            strokeWidth={4 / zoom}
                                            shadowBlur={10 / zoom}
                                            shadowOpacity={0.4}
                                            shadowColor="rgba(0,0,0,0.5)"
                                        />
                                        <Line points={[-22 / zoom, 0, 22 / zoom, 0]} stroke="#fbbf24" strokeWidth={2 / zoom} />
                                        <Line points={[0, -22 / zoom, 0, 22 / zoom]} stroke="#fbbf24" strokeWidth={2 / zoom} />
                                    </Group>
                                )}
                                {calibrationPoints.p1 && calibrationPoints.p2 && (
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
                                            onClick={(e) => {
                                                e.cancelBubble = true
                                                const stage = e.target.getStage()
                                                const absPos = e.target.getAbsolutePosition()
                                                setEditInputState({
                                                    id: 'calibration-value',
                                                    type: 'calibration-value',
                                                    val: calibrationTargetValue || 0,
                                                    screenPos: absPos,
                                                    onCommit: (val) => onUpdateCalibrationValue?.(val)
                                                })
                                            }}
                                            onTap={(e) => {
                                                e.cancelBubble = true
                                                const stage = e.target.getStage()
                                                const absPos = e.target.getAbsolutePosition()
                                                setEditInputState({
                                                    id: 'calibration-value',
                                                    type: 'calibration-value',
                                                    val: calibrationTargetValue || 0,
                                                    screenPos: absPos,
                                                    onCommit: (val) => onUpdateCalibrationValue?.(val)
                                                })
                                            }}
                                        />
                                    </Group>
                                )}
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
                                        onClick={() => {
                                            if (selectedWall) {
                                                setEditMode("thickness")
                                            } else if (selectedElement) {
                                                if (isMobile) {
                                                    const el = selectedElement.type === "door"
                                                        ? doors.find(d => d.id === selectedElement.id)
                                                        : selectedElement.type === "window"
                                                            ? windows.find(w => w.id === selectedElement.id)
                                                            : shunts.find(s => s.id === selectedElement.id)

                                                    if (el) {
                                                        const isDual = selectedElement.type === "window" || selectedElement.type === "shunt"
                                                        setEditInputState({
                                                            id: `${selectedElement.type}-pencil-${el.id}`,
                                                            type: isDual ? 'window-dimensions' : 'door-width',
                                                            val: isDual ? { width: (el as any).width, height: (el as any).height } : (el as any).width,
                                                            screenPos: currentEPos!,
                                                            onCommit: (vals: any) => {
                                                                const updates = typeof vals === 'object' ? vals : { width: vals }
                                                                onUpdateElement(selectedElement.type, el.id, updates)
                                                            }
                                                        })
                                                    }
                                                } else {
                                                    setEditMode("length")
                                                }
                                            } else {
                                                setEditMode("room")
                                            }
                                        }}
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
                                                        title="Clonar HabitaciÃ³n"
                                                    />
                                                    <div className="w-px h-4 bg-slate-100 mx-0.5" />
                                                </>
                                            )}
                                            <MenuButton
                                                icon={<Trash2 className="h-3 w-3" />}
                                                onClick={() => onDeleteRoom(selectedRoomId)}
                                                variant="danger"
                                                title="Eliminar HabitaciÃ³n"
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
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{editMode === "room-custom" ? "Nombre Personalizado" : "Tipo de HabitaciÃ³n"}</span>
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
                                            Volver al menÃº
                                        </button>
                                    )}
                                </div>
                            ) : editMode === "thickness" ? (
                                <div className="flex items-center gap-3 px-3 py-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Grosor pared</span>
                                    <div className="flex items-center gap-1">
                                        <NumericInput
                                            isMobile={isMobile}
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
                            ) : editMode === "length" && !isMobile ? (
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
                                                        const targetLen = parseFloat(editLength.replace(',', '.'))
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
                                                    {Math.abs(selectedWall.start.y - selectedWall.end.y) < 1 ? "â†" : "â†‘"}
                                                </button>
                                                <div className="flex items-center gap-1 bg-white border-2 border-slate-100 rounded-lg px-2 py-1">
                                                    <NumericInput
                                                        isMobile={isMobile}
                                                        label={editFace === "interior" ? "Medida Azul" : "Medida Naranja"}
                                                        value={editLength}
                                                        step={0.1}
                                                        setter={setEditLength}
                                                        onEnter={(val) => {
                                                            const finalVal = val !== undefined ? val : editLength
                                                            const targetLen = parseFloat(finalVal.replace(',', '.'))
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
                                                        const targetLen = parseFloat(editLength.replace(',', '.'))
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
                                                    {Math.abs(selectedWall.start.y - selectedWall.end.y) < 1 ? "â†’" : "â†“"}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                    {selectedElement && (
                                        <div className="flex flex-col gap-1.5 px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase w-8">Ancho</span>
                                                <NumericInput
                                                    isMobile={isMobile}
                                                    label="Ancho"
                                                    value={editLength}
                                                    step={0.1}
                                                    setter={setEditLength}
                                                    onEnter={(val) => {
                                                        const finalVal = val !== undefined ? val : editLength
                                                        const updates: any = { width: parseFloat(finalVal.replace(',', '.')) }
                                                        if ((selectedElement.type === "window" || selectedElement.type === "shunt") && editHeight) updates.height = parseFloat(editHeight.replace(',', '.'))
                                                        onUpdateElement(selectedElement.type, selectedElement.id, updates)
                                                        setEditMode("menu")
                                                    }}
                                                />
                                                {/* Unit removed per user request */}
                                            </div>
                                            {(selectedElement.type === "window" || selectedElement.type === "shunt") && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase w-8">Alto / Largo</span>
                                                    <NumericInput
                                                        isMobile={isMobile}
                                                        label="Alto / Largo"
                                                        value={editHeight}
                                                        setter={setEditHeight}
                                                        onEnter={(val) => {
                                                            const finalVal = val !== undefined ? val : editHeight
                                                            onUpdateElement(selectedElement.type, selectedElement.id, {
                                                                width: parseFloat(editLength.replace(',', '.')),
                                                                height: parseFloat(finalVal.replace(',', '.'))
                                                            })
                                                            setEditMode("menu")
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            <button
                                                onClick={() => {
                                                    const updates: any = { width: parseFloat(editLength.replace(',', '.')) }
                                                    if (selectedElement.type === "window" || selectedElement.type === "shunt") updates.height = parseFloat(editHeight.replace(',', '.'))
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
            {editInputState && (
                typeof editInputState.val === 'object' && editInputState.val !== null ? (
                    <DualInputWrapper
                        valObj={editInputState.val}
                        screenPos={editInputState.screenPos}
                        onCommit={editInputState.onCommit}
                        onClose={() => setEditInputState(null)}
                        isMobile={isMobile}
                    />
                ) : (
                    <SingleInputWrapper
                        val={editInputState.val}
                        screenPos={editInputState.screenPos}
                        onCommit={editInputState.onCommit}
                        onClose={() => setEditInputState(null)}
                        isMobile={isMobile}
                    />
                )
            )}

            {/* Unified Wall Editor (Keypad) - Root Level Pattern to avoid CSS Stacking Context issues */}
            {editMode === "length" && isMobile && (() => {
                let orientation: 'horizontal' | 'vertical' | 'inclined' | 'none' = 'none'
                if (selectedWall) {
                    const isHorizontal = Math.abs(selectedWall.start.y - selectedWall.end.y) < 1
                    const isVertical = Math.abs(selectedWall.start.x - selectedWall.end.x) < 1
                    orientation = isHorizontal ? 'horizontal' : (isVertical ? 'vertical' : 'inclined')
                } else if (selectedElement) {
                    orientation = 'none'
                }

                return (
                    <UnifiedWallEditor
                        initialValue={editLength}
                        orientation={orientation}
                        onCancel={() => setEditMode("menu")}
                        onConfirm={(val, direction) => {
                            const targetLen = parseFloat(val.replace(',', '.'))
                            if (isNaN(targetLen)) return

                            if (selectedWall) {
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
                                let side: "left" | "right" = "right"
                                if (direction) {
                                    if (direction === "left" || direction === "up") side = "left"
                                    else side = "right"
                                }

                                if (Math.abs(delta) > 0.01) {
                                    onUpdateWallLength(selectedWall.id, centerLength + delta, side, faceNormal)
                                }
                            } else if (selectedElement) {
                                if (selectedElement.type === "door" || selectedElement.type === "window") {
                                    onUpdateElement(selectedElement.type, selectedElement.id, { width: targetLen })
                                } else if (selectedElement.type === "shunt" && onUpdateShunt) {
                                    onUpdateShunt(selectedElement.id, { width: targetLen, height: targetLen })
                                }
                            }
                            setEditMode("menu")
                        }}
                    />
                )
            })()}
        </div >
    )
}

CanvasEngine.displayName = "CanvasEngine"
