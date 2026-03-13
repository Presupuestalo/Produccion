"use client"
import React from "react"
import { Stage, Layer, Group, Line, Rect, Text, Circle, Arc as KonvaArc, Arrow } from "react-konva"
import { Grid } from "./Grid"
import { getClosestPointOnSegment, generateArcPoints, getLineIntersection, isPointOnSegment, isPointInPolygon } from "@/lib/utils/geometry"
import { Scissors, Plus, Pencil, Trash2, X, RotateCcw, Copy, FlipHorizontal, FlipVertical, SquareDashed, Spline, Check, Delete, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowLeftRight, Grid3X3, Eraser } from "lucide-react"
import { NumericInput } from "./NumericInput"
import { UnifiedWallEditor } from "./UnifiedWallEditor"


interface Point { x: number; y: number }
interface Wall { id: string; start: Point; end: Point; thickness: number; isInvisible?: boolean; offsetMode?: 'center' | 'outward' | 'inward'; disabledCeramicFaces?: ('F' | 'B')[]; ceramicHeights?: Partial<Record<'F' | 'B', number>> }

interface Room {
    id: string
    name: string
    polygon: Point[]
    area: number
    color: string
    visualCenter?: Point
    hasCeramicFloor?: boolean
    hasCeramicWalls?: boolean
    disabledCeramicWalls?: string[]
    ceramicWallHeights?: Record<string, number>
    isGlobalCeramic?: boolean
}

interface Door { id: string; wallId: string; t: number; width: number; flipX?: boolean; flipY?: boolean; openType?: "single" | "double" | "sliding_rail" | "sliding_pocket" | "sliding" | "double_swing" | "exterior_sliding" }
interface Window { id: string; wallId: string; t: number; width: number; height: number; flipX?: boolean; flipY?: boolean; openType?: "single" | "double" | "balcony" | "fixed"; isFixed?: boolean }
interface Shunt { id: string; x: number; y: number; width: number; height: number; rotation: number; hasCeramic?: boolean }

function calculatePolygonCentroid(points: Point[]): Point {
    let sx = 0, sy = 0
    points.forEach(p => { sx += p.x; sy += p.y })
    return { x: sx / points.length, y: sy / points.length }
}

const isClockwise = (poly: Point[]) => {
    let sum = 0;
    for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];
        sum += (p2.x - p1.x) * (p2.y + p1.y);
    }
    return sum < 0;
};

const ensureClockwise = (poly: Point[]) => {
    if (isClockwise(poly)) return poly;
    return [...poly].reverse();
};

function insetPolygon(poly: Point[], d: number): Point[] {
    const n = poly.length;
    if (n < 3) return poly;
    const out: Point[] = [];
    for (let i = 0; i < n; i++) {
        const p = poly[i];
        const prev = poly[(i - 1 + n) % n];
        const next = poly[(i + 1) % n];

        const d1x = p.x - prev.x, d1y = p.y - prev.y;
        const l1 = Math.sqrt(d1x * d1x + d1y * d1y);
        const n1x = -d1y / l1, n1y = d1x / l1;

        const d2x = next.x - p.x, d2y = next.y - p.y;
        const l2 = Math.sqrt(d2x * d2x + d2y * d2y);
        const n2x = -d2y / l2, n2y = d2x / l2;

        const nx = n1x + n2x, ny = n1y + n2y;
        const nl = Math.sqrt(nx * nx + ny * ny);
        const miterX = nx / nl, miterY = ny / nl;
        
        const miterDot = (miterX * n1x + miterY * n1y);
        const miterLen = Math.abs(miterDot) < 0.1 ? d : d / miterDot;
        out.push({ x: p.x + miterX * miterLen, y: p.y + miterY * miterLen });
    }
    return out;
}

/**
 * Ensures that click detection and rendering use the EXACT same wall-matching logic,
 * including the aggressive "healing" pass for short segments.
 */
function getFaceIdWithParity(i: number, poly: Point[], walls: Wall[]): string | null {
    const getDist = (a: Point, b: Point) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    
    const findWallForSegment = (pA: Point, pB: Point) => {
        const midP = { x: (pA.x + pB.x) / 2, y: (pA.y + pB.y) / 2 };
        let best: Wall | null = null;
        let minDist = 9999;
        // Pass A: Visible walls
        for (const w of walls) {
            if (w.isInvisible) continue;
            const { point: proj } = getClosestPointOnSegment(midP, w.start, w.end);
            const d = getDist(midP, proj);
            if (d < w.thickness + 20 && d < minDist) { minDist = d; best = w; }
        }
        // Pass B: Invisible fallback
        if (!best) {
            for (const w of walls) {
                if (!w.isInvisible) continue;
                const { point: proj } = getClosestPointOnSegment(midP, w.start, w.end);
                const d = getDist(midP, proj);
                if (d < 15 && d < minDist) { minDist = d; best = w; }
            }
        }
        return { wall: best, len: getDist(pA, pB) };
    };

    // Calculate current, previous and next segment wall search (Parity with rendering raw search)
    const s = findWallForSegment(poly[i], poly[(i + 1) % poly.length]);
    const p = findWallForSegment(poly[(i - 1 + poly.length) % poly.length], poly[i]);
    const n = findWallForSegment(poly[(i + 1) % poly.length], poly[(i + 2) % poly.length]);

    let w = s.wall;
    const pVis = p.wall && !p.wall.isInvisible;
    const nVis = n.wall && !n.wall.isInvisible;

    // Healing logic (Identical to line 3291 rendering)
    if (s.len < 40 && (pVis || nVis)) {
        w = pVis ? p.wall : n.wall;
    } else if (!w) {
        w = p.wall || n.wall;
    }

    if (!w) return null;

    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];
    const wDir = { x: w.end.x - w.start.x, y: w.end.y - w.start.y };
    const sDir = { x: p2.x - p1.x, y: p2.y - p1.y };
    const side = (wDir.x * sDir.x + wDir.y * sDir.y) >= 0 ? 'F' : 'B';
    return `${w.id}:${side}`;
}

interface MenuButtonProps {
    icon: React.ReactNode
    label?: string
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
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

const SeparatorIcon = ({ className }: { className?: string }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeDasharray="2 4" 
        className={className}
    >
        <line x1="12" y1="0" x2="12" y2="24" stroke="#0ea5e9" />
    </svg>
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
    activeTool: "select" | "wall" | "door" | "window" | "ruler" | "arc" | "shunt" | "ceramic" | "eraser"
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
    onUpdateWall: (id: string, updates: Partial<Wall>) => void
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
    showGrid?: boolean
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
    alignmentGuides?: { x?: number, y?: number } | null
    isCeramicEraserActive?: boolean
    setIsCeramicEraserActive?: (active: boolean) => void
    planHeight?: number
}

export interface CanvasEngineRef {
    getSnapshot: (options?: { hideBackground?: boolean; hideGrid?: boolean }) => string
}


// Memoized Shunt Item to prevent re-renders during drag (fixes stutter)
const ShuntItem = React.memo(({
    shunt, isSelected, activeTool, walls, snappingEnabled, zoom, shunts,
    setDragShuntState, onSelect, onDragEnd, onEditDimensions, isEditing,
    showAllQuotes, ceramicGridImage
}: {
    shunt: Shunt, isSelected: boolean, activeTool: string,
    walls: Wall[], snappingEnabled: boolean, zoom: number, shunts: Shunt[],
    setDragShuntState: (state: { id: string, x: number, y: number } | null) => void,
    onSelect: () => void,
    onDragEnd: (id: string, x: number, y: number) => void,
    onEditDimensions: (e: any) => void,
    isEditing: boolean,
    showAllQuotes?: boolean,
    ceramicGridImage?: HTMLImageElement | null
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

                    walls.filter(w => !w.isInvisible).forEach(w => {
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
            {/* Ceramic dashed lines — only on exposed (non-wall-touching) faces */}
            {shunt.hasCeramic && (() => {
                const hw = shunt.width / 2
                const hh = shunt.height / 2
                // Define the 4 faces: [x1,y1,x2,y2] relative to shunt centre (offsetX/Y already set by Group)
                const faces = [
                    { pts: [-hw, -hh, hw, -hh], mid: { x: 0, y: -hh } },   // top
                    { pts: [-hw, hh, hw, hh], mid: { x: 0, y: hh } },       // bottom
                    { pts: [-hw, -hh, -hw, hh], mid: { x: -hw, y: 0 } },    // left
                    { pts: [hw, -hh, hw, hh], mid: { x: hw, y: 0 } },    // right
                ]
                const WALL_TOL = 4.0
                return faces
                    .filter(face => {
                        // World-space midpoint of this face
                        const wx = shunt.x + face.mid.x
                        const wy = shunt.y + face.mid.y
                        // A face is "supported" (hidden) if it lies on a visible wall surface
                        return !walls.some(w => {
                            if (w.isInvisible) return false
                            const dx = w.end.x - w.start.x
                            const dy = w.end.y - w.start.y
                            const lenSq = dx * dx + dy * dy
                            if (lenSq < 0.01) return false
                            const t = Math.max(0, Math.min(1, ((wx - w.start.x) * dx + (wy - w.start.y) * dy) / lenSq))
                            const px = w.start.x + t * dx
                            const py = w.start.y + t * dy
                            const dist = Math.sqrt((wx - px) ** 2 + (wy - py) ** 2)
                            return dist < (w.thickness / 2) + WALL_TOL
                        })
                    })
                    .map((face, i) => (
                        <React.Fragment key={`ceramic-face-${i}`}>
                            {/* Thick dark dashed line - Reduced width for cleaner look on small columns */}
                            <Line
                                points={face.pts}
                                stroke="#1e293b"
                                strokeWidth={8 / zoom}
                                dash={[8 / zoom, 4 / zoom]}
                                opacity={0.8}
                                listening={false}
                            />
                            {/* White mask to create the inset effect */}
                            <Line
                                points={face.pts}
                                stroke="#ffffff"
                                strokeWidth={2 / zoom}
                                opacity={1}
                                listening={false}
                            />
                        </React.Fragment>
                    ))
            })()}
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
    return prev.shunt.x === next.shunt.x &&
        prev.shunt.y === next.shunt.y &&
        prev.isSelected === next.isSelected &&
        prev.activeTool === next.activeTool &&
        prev.zoom === next.zoom &&
        prev.shunts === next.shunts &&
        prev.walls === next.walls && // walls affect exposed-face computation
        prev.isEditing === next.isEditing &&
        prev.shunt.hasCeramic === next.shunt.hasCeramic
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

const CERAMIC_BLUE = "#0ea5e9"
const CERAMIC_ORANGE = "#f59e0b"

export const CanvasEngine = ({
    width, height, zoom, offset,
    walls, rooms, doors, windows, shunts = [],
    currentWall, activeTool, hoveredWallId, onPan, onZoom, onMouseDown, onMouseMove, onMouseUp, onHoverWall, onSelectWall, onDragWall, onDragEnd, onUpdateWallLength, onDeleteWall, onSplitWall, onUpdateWall, onUpdateWallThickness, onUpdateWallInvisible, onUpdateRoom, onDeleteRoom, onCloneRoom, selectedWallIds, selectedRoomId, onSelectRoom, onDragVertex, wallSnapshot, onStartDragWall, onDragElement, selectedElement, onSelectElement, onUpdateElement, onCloneElement, onDeleteElement, onUpdateShunt, bgImage, bgConfig, onUpdateBgConfig, isCalibrating, calibrationPoints, calibrationTargetValue, onUpdateCalibrationPoint, onUpdateCalibrationValue,
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
    showGrid = true,
    onDblClick,
    onDblTap,
    alignmentGuides: externalGuides,
    isCeramicEraserActive = false,
    setIsCeramicEraserActive = () => { },
    planHeight = 250
}: CanvasEngineProps) => {
    const [roomMenuClickPos, setRoomMenuClickPos] = React.useState<Point | null>(null)
    const [wallMenuClickPos, setWallMenuClickPos] = React.useState<Point | null>(null)

    const stageRef = React.useRef<any>(null)
    const gridRef = React.useRef<any>(null)
    const [dragShuntState, setDragShuntState] = React.useState<{ id: string, x: number, y: number } | null>(null)
    const [draggedWallId, setDraggedWallId] = React.useState<string | null>(null)
    const [alignmentGuides, setAlignmentGuides] = React.useState<{ x?: number, y?: number } | null>(null)
    const [image, setImage] = React.useState<HTMLImageElement | null>(null)
    const [hoveredCeramicFaceId, setHoveredCeramicFaceId] = React.useState<string | null>(null)
    const [clickedFaceId, setClickedFaceId] = React.useState<'F' | 'B' | null>(null)

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

    // Unified exposure of methods to parent via onReady is handled below by getSnapshot useCallback

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

    const groupedWallChains = React.useMemo(() => {
        const currentWS = wallSnapshot || walls
        const visibleWalls = currentWS.filter(w => !w.isInvisible)
        if (visibleWalls.length === 0) return []

        // 1. Pre-calculate the average offset for every node (vertex) in the floor plan
        // This ensures that if a room wall ('outward') meets a loose wall ('center'),
        // they both agree on a shared visual coordinate at the junction.
        const nodeOffsets = new Map<string, Point>();
        const nodeWallCounts = new Map<string, number>();

        const getNodeKey = (p: Point) => `${Math.round(p.x)},${Math.round(p.y)}`;

        visibleWalls.forEach(w => {
            const off = getWallOffset(w);
            const keys = [getNodeKey(w.start), getNodeKey(w.end)];
            keys.forEach(key => {
                const cur = nodeOffsets.get(key) || { x: 0, y: 0 };
                nodeOffsets.set(key, { x: cur.x + off.x, y: cur.y + off.y });
                nodeWallCounts.set(key, (nodeWallCounts.get(key) || 0) + 1);
            });
        });

        const getSharedOffset = (p: Point) => {
            const key = getNodeKey(p);
            const sum = nodeOffsets.get(key) || { x: 0, y: 0 };
            const count = nodeWallCounts.get(key) || 1;
            return { x: sum.x / count, y: sum.y / count };
        };

        // 2. Group by thickness for clean miter joins
        const thicknessGroups: Record<number, Wall[]> = {}
        visibleWalls.forEach(w => {
            if (!thicknessGroups[w.thickness]) thicknessGroups[w.thickness] = []
            thicknessGroups[w.thickness].push(w)
        })

        const allChains: { points: number[], closed: boolean, thickness: number, isTabique: boolean }[] = []

        Object.entries(thicknessGroups).forEach(([thicknessStr, groupWalls]) => {
            const thickness = parseFloat(thicknessStr)
            const visited = new Set<string>()

            groupWalls.forEach(startWall => {
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
                    const nextWall = groupWalls.find(w => !visited.has(w.id) && (isSamePointLocal(w.start, lastP) || isSamePointLocal(w.end, lastP)))
                    if (nextWall) {
                        visited.add(nextWall.id)
                        if (isSamePointLocal(nextWall.end, lastP)) {
                            // Reverse segment if it was drawn end-to-start
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
                    const prevWall = groupWalls.find(w => !visited.has(w.id) && (isSamePointLocal(w.start, firstP) || isSamePointLocal(w.end, firstP)))
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

                // Compute offset segments for each wall using the shared node offsets
                const segments = wallChain.map(w => {
                    const offS = getSharedOffset(w.start);
                    const offE = getSharedOffset(w.end);
                    return {
                        p1: { x: w.start.x + offS.x, y: w.start.y + offS.y },
                        p2: { x: w.end.x + offE.x, y: w.end.y + offE.y }
                    }
                })

                const chainPoints: number[] = []
                if (isLoop) {
                    for (let i = 0; i < segments.length; i++) {
                        const curr = segments[i]
                        const next = segments[(i + 1) % segments.length]
                        // We use line intersection to find the exact miter point between offset segments
                        const inter = calculateLineIntersection(curr.p1, curr.p2, next.p1, next.p2)
                        const joint = inter || curr.p2
                        chainPoints.push(joint.x, joint.y)
                    }
                } else {
                    chainPoints.push(segments[0].p1.x, segments[0].p1.y)
                    for (let i = 0; i < segments.length - 1; i++) {
                        const curr = segments[i]
                        const next = segments[i + 1]
                        const inter = calculateLineIntersection(curr.p1, curr.p2, next.p1, next.p2)
                        const joint = inter || curr.p2
                        chainPoints.push(joint.x, joint.y)
                    }
                    const last = segments[segments.length - 1]
                    chainPoints.push(last.p2.x, last.p2.y)
                }

                // Safety: If chain only has one point, it's not a line.
                // If it has two identical points, it's also not a line.
                if (chainPoints.length < 4) return;

                allChains.push({
                    points: chainPoints,
                    closed: isLoop,
                    thickness: thickness,
                    isTabique: !isLoop  // Open chains are interior partition walls
                })
            })
        })

        return allChains
    }, [walls, wallSnapshot, rooms])

    const getSnapshot = React.useCallback((options?: { hideBackground?: boolean; hideGrid?: boolean }) => {
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

        // C. Hide Background Image if requested
        const bgNode = stage.findOne('.background-image')
        const wasBgVisible = bgNode?.visible()
        if (options?.hideBackground && bgNode) {
            bgNode.visible(false)
        }

        // D. Hide Grid if requested
        if (options?.hideGrid && gridRef.current) {
            gridRef.current.visible(false)
        }

        // FORCE SYNCHRONOUS DRAW to apply changes before data extraction
        stage.batchDraw()

        // 3. Export specific area
        const dataUrl = stage.toDataURL({
            x: screenX,
            y: screenY,
            width: screenWidth,
            height: screenHeight,
            pixelRatio: 1,
            mimeType: "image/png"
        })
        console.log(`DEBUG: Snapshot generated, len=${dataUrl?.length}`)

        // --- RESTORE STATE ---
        container.style.backgroundColor = originalBg
        if (gridRef.current && wasGridVisible !== undefined) gridRef.current.visible(wasGridVisible)
        if (options?.hideBackground && bgNode && wasBgVisible !== undefined) bgNode.visible(wasBgVisible)
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
            img.crossOrigin = "Anonymous"

            // If it's a remote URL (not a data URL), add a cache-buster
            // to bypass potential non-CORS cached versions in the browser
            if (bgImage.startsWith('http')) {
                const separator = bgImage.includes('?') ? '&' : '?'
                img.src = `${bgImage}${separator}t=${new Date().getTime()}`
            } else {
                img.src = bgImage
            }

            img.onload = () => setImage(img)
            img.onerror = (err) => {
                console.error("Error loading background image:", err)
                setImage(null)
            }
        } else {
            setImage(null)
        }
    }, [bgImage])
    const [mousePos, setMousePos] = React.useState<Point | null>(null)
    const [ceramicGridImage, setCeramicGridImage] = React.useState<HTMLImageElement | null>(null)
    const [wallHatchingImage, setWallHatchingImage] = React.useState<HTMLImageElement | null>(null)

    React.useEffect(() => {
        if (typeof document === 'undefined') return
        const canvas = document.createElement('canvas')
        const size = 60 // 60cm tiles
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (ctx) {
            // Checkerboard pattern (chess) para máxima diferenciación
            const half = size / 2

            // Baldosas alternas (Estilo ajedrez exagerado)
            ctx.fillStyle = '#cbd5e1' // Slate-200 (Gris azulado definido)
            ctx.fillRect(0, 0, half, half)
            ctx.fillRect(half, half, half, half)

            ctx.fillStyle = '#ffffff' // Blanco puro
            ctx.fillRect(half, 0, half, half)
            ctx.fillRect(0, half, half, half)

            // Líneas de unión negras para resaltar el despiece
            ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(half, 0); ctx.lineTo(half, size)
            ctx.moveTo(0, half); ctx.lineTo(size, half)
            ctx.stroke()
            ctx.strokeRect(0, 0, size, size)
        }
        const img = new Image()
        img.src = canvas.toDataURL()
        img.onload = () => setCeramicGridImage(img)
    }, [])

    React.useEffect(() => {
        if (typeof document === 'undefined') return
        const canvas = document.createElement('canvas')
        const size = 20
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (ctx) {
            ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)' // More opaque hatching
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(0, size)
            ctx.lineTo(size, 0)
            ctx.stroke()
        }
        const img = new Image()
        img.src = canvas.toDataURL()
        img.onload = () => setWallHatchingImage(img)
    }, [])
    const [internalAlignmentGuides, setInternalAlignmentGuides] = React.useState<{ x?: number, y?: number } | null>(null)
    const [editMode, setEditMode] = React.useState<"menu" | "length" | "thickness" | "room" | "room-custom" | "ceramic" | null>(null)
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
            const hasHover = window.matchMedia('(hover: hover)').matches;
            if (hasHover) {
                // On desktop/hover devices, only mobile if window is extremely narrow
                setIsMobile(window.innerWidth < 1024);
            } else {
                // On touch-only devices
                setIsMobile(window.innerWidth < 1024 || (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)));
            }
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
            const rect = stage.content.getBoundingClientRect()
            const pos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            }

            // Manual transform to account for zoom/pan
            const pointer = {
                x: (pos.x - offset.x) / zoom,
                y: (pos.y - offset.y) / zoom
            }

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

            setInternalAlignmentGuides(Object.keys(guides).length > 0 ? guides : null)
            // --- SNAPPING LOGIC END ---

            onDragVertex(dragStartPos.current, totalDelta, draggingVertexWallIds.current)
        }

        const handleVertexUp = (e: PointerEvent) => {
            if (isDraggingVertexRef.current) {
                isDraggingVertexRef.current = false
                dragStartPos.current = null
                dragStartPointerPos.current = null
                setInternalAlignmentGuides(null) // Clear guides
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
    const wasPinching = React.useRef(false)

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

    // Global Key Listener for Escape
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsCeramicEraserActive(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const selectedWall = selectedWallIds.length === 1 ? walls.find(w => w.id === selectedWallIds[0]) : null
    const selectedRoom = rooms.find(r => r.id === selectedRoomId)

    // Reset ceramic eraser and room menu pos when tool changes or selection is cleared
    React.useEffect(() => {
        // Reset when switching tools or when selection is completely cleared
        if (activeTool !== "select") {
            setIsCeramicEraserActive(false)
            setRoomMenuClickPos(null)
            setWallMenuClickPos(null)
        } else if (!selectedRoomId && !selectedWall && !selectedElement) {
            // Check if eraser was active. If nothing is selected, eraser can't be active (no menu)
            setRoomMenuClickPos(null)
            setWallMenuClickPos(null)
            setIsCeramicEraserActive(false)
        }
    }, [activeTool, selectedRoomId, selectedWall, selectedElement])

    const ROOM_TYPES = [
        "Salón", "Cocina", "Cocina Abierta", "Cocina Americana",
        "Baño", "Dormitorio",
        "Pasillo", "Hall",
        "Terraza", "Trastero",
        "Vestidor", "Otro"
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

        const candidates: Point[] = []
        const snapshotWalls = wallSnapshot || walls
        snapshotWalls.forEach((w: Wall) => {
            candidates.push(w.start)
            candidates.push(w.end)
        })
        rooms.forEach((r: Room) => {
            r.polygon.forEach((p: Point) => candidates.push(p))
        })

        // Prioridad: Si estamos dibujando un muro, el punto de inicio es el candidato #1 para cerrar la figura
        if (currentWall?.start) {
            candidates.unshift(currentWall.start)
        }

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

        setInternalAlignmentGuides(null)

        if (!snappingEnabled) return point

        // 1. VERTEX SNAP (Strongest) - Increased from 6 to 12 for better room closing
        const vertexThreshold = 12 / zoom
        const vertex = findNearestVertex(point, vertexThreshold)
        if (vertex) return vertex

        // 2. ALINEACIONES Y ORTOGONALIDAD
        const alignThreshold = 12 / zoom
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
            setInternalAlignmentGuides({ x: snappedX ?? undefined, y: snappedY ?? undefined })
            if (snappedX !== null) point.x = snappedX
            if (snappedY !== null) point.y = snappedY

            // Si snapamos ambos ejes es virtualmente un vÃ©rtice, retornamos ya
            if (snappedX !== null && snappedY !== null) return point
        }

        // 3. EDGE SNAP (Si no hay alineaciÃ³n fuerte de ejes) - Increased from 8 to 15
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

        // 4. ROUNDING FINAL (1mm precision)
        return {
            x: Math.round(point.x * 10) / 10,
            y: Math.round(point.y * 10) / 10
        }
    }

    const findTerminal = (startWall: Wall, startP: Point, visited: Set<string>, faceNormal: Point, interiorRoomId?: string) => {
        const isInterior = !!interiorRoomId
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
            const contIsInterior = interiorRoomId ? isPointInPolygon(testP_cont, rooms.find(r => r.id === interiorRoomId)!.polygon) : false

            if (isInterior && !contIsInterior) {
                return { terminal: curr, addedLen, terminalWallId }
            }

            // If we are measuring EXTERIOR, we should also stop if we hit an interior segment
            // (i.e., we are crossing into the "inside" of some room part)
            if (!isInterior && isPointInAnyRoom(testP_cont)) {
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
        const neighbors = walls.filter(w => !ignoreIds.has(w.id) && w.id !== wall.id && !w.isInvisible && (() => {
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

            const midP = { x: (selectedWall.start.x + selectedWall.end.x) / 2, y: (selectedWall.start.y + selectedWall.end.y) / 2 }
            const safeOffset = (selectedWall.thickness / 2) + 12
            const testP = { x: midP.x + faceNormal.x * safeOffset, y: midP.y + faceNormal.y * safeOffset }
            const owningRoom = rooms.find(r => isPointInPolygon(testP, r.polygon))
            const interiorRoomId = owningRoom?.id

            const chainIds = new Set([selectedWall.id])

            // GLOBAL CHAIN LOGIC: Always sync with the total chain length (Interior or Exterior)
            // to maintain consistency with the visualized labels.
            const back = findTerminal(selectedWall, selectedWall.start, chainIds, faceNormal, interiorRoomId)
            const forward = findTerminal(selectedWall, selectedWall.end, chainIds, faceNormal, interiorRoomId)
            const chainLen = centerLength + back.addedLen + forward.addedLen

            const terminalStartWall = walls.find(w => w.id === back.terminalWallId) || selectedWall
            const terminalEndWall = walls.find(w => w.id === forward.terminalWallId) || selectedWall

            targetLen = chainLen +
                getFaceOffsetAt(terminalEndWall, forward.terminal, faceNormal, chainIds, true) -
                getFaceOffsetAt(terminalStartWall, back.terminal, faceNormal, chainIds, false)
        }

        setEditLength(targetLen.toFixed(1))
    }, [editFace, selectedWall, editMode])

    // Reset ceramic subpanel when the selected wall changes so the user always starts in normal menu
    const prevSelectedWallIdRef = React.useRef<string | null>(null)
    React.useEffect(() => {
        const newId = selectedWall?.id ?? null
        if (newId !== prevSelectedWallIdRef.current) {
            prevSelectedWallIdRef.current = newId
            if (editMode === "ceramic") setEditMode("menu")
        }
    }, [selectedWall?.id])

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

        // Robust Interior/Exterior detection & Room identification
        const safeCheckDist = (wall.thickness / 2) + 12
        const interiorTestP = { x: midP.x + nx * safeCheckDist, y: midP.y + ny * safeCheckDist }
        const exteriorTestP = { x: midP.x - nx * safeCheckDist, y: midP.y - ny * safeCheckDist }

        // We consider the side we are rendering on
        const currentSideTestP = offsetVal > 0 ? interiorTestP : exteriorTestP
        const owningRoom = rooms.find(r => isPointInPolygon(currentSideTestP, r.polygon))
        const isActuallyInterior = !!owningRoom
        const interiorRoomId = owningRoom?.id
        const isInterior = isActuallyInterior // For findTerminal and other logic

        // COLLINEAR CHAIN SEARCH
        const chainIds = new Set([wall.id])
        const back = findTerminal(wall, wall.start, chainIds, faceNormal, interiorRoomId)
        const forward = findTerminal(wall, wall.end, chainIds, faceNormal, interiorRoomId)

        const totalChainCenter = centerLength + back.addedLen + forward.addedLen
        const terminalStartWall = walls.find(w => w.id === back.terminalWallId) || wall
        const terminalEndWall = walls.find(w => w.id === forward.terminalWallId) || wall

        const finalOffStart = getFaceOffsetAt(terminalStartWall, back.terminal, faceNormal, chainIds, false)
        const finalOffEnd = getFaceOffsetAt(terminalEndWall, forward.terminal, faceNormal, chainIds, true)

        // CHAIN SELECTION & COLOR LOGIC
        const isAnyInChainSelected = Array.from(chainIds).some(id => selectedWallIds.includes(id))
        const isDragging = draggedWallId && chainIds.has(draggedWallId)

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
                    isVisible = isPointInPolygon(currentSideTestP, selectedRoom.polygon)
                }
            }
        }

        if (!isVisible) return null

        const isInteractive = forceInteractive ?? isAnyInChainSelected

        const isBlueSide = offsetVal > 0
        const defaultColor = isInteractive
            ? (isBlueSide ? CERAMIC_BLUE : CERAMIC_ORANGE)
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
        // Scale offset to ensure it never touches the wall and stacks properly
        const baseOffsetFactor = 1.4

        // STACKING LOGIC: Total chains (facades) go further out than individual segments
        const isTotalChain = (totalChainCenter > centerLength + 5)
        const stackMultiplier = isTotalChain ? 1.6 : 1.0
        const extMultiplier = !isActuallyInterior ? 1.3 : 1.0 // Exterior goes a bit further out to differentiate

        const visualOff = (offsetVal * baseOffsetFactor) * stackMultiplier * extMultiplier

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
                        if (activeTool !== "select" || isCeramicEraserActive) return
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

        const isTouchInteraction = (e.evt as any).pointerType === "touch" || (e.evt as any).pointerType === "pen" || forceTouchOffset
        const isDrawingToolEarly = activeTool === "wall" || activeTool === "door" || activeTool === "window" || activeTool === "ruler" || activeTool === "arc" || activeTool === "shunt"

        // SAFETY: Force-clear stale panning state for drawing tools on touch/pen
        // This prevents isPanning getting stuck from a missed pointerUp
        if (isTouchInteraction && isDrawingToolEarly) {
            isPanning.current = false
            wasPinching.current = false
            lastDist.current = 0
            lastCenter.current = null
            isPotentialSustainedPan.current = false
            didSustainedPanOccur.current = false
            setIsPanningState(false)
        }

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

        if (isRightClick || isMiddleClick || (isBackground && !isDrawingToolEarly && activeTool !== "ceramic" && activeTool !== "eraser") || spacePressed.current || ((activeTool === "select" || isCeramicEraserActive) && (!isProtected || isRoom))) {
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
        const isTileTool = activeTool === "ceramic" || activeTool === "eraser"

        // SPECIAL CASE: Sustained Click-to-Pan while using tools
        // ONLY for mouse, to avoid interfering with mobile/stylus chained drawing
        if ((isDrawingTool || isTileTool) && isPrimaryClick && !isTouchInteraction) {
            // For drawing tools, only enable pan if dragging a wall/ruler/arc.
            // For tile tools, always enable potential pan.
            if ((isDrawingTool && (currentWall || activeTool === "ruler" || activeTool === "arc")) || isTileTool) {
                isPotentialSustainedPan.current = true
                didSustainedPanOccur.current = false
                return
            }
        }

        if (e.evt.button !== 0 && (e.evt as any).pointerType === 'mouse') return
        
        // --- LÓGICA MÓVIL (TOUCH): TAP TO SELECT, TAP AGAIN TO ERASE ---
        if (isTouchInteraction && (activeTool === "ceramic" || activeTool === "eraser" || isCeramicEraserActive)) {
            // CRÍTICO: Usar adjustedY para compensar el offset del dedo en táctil. 
            // Esto arregla que no se puedan tocar las paredes de arriba e izquierda.
            const pos = getRelativePointerPosition(stage, { x: stagePos.x, y: adjustedY })
            let touchedFaceId: string | null = null

            // Detectar cara tocada (misma lógica que onPointerMove con umbral táctil MUCHO mayor)
            const avgThickness = walls.length > 0 ? walls.reduce((acc, w) => acc + w.thickness, 0) / walls.length : 20;
            const thresholdWorld = avgThickness / 2 + 60 / zoom; // Umbral extra grande para "dedos gordos" (60px)
            let bestDist = thresholdWorld;
            const activeRoom = (isCeramicEraserActive && selectedRoomId) ? rooms.find(r => r.id === selectedRoomId) : null;

            for (const wall of walls) {
                if (wall.isInvisible) continue;
                const { point: proj } = getClosestPointOnSegment(pos, wall.start, wall.end);
                const d = Math.sqrt((pos.x - proj.x) ** 2 + (pos.y - proj.y) ** 2);
                if (d < bestDist) {
                    bestDist = d;
                    
                    // 1. Determinar matemáticamente qué lado se tocó (basado en la línea central)
                    const wdx = wall.end.x - wall.start.x;
                    const wdy = wall.end.y - wall.start.y;
                    const cross = wdx * (pos.y - wall.start.y) - wdy * (pos.x - wall.start.x);
                    const touchedSide = cross > 0 ? 'F' : 'B';

                    let faceSide: 'F' | 'B' | null = touchedSide;

                    // 2. Si estamos en el modo de habitación, verificamos si el lado tocado PERTENECE a esta habitación
                    if (activeRoom) {
                        let belongsToRoom = false;
                        for (let i = 0; i < activeRoom.polygon.length; i++) {
                            const p1 = activeRoom.polygon[i];
                            const p2 = activeRoom.polygon[(i + 1) % activeRoom.polygon.length];
                            const midP = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                            const { point: midProj } = getClosestPointOnSegment(midP, wall.start, wall.end);
                            const midD = Math.sqrt((midP.x - midProj.x) ** 2 + (midP.y - midProj.y) ** 2);
                            
                            if (midD <= (wall.thickness / 2) + 5) {
                                const dot = wdx * (p2.x - p1.x) + wdy * (p2.y - p1.y);
                                const roomFaceSide = dot >= 0 ? 'F' : 'B';
                                // La habitación es dueña de este lado del muro
                                if (roomFaceSide === touchedSide) {
                                    belongsToRoom = true;
                                    break;
                                }
                            }
                        }
                        
                        // Si el lado que tocaste NO es el que da a tu habitación, no seleccionamos nada
                        // (No puedes borrar la cerámica del vecino desde tu menú)
                        if (!belongsToRoom) {
                            faceSide = null;
                        }
                    }
                    
                    if (faceSide) {
                        touchedFaceId = `${wall.id}:${faceSide}`;
                    }
                }
            }

            // Si tocamos una cara nueva -> Seleccionar (Resaltar rojo) y EVITAR borrar aún
            if (touchedFaceId && touchedFaceId !== hoveredCeramicFaceId) {
                setHoveredCeramicFaceId(touchedFaceId)
                return // Detenemos ejecución, obligando al usuario a hacer un segundo tap
            }
            // Si tocamos fuera de cualquier pared -> Quitar selección
            if (!touchedFaceId) {
                setHoveredCeramicFaceId(null)
                return
            }
            
            // Si llegamos aquí: touchedFaceId === hoveredCeramicFaceId
            // Es el segundo tap en la misma cara -> Continuar y ejecutar el borrado normal abajo
        }

        // HERRAMIENTA CERÁMICA
        if (activeTool === "ceramic") {
            const pos = isTouchInteraction 
                ? getRelativePointerPosition(stage, { x: stagePos.x, y: adjustedY })
                : getRelativePointerPosition(stage)

            // Use the hovered face ID (set by handleStagePointerMove using direct wall-normal detection)
            let bestFaceId: string | null = hoveredCeramicFaceId

            // If no hovered face (e.g. tap without hover), compute directly from cursor
            if (!bestFaceId) {
                const avgThickness = walls.length > 0 ? walls.reduce((acc, w) => acc + w.thickness, 0) / walls.length : 20;
                const thresholdWorld = avgThickness / 2 + (isTouchInteraction ? 40 : 15) / zoom;
                let bestDist = thresholdWorld;
                const activeRoom = (isCeramicEraserActive && selectedRoomId) ? rooms.find(r => r.id === selectedRoomId) : null;
                for (const wall of walls) {
                    if (wall.isInvisible) continue;
                    const { point: proj } = getClosestPointOnSegment(pos, wall.start, wall.end);
                    const d = Math.sqrt((pos.x - proj.x) ** 2 + (pos.y - proj.y) ** 2);
                    if (d < bestDist) {
                        bestDist = d;
                        
                        let faceSide: 'F' | 'B' | null = null;
                        if (activeRoom) {
                            for (let i = 0; i < activeRoom.polygon.length; i++) {
                                const p1 = activeRoom.polygon[i];
                                const p2 = activeRoom.polygon[(i + 1) % activeRoom.polygon.length];
                                const midP = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                                const { point: midProj } = getClosestPointOnSegment(midP, wall.start, wall.end);
                                const midD = Math.sqrt((midP.x - midProj.x) ** 2 + (midP.y - midProj.y) ** 2);
                                if (midD <= (wall.thickness / 2) + 5) {
                                    const wdx = wall.end.x - wall.start.x;
                                    const wdy = wall.end.y - wall.start.y;
                                    const dot = wdx * (p2.x - p1.x) + wdy * (p2.y - p1.y);
                                    faceSide = dot >= 0 ? 'F' : 'B';
                                    break;
                                }
                            }
                        }
                        
                        if (!faceSide) {
                            const wdx = wall.end.x - wall.start.x;
                            const wdy = wall.end.y - wall.start.y;
                            const cross = wdx * (pos.y - wall.start.y) - wdy * (pos.x - wall.start.x);
                            faceSide = cross > 0 ? 'F' : 'B';
                        }
                        
                        bestFaceId = `${wall.id}:${faceSide}`;
                    }
                }
            }

            if (bestFaceId) {
                // Find the room whose interior contains this face
                // A room "owns" a face if:
                //   - it has a polygon segment aligned with the wall, AND
                //   - the wall is on the interior side of that segment (the segment faces into the room)
                const [wallId, faceSide] = bestFaceId.split(':')
                const wall = walls.find(w => w.id === wallId)
                let roomId: string | null = null

                if (wall) {
                    for (const room of rooms) {
                        let found = false
                        for (let i = 0; i < room.polygon.length; i++) {
                            const p1 = room.polygon[i]
                            const p2 = room.polygon[(i + 1) % room.polygon.length]
                            const midP = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
                            const { point: proj } = getClosestPointOnSegment(midP, wall.start, wall.end)
                            const d = Math.sqrt((midP.x - proj.x) ** 2 + (midP.y - proj.y) ** 2)
                            if (d > (wall.thickness / 2) + 5) continue
                            // Check which side of the wall this room segment represents
                            const wDir = { x: wall.end.x - wall.start.x, y: wall.end.y - wall.start.y }
                            const sDir = { x: p2.x - p1.x, y: p2.y - p1.y }
                            const dot = wDir.x * sDir.x + wDir.y * sDir.y
                            const segSide = dot >= 0 ? 'F' : 'B'
                            if (segSide === faceSide) {
                                roomId = room.id
                                found = true
                                break
                            }
                        }
                        if (found) break
                    }
                }

                if (roomId) {
                    const room = rooms.find(r => r.id === roomId)!
                    const currentDisabled = room.disabledCeramicWalls || []
                    let nextDisabled: string[]
                    let nextHasCeramicWalls = room.hasCeramicWalls

                    if (!nextHasCeramicWalls) {
                        nextHasCeramicWalls = true
                        // Collect all face IDs for this room, disable all except the clicked one
                        const faceIds: string[] = []
                        room.polygon.forEach((p, i) => {
                            const pNext = room.polygon[(i + 1) % room.polygon.length]
                            const midP = { x: (p.x + pNext.x) / 2, y: (p.y + pNext.y) / 2 }
                            const w = walls.find(w => {
                                if (w.isInvisible) return false
                                const { point: proj } = getClosestPointOnSegment(midP, w.start, w.end)
                                const dist = Math.sqrt((midP.x - proj.x) ** 2 + (midP.y - proj.y) ** 2)
                                return dist < (w.thickness / 2) + 5.0
                            })
                            if (w) {
                                const wDir = { x: w.end.x - w.start.x, y: w.end.y - w.start.y }
                                const sDir = { x: pNext.x - p.x, y: pNext.y - p.y }
                                const dot = wDir.x * sDir.x + wDir.y * sDir.y
                                const side = dot >= 0 ? 'F' : 'B'
                                faceIds.push(`${w.id}:${side}`)
                            }
                        })
                        nextDisabled = faceIds.filter(id => id !== bestFaceId)
                    } else {
                        const parts = bestFaceId!.split(':')
                        const wId = parts[0]
                        if (currentDisabled.includes(bestFaceId!)) {
                            nextDisabled = currentDisabled.filter(id => id !== bestFaceId)
                        } else if (currentDisabled.includes(wId)) {
                            const side = parts[1], otherSide = side === 'F' ? 'B' : 'F'
                            nextDisabled = [...currentDisabled.filter(id => id !== wId), `${wId}:${otherSide}`]
                        } else {
                            nextDisabled = [...currentDisabled, bestFaceId!]
                        }
                    }
                    onUpdateRoom(roomId, { hasCeramicWalls: nextHasCeramicWalls, disabledCeramicWalls: nextDisabled })
                    return
                }
            }

            // 2. Intentar toggle de suelo cerámico
            const clickedRoom = rooms.find(r => isPointInPolygon(pos, r.polygon))
            if (clickedRoom) {
                onUpdateRoom(clickedRoom.id, { hasCeramicFloor: !clickedRoom.hasCeramicFloor })
                return
            }
        }

        // HERRAMIENTA GOMA (BORRADOR)
        if (activeTool === "eraser") {
            const pos = getRawPointerPosition(stage)

            // Use hovered face ID (set by direct wall-normal hover detection)
            let bestFaceId: string | null = hoveredCeramicFaceId

            // Fallback: compute directly if no hover
            if (!bestFaceId) {
                let bestWallPerp = 20 / zoom
                for (const wall of walls) {
                    if (wall.isInvisible) continue
                    const wdx = wall.end.x - wall.start.x
                    const wdy = wall.end.y - wall.start.y
                    const wallLen = Math.sqrt(wdx * wdx + wdy * wdy)
                    if (wallLen < 0.1) continue
                    const ux = wdx / wallLen, uy = wdy / wallLen
                    const cx = pos.x - wall.start.x, cy = pos.y - wall.start.y
                    const along = cx * ux + cy * uy
                    if (along < -wall.thickness || along > wallLen + wall.thickness) continue
                    const perp = cx * (-uy) + cy * ux
                    const perpAbs = Math.abs(perp)
                    if (perpAbs >= bestWallPerp) continue
                    const nudge = wall.thickness / 2 + 8
                    const t = Math.max(0, Math.min(1, (cx * ux + cy * uy) / wallLen))
                    const projX = wall.start.x + t * ux * wallLen
                    const projY = wall.start.y + t * uy * wallLen
                    const nSign = perp >= 0 ? 1 : -1
                    const testX = projX + (-uy) * nSign * nudge
                    const testY = projY + ux * nSign * nudge
                    let ownerRoom: typeof rooms[0] | null = null
                    for (const room of rooms) {
                        if (isPointInPolygon({ x: testX, y: testY }, room.polygon)) {
                            ownerRoom = room; break
                        }
                    }
                    if (ownerRoom) {
                        let closestSegDist = Infinity
                        for (let i = 0; i < ownerRoom.polygon.length; i++) {
                            const p1 = ownerRoom.polygon[i]
                            const p2 = ownerRoom.polygon[(i + 1) % ownerRoom.polygon.length]
                            const midP = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
                            const { point: proj2 } = getClosestPointOnSegment(midP, wall.start, wall.end)
                            const segDist = Math.sqrt((midP.x - proj2.x) ** 2 + (midP.y - proj2.y) ** 2)
                            if (segDist < (wall.thickness / 2) + 5 && segDist < closestSegDist) {
                                closestSegDist = segDist
                                const wDir = { x: wall.end.x - wall.start.x, y: wall.end.y - wall.start.y }
                                const sDir = { x: p2.x - p1.x, y: p2.y - p1.y }
                                const side = wDir.x * sDir.x + wDir.y * sDir.y >= 0 ? 'F' : 'B'
                                bestFaceId = `${wall.id}:${side}`
                                bestWallPerp = perpAbs
                            }
                        }
                    }
                }
            }

            if (bestFaceId) {
                const [wallId, faceSide] = bestFaceId.split(':')
                const wall = walls.find(w => w.id === wallId)
                let roomId: string | null = null

                if (wall) {
                    for (const room of rooms) {
                        let found = false
                        for (let i = 0; i < room.polygon.length; i++) {
                            const p1 = room.polygon[i]
                            const p2 = room.polygon[(i + 1) % room.polygon.length]
                            const midP = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
                            const { point: proj } = getClosestPointOnSegment(midP, wall.start, wall.end)
                            const d = Math.sqrt((midP.x - proj.x) ** 2 + (midP.y - proj.y) ** 2)
                            if (d > (wall.thickness / 2) + 5) continue
                            const wDir = { x: wall.end.x - wall.start.x, y: wall.end.y - wall.start.y }
                            const sDir = { x: p2.x - p1.x, y: p2.y - p1.y }
                            const dot = wDir.x * sDir.x + wDir.y * sDir.y
                            const segSide = dot >= 0 ? 'F' : 'B'
                            if (segSide === faceSide) {
                                // Only erase if this face is actually enabled (has ceramic)
                                const disabled = room.disabledCeramicWalls || []
                                if (room.hasCeramicWalls && !disabled.includes(bestFaceId!) && !disabled.includes(wallId)) {
                                    roomId = room.id
                                }
                                found = true
                                break
                            }
                        }
                        if (found) break
                    }
                }

                if (roomId) {
                    const room = rooms.find(r => r.id === roomId)!
                    const currentDisabled = room.disabledCeramicWalls || []
                    onUpdateRoom(room.id, { disabledCeramicWalls: [...currentDisabled, bestFaceId!] })
                    return
                }
            }

            // 2. Comportamiento normal: borrar el elemento
            if (targetName.startsWith("wall-")) {
                const wallId = targetName.split("wall-")[1].split("-")[0]
                onDeleteWall(wallId)
                return
            } else if (targetName.startsWith("door-") || targetName.startsWith("window-") || targetName.startsWith("shunt-")) {
                const type = targetName.split("-")[0] as "door" | "window" | "shunt"
                const id = targetName.split("-")[1]
                onDeleteElement(type, id)
                return
            }
        }

        // LÓGICA DE GOMA CERÁMICA DESDE EL MENÚ DE HABITACIÓN
        if (isCeramicEraserActive && selectedRoomId) {
            if (hoveredCeramicFaceId) {
                const room = rooms.find(r => r.id === selectedRoomId)
                if (room && room.hasCeramicWalls) {
                    const currentDisabled = room.disabledCeramicWalls || []
                    if (!currentDisabled.includes(hoveredCeramicFaceId)) {
                        onUpdateRoom(room.id, { disabledCeramicWalls: [...currentDisabled, hoveredCeramicFaceId] })
                    }
                    return
                }
            }
        }

        // Si pinchamos en algo (o cerca por el offset) y es tÃ¡ctil, disparamos su lÃ³gica
        if (isTouchInteraction && !isBackground) {
            if (activeTool === "select" && !isCeramicEraserActive) {
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

        if (activeTool !== "wall" && activeTool !== "door" && activeTool !== "window" && activeTool !== "ruler" && activeTool !== "arc" && activeTool !== "shunt" && activeTool !== "ceramic" && activeTool !== "eraser") return

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
            const panSpeed = 8 / zoom 
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


        if (activeTool === "ceramic" || activeTool === "eraser" || isCeramicEraserActive) {
            const ceramicPos = getRelativePointerPosition(stage, { x: stagePos.x, y: adjustedY })
            let bestFaceId: string | null = null

            // Threshold: half of avg wall thickness + 15 screen-pixel buffer
            const avgThickness = walls.length > 0 ? walls.reduce((acc, w) => acc + w.thickness, 0) / walls.length : 20;
            const thresholdWorld = avgThickness / 2 + 15 / zoom;
            const activeRoom = (isCeramicEraserActive && selectedRoomId) ? rooms.find(r => r.id === selectedRoomId) : null;

            let bestDist = thresholdWorld;

            for (const wall of walls) {
                if (wall.isInvisible) continue;
                const { point: proj } = getClosestPointOnSegment(ceramicPos, wall.start, wall.end);
                const d = Math.sqrt((ceramicPos.x - proj.x) ** 2 + (ceramicPos.y - proj.y) ** 2);
                if (d < bestDist) {
                    bestDist = d;
                    
                    // 1. Determinar matemáticamente qué lado se tocó
                    const wdx = wall.end.x - wall.start.x;
                    const wdy = wall.end.y - wall.start.y;
                    const cross = wdx * (ceramicPos.y - wall.start.y) - wdy * (ceramicPos.x - wall.start.x);
                    const hoveredSide = cross > 0 ? 'F' : 'B';

                    let faceSide: 'F' | 'B' | null = hoveredSide;

                     if (activeRoom) {
                        let belongsToRoom = false;
                        for (let i = 0; i < activeRoom.polygon.length; i++) {
                            const p1 = activeRoom.polygon[i];
                            const p2 = activeRoom.polygon[(i + 1) % activeRoom.polygon.length];
                            const midP = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                            const { point: midProj } = getClosestPointOnSegment(midP, wall.start, wall.end);
                            const midD = Math.sqrt((midP.x - midProj.x) ** 2 + (midP.y - midProj.y) ** 2);
                            
                            if (midD <= (wall.thickness / 2) + 5) {
                                const dot = wdx * (p2.x - p1.x) + wdy * (p2.y - p1.y);
                                const roomFaceSide = dot >= 0 ? 'F' : 'B';
                                if (roomFaceSide === hoveredSide) {
                                    belongsToRoom = true;
                                    break;
                                }
                            }
                        }
                        
                        if (!belongsToRoom) {
                            faceSide = null;
                        }
                    }
                    
                    if (faceSide) {
                        bestFaceId = `${wall.id}:${faceSide}`;
                    }
                }
            }

            if (bestFaceId !== hoveredCeramicFaceId) {
                setHoveredCeramicFaceId(bestFaceId)
            }
        } else if (hoveredCeramicFaceId) {
            setHoveredCeramicFaceId(null)
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
                // BUT we skip it if we were just pinching (zooming)
                if (!wasPinching.current) {
                    onMouseUp(pos)
                }
                // Reset pinch state after the interaction sequence finishes
                wasPinching.current = false
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
        const stage = e.target.getStage()
        const oldScale = zoom
        const pointer = stage.getPointerPosition()

        const mousePointTo = {
            x: (pointer.x - offset.x) / oldScale,
            y: (pointer.y - offset.y) / oldScale,
        }

        let newScale: number
        if (e.evt.ctrlKey) {
            // Trackpad pinch-zoom on Mac: deltaY is proportional to the gesture.
            // Use a gentle exponential factor to avoid the exaggerated zoom.
            const factor = Math.exp(-e.evt.deltaY * 0.004)
            newScale = oldScale * factor
        } else {
            // Regular mouse wheel: use a small fixed step per notch.
            const scaleBy = 1.06
            newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
        }

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
            wasPinching.current = true

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
                x: (newCenter.x - offset.x) / zoom,
                y: (newCenter.y - offset.y) / zoom,
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
        <div className="w-full h-full bg-slate-50 overflow-hidden"
            style={{ touchAction: 'none' }}>
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
                style={{ 
                    cursor: isPanningState 
                        ? 'grabbing' 
                        : (isCeramicEraserActive || activeTool === "eraser")
                            ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32' fill='none' stroke='%23ef4444' stroke-width='2'%3E%3Cpath d='M1 1 L12 5 L5 12 Z' fill='%23ef4444'/%3E%3Cpath d='M14 18l4-4 8 8-4 4zM24 12l4 4' stroke='%23ef4444' stroke-width='2'/%3E%3C/svg%3E") 2 2, pointer`
                            : activeTool === "ceramic"
                                ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32' fill='none' stroke='%230ea5e9' stroke-width='2'%3E%3Cpath d='M1 1 L12 5 L5 12 Z' fill='%230ea5e9'/%3E%3Crect width='14' height='14' x='14' y='14' rx='2' stroke='%230ea5e9' stroke-width='2'/%3E%3Cpath d='M14 21h14M21 14v14' stroke='%230ea5e9' stroke-width='1'/%3E%3C/svg%3E") 2 2, pointer`
                                : (activeTool === "wall" || activeTool === "arc" || activeTool === "ruler") 
                                    ? 'crosshair' 
                                    : 'default', 
                    touchAction: 'none' 
                }}
            >
                <Layer>
                    {/* Clean background white/gray */}
                    <Rect
                        name="grid-rect"
                        x={-50000}
                        y={-50000}
                        width={100000}
                        height={100000}
                        fill="#f8fafc"
                        onClick={() => {
                            if (activeTool === "select") {
                                onSelectWall(null)
                                onSelectRoom(null)
                                onSelectElement(null)
                                setEditMode(null)
                            }
                        }}
                        onTap={() => {
                            if (activeTool === "select") {
                                onSelectWall(null)
                                onSelectRoom(null)
                                onSelectElement(null)
                                setEditMode(null)
                            }
                        }}
                    />
                </Layer>
                <Layer>
                    <Group x={offset.x} y={offset.y} scaleX={zoom} scaleY={zoom}>
                        {/* Grid - now properly transformed with the floor plan */}
                        <Group ref={gridRef}>
                            {showGrid && <Grid width={width / zoom} height={height / zoom} zoom={1} offset={{ x: 0, y: 0 }} rotation={gridRotation} />}
                        </Group>

                        {/* Imagen de fondo / Plantilla */}
                        {image && bgConfig && (
                            <Rect
                                x={bgConfig.x + (image.width * bgConfig.scale) / 2}
                                y={bgConfig.y + (image.height * bgConfig.scale) / 2}
                                width={image.width * bgConfig.scale}
                                height={image.height * bgConfig.scale}
                                offsetX={(image.width * bgConfig.scale) / 2}
                                offsetY={(image.height * bgConfig.scale) / 2}
                                fillPatternImage={image}
                                fillPatternScaleX={bgConfig.scale}
                                fillPatternScaleY={bgConfig.scale}
                                rotation={bgConfig.rotation || 0}
                                opacity={bgConfig.opacity}
                                listening={false}
                                name="background-image"
                            />
                        )}


                        {/* Renderizar habitaciones detectadas (SOLO FONDO) */}
                        {rooms.map((room: Room) => {
                            const points = room.polygon.flatMap((p: Point) => [p.x, p.y])

                            return (
                                <Group key={room.id}>
                                    {/* 1. Capa base blanca para ocultar el grid global */}
                                    {!bgImage && (
                                        <Line
                                            points={points}
                                            fill="#ffffff"
                                            stroke="transparent"
                                            closed={true}
                                            listening={false}
                                        />
                                    )}

                                    {/* 2. Capa de color original (Sombreado) */}
                                    <Line
                                        name="room-poly"
                                        points={points}
                                        fill={bgImage
                                            ? (selectedRoomId === room.id ? room.color + "40" : room.color + "20")
                                            : (selectedRoomId === room.id ? room.color + "60" : room.color + "40")
                                        }
                                        stroke={selectedRoomId === room.id ? "#0ea5e9" : "transparent"}
                                        strokeWidth={selectedRoomId === room.id ? 4 : 2}
                                        hitStrokeWidth={60} // Added: easier to hit wall faces with eraser
                                        closed={true}
                                        onClick={(e) => { 
                                            e.cancelBubble = true; 
                                            const stage = e.target.getStage();
                                            const pointer = stage?.getPointerPosition();
                                            if (pointer) {
                                                const worldPos = {
                                                    x: (pointer.x - offset.x) / zoom,
                                                    y: (pointer.y - offset.y) / zoom
                                                };
                                                setRoomMenuClickPos(worldPos);

                                                if (activeTool === "ceramic" || activeTool === "eraser" || isCeramicEraserActive) {
                                                    // Use the already-computed hover target — the red highlight IS the target
                                                    const faceId = hoveredCeramicFaceId;
                                                    if (faceId) {
                                                        const current = room.disabledCeramicWalls || [];
                                                        const isCurrentlyDisabled = current.includes(faceId);
                                                        const isEraser = activeTool === "eraser" || isCeramicEraserActive;
                                                        let next;
                                                        if (isEraser) {
                                                            if (!isCurrentlyDisabled) next = [...current, faceId];
                                                            else next = current;
                                                        } else {
                                                            if (isCurrentlyDisabled) next = current.filter(id => id !== faceId);
                                                            else next = [...current, faceId];
                                                        }
                                                        onUpdateRoom(room.id, { disabledCeramicWalls: next });
                                                        return;
                                                    }
                                                }
                                            }
                                            onSelectRoom(room.id);
                                        }}
                                        onTap={(e) => { 
                                            e.cancelBubble = true; 
                                            const stage = e.target.getStage();
                                            const pointer = stage?.getPointerPosition();
                                            if (pointer) {
                                                const worldPos = {
                                                    x: (pointer.x - offset.x) / zoom,
                                                    y: (pointer.y - offset.y) / zoom
                                                };
                                                setRoomMenuClickPos(worldPos);

                                                if (activeTool === "ceramic" || activeTool === "eraser" || isCeramicEraserActive) {
                                                    // Use the already-computed hover target — the red highlight IS the target
                                                    const faceId = hoveredCeramicFaceId;
                                                    if (faceId) {
                                                        const current = room.disabledCeramicWalls || [];
                                                        const isCurrentlyDisabled = current.includes(faceId);
                                                        const isEraser = activeTool === "eraser" || isCeramicEraserActive;
                                                        let next;
                                                        if (isEraser) {
                                                            if (!isCurrentlyDisabled) next = [...current, faceId];
                                                            else next = current;
                                                        } else {
                                                            if (isCurrentlyDisabled) next = current.filter(id => id !== faceId);
                                                            else next = [...current, faceId];
                                                        }
                                                        onUpdateRoom(room.id, { disabledCeramicWalls: next });
                                                        return;
                                                    }
                                                }
                                            }
                                            onSelectRoom(room.id);
                                        }}
                                    />

                                    {/* 3. Ceramic Floor Visualization (ON TOP) */}
                                    {room.hasCeramicFloor && ceramicGridImage && (
                                        <Line
                                            points={points}
                                            fillPatternImage={ceramicGridImage}
                                            fillPatternRepeat="repeat"
                                            fillPatternScaleX={1}
                                            fillPatternScaleY={1}
                                            opacity={1.0}
                                            closed={true}
                                            listening={false}
                                        />
                                    )}

                                </Group>
                            )
                        })}

                        {/* INTERIOR TABIQUE CHAINS: Render WITHOUT room clipping to avoid triangular artifacts */}
                        {/* These walls are inside rooms, so the evenodd clip would cut them, creating triangles */}
                        <Group listening={false}>
                            {groupedWallChains.filter(c => c.isTabique).map((chain, idx) => (
                                <Line
                                    key={`tabique-chain-${idx}`}
                                    points={chain.points}
                                    closed={false}
                                    stroke="#334155"
                                    strokeWidth={chain.thickness}
                                    lineJoin="miter"
                                    miterLimit={5}
                                    lineCap="square"
                                    listening={false}
                                />
                            ))}
                        </Group>

                        {/* PERIMETER WALL CHAINS: Render WITH room clip so overlapping corners are clean */}
                        <Group clipFunc={(ctx) => {
                            ctx.beginPath();
                            const clipWidth = 100000 / zoom;
                            const clipHeight = 100000 / zoom;
                            // Draw a massive outer rectangle in COUNTER-CLOCKWISE direction to act as the base solid area
                            const cx = -offset.x / zoom;
                            const cy = -offset.y / zoom;
                            // Draw CCW: Top-Left -> Bottom-Left -> Bottom-Right -> Top-Right -> Top-Left
                            ctx.moveTo(cx - clipWidth / 2, cy - clipHeight / 2);
                            ctx.lineTo(cx - clipWidth / 2, cy + clipHeight / 2);
                            ctx.lineTo(cx + clipWidth / 2, cy + clipHeight / 2);
                            ctx.lineTo(cx + clipWidth / 2, cy - clipHeight / 2);
                            ctx.lineTo(cx - clipWidth / 2, cy - clipHeight / 2);

                            rooms.forEach(room => {
                                if (room.polygon && room.polygon.length > 2) {
                                    const cwPoly = ensureClockwise(room.polygon);
                                    // Use a positive value (5) to INSET the mask. This means the hole starts
                                    // at the inner edge of the walls (which have thickness 10, i.e. 5 units inward),
                                    // leaving the actual wall safe from being clipped out.
                                    const inset = insetPolygon(cwPoly, 5)
                                    ctx.moveTo(inset[0].x, inset[0].y);
                                    for (let i = 1; i < inset.length; i++) {
                                        ctx.lineTo(inset[i].x, inset[i].y);
                                    }
                                    ctx.closePath();
                                }
                            });
                            
                            ctx.clip("evenodd");
                        }}>
                            {groupedWallChains.filter(c => !c.isTabique).map((chain, idx) => (
                                <Line
                                    key={`wall-chain-${idx}`}
                                    points={chain.points}
                                    closed={chain.closed}
                                    stroke="#334155"
                                    strokeWidth={chain.thickness}
                                    lineJoin="miter"
                                    miterLimit={5}
                                    lineCap="butt"
                                    listening={false}
                                />
                            ))}
                        </Group>
                        {/* Ceramic Walls Visualization (TOP LAYER) */}
                        {rooms.map((room) => (
                            <Group key={`cer-walls-top-${room.id}`}>
                                {room.hasCeramicWalls ? (
                                    <Group listening={false}>
                                        <Group
                                            clipFunc={(ctx) => {
                                                ctx.beginPath();
                                                const cwPoly = ensureClockwise(room.polygon);
                                                // Small inset (3px) to cleanly clip corner miter spikes
                                                // without visually thinning the ceramic line
                                                const clipPoly = insetPolygon(cwPoly, 3);
                                                const target = clipPoly.length >= 3 ? clipPoly : cwPoly;
                                                target.forEach((p, i) => {
                                                    if (i === 0) ctx.moveTo(p.x, p.y);
                                                    else ctx.lineTo(p.x, p.y);
                                                });
                                                ctx.closePath();
                                                ctx.clip();
                                            }}
                                        >
                                            {(() => {
                                                const getDist = (a: {x:number, y:number}, b: {x:number, y:number}) => 
                                                    Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2);

                                                // 1. Prioritized pass: find closest visible wall first
                                                const poly = ensureClockwise(room.polygon); // Added: Enforce consistency
                                                const raw = poly.map((p1: Point, i: number) => {
                                                    const p2 = poly[(i + 1) % poly.length];
                                                    const midP = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                                                    const len = getDist(p1, p2);
                                                    let best = null;
                                                    let minDist = 9999;

                                                    // Pass A: Visible walls (Wide search)
                                                    for (const w of walls) {
                                                        if (w.isInvisible) continue;
                                                        const { point: proj } = getClosestPointOnSegment(midP, w.start, w.end);
                                                        const d = getDist(midP, proj);
                                                        if (d < w.thickness + 20 && d < minDist) {
                                                            minDist = d;
                                                            best = w;
                                                        }
                                                    }
                                                    // Pass B: Invisible fallback (Tiny search)
                                                    if (!best) {
                                                        minDist = 9999;
                                                        for (const w of walls) {
                                                            if (!w.isInvisible) continue;
                                                            const { point: proj } = getClosestPointOnSegment(midP, w.start, w.end);
                                                            const d = getDist(midP, proj);
                                                            if (d < 15 && d < minDist) {
                                                                minDist = d;
                                                                best = w;
                                                            }
                                                        }
                                                    }
                                                    return { p1, p2, wall: best, len };
                                                });

                                                // 2. Aggressive Healing Pass
                                                const segments = raw.map((s: any, i: number) => {
                                                    const p = raw[(i - 1 + raw.length) % raw.length];
                                                    const n = raw[(i + 1) % raw.length];
                                                    let w = s.wall;
                                                    // If it's a short tip (< 40px), prefer visible neighbors
                                                    const pVis = p.wall && !p.wall.isInvisible;
                                                    const nVis = n.wall && !n.wall.isInvisible;
                                                    if (s.len < 40 && (pVis || nVis)) {
                                                        w = pVis ? p.wall : n.wall;
                                                    } else if (!w) {
                                                        w = p.wall || n.wall;
                                                    }
                                                    const wt = w ? Math.round(w.thickness) : 10;
                                                    const inv = !!w?.isInvisible;
                                                    
                                                    // Accurate face-specific disabling and heights
                                                    let dis = false;
                                                    let hvr = false;
                                                    let h = 0;
                                                    if (w) {
                                                        const wDir = { x: w.end.x - w.start.x, y: w.end.y - w.start.y };
                                                        const sDir = { x: s.p2.x - s.p1.x, y: s.p2.y - s.p1.y };
                                                        const dot = wDir.x * sDir.x + wDir.y * sDir.y;
                                                        const side = dot >= 0 ? 'F' : 'B';
                                                        const faceId = `${w.id}:${side}`;
                                                        
                                                        const isManualMode = room.isGlobalCeramic === false;
                                                        const wallHasConfig = w.disabledCeramicFaces !== undefined || w.ceramicHeights?.[side] !== undefined || room.ceramicWallHeights?.[faceId] !== undefined;

                                                        // If wall has explicit whitelist use it, otherwise fall back to legacy logic
                                                        if (w.ceramicActiveFaces !== undefined) {
                                                            dis = !w.ceramicActiveFaces.includes(side);
                                                        } else {
                                                            // If there's no whitelist, but the room has ceramic, this wall defaults to OFF (disabled)
                                                            // to prevent the "bloom" effect where activating one wall activates all.
                                                            dis = true; 
                                                        }

                                                        const color = "#0ea5e9";
                                                        h = w.ceramicHeights?.[side] || room.ceramicWallHeights?.[faceId] || room.ceramicWallHeights?.[w.id] || 0;
                                                        if (h === 0) {
                                                            h = planHeight;
                                                        }
                                                        hvr = hoveredCeramicFaceId === faceId;
                                                        
                                                        return { p1: s.p1, p2: s.p2, wt, inv, dis, hvr, h, color: "#0ea5e9", wall: w };
                                                    }
                                                    
                                                    return { p1: s.p1, p2: s.p2, wt, inv, dis, hvr, h, color: "#0ea5e9", wall: w };
                                                });

                                                // 3. Group into chains (including height and color in key)
                                                const chains: any[] = [];
                                                for (const s of segments) {
                                                    const key = `${s.wt}-${s.inv}-${s.dis}-${s.hvr}-${s.h}-${s.color}`;
                                                    if (chains.length === 0 || chains[chains.length-1].key !== key) {
                                                        chains.push({ key, wt: s.wt, inv: s.inv, dis: s.dis, hvr: s.hvr, h: s.h, color: s.color, pts: [s.p1.x, s.p1.y, s.p2.x, s.p2.y] });
                                                    } else {
                                                        chains[chains.length-1].pts.push(s.p2.x, s.p2.y);
                                                    }
                                                }

                                                // 4. Close Loop Join
                                                if (chains.length > 1 && chains[0].key === chains[chains.length-1].key) {
                                                    const last = chains.pop();
                                                    chains[0].pts = [...last.pts.slice(0, -2), ...chains[0].pts];
                                                }

                                                const getOffsetPolyline = (pts: number[], dist: number, closed: boolean) => {
                                                    const out: number[] = [];
                                                    const n = pts.length / 2;
                                                    for(let i=0; i<n; i++) {
                                                        const px = pts[i*2], py = pts[i*2+1];
                                                        
                                                        let nx1=0, ny1=0, nx2=0, ny2=0;
                                                        let len1=0, len2=0;
                                                        
                                                        if (i > 0 || closed) {
                                                            const pIdx = (i - 1 + n) % n;
                                                            const ppx = pts[pIdx*2], ppy = pts[pIdx*2+1];
                                                            len1 = Math.sqrt((px-ppx)**2 + (py-ppy)**2);
                                                            if (len1>0) { nx1 = -(py-ppy)/len1; ny1 = (px-ppx)/len1; }
                                                        }
                                                        if (i < n - 1 || closed) {
                                                            const nIdx = (i + 1) % n;
                                                            const npx = pts[nIdx*2], npy = pts[nIdx*2+1];
                                                            len2 = Math.sqrt((npx-px)**2 + (npy-py)**2);
                                                            if (len2>0) { nx2 = -(npy-py)/len2; ny2 = (npx-px)/len2; }
                                                        }

                                                        if (len1>0 && len2>0) {
                                                            const dot = nx1*nx2 + ny1*ny2;
                                                            if (dot < -0.99) {
                                                                // 180 degree turn (loose tabique tip) - insert two points to create the square cap
                                                                out.push(px + nx1*dist, py + ny1*dist);
                                                                out.push(px + nx2*dist, py + ny2*dist);
                                                            } else {
                                                                let mnx = nx1 + nx2;
                                                                let mny = ny1 + ny2;
                                                                let miterFactor = 1 / Math.max(0.1, (nx1*mnx + ny1*mny));
                                                                if (miterFactor > 5) miterFactor = 5;
                                                                out.push(px + mnx*dist*miterFactor, py + mny*dist*miterFactor);
                                                            }
                                                        } else if (len1>0) {
                                                            out.push(px + nx1*dist, py + ny1*dist);
                                                        } else if (len2>0) {
                                                            out.push(px + nx2*dist, py + ny2*dist);
                                                        } else {
                                                            out.push(px, py);
                                                        }
                                                    }
                                                    return out;
                                                };

                                                return chains.map((c, idx) => {
                                                    const isHovered = c.hvr && (activeTool === "ceramic" || activeTool === "eraser" || isCeramicEraserActive);
                                                    const hColor = (activeTool === "eraser" || isCeramicEraserActive) ? "#ef4444" : c.color;

                                                    if (c.inv || (c.dis && !isHovered)) return null;
                                                    
                                                    const isC = c.pts.length >= 6 && Math.abs(c.pts[0]-c.pts[c.pts.length-2]) < 0.2 && Math.abs(c.pts[1]-c.pts[c.pts.length-1]) < 0.2;
                                                    const pts = isC ? c.pts.slice(0, -2) : c.pts;
                                                    
                                                    // Calculate the offset polyline so it sits perfectly on the wall surface
                                                    // Positive distance offsets INWARDS for CW
                                                    const offsetDist = (c.wt / 2) + 2.0;
                                                    const offsetPts = getOffsetPolyline(pts, offsetDist, isC);
                                                    
                                                    const strokeW = 4;
                                                    
                                                    return (
                                                        <Group key={`cer-${room.id}-${idx}`}>
                                                            {isHovered && <Line points={offsetPts} closed={isC} stroke={hColor} strokeWidth={12} opacity={0.4} lineJoin="miter" lineCap="square" listening={false} />}
                                                            {!c.dis && (
                                                                <>
                                                                    <Line points={offsetPts} closed={isC} stroke={c.color} strokeWidth={5} dash={[10, 8]} lineJoin="miter" lineCap="square" listening={false} />
                                                                    {c.h > 0 && c.h !== planHeight && (() => {
                                                                        const labels: any[] = [];
                                                                        for (let i = 0; i < offsetPts.length / 2 - 1; i++) {
                                                                            const x1 = offsetPts[i * 2], y1 = offsetPts[i * 2 + 1];
                                                                            const x2 = offsetPts[(i + 1) * 2], y2 = offsetPts[(i + 1) * 2 + 1];
                                                                            const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                                                                            if (len < 10) continue; // Skip very short segments

                                                                            const mx = (x1 + x2) / 2;
                                                                            const my = (y1 + y2) / 2;
                                                                            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

                                                                            labels.push(
                                                                                <Group key={`height-${i}`} x={mx} y={my} rotation={angle}>
                                                                                    <Rect
                                                                                        x={-20 / zoom}
                                                                                        y={-10 / zoom}
                                                                                        width={40 / zoom}
                                                                                        height={20 / zoom}
                                                                                        fill="#a855f7"
                                                                                        cornerRadius={4 / zoom}
                                                                                        shadowBlur={4 / zoom}
                                                                                        shadowOpacity={0.2}
                                                                                    />
                                                                                    <Text
                                                                                        text={`${c.h}`}
                                                                                        fill="white"
                                                                                        fontSize={11 / zoom}
                                                                                        fontStyle="bold"
                                                                                        width={40 / zoom}
                                                                                        align="center"
                                                                                        y={-5 / zoom}
                                                                                        x={-20 / zoom}
                                                                                    />
                                                                                </Group>
                                                                            );
                                                                        }
                                                                        return labels;
                                                                    })()}
                                                                </>
                                                            )}
                                                        </Group>
                                                    );
                                                });

                                            })()}
                                        </Group>
                                    </Group>
                                ) : null}
                            </Group>
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
                                    if (activeTool === "select" && !isCeramicEraserActive && onSplitWall) {
                                        const stage = e.target.getStage()
                                        if (stage) {
                                            const pos = getRelativePointerPosition(stage)
                                            onSplitWall(wall.id, pos)
                                        }
                                    }
                                } else {
                                    // Single tap -> Select
                                    if (activeTool === "select" && !isCeramicEraserActive) {
                                        const stage = e.target.getStage();
                                        const pointer = stage?.getPointerPosition();
                                        if (pointer) {
                                            const clickP = {
                                                x: (pointer.x - offset.x) / zoom,
                                                y: (pointer.y - offset.y) / zoom
                                            };
                                            setWallMenuClickPos(clickP);

                                            // Calculate which face (F/B) was clicked
                                            const dx = wall.end.x - wall.start.x;
                                            const dy = wall.end.y - wall.start.y;
                                            const nx = -dy; // Normal vector
                                            const ny = dx;
                                            const vpx = clickP.x - wall.start.x;
                                            const vpy = clickP.y - wall.start.y;
                                            const dot = vpx * nx + vpy * ny;
                                            setClickedFaceId(dot >= 0 ? 'F' : 'B');
                                        }
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
                                        stroke={wall.isInvisible ? "#0ea5e9" : ((isHovered && !isSelected) ? "#ef4444" : "transparent")}
                                        strokeWidth={wall.isInvisible ? (isSelected ? 4 : 2) : wall.thickness}
                                        dash={wall.isInvisible ? [5, 5] : undefined}
                                        hitStrokeWidth={30} // Increased from 20 for better mobile touch
                                        lineCap="butt"
                                        lineJoin="miter"
                                        draggable={activeTool === "select" && !isCeramicEraserActive}
                                        onClick={(e) => {
                                            e.cancelBubble = true
                                            if (activeTool === "select" && !isCeramicEraserActive) {
                                                const stage = e.target.getStage();
                                                const pointer = stage?.getPointerPosition();
                                                if (pointer) {
                                                    setWallMenuClickPos({
                                                        x: (pointer.x - offset.x) / zoom,
                                                        y: (pointer.y - offset.y) / zoom
                                                    });
                                                }
                                                onSelectWall(wall.id, e.evt.ctrlKey)
                                            }
                                        }}
                                        onTap={handleWallTap}
                                        onDblClick={(e) => {
                                            if (activeTool === "select" && !isCeramicEraserActive && onSplitWall) {
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
                                            setDraggedWallId(wall.id)
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
                                            setDraggedWallId(null)
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

                                    {/* MEDIDA DE PUNTA (GROSOR) PARA TABIQUES SUELTOS */}
                                    {(() => {
                                        if (wall.isInvisible) return null
                                        const isStartDangling = !walls.some(w => w.id !== wall.id && !w.isInvisible && (Math.abs(w.start.x - wall.start.x) < 2 && Math.abs(w.start.y - wall.start.y) < 2 || Math.abs(w.end.x - wall.start.x) < 2 && Math.abs(w.end.y - wall.start.y) < 2 || isPointOnSegment(wall.start, w.start, w.end, 1.0)))
                                        const isEndDangling = !walls.some(w => w.id !== wall.id && !w.isInvisible && (Math.abs(w.start.x - wall.end.x) < 2 && Math.abs(w.start.y - wall.end.y) < 2 || Math.abs(w.end.x - wall.end.x) < 2 && Math.abs(w.end.y - wall.end.y) < 2 || isPointOnSegment(wall.end, w.start, w.end, 1.0)))

                                        const dx = wall.end.x - wall.start.x
                                        const dy = wall.end.y - wall.start.y
                                        const len = Math.sqrt(dx * dx + dy * dy)
                                        if (len < 1) return null

                                        const nx = -dy / len
                                        const ny = dx / len
                                        const dirX = dx / len
                                        const dirY = dy / len

                                        const createTipQuote = (targetPoint: Point, isStart: boolean) => {
                                            const tipNormX = isStart ? -dirX : dirX
                                            const tipNormY = isStart ? -dirY : dirY

                                            const safeOffset = 10
                                            const testP = { x: targetPoint.x + tipNormX * safeOffset, y: targetPoint.y + tipNormY * safeOffset }

                                            let isVisible = false
                                            if (showAllQuotes || isSelected) {
                                                isVisible = true
                                            } else if (selectedRoomId) {
                                                const selectedRoom = rooms.find(r => r.id === selectedRoomId)
                                                if (selectedRoom && selectedRoom.area >= 2) {
                                                    isVisible = isPointInPolygon(testP, selectedRoom.polygon)
                                                }
                                            }

                                            if (!isVisible) return null

                                            const offsetVal = 25 / zoom
                                            const textOff = 12 / zoom
                                            const color = isSelected ? "#0ea5e9" : "#94a3b8"

                                            const cx = targetPoint.x + tipNormX * offsetVal
                                            const cy = targetPoint.y + tipNormY * offsetVal

                                            const halfT = wall.thickness / 2
                                            const p1x = cx - nx * halfT
                                            const p1y = cy - ny * halfT
                                            const p2x = cx + nx * halfT
                                            const p2y = cy + ny * halfT

                                            const textX = cx + tipNormX * textOff
                                            const textY = cy + tipNormY * textOff

                                            let angle = Math.atan2(ny, nx) * (180 / Math.PI)
                                            if (angle > 90 || angle < -90) angle += 180

                                            return (
                                                <Group key={`tip-${wall.id}-${isStart ? 'start' : 'end'}`}>
                                                    <Line points={[p1x, p1y, p2x, p2y]} stroke={color} strokeWidth={1 / zoom} listening={false} />
                                                    <Line points={[targetPoint.x - nx * halfT, targetPoint.y - ny * halfT, p1x, p1y]} stroke={CERAMIC_BLUE} strokeWidth={1 / zoom} dash={[2 / zoom, 2 / zoom]} listening={false} />
                                                    <Line points={[targetPoint.x + nx * halfT, targetPoint.y + ny * halfT, p2x, p2y]} stroke={CERAMIC_BLUE} strokeWidth={1 / zoom} dash={[2 / zoom, 2 / zoom]} listening={false} />

                                                    <Group x={textX} y={textY} rotation={angle} listening={false}>
                                                        <Rect
                                                            x={-20 / zoom} y={-8 / zoom} width={40 / zoom} height={16 / zoom}
                                                            fill="rgba(255,255,255,0.7)" cornerRadius={2 / zoom}
                                                        />
                                                        <Text
                                                            text={wall.thickness.toFixed(1).replace('.', ',')}
                                                            fontSize={12 / zoom} fill={color} fontStyle="bold"
                                                            align="center" verticalAlign="middle"
                                                            x={-20 / zoom} y={-6 / zoom} width={40 / zoom}
                                                        />
                                                    </Group>
                                                </Group>
                                            )
                                        }

                                        const tipContent = []
                                        if (isStartDangling) tipContent.push(createTipQuote(wall.start, true))
                                        if (isEndDangling) tipContent.push(createTipQuote(wall.end, false))
                                        return tipContent
                                    })()}

                                    {/* MEDIDAS PERPENDICULARES DINÃMICAS */}
                                    {(isSelected || dragStartPos.current) && (
                                        walls.filter(otherW => isConnectedPerpendicular(wall, otherW) && !selectedWallIds.includes(otherW.id)).map(perpWall => (
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

                            // --- CHAIN MEASUREMENT LOGIC ---
                            // Find the true visible terminals of the wall chain to jump over invisible dividers
                            const dx = wall.end.x - wall.start.x
                            const dy = wall.end.y - wall.start.y
                            const centerLength = Math.max(0.1, Math.sqrt(dx * dx + dy * dy))
                            const nx_local = -dy / centerLength
                            const ny_local = dx / centerLength
                            const midP = { x: (wall.start.x + wall.end.x) / 2, y: (wall.start.y + wall.end.y) / 2 }
                            // Determine if we are measuring on an interior-pointing face for proper terminal traversal
                            const testP = { x: midP.x + nx_local * (wall.thickness / 2 + 10), y: midP.y + ny_local * (wall.thickness / 2 + 10) }
                            const interiorRoomId = rooms.find(r => isPointInPolygon(testP, r.polygon))?.id
                            const faceNormal = { x: nx_local, y: ny_local }

                            const chainIds = new Set([wall.id])
                            const back = findTerminal(wall, wall.start, chainIds, faceNormal, interiorRoomId)
                            const forward = findTerminal(wall, wall.end, chainIds, faceNormal, interiorRoomId)

                            // Helper to get connected wall thickness at a vertex (IGNORING INVISIBLE WALLS)
                            const getNeighborThickness = (p: { x: number, y: number }, wallId: string) => {
                                const neighbor = walls.find(w => w.id !== wallId && !w.isInvisible && (
                                    (Math.abs(w.start.x - p.x) < 1 && Math.abs(w.start.y - p.y) < 1) ||
                                    (Math.abs(w.end.x - p.x) < 1 && Math.abs(w.end.y - p.y) < 1)
                                ))
                                return neighbor ? neighbor.thickness : 0
                            }

                            const terminalStartThick = getNeighborThickness(back.terminal, back.terminalWallId)
                            const terminalEndThick = getNeighborThickness(forward.terminal, forward.terminalWallId)

                            // Calculate distances relative to the full chain
                            const d1Val = Math.max(0, back.addedLen + (door.t * wallLen) - (door.width / 2) - (terminalStartThick / 2))
                            const d2Val = Math.max(0, forward.addedLen + ((1 - door.t) * wallLen) - (door.width / 2) - (terminalEndThick / 2))
                            const d1 = d1Val.toFixed(1).replace('.', ',')
                            const d2 = d2Val.toFixed(1).replace('.', ',')

                            const isSelected = selectedElement?.id === door.id && selectedElement?.type === "door"

                            // Posiciones locales centradas en los huecos de pared a los lados de la puerta
                            // Important: these are used for label placement, we adjust them to reflect the total chain gap
                            const gap1CenterLocalX = (-(back.addedLen + door.t * wallLen) - door.width / 2) / 2
                            const gap2CenterLocalX = ((forward.addedLen + (1 - door.t) * wallLen) + door.width / 2) / 2

                            return (
                                <Group
                                    key={door.id}
                                    name={`door-${door.id}`}
                                    x={pos.x} y={pos.y}
                                    rotation={wallAngle}
                                    draggable={activeTool === "select" && !isCeramicEraserActive}
                                    onClick={(e) => { 
                                        if (activeTool === "select" && !isCeramicEraserActive) {
                                            e.cancelBubble = true; 
                                            onSelectElement({ type: "door", id: door.id }) 
                                        }
                                    }}
                                    onTap={(e) => { 
                                        if (activeTool === "select" && !isCeramicEraserActive) {
                                            e.cancelBubble = true; 
                                            onSelectElement({ type: "door", id: door.id }) 
                                        }
                                    }}
                                    onDragStart={(e) => {
                                        if (activeTool !== "select" || isCeramicEraserActive) {
                                            e.target.stopDrag();
                                            return;
                                        }
                                        onSelectElement({ type: "door", id: door.id })
                                        const stage = e.target.getStage()
                                        const sp = stage?.getPointerPosition()
                                        if (sp) {
                                            if (((e.evt as any).pointerType === 'touch' || forceTouchOffset) && touchOffset) sp.y -= touchOffset;
                                            // Manual transform to account for zoom/pan
                                            const cursorPos = {
                                                x: (sp.x - offset.x) / zoom,
                                                y: (sp.y - offset.y) / zoom
                                            }
                                            // Store offset: Vector from Cursor to Element Center
                                            dragOffsetRef.current = {
                                                x: pos.x - cursorPos.x,
                                                y: pos.y - cursorPos.y
                                            }
                                        }
                                    }}
                                    onDragMove={(e) => {
                                        if (wasPinching.current) return
                                        const stage = e.target.getStage()
                                        if (!stage || !dragOffsetRef.current) return

                                        const sp = stage.getPointerPosition()
                                        if (!sp) return
                                        if (((e.evt as any).pointerType === 'touch' || forceTouchOffset) && touchOffset) sp.y -= touchOffset;

                                        // Manual transform to account for zoom/pan
                                        const cursorPos = {
                                            x: (sp.x - offset.x) / zoom,
                                            y: (sp.y - offset.y) / zoom
                                        }

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
                                        onDragEnd()
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
                                    {(door.openType === "sliding_rail" || door.openType === "sliding") && (
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
                                    {door.openType === "sliding_pocket" && (
                                        <Group listening={false}>
                                            {/* Pocket panel (inside the wall) */}
                                            <Rect
                                                width={door.width}
                                                height={wall.thickness - 4}
                                                x={-door.width / 2}
                                                y={-(wall.thickness - 4) / 2}
                                                fill={isSelected ? "#e0f2fe" : "#ffffff"}
                                                stroke={isSelected ? "#0ea5e9" : "#334155"}
                                                strokeWidth={1}
                                                cornerRadius={1}
                                            />
                                            {/* Indicators that it's a sliding door inside the wall */}
                                            <Line
                                                points={[-door.width / 2 + 5, -wall.thickness / 4, -door.width / 2 + 5, wall.thickness / 4]}
                                                stroke={isSelected ? "#0ea5e9" : "#334155"}
                                                strokeWidth={2}
                                            />
                                            <Line
                                                points={[door.width / 2 - 5, -wall.thickness / 4, door.width / 2 - 5, wall.thickness / 4]}
                                                stroke={isSelected ? "#0ea5e9" : "#334155"}
                                                strokeWidth={2}
                                            />
                                        </Group>
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

                            // --- CHAIN MEASUREMENT LOGIC ---
                            // Find the true visible terminals of the wall chain to jump over invisible dividers
                            const dx = wall.end.x - wall.start.x
                            const dy = wall.end.y - wall.start.y
                            const centerLength = Math.max(0.1, Math.sqrt(dx * dx + dy * dy))
                            const nx_local = -dy / centerLength
                            const ny_local = dx / centerLength
                            const midP = { x: (wall.start.x + wall.end.x) / 2, y: (wall.start.y + wall.end.y) / 2 }
                            // Determine if we are measuring on an interior-pointing face for proper terminal traversal
                            const testP = { x: midP.x + nx_local * (wall.thickness / 2 + 10), y: midP.y + ny_local * (wall.thickness / 2 + 10) }
                            const interiorRoomId = rooms.find(r => isPointInPolygon(testP, r.polygon))?.id
                            const faceNormal = { x: nx_local, y: ny_local }

                            const chainIds = new Set([wall.id])
                            const back = findTerminal(wall, wall.start, chainIds, faceNormal, interiorRoomId)
                            const forward = findTerminal(wall, wall.end, chainIds, faceNormal, interiorRoomId)

                            // Helper to get connected wall thickness at a vertex (IGNORING INVISIBLE WALLS)
                            const getNeighborThickness = (p: { x: number, y: number }, wallId: string) => {
                                const neighbor = walls.find(w => w.id !== wallId && !w.isInvisible && (
                                    (Math.abs(w.start.x - p.x) < 1 && Math.abs(w.start.y - p.y) < 1) ||
                                    (Math.abs(w.end.x - p.x) < 1 && Math.abs(w.end.y - p.y) < 1)
                                ))
                                return neighbor ? neighbor.thickness : 0
                            }

                            const terminalStartThick = getNeighborThickness(back.terminal, back.terminalWallId)
                            const terminalEndThick = getNeighborThickness(forward.terminal, forward.terminalWallId)

                            // Calculate distances relative to the full chain
                            const d1Val = Math.max(0, back.addedLen + (window.t * wallLen) - (window.width / 2) - (terminalStartThick / 2))
                            const d2Val = Math.max(0, forward.addedLen + ((1 - window.t) * wallLen) - (window.width / 2) - (terminalEndThick / 2))
                            const d1 = d1Val.toFixed(1).replace('.', ',')
                            const d2 = d2Val.toFixed(1).replace('.', ',')

                            const isSelected = selectedElement?.id === window.id && selectedElement?.type === "window"

                            // Posiciones locales centradas en los huecos de pared a los lados de la ventana
                            const gap1CenterLocalX = (-(back.addedLen + window.t * wallLen) - window.width / 2) / 2
                            const gap2CenterLocalX = ((forward.addedLen + (1 - window.t) * wallLen) + window.width / 2) / 2

                            return (
                                <Group
                                    key={window.id}
                                    name={`window-${window.id}`}
                                    x={pos.x} y={pos.y}
                                    rotation={wallAngle}
                                    draggable={activeTool === "select" && !isCeramicEraserActive}
                                    onClick={(e) => { 
                                        if (activeTool === "select" && !isCeramicEraserActive) {
                                            e.cancelBubble = true; 
                                            onSelectElement({ type: "window", id: window.id }) 
                                        }
                                    }}
                                    onTap={(e) => { 
                                        if (activeTool === "select" && !isCeramicEraserActive) {
                                            e.cancelBubble = true; 
                                            onSelectElement({ type: "window", id: window.id }) 
                                        }
                                    }}
                                    onDragStart={(e) => {
                                        if (activeTool !== "select" || isCeramicEraserActive) {
                                            e.target.stopDrag();
                                            return;
                                        }
                                        onSelectElement({ type: "window", id: window.id })
                                        const stage = e.target.getStage()
                                        const sp = stage?.getPointerPosition()
                                        if (sp) {
                                            if (((e.evt as any).pointerType === 'touch' || forceTouchOffset) && touchOffset) sp.y -= touchOffset;
                                            // Manual transform to account for zoom/pan
                                            const cursorPos = {
                                                x: (sp.x - offset.x) / zoom,
                                                y: (sp.y - offset.y) / zoom
                                            }
                                            dragOffsetRef.current = {
                                                x: pos.x - cursorPos.x,
                                                y: pos.y - cursorPos.y
                                            }
                                        }
                                    }}
                                    onDragMove={(e) => {
                                        if (wasPinching.current) return
                                        const stage = e.target.getStage()
                                        if (!stage || !dragOffsetRef.current) return

                                        const sp = stage.getPointerPosition()
                                        if (!sp) return
                                        if (((e.evt as any).pointerType === 'touch' || forceTouchOffset) && touchOffset) sp.y -= touchOffset;

                                        // Manual transform to account for zoom/pan
                                        const cursorPos = {
                                            x: (sp.x - offset.x) / zoom,
                                            y: (sp.y - offset.y) / zoom
                                        }

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
                                        onDragEnd()
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
                                    {window.openType === "balcony" ? (
                                        // Balcony Door (Narrower angle, specific color)
                                        <KonvaArc
                                            x={window.flipX ? window.width / 2 : -window.width / 2}
                                            y={window.flipY ? (wall.thickness + 4) / 2 : -(wall.thickness + 4) / 2}
                                            innerRadius={0}
                                            outerRadius={window.width}
                                            angle={60} // Narrower angle for balcony
                                            rotation={window.flipY ? (window.flipX ? 120 : 0) : (window.flipX ? 180 : -60)}
                                            stroke={isSelected ? "#0ea5e9" : "#0891b2"} // Cyan-600 for distinction
                                            strokeWidth={isSelected ? 2 : 1.5}
                                            fill={isSelected ? "#0ea5e920" : "transparent"}
                                            listening={false}
                                        />
                                    ) : (!window.openType || window.openType === "single" || window.openType === "fixed") ? (
                                        // Single Leaf (1 Hoja) or Fixed
                                        <Group>
                                            {/* Glass Line */}
                                            <Line
                                                points={[-window.width / 2, 0, window.width / 2, 0]}
                                                stroke={isSelected ? "#0ea5e9" : "#38bdf8"}
                                                strokeWidth={isSelected ? 2 : 1.5}
                                                listening={false}
                                            />
                                            {/* Opening Arc (only if not fixed type and not isFixed flag) */}
                                            {window.openType !== "fixed" && !window.isFixed && (
                                                <KonvaArc
                                                    x={window.flipX ? window.width / 2 : -window.width / 2}
                                                    y={window.flipY ? (wall.thickness + 4) / 2 : -(wall.thickness + 4) / 2}
                                                    innerRadius={0}
                                                    outerRadius={window.width}
                                                    angle={90}
                                                    rotation={window.flipY ? (window.flipX ? 90 : 0) : (window.flipX ? 180 : -90)}
                                                    stroke={isSelected ? "#0ea5e9" : "#38bdf8"}
                                                    strokeWidth={1}
                                                    dash={[3, 3]}
                                                    listening={false}
                                                />
                                            )}
                                        </Group>
                                    ) : (
                                        // Double Leaf (2 Hojas) - Split Line with Tick AND Arcs
                                        <Group>
                                            <Line
                                                points={[-window.width / 2, 0, window.width / 2, 0]}
                                                stroke={isSelected ? "#0ea5e9" : "#38bdf8"}
                                                strokeWidth={isSelected ? 2 : 1.5}
                                                listening={false}
                                            />
                                            {/* Mid tick */}
                                            <Line
                                                points={[0, -(wall.thickness + 4) / 2, 0, (wall.thickness + 4) / 2]}
                                                stroke={isSelected ? "#0ea5e9" : "#38bdf8"}
                                                strokeWidth={isSelected ? 2 : 1.5}
                                                listening={false}
                                            />
                                            {/* Left Arc */}
                                            <KonvaArc
                                                x={-window.width / 2}
                                                y={window.flipY ? (wall.thickness + 4) / 2 : -(wall.thickness + 4) / 2}
                                                innerRadius={0}
                                                outerRadius={window.width / 2}
                                                angle={45}
                                                rotation={window.flipY ? 0 : -45}
                                                stroke={isSelected ? "#0ea5e9" : "#38bdf8"}
                                                strokeWidth={1}
                                                dash={[3, 3]}
                                                listening={false}
                                            />
                                            {/* Right Arc - Mirrored */}
                                            <KonvaArc
                                                x={window.width / 2}
                                                y={window.flipY ? (wall.thickness + 4) / 2 : -(wall.thickness + 4) / 2}
                                                innerRadius={0}
                                                outerRadius={window.width / 2}
                                                angle={45}
                                                rotation={window.flipY ? 0 + 135 : -45 - 135} // Adjusted for correct sweep direction? No, let's think.
                                            // Left one starts at 0 (if flipY) and updates +45.
                                            // Right one needs to start at 180 and go to 135?
                                            // Actually let's keep it simple.
                                            // Right side opens to the right.
                                            // Center is at window.width/2.
                                            // Arc starts from Left (180deg) relative to center?
                                            // Wait, standard double window opens from center outwards.
                                            // Left leaf opens Left. Right leaf opens Right.
                                            // Left Pivot is at -width/2. Right Pivot is at width/2.
                                            />
                                            <KonvaArc
                                                x={window.width / 2}
                                                y={window.flipY ? (wall.thickness + 4) / 2 : -(wall.thickness + 4) / 2}
                                                innerRadius={0}
                                                outerRadius={window.width / 2}
                                                angle={45}
                                                rotation={window.flipY ? 135 : 180} // Starts at 180 (left) goes down? 
                                                // Math: 0 is Right (East). 90 is Down (South). -90 is Up (North). 180 is Left (West).
                                                // If flipY is false (top), wall is horizontal.
                                                // Inside is DOWN (y increases).
                                                // Left leaf pivot: -w/2. Arc from 0 to 45 (Down-Right).
                                                // Right leaf pivot: w/2. Arc from 180 to 135 (Down-Left).
                                                // If flipY is true (bottom), wall is horizontal.
                                                // Inside is UP (y decreases).
                                                // Left leaf pivot: -w/2. Arc from 0 to -45 (Up-Right).
                                                // Right leaf pivot: w/2. Arc from 180 to 225 (Up-Left).

                                                stroke={isSelected ? "#0ea5e9" : "#38bdf8"}
                                                strokeWidth={1}
                                                dash={[3, 3]}
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
                                onSelect={() => {
                                    if (activeTool === "select" && !isCeramicEraserActive) {
                                        onSelectElement({ type: "shunt", id: shunt.id })
                                    }
                                }}
                                onDragEnd={(id, x, y) => {
                                    onDragElement("shunt", id, { x, y })
                                    onDragEnd()
                                }}
                                showAllQuotes={showAllQuotes}
                                ceramicGridImage={ceramicGridImage}
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

                            // Scale factor: Base 200px -> Scale 1. Range [1.0, 1.3] (Reduced variance for better readability)
                            const scale = Math.max(1.0, Math.min(1.3, minDim / 200))

                            return (
                                <Group
                                    key={`label-${room.id}`}
                                    name="room-label"
                                    x={labelPos.x} y={labelPos.y}
                                    onClick={(e) => { 
                                        if (activeTool === "select" && !isCeramicEraserActive) {
                                            e.cancelBubble = true; 
                                            const stage = e.target.getStage();
                                            const pointer = stage?.getPointerPosition();
                                            if (pointer) {
                                                setRoomMenuClickPos({
                                                    x: (pointer.x - offset.x) / zoom,
                                                    y: (pointer.y - offset.y) / zoom
                                                });
                                            }
                                            onSelectRoom(room.id);
                                        }
                                    }}
                                    onTap={(e) => { 
                                        if (activeTool === "select" && !isCeramicEraserActive) {
                                            e.cancelBubble = true; 
                                            const stage = e.target.getStage();
                                            const pointer = stage?.getPointerPosition();
                                            if (pointer) {
                                                setRoomMenuClickPos({
                                                    x: (pointer.x - offset.x) / zoom,
                                                    y: (pointer.y - offset.y) / zoom
                                                });
                                            }
                                            onSelectRoom(room.id);
                                        }
                                    }}
                                    listening={true}
                                >
                                    {showRoomNames && (
                                        <Text
                                            name="room-label-text"
                                            y={-14 * scale}
                                            text={room.name}
                                            fontSize={18 * scale}
                                            fill="#1e293b"
                                            stroke="#ffffff"
                                            strokeWidth={3 * scale}
                                            fillAfterStrokeEnabled={true}
                                            fontStyle="bold"
                                            align="center"
                                            offsetX={125 * scale}
                                            width={250 * scale}
                                            wrap="none"
                                        />
                                    )}
                                    {showAreas && (
                                        <>
                                            <Text
                                                name="room-label-text"
                                                y={12 * scale}
                                                text={`${room.area.toFixed(2).replace('.', ',')} m²`}
                                                fontSize={14 * scale}
                                                fill="#475569"
                                                stroke="#ffffff"
                                                strokeWidth={3 * scale}
                                                fillAfterStrokeEnabled={true}
                                                fontStyle="bold"
                                                align="center"
                                                offsetX={125 * scale}
                                                width={250 * scale}
                                                wrap="none"
                                            />
                                        </>
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
                        {/* External & Internal Alignment Guides */}
                        {(() => {
                            const isSnappingInhibited = (activeTool === "ceramic" || isCeramicEraserActive)
                            const guides = externalGuides || internalAlignmentGuides
                            if (!guides || isSnappingInhibited) return null
                            return (
                                <Group listening={false}>
                                    {guides.x !== undefined && (
                                        <Line
                                            points={[guides.x, -5000, guides.x, 5000]}
                                            stroke="#0ea5e9"
                                            strokeWidth={1.5 / zoom}
                                            dash={[10, 5]}
                                            opacity={0.8}
                                        />
                                    )}
                                    {guides.y !== undefined && (
                                        <Line
                                            points={[-5000, guides.y, 5000, guides.y]}
                                            stroke="#0ea5e9"
                                            strokeWidth={1.5 / zoom}
                                            dash={[10, 5]}
                                            opacity={0.8}
                                        />
                                    )}
                                </Group>
                            )
                        })()}

                        {/* Indicador visual de Snapping */}
                        {(() => {
                            const p = mousePos
                            if (!p) return null
                            const isWallTool = activeTool === "wall"
                            const isDragging = !!wallSnapshot

                            const isSnappingInhibited = (activeTool === "ceramic" || isCeramicEraserActive)
                            if (isSnappingInhibited || !snappingEnabled || (!isWallTool && !isDragging)) return null

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
                                                    // Manual transform to account for zoom/pan
                                                    dragStartPointerPos.current = {
                                                        x: (pos.x - offset.x) / zoom,
                                                        y: (adjustedY - offset.y) / zoom
                                                    }
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
                                ? (roomMenuClickPos 
                                    ? (roomMenuClickPos.x * zoom + offset.x)
                                    : (calculatePolygonCentroid(selectedRoom.polygon).x * zoom + offset.x))
                                : (selectedElement && currentEPos)
                                    ? currentEPos.x
                                    : (wallMenuClickPos 
                                        ? (wallMenuClickPos.x * zoom + offset.x)
                                        : (uiPos?.x || 0))
                            ) + menuDragOffset.x)),
                            top: Math.max(80, Math.min(window.innerHeight - 80, (selectedRoom
                                ? (roomMenuClickPos
                                    ? (roomMenuClickPos.y * zoom + offset.y - 40)
                                    : (calculatePolygonCentroid(selectedRoom.polygon).y * zoom + offset.y - 40))
                                : (selectedElement && currentEPos)
                                    ? currentEPos.y - 80
                                    : (wallMenuClickPos 
                                        ? (wallMenuClickPos.y * zoom + offset.y - 100)
                                        : (uiPos ? uiPos.y - 100 : 0))
                            ) + menuDragOffset.y)),
                            transform: 'translateX(-50%) translateY(-100%)', // Anchor bottom-center
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(12px)',
                            padding: '2px 4px',
                            borderRadius: '12px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
                            zIndex: 40,
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
                                                icon={<Grid3X3 className="h-3 w-3 text-sky-600" />}
                                                onClick={() => setEditMode("ceramic")}
                                                title="Gestionar Cerámica"
                                            />
                                            <MenuButton
                                                icon={<SeparatorIcon className={`h-6 w-3 ${selectedWall.isInvisible ? 'opacity-100' : 'opacity-60'}`} />}
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
                                                        icon={<ArrowLeftRight className="h-3 w-3" />}
                                                        onClick={() => {
                                                            const el = doors.find(d => d.id === selectedElement.id)
                                                            if (el) {
                                                                const types = ["single", "double", "sliding", "sliding_pocket"] as const
                                                                // @ts-ignore
                                                                const currentIdx = types.indexOf(el.openType || "single")
                                                                const nextType = types[(currentIdx + 1) % types.length]

                                                                let newWidth = el.width || 82
                                                                const isLarge = (t: string) => t === "double" || t === "sliding_pocket"
                                                                const nextIsLarge = isLarge(nextType)
                                                                const currentIsLarge = isLarge(el.openType || "single")

                                                                if (nextIsLarge && !currentIsLarge) {
                                                                    newWidth = (el.width || 82) * 2
                                                                } else if (!nextIsLarge && currentIsLarge) {
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
                                                <>
                                                    <MenuButton
                                                        icon={<FlipHorizontal className="h-3 w-3" />}
                                                        onClick={() => {
                                                            const el = windows.find(w => w.id === selectedElement.id)
                                                            if (el) onUpdateElement("window", el.id, { flipX: !el.flipX })
                                                        }}
                                                    />
                                                    <MenuButton
                                                        icon={<FlipVertical className="h-3 w-3" />}
                                                        onClick={() => {
                                                            const el = windows.find(w => w.id === selectedElement.id)
                                                            if (el) onUpdateElement("window", el.id, { flipY: !el.flipY })
                                                        }}
                                                    />
                                                    <MenuButton
                                                        icon={<ArrowLeftRight className="h-3 w-3" />}
                                                        onClick={() => {
                                                            const el = windows.find(w => w.id === selectedElement.id)
                                                            if (el) {
                                                                const types = ["single", "double", "fixed", "balcony"] as const
                                                                // @ts-ignore
                                                                const currentIdx = types.indexOf(el.openType || "single")
                                                                const nextType = types[(currentIdx + 1) % types.length]

                                                                const updates: any = { openType: nextType, isFixed: nextType === "fixed" }
                                                                if (nextType === "balcony") {
                                                                    updates.width = 82
                                                                    updates.height = 210
                                                                } else if (nextType === "double") {
                                                                    updates.width = 120
                                                                    updates.height = 140
                                                                } else if (nextType === "single" || nextType === "fixed") {
                                                                    // Fallback/standard for simple windows
                                                                    if (!el.width || el.width > 200) updates.width = 60
                                                                    if (!el.height) updates.height = 100
                                                                }

                                                                // @ts-ignore
                                                                onUpdateElement("window", el.id, updates)
                                                            }
                                                        }}
                                                        title="Cambiar tipo de ventana"
                                                    />
                                                </>
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
                                            <MenuButton
                                                icon={<Grid3X3 className={`h-3.5 w-3.5 ${selectedRoom?.hasCeramicFloor ? "text-sky-600" : "text-slate-400"}`} />}
                                                onClick={() => onUpdateRoom(selectedRoomId, { hasCeramicFloor: !selectedRoom?.hasCeramicFloor })}
                                                title="Suelo cerámico"
                                            />
                                            <MenuButton
                                                icon={<SquareDashed className={`h-3.5 w-3.5 ${selectedRoom?.hasCeramicWalls ? "text-sky-600" : "text-slate-400"}`} />}
                                                onClick={() => {
                                                    const newState = !selectedRoom?.hasCeramicWalls;
                                                    onUpdateRoom(selectedRoomId, {
                                                        hasCeramicWalls: newState,
                                                        isGlobalCeramic: newState,
                                                        disabledCeramicWalls: [] // Reset when toggling
                                                    });
                                                    if (!newState) setIsCeramicEraserActive(false);
                                                }}
                                                title="Paredes cerámicas"
                                            />
                                            {selectedRoom?.hasCeramicWalls && (
                                                <MenuButton
                                                    icon={<Eraser className={`h-3.5 w-3.5 ${isCeramicEraserActive ? "text-sky-600" : "text-slate-400"}`} />}
                                                    onClick={() => setIsCeramicEraserActive(!isCeramicEraserActive)}
                                                    title="Goma de borrar cerámica"
                                                />
                                            )}
                                            <div className="w-px h-4 bg-slate-100 mx-0.5" />
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
                                        <>
                                            {selectedElement?.type === "shunt" && (() => {
                                                const shunt = shunts.find(s => s.id === selectedElement.id)
                                                if (!shunt) return null
                                                const inCeramicRoom = rooms.some(r => r.hasCeramicWalls && isPointInPolygon({ x: shunt.x, y: shunt.y }, r.polygon))
                                                if (!inCeramicRoom) return null
                                                return (
                                                    <>
                                                        <MenuButton
                                                            icon={<SquareDashed className={`h-3.5 w-3.5 ${shunt.hasCeramic ? "text-sky-600" : "text-slate-400"}`} />}
                                                            onClick={(e) => {
                                                                // Prevent event propagation to avoid deselecting or other side effects
                                                                if (e && e.stopPropagation) e.stopPropagation();
                                                                onUpdateElement("shunt", shunt.id, { hasCeramic: !shunt.hasCeramic })
                                                            }}
                                                            title={shunt.hasCeramic ? "Quitar alicatado" : "Alicatar columna"}
                                                        />
                                                        <div className="w-px h-4 bg-slate-100 mx-0.5" />
                                                    </>
                                                )
                                            })()}
                                            <MenuButton
                                                icon={<Trash2 className="h-3 w-3" />}
                                                onClick={() => {
                                                    if (selectedWall) onDeleteWall(selectedWall.id)
                                                    else if (selectedElement) onDeleteElement(selectedElement.type, selectedElement.id)
                                                }}
                                                variant="danger"
                                                title="Eliminar"
                                            />
                                        </>
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
                                        title="Cerrar menú"
                                    >
                                        <X className="h-2.5 w-2.5" />
                                    </button>
                                </>
                            ) : editMode === "ceramic" && selectedWall ? (
                                <div className="flex flex-col w-[200px] sm:w-[260px] overflow-hidden">
                                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100/50">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 bg-slate-50 rounded-lg">
                                                <Grid3X3 className="h-3 w-3 text-slate-400" />
                                            </div>
                                            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Cerámica</span>
                                        </div>
                                        <button 
                                            onClick={() => setEditMode("menu")} 
                                            className="p-1 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-all active:scale-95"
                                            title="Cerrar Panel"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row gap-1 p-1 bg-slate-50/20">
                                        {[
                                            { id: 'B' as const, label: 'Naranja' },
                                            { id: 'F' as const, label: 'Azul' }
                                        ].map((side) => {
                                            // Detect if this side is part of any room
                                            const w = selectedWall;
                                            const dx = w.end.x - w.start.x;
                                            const dy = w.end.y - w.start.y;
                                            const len = Math.sqrt(dx*dx + dy*dy);
                                            const nx = -dy / len;
                                            const ny = dx / len;
                                            const sign = side.id === 'F' ? 1 : -1;
                                            const testDist = (w.thickness / 2) + 12;
                                            const testP = { x: (w.start.x + w.end.x)/2 + nx * testDist * sign, y: (w.start.y + w.end.y)/2 + ny * testDist * sign };
                                            const sideRoom = rooms.find(r => isPointInPolygon(testP, r.polygon));
                                            const isExterior = !sideRoom;
                                            const sideColor = side.id === 'F' ? CERAMIC_BLUE : CERAMIC_ORANGE;

                                            // Use the explicit whitelist if available
                                            const isOn = selectedWall.ceramicActiveFaces !== undefined
                                                ? selectedWall.ceramicActiveFaces.includes(side.id)
                                                : !selectedWall.disabledCeramicFaces?.includes(side.id) && (sideRoom?.hasCeramicWalls ?? false);

                                            const heightVal = selectedWall.ceramicHeights?.[side.id];
                                            const heightDisplay = heightVal !== undefined ? `${heightVal} cm` : `${planHeight} cm`;
                                            
                                            return (
                                                <div 
                                                    key={side.id}
                                                    onClick={() => {
                                                        if (isExterior) return;
                                                        
                                                        // Toggle this face in the ceramicActiveFaces whitelist
                                                        const currentActive = selectedWall.ceramicActiveFaces ?? [];
                                                        const nextActive = isOn
                                                            ? currentActive.filter(f => f !== side.id) // Turn OFF
                                                            : [...currentActive, side.id]; // Turn ON
                                                        
                                                        onUpdateWall(selectedWall.id, { ceramicActiveFaces: nextActive });

                                                        // Auto-enable room ceramic flag if activating
                                                        if (!isOn && sideRoom) {
                                                            onUpdateRoom(sideRoom.id, { hasCeramicWalls: true });
                                                        }
                                                    }}
                                                    className={`relative flex-1 flex flex-col items-center gap-1 p-1.5 rounded-lg border-2 transition-all duration-300 ${isExterior ? 'cursor-not-allowed opacity-40 grayscale' : 'cursor-pointer'} ${isOn && !isExterior
                                                        ? `bg-white shadow-sm ring-1 ring-black/[0.02]` 
                                                        : 'border-slate-100 bg-slate-50/50 opacity-60'}`}
                                                    style={{ borderStyle: 'solid', borderColor: (isOn && !isExterior) ? sideColor : 'transparent' }}
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] font-black uppercase tracking-tight" style={{ color: (isOn && !isExterior) ? sideColor : '#94a3b8' }}>
                                                            {side.label}
                                                        </span>
                                                        {isExterior && <span className="text-[7px] text-slate-400 font-bold uppercase">Exterior</span>}
                                                    </div>
                                                    
                                                    <div className={`w-12 py-0.5 rounded-full text-[9px] font-black transition-all shadow-sm text-center ${isOn && !isExterior
                                                            ? 'bg-white border border-slate-100' 
                                                            : 'bg-slate-200 text-slate-500'}`}
                                                        style={{ color: (isOn && !isExterior) ? sideColor : undefined }}
                                                    >
                                                        {(isOn && !isExterior) ? 'ON' : 'OFF'}
                                                    </div>

                                                    {/* Height input — always accessible, but shows placeholder when default */}
                                                    {!isExterior && (
                                                        <div className="w-full mt-1 flex flex-col items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                                                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">Alt. (cm)</span>
                                                            <NumericInput
                                                                isMobile={isMobile}
                                                                value={selectedWall.ceramicHeights?.[side.id]?.toString() || ""}
                                                                placeholder={planHeight.toString().replace('.', ',')}
                                                                style={{ color: isOn ? sideColor : undefined, textAlign: 'center' as any }}
                                                                onEnter={() => {}}
                                                                setter={(val) => {
                                                                    if (isExterior) return;
                                                                    const next = { ...selectedWall.ceramicHeights };
                                                                    if (val === "") delete next[side.id]; else next[side.id] = parseFloat(val.replace(',', '.'));
                                                                    onUpdateWall(selectedWall.id, { ceramicHeights: next });
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
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
                                            {ROOM_TYPES.map(type => (
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
                                                            const interiorRoomId = getRoomIdAt(testP)

                                                            const back = findTerminal(selectedWall, selectedWall.start, chainIds, faceNormal, interiorRoomId)
                                                            const forward = findTerminal(selectedWall, selectedWall.end, chainIds, faceNormal, interiorRoomId)
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
                                                    {Math.abs(selectedWall.start.y - selectedWall.end.y) < 1 ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
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
                                                                const interiorRoomId = getRoomIdAt(testP)

                                                                const back = findTerminal(selectedWall, selectedWall.start, chainIds, faceNormal, interiorRoomId)
                                                                const forward = findTerminal(selectedWall, selectedWall.end, chainIds, faceNormal, interiorRoomId)
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
                                                        const interiorRoomId = getRoomIdAt(testP)

                                                        const back = findTerminal(selectedWall, selectedWall.start, chainIds, faceNormal, interiorRoomId)
                                                        const forward = findTerminal(selectedWall, selectedWall.end, chainIds, faceNormal, interiorRoomId)
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
                                                    {Math.abs(selectedWall.start.y - selectedWall.end.y) < 1 ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
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
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase w-8">
                                                        {selectedElement.type === "window" ? "Alto" : "Alto / Largo"}
                                                    </span>
                                                    <NumericInput
                                                        isMobile={isMobile}
                                                        label={selectedElement.type === "window" ? "Alto" : "Alto / Largo"}
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
                                    const interiorRoomId = getRoomIdAt(testP)

                                    const back = findTerminal(selectedWall, selectedWall.start, chainIds, faceNormal, interiorRoomId)
                                    const forward = findTerminal(selectedWall, selectedWall.end, chainIds, faceNormal, interiorRoomId)
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
