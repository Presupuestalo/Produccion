"use client"
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import dynamic from "next/dynamic"
const CanvasEngine = dynamic(() => import("./CanvasEngine").then((mod) => mod.CanvasEngine), { ssr: false })
import { CanvasEngineRef } from "./CanvasEngine" // Added CanvasEngineRef import
import { Card } from "@/components/ui/card"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { MousePointer2, Pencil, ZoomIn, ZoomOut, Maximize, Maximize2, Sparkles, Save, Undo2, Redo2, DoorClosed, Layout, Trash2, ImagePlus, Sliders, Move, Magnet, Ruler, Building2, ArrowLeft, RotateCcw, RotateCw, FileText, ClipboardList, Spline, Menu, Square } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { FloorPlanSummary } from "./FloorPlanSummary"
import { WallProperties } from "./WallProperties"
import { ElementProperties } from "./ElementProperties"
import { MobileOrientationGuard } from "./MobileOrientationGuard"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { detectRoomsGeometrically, fragmentWalls, getClosestPointOnSegment, isPointOnSegment, isSamePoint, cleanupAndMergeWalls, calculateBoundingBox, rotatePoint, generateArcPoints } from "@/lib/utils/geometry"

interface Point { x: number; y: number }
interface Wall { id: string; start: Point; end: Point; thickness: number; isInvisible?: boolean }
interface Room { id: string; name: string; polygon: Point[]; area: number; color: string; visualCenter?: Point }
interface Door { id: string; wallId: string; t: number; width: number; flipX?: boolean; flipY?: boolean; openType?: "single" | "double" | "sliding" }
interface Window { id: string; wallId: string; t: number; width: number; height: number; flipY?: boolean }
interface Shunt { id: string; x: number; y: number; width: number; height: number; rotation: number }

export const EditorContainer = forwardRef((props: any, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const editorWrapperRef = useRef<HTMLDivElement>(null)
    const canvasEngineRef = useRef<CanvasEngineRef>(null)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const [zoom, setZoom] = useState(1)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const router = useRouter()

    // Feature Flags
    const { isFeatureEnabled } = useFeatureFlags()

    const [walls, setWalls] = useState<Wall[]>(props.initialData?.walls || [])
    const [rooms, setRooms] = useState<Room[]>(props.initialData?.rooms || [])
    const [currentWall, setCurrentWall] = useState<{ start: Point; end: Point } | null>(null)
    const [hoveredWallId, setHoveredWallId] = useState<string | null>(null)
    const [doors, setDoors] = useState<Door[]>(props.initialData?.doors || [])
    const [windows, setWindows] = useState<Window[]>(props.initialData?.windows || [])
    const [selectedElement, setSelectedElement] = useState<{ type: "door" | "window" | "shunt", id: string } | null>(null)
    const [shunts, setShunts] = useState<Shunt[]>(props.initialData?.shunts || [])
    const [activeTool, _setActiveTool] = useState<"select" | "wall" | "door" | "window" | "ruler" | "arc" | "shunt">("wall")
    // ... (rest of state)
    const [gridRotation, setGridRotation] = useState<number>(props.initialData?.gridRotation || 0)

    // Arc Tool State
    const [arcCreationStep, setArcCreationStep] = useState<"start" | "end" | "depth">("start")
    const [phantomArc, setPhantomArc] = useState<{ start: Point, end: Point, depth: number } | undefined>(undefined)

    // Wrapper to ensure clean state transitions
    const setActiveTool = (tool: "select" | "wall" | "door" | "window" | "ruler" | "arc") => {
        _setActiveTool(tool)
        setCurrentWall(null)
        setRulerState({ active: false, start: null, end: null })
        setSelectedWallIds([]) // Clear selection when switching tools
        setPhantomArc(undefined)
        setArcCreationStep("start")
        setSelectedRoomId(null)
        setSelectedElement(null)
    }
    const [selectedWallIds, setSelectedWallIds] = useState<string[]>([])
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
    const [showSummary, setShowSummary] = useState(false)
    const [isSaving, setIsSaving] = useState(false)


    // Historial para deshacer/rehacer
    const [history, setHistory] = useState<any[]>([])
    const historyRef = useRef<any[]>([])
    const [redoHistory, setRedoHistory] = useState<any[]>([])
    const redoHistoryRef = useRef<any[]>([])
    // Snapshots para arrastre suave y rígido
    const [wallSnapshot, setWallSnapshot] = useState<Wall[] | null>(null)
    const wallSnapshotRef = useRef<Wall[] | null>(null)
    const lastRoomDetectionTime = useRef<number>(0)

    // Estado del plano de fondo (Plantilla)
    const [bgImage, setBgImage] = useState<string | null>(props.initialData?.bgConfig?.url || null)
    const [bgConfig, setBgConfig] = useState(props.initialData?.bgConfig || { opacity: 0.5, scale: 1, x: 0, y: 0, rotation: 0 })
    const [isCalibrating, setIsCalibrating] = useState(false)
    const [calibrationPoints, setCalibrationPoints] = useState(props.initialData?.calibration ? { p1: props.initialData.calibration.p1, p2: props.initialData.calibration.p2 } : { p1: { x: 200, y: 200 }, p2: { x: 500, y: 200 } })
    const [calibrationTargetValue, setCalibrationTargetValue] = useState(props.initialData?.calibration?.distance || 500)
    const [snappingEnabled, setSnappingEnabled] = useState(true)
    const [touchOffset, setTouchOffset] = useState(40)
    const [forceTouchOffset, setForceTouchOffset] = useState(false)
    const [rulerState, setRulerState] = useState<{ start: Point | null, end: Point | null, active: boolean }>({ start: null, end: null, active: false })

    const toggleFullscreen = () => {
        if (!editorWrapperRef.current) return

        if (!document.fullscreenElement) {
            editorWrapperRef.current.requestFullscreen().catch((e: any) => console.error(e))
        } else {
            document.exitFullscreen().catch((e: any) => console.error(e))
        }
    }

    useImperativeHandle(ref, () => ({
        clearPlan: executeClearPlan
    }))

    // Limpiar estados al cambiar de herramienta o cancelar
    useEffect(() => {
        setCurrentWall(null)
        setSelectedWallIds([])
        setSelectedRoomId(null)
        setRulerState({ start: null, end: null, active: false })
    }, [activeTool])

    const saveStateToHistory = () => {
        const state = {
            walls: JSON.parse(JSON.stringify(walls)),
            rooms: JSON.parse(JSON.stringify(rooms)),
            doors: JSON.parse(JSON.stringify(doors)),
            windows: JSON.parse(JSON.stringify(windows))
        }
        historyRef.current = [...historyRef.current, state].slice(-20)
        setHistory(historyRef.current)
        // Al hacer una acción nueva, limpiamos el redo
        redoHistoryRef.current = []
        setRedoHistory([])
    }

    const handleUndo = () => {
        if (historyRef.current.length === 0) return

        // Guardar estado actual en Redo antes de volver atrás
        const currentState = {
            walls: JSON.parse(JSON.stringify(walls)),
            rooms: JSON.parse(JSON.stringify(rooms)),
            doors: JSON.parse(JSON.stringify(doors)),
            windows: JSON.parse(JSON.stringify(windows))
        }
        redoHistoryRef.current = [...redoHistoryRef.current, currentState]
        setRedoHistory(redoHistoryRef.current)

        const lastState = historyRef.current[historyRef.current.length - 1]
        const newHistory = historyRef.current.slice(0, -1)

        setWalls(lastState.walls)
        setRooms(lastState.rooms)
        setDoors(lastState.doors)
        setWindows(lastState.windows)

        historyRef.current = newHistory
        setHistory(newHistory)
    }

    const handleRedo = () => {
        if (redoHistoryRef.current.length === 0) return

        const nextState = redoHistoryRef.current[redoHistoryRef.current.length - 1]
        const newRedoHistory = redoHistoryRef.current.slice(0, -1)

        // Guardar estado actual en el historial normal antes de saltar adelante
        const currentState = {
            walls: JSON.parse(JSON.stringify(walls)),
            rooms: JSON.parse(JSON.stringify(rooms)),
            doors: JSON.parse(JSON.stringify(doors)),
            windows: JSON.parse(JSON.stringify(windows))
        }
        historyRef.current = [...historyRef.current, currentState]
        setHistory(historyRef.current)

        setWalls(nextState.walls)
        setRooms(nextState.rooms)
        setDoors(nextState.doors)
        setWindows(nextState.windows)

        redoHistoryRef.current = newRedoHistory
        setRedoHistory(newRedoHistory)
    }

    // Atajos de teclado
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return

            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault()
                if (e.shiftKey) handleRedo()
                else handleUndo()
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault()
                handleRedo()
            }
            if (e.key === 'Escape') {
                setCurrentWall(null)
                setSelectedWallIds([])
                setSelectedRoomId(null)
                setRulerState({ start: null, end: null, active: false })
            }
            if (e.key === '[') {
                handleRotatePlan(-15)
            }
            if (e.key === ']') {
                handleRotatePlan(15)
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedWallIds.length > 0) {
                    selectedWallIds.forEach(id => deleteWall(id))
                } else if (selectedRoomId) {
                    deleteRoom(selectedRoomId)
                } else if (selectedElement) {
                    handleDeleteElement(selectedElement.type, selectedElement.id)
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedWallIds, selectedElement, walls, doors, windows, redoHistory])

    const calculateArea = (points: Point[]) => {
        let total = 0
        for (let i = 0, l = points.length; i < l; i++) {
            const p1 = points[i]
            const p2 = points[(i + 1) % l]
            total += (p1.x * p2.y) - (p2.x * p1.y)
        }
        let area = Math.abs(total) / 2 / (100 * 100) // Area in m²

        // Subtract Shunts inside the room
        const roomPoly = points
        // Helper to check if a point is inside polygon
        const isPointInPoly = (p: Point, poly: Point[]) => {
            let inside = false
            for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                const xi = poly[i].x, yi = poly[i].y
                const xj = poly[j].x, yj = poly[j].y
                const intersect = ((yi > p.y) !== (yj > p.y)) && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi)
                if (intersect) inside = !inside
            }
            return inside
        }



        return Math.max(0, area)
    }

    // Actualizar áreas cuando cambian los shunts
    useEffect(() => {
        if (rooms.length > 0) {
            setRooms(prevRooms => prevRooms.map(r => ({
                ...r,
                area: calculateArea(r.polygon)
            })))
        }
    }, [shunts])

    // Actualizar dimensiones del contenedor
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                })
            }
        }

        updateDimensions()
        window.addEventListener("resize", updateDimensions)
        return () => window.removeEventListener("resize", updateDimensions)
    }, [])

    const handleResetView = () => {
        setZoom(1)
        setOffset({ x: 0, y: 0 })
    }



    const detectAndNameRooms = (newWalls: Wall[], currentRooms: Room[]) => {
        const detected = detectRoomsGeometrically(newWalls, currentRooms)

        // Enhance areas by subtracting shunts
        detected.forEach(r => {
            r.area = calculateArea(r.polygon)
        })

        const usedNames = new Set<string>()
        const finalRooms: Room[] = []
        const pendingRooms: Room[] = []

        // Pass 1: Keep valid names (Custom or unique H#)
        detected.forEach(room => {
            const isCustom = room.name && !/^H\d+$/.test(room.name)

            if (isCustom) {
                // Always keep custom names (e.g. "Cocina", "Salón")
                usedNames.add(room.name)
                finalRooms.push(room)
            } else if (/^H\d+$/.test(room.name) && !usedNames.has(room.name)) {
                // Keep H# if it's unique so far
                usedNames.add(room.name)
                finalRooms.push(room)
            } else {
                // ID collision or empty name -> needs renaming
                pendingRooms.push(room)
            }
        })

        // Pass 2: Rename pending rooms
        pendingRooms.forEach(room => {
            // If it had a custom name but was a duplicate (unlikely for user input), it got here.
            // But mainly for H# duplicates or new rooms.
            let n = 1
            while (usedNames.has(`H${n}`)) {
                n++
            }
            const newName = `H${n}`
            usedNames.add(newName)
            finalRooms.push({ ...room, name: newName })
        })

        // Return combined list (order might change, but that is acceptable)
        return [...finalRooms]
    }

    const deleteRoom = (roomId: string) => {
        const room = rooms.find(r => r.id === roomId)
        if (!room) return

        saveStateToHistory()

        // Find walls that form this room
        const wallsToDelete: string[] = []
        const TOL = 5.0
        const isSame = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL

        walls.forEach(wall => {
            // Check if this wall is part of the room's polygon
            const startInRoom = room.polygon.some(p => isSame(p, wall.start))
            const endInRoom = room.polygon.some(p => isSame(p, wall.end))

            if (startInRoom && endInRoom) {
                // IT IS part of the room, but is it SHARED?
                // Check if this wall is also part of ANY OTHER room
                const isShared = rooms.some(otherRoom => {
                    if (otherRoom.id === roomId) return false
                    const startInOther = otherRoom.polygon.some(p => isSame(p, wall.start))
                    const endInOther = otherRoom.polygon.some(p => isSame(p, wall.end))
                    return startInOther && endInOther
                })

                if (!isShared) {
                    wallsToDelete.push(wall.id)
                }
            }
        })

        // Batch delete
        const newWalls = walls.filter(w => !wallsToDelete.includes(w.id))
        setWalls(newWalls)
        setSelectedWallIds([])
        setSelectedRoomId(null)
        setRooms(detectAndNameRooms(newWalls, rooms.filter(r => r.id !== roomId)))
        setDoors(prev => prev.filter(d => !wallsToDelete.includes(d.wallId)))
        setWindows(prev => prev.filter(w => !wallsToDelete.includes(w.wallId)))

        if (selectedElement && ((selectedElement.type === "door" && doors.find(d => d.id === selectedElement.id && wallsToDelete.includes(d.wallId))) ||
            (selectedElement.type === "window" && windows.find(w => w.id === selectedElement.id && wallsToDelete.includes(w.wallId))))) {
            setSelectedElement(null)
        }
    }

    const cloneRoom = (roomId: string) => {
        if (!isFeatureEnabled("ADVANCED_EDITOR")) return

        const room = rooms.find(r => r.id === roomId)
        if (!room) return

        saveStateToHistory()

        // Find walls that form this room
        const TOL = 5.0
        const isSame = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL

        const roomWalls: Wall[] = []
        walls.forEach(wall => {
            const startInRoom = room.polygon.some(p => isSame(p, wall.start))
            const endInRoom = room.polygon.some(p => isSame(p, wall.end))
            if (startInRoom && endInRoom) {
                roomWalls.push(wall)
            }
        })

        if (roomWalls.length === 0) return

        // Calculate offset (room width + gap)
        const xs = room.polygon.map(p => p.x)
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const offsetX = maxX - minX + 50 // room width + 50cm gap

        // Clone walls with offset
        const now = Date.now()
        const wallIdMap = new Map<string, string>()
        const newWalls: Wall[] = roomWalls.map((wall, idx) => {
            const newId = `wall-clone-${now}-${idx}`
            wallIdMap.set(wall.id, newId)
            return {
                ...wall,
                id: newId,
                start: { x: wall.start.x + offsetX, y: wall.start.y },
                end: { x: wall.end.x + offsetX, y: wall.end.y }
            }
        })

        // Clone doors
        const newDoors: Door[] = doors
            .filter(d => wallIdMap.has(d.wallId))
            .map((door, idx) => ({
                ...door,
                id: `door-clone-${now}-${idx}`,
                wallId: wallIdMap.get(door.wallId)!
            }))

        // Clone windows
        const newWindows: Window[] = windows
            .filter(w => wallIdMap.has(w.wallId))
            .map((window, idx) => ({
                ...window,
                id: `window-clone-${now}-${idx}`,
                wallId: wallIdMap.get(window.wallId)!
            }))

        // Update state
        const updatedWalls = [...walls, ...newWalls]
        setWalls(updatedWalls)
        setDoors(prev => [...prev, ...newDoors])
        setWindows(prev => [...prev, ...newWindows])

        // Detect rooms and select the new one
        const updatedRooms = detectAndNameRooms(updatedWalls, rooms)
        setRooms(updatedRooms)

        // Find and select the newly created room (should be the last detected one in the same area)
        const newRoom = updatedRooms.find(r => {
            const roomMinX = Math.min(...r.polygon.map(p => p.x))
            return Math.abs(roomMinX - (minX + offsetX)) < TOL
        })

        if (newRoom) {
            setSelectedRoomId(newRoom.id)
        }
    }

    const deleteWall = (id: string) => {
        saveStateToHistory()
        const newWalls = walls.filter(w => w.id !== id)
        setWalls(newWalls)
        setSelectedWallIds(prev => prev.filter(wid => wid !== id))
        setRooms(detectAndNameRooms(newWalls, rooms))
        setDoors(prev => prev.filter(d => d.wallId !== id))
        setWindows(prev => prev.filter(w => w.wallId !== id))
        if (selectedElement?.type === "door" && doors.find(d => d.id === selectedElement.id)?.wallId === id) setSelectedElement(null)
        if (selectedElement?.type === "window" && windows.find(w => w.id === selectedElement.id)?.wallId === id) setSelectedElement(null)
    }

    const handleDeleteElement = (type: "door" | "window" | "shunt", id: string) => {
        saveStateToHistory()
        if (type === "door") {
            setDoors(prev => prev.filter(d => d.id !== id))
        } else if (type === "window") {
            setWindows(prev => prev.filter(w => w.id !== id))
        } else if (type === "shunt") {
            setShunts(prev => prev.filter(s => s.id !== id))
        }
        if (selectedElement?.id === id && selectedElement.type === type) {
            setSelectedElement(null)
        }
    }

    const handleSplitWall = (id: string, atPoint?: Point) => {
        saveStateToHistory()
        const now = Date.now()
        const p1Id = `wall-${id}-p1-${now}`
        const p2Id = `wall-${id}-p2-${now}`

        setWalls(prev => {
            const wall = prev.find(w => w.id === id)
            if (!wall) return prev
            let splitPoint: Point
            if (atPoint) {
                splitPoint = getClosestPointOnSegment(atPoint, wall.start, wall.end).point
            } else {
                splitPoint = {
                    x: (wall.start.x + wall.end.x) / 2,
                    y: (wall.start.y + wall.end.y) / 2
                }
            }
            const p1: Wall = { ...wall, id: p1Id, end: splitPoint }
            const p2: Wall = { ...wall, id: p2Id, start: splitPoint }
            const newWalls = prev.filter(w => w.id !== id).concat([p1, p2])
            setRooms(detectAndNameRooms(newWalls, rooms))
            return newWalls
        })
        setSelectedWallIds([p1Id])
    }

    const handleUpdateRoom = (id: string, updates: Partial<Room>) => {
        saveStateToHistory()
        setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
    }



    const handleUpdateWallInvisible = (id: string, isInvisible: boolean) => {
        saveStateToHistory()
        setWalls(prev => {
            const next = prev.map(w => w.id === id ? { ...w, isInvisible } : w)
            setRooms(detectAndNameRooms(next, rooms))
            return next
        })
    }

    const handleUpdateWallThickness = (id: string, thickness: number) => {
        saveStateToHistory()
        setWalls(prev => prev.map(w => w.id === id ? { ...w, thickness } : w))
    }

    const handleDragElement = (type: "door" | "window" | "shunt", id: string, pointer: Point) => {
        if (type === "shunt") {
            setShunts(prev => prev.map(s => s.id === id ? { ...s, x: pointer.x, y: pointer.y } : s))
            return
        }

        const closest = findClosestWall(pointer)
        if (!closest || closest.dist > 30) return // Umbral para "saltar" entre muros

        const wall = walls.find(w => w.id === closest.wallId)
        if (!wall) return

        // Lógica de flip dinámico segun lado del muro
        const dx = wall.end.x - wall.start.x
        const dy = wall.end.y - wall.start.y
        const det = (pointer.x - wall.start.x) * dy - (pointer.y - wall.start.y) * dx
        const isFlippedY = det < 0

        if (type === "door") {
            setDoors(prev => prev.map(d => d.id === id ? { ...d, t: closest.t, wallId: closest.wallId, flipY: isFlippedY } : d))
        } else {
            setWindows(prev => prev.map(w => w.id === id ? { ...w, t: closest.t, wallId: closest.wallId, flipY: isFlippedY } : w))
        }
    }

    const handleAddShunt = () => {
        const { center } = calculateBoundingBox(walls, rooms)
        const newShunt: Shunt = {
            id: `shunt-${Date.now()}`,
            x: center.x || 300,
            y: center.y || 300,
            width: 50,
            height: 50,
            rotation: 0
        }
        setShunts(prev => [...prev, newShunt])
        setSelectedElement({ type: "shunt", id: newShunt.id })
    }

    const handleUpdateShunt = (id: string, updates: Partial<Shunt>) => {
        setShunts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
        saveStateToHistory()
    }

    const handleRotatePlan = (angleIncrement: number) => {
        saveStateToHistory()

        // 1. Calcular el centro del plano actual
        const { center } = calculateBoundingBox(walls, rooms)

        // 2. Rotar Muros
        const rotatedWalls = walls.map(w => ({
            ...w,
            start: rotatePoint(w.start, center, angleIncrement),
            end: rotatePoint(w.end, center, angleIncrement)
        }))

        // 3. Rotar Habitaciones
        const rotatedRooms = rooms.map(r => ({
            ...r,
            polygon: r.polygon.map(p => rotatePoint(p, center, angleIncrement)),
            visualCenter: r.visualCenter ? rotatePoint(r.visualCenter, center, angleIncrement) : undefined
        }))

        // 4. Rotar Fondo (si existe)
        // La rotación del fondo es más compleja porque depende de su propio centro y offset.
        // Simplificación: Giramos el background alrededor del centro del plano también.
        // Esto cambia su posición X,Y y su rotación interna.
        let newBgConfig = { ...bgConfig }
        if (bgImage) {
            // Posición actual del centro de la imagen (aproximada)
            // Esto requeriría saber el tamaño original de la imagen, que no tenemos aquí fácil.
            // Asumimos que el usuario ajustará si se descuadra mucho, O rotamos solo la propiedad 'rotation'
            // si la imagen estaba centrada en el mismo sitio.
            // PERO el usuario pidió que gire "todo el plano".
            // Si la imagen rota sobre SU centro, y el plano sobre OTRO centro, se desalinean.
            // Lo ideal es rotar la posición (x,y) de la imagen alrededor del centro del plano.

            const bgPos = { x: bgConfig.x, y: bgConfig.y }
            const newBgPos = rotatePoint(bgPos, center, angleIncrement)
            newBgConfig.x = newBgPos.x
            newBgConfig.y = newBgPos.y
            newBgConfig.rotation = (newBgConfig.rotation || 0) + angleIncrement
        }

        setWalls(rotatedWalls)
        setRooms(rotatedRooms)
        setBgConfig(newBgConfig)
        // Grid Rotation can stay 0 or be used for visual alignment independently
    }

    const handleCloneElement = (type: "door" | "window" | "shunt", id: string) => {
        saveStateToHistory()
        if (type === "door") {
            const door = doors.find(d => d.id === id)
            if (door) {
                const newDoor = { ...door, id: `door-${Date.now()}`, t: Math.min(0.9, door.t + 0.1) }
                setDoors([...doors, newDoor])
                setSelectedElement({ type: "door", id: newDoor.id })
            }
        } else if (type === "window") {
            const window = windows.find(w => w.id === id)
            if (window) {
                const newWindow = { ...window, id: `window-${Date.now()}`, t: Math.min(0.9, window.t + 0.1) }
                setWindows([...windows, newWindow])
                setSelectedElement({ type: "window", id: newWindow.id })
            }
        } else if (type === "shunt") {
            const shunt = shunts.find(s => s.id === id)
            if (shunt) {
                const newShunt = { ...shunt, id: `shunt-${Date.now()}`, x: shunt.x + shunt.width + 5, y: shunt.y }
                setShunts([...shunts, newShunt])
                setSelectedElement({ type: "shunt", id: newShunt.id })
            }
        }
    }

    const handleUpdateElement = (type: "door" | "window" | "shunt", id: string, updates: any) => {
        saveStateToHistory()
        if (type === "door") {
            setDoors(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
        } else if (type === "window") {
            setWindows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w))
        } else if (type === "shunt") {
            setShunts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
        }
    }
    const handleDragWall = (id: string, totalDelta: Point) => {
        setWalls(prevWalls => {
            if (!wallSnapshot) return prevWalls
            const wallToMove = wallSnapshot.find(w => w.id === id)
            if (!wallToMove) return prevWalls

            const isH = Math.abs(wallToMove.start.y - wallToMove.end.y) < 15.0
            const isV = Math.abs(wallToMove.start.x - wallToMove.end.x) < 15.0

            const cleanDelta = {
                x: (isV || (!isH && !isV)) ? totalDelta.x : 0,
                y: (isH || (!isH && !isV)) ? totalDelta.y : 0
            }

            let workingWalls = JSON.parse(JSON.stringify(wallSnapshot)) as Wall[]
            const addedJogs: Wall[] = []

            const TOL = 0.5
            const isSame = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL

            // Movemos el muro principal
            const wTarget = workingWalls.find(w => w.id === id)!
            wTarget.start.x += cleanDelta.x; wTarget.start.y += cleanDelta.y
            wTarget.end.x += cleanDelta.x; wTarget.end.y += cleanDelta.y

            // Procesamos el resto de muros
            workingWalls.forEach(w => {
                if (w.id === id) return
                const isWH = Math.abs(w.start.y - w.end.y) < 25.0
                const isWV = Math.abs(w.start.x - w.end.x) < 25.0

                // Conexiones al INICIO del muro arrastrado
                if (isSame(w.start, wallToMove.start)) {
                    // Check if NOT parallel/collinear - if so, we simply move the vertex (Stretch)
                    if (!((isV && isWV) || (isH && isWH))) {
                        w.start.x += cleanDelta.x; w.start.y += cleanDelta.y
                    } else {
                        // If they ARE parallel/collinear, we add a Jog to maintain connection
                        addedJogs.push({ id: `jog-s-${id}-${w.id}`, start: { ...w.start }, end: { ...wTarget.start }, thickness: wTarget.thickness })
                    }
                } else if (isSame(w.end, wallToMove.start)) {
                    if (!((isV && isWV) || (isH && isWH))) {
                        w.end.x += cleanDelta.x; w.end.y += cleanDelta.y
                    } else {
                        addedJogs.push({ id: `jog-e-${id}-${w.id}`, start: { ...w.end }, end: { ...wTarget.start }, thickness: wTarget.thickness })
                    }
                }

                // Conexiones al FINAL del muro arrastrado
                if (isSame(w.start, wallToMove.end)) {
                    if (!((isV && isWV) || (isH && isWH))) {
                        w.start.x += cleanDelta.x; w.start.y += cleanDelta.y
                    } else {
                        addedJogs.push({ id: `jog-fs-${id}-${w.id}`, start: { ...w.start }, end: { ...wTarget.end }, thickness: wTarget.thickness })
                    }
                } else if (isSame(w.end, wallToMove.end)) {
                    if (!((isV && isWV) || (isH && isWH))) {
                        w.end.x += cleanDelta.x; w.end.y += cleanDelta.y
                    } else {
                        addedJogs.push({ id: `jog-fe-${id}-${w.id}`, start: { ...w.end }, end: { ...wTarget.end }, thickness: wTarget.thickness })
                    }
                }
            })
            const nextWalls = workingWalls.concat(addedJogs)
            setRooms(detectRoomsGeometrically(nextWalls, rooms))
            return nextWalls
        })
    }

    const handleDragVertex = (originalPoint: Point, totalDelta: Point, activeIds?: string[]) => {
        const SNAP_THRESHOLD = 10 // Increased for more intuitive snapping behavior
        let snapshot = wallSnapshotRef.current
        // If snapshot doesn't exist (edge case), create it now to prevent blocking movement
        if (!snapshot) {
            console.warn('⚠️ Snapshot missing during drag - creating emergency snapshot')
            snapshot = JSON.parse(JSON.stringify(walls))
            wallSnapshotRef.current = snapshot
        }

        // Type guard: ensure snapshot is not null
        if (!snapshot) {
            console.error('❌ Failed to create snapshot - aborting drag')
            return
        }

        console.log('🔍 handleDragVertex called', {
            originalPoint,
            totalDelta,
            activeIds,
            snapshotLength: snapshot.length
        })

        // Unwrapped setWalls to prevent nested update loop
        {
            // Use standard tolerance for identifying which vertices move together
            const TOL = 0.5
            const isSame = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL
            const idsToMove = activeIds || (selectedWallIds.length > 0 ? selectedWallIds : (hoveredWallId ? [hoveredWallId] : []))
            const idsToMoveSet = new Set(idsToMove)

            // 1. Calculate TARGET position (snapped or raw)
            let tx = originalPoint.x + totalDelta.x
            let ty = originalPoint.y + totalDelta.y

            // Apply snapping immediately - NO BREAKOUT
            if (snappingEnabled) {
                let vertexSnapped = false

                // CRITICAL FIX: Identify points to IGNORE during snap
                // These are the "other ends" of walls we are currently moving. 
                // Snapping to them would collapse the wall to length 0.
                const ignoredSnapPoints: Point[] = []
                for (const id of idsToMove) {
                    const w = snapshot.find(sw => sw.id === id)
                    if (w) {
                        const isStartToCheck = isSame(w.start, originalPoint)
                        const isEndToCheck = isSame(w.end, originalPoint)
                        // Only ignore if we are definitely moving one end
                        if (isStartToCheck) ignoredSnapPoints.push(w.end)
                        else if (isEndToCheck) ignoredSnapPoints.push(w.start)
                    }
                }

                for (const w of snapshot) {
                    if (idsToMoveSet.has(w.id)) continue

                    for (const p of [w.start, w.end]) {
                        // Skip if this point is one of our own "anchors"
                        if (ignoredSnapPoints.some(ip => isSame(ip, p))) continue

                        const d = Math.sqrt(Math.pow(p.x - tx, 2) + Math.pow(p.y - ty, 2))
                        if (d < SNAP_THRESHOLD) {
                            tx = p.x; ty = p.y
                            vertexSnapped = true
                            break
                        }
                    }
                    if (vertexSnapped) break
                }

                // Imanes de ejes (ortogonalidad) - only apply if not snapped to vertex
                if (!vertexSnapped) {
                    for (const id of idsToMove) {
                        const w = snapshot.find(sw => sw.id === id)
                        if (!w) continue
                        const fixedP = isSame(w.start, originalPoint) ? w.end : w.start

                        // Slightly increased axis snap threshold for easier alignment
                        const AXIS_SNAP = 2.5

                        if (Math.abs(tx - fixedP.x) < AXIS_SNAP) tx = fixedP.x
                        if (Math.abs(ty - fixedP.y) < AXIS_SNAP) ty = fixedP.y
                    }
                }
            }

            // NO REDONDEAR AQUÍ. Dejamos que el movimiento sea sub-pixel para máxima fluidez.
            // El redondeo se hace al soltar (handleDragEnd).

            // 2. Build new walls ENTIRELY from snapshot to prevent coordinate drift during drag
            const workingWalls = snapshot.map(snapW => {
                if (!idsToMoveSet.has(snapW.id)) {
                    // Wall not being moved - return it from prevWalls to preserve any other changes
                    // Wall not being moved - return it from walls state to preserve any other changes
                    return walls.find(w => w.id === snapW.id) || snapW
                }

                // Wall IS being moved - create new wall from snapshot coords
                const newW = { ...snapW, start: { ...snapW.start }, end: { ...snapW.end } }

                if (isSame(snapW.start, originalPoint)) {
                    newW.start.x = tx; newW.start.y = ty
                }
                if (isSame(snapW.end, originalPoint)) {
                    newW.end.x = tx; newW.end.y = ty
                }
                return newW
            })

            // Throttled room detection
            const now = Date.now()
            if (now - lastRoomDetectionTime.current > 100) {
                setRooms(detectAndNameRooms(workingWalls, rooms))
                lastRoomDetectionTime.current = now
            }

            setWalls(workingWalls)
        }
    }

    const handleDragEnd = () => {
        setWallSnapshot(null)
        setWalls(prev => {
            const processed = prev.map(w => ({
                ...w,
                id: w.id.startsWith('jog-') ? `w-${Math.random().toString(36).substr(2, 9)}` : w.id,
                start: { x: Math.round(w.start.x * 10) / 10, y: Math.round(w.start.y * 10) / 10 },
                end: { x: Math.round(w.end.x * 10) / 10, y: Math.round(w.end.y * 10) / 10 }
            }))
            const splitResult = fragmentWalls(processed)

            // Re-vincular puertas y ventanas
            setDoors(prevDoors => prevDoors.map(door => {
                const oldWall = processed.find(w => w.id === door.wallId)
                if (!oldWall) return door
                const p = {
                    x: oldWall.start.x + door.t * (oldWall.end.x - oldWall.start.x),
                    y: oldWall.start.y + door.t * (oldWall.end.y - oldWall.start.y)
                }
                const bestWall = splitResult.find(nw => isPointOnSegment(p, nw.start, nw.end, 2.0))
                if (bestWall) {
                    const dx = bestWall.end.x - bestWall.start.x
                    const dy = bestWall.end.y - bestWall.start.y
                    const lenSq = dx * dx + dy * dy
                    const t = lenSq === 0 ? 0 : ((p.x - bestWall.start.x) * dx + (p.y - bestWall.start.y) * dy) / lenSq
                    return { ...door, wallId: bestWall.id, t: Math.max(0, Math.min(1, t)) }
                }
                return door
            }))

            setWindows(prevWindows => prevWindows.map(win => {
                const oldWall = processed.find(w => w.id === win.wallId)
                if (!oldWall) return win
                const p = {
                    x: oldWall.start.x + win.t * (oldWall.end.x - oldWall.start.x),
                    y: oldWall.start.y + win.t * (oldWall.end.y - oldWall.start.y)
                }
                const bestWall = splitResult.find(nw => isPointOnSegment(p, nw.start, nw.end, 2.0))
                if (bestWall) {
                    const dx = bestWall.end.x - bestWall.start.x
                    const dy = bestWall.end.y - bestWall.start.y
                    const lenSq = dx * dx + dy * dy
                    const t = lenSq === 0 ? 0 : ((p.x - bestWall.start.x) * dx + (p.y - bestWall.start.y) * dy) / lenSq
                    return { ...win, wallId: bestWall.id, t: Math.max(0, Math.min(1, t)) }
                }
                return win
            }))

            setSelectedWallIds(swIds => swIds.map(oldId => {
                const found = splitResult.find(nw => nw.id === oldId || nw.id === `${oldId}-s0`)
                return found ? found.id : oldId
            }).filter(id => splitResult.some(nw => nw.id === id)))

            setRooms(detectRoomsGeometrically(splitResult, rooms))
            return splitResult
        })
        saveStateToHistory()
    }

    const applyPerimeterThickness = () => {
        saveStateToHistory()
        setWalls(prevWalls => {
            const fragmented = fragmentWalls(prevWalls)
            const detectedRooms = detectRoomsGeometrically(fragmented)

            const updatedWalls = fragmented.map(w => {
                let count = 0
                for (const room of detectedRooms) {
                    for (let i = 0; i < room.polygon.length; i++) {
                        const p1 = room.polygon[i]
                        const p2 = room.polygon[(i + 1) % room.polygon.length]
                        if ((isSamePoint(w.start, p1) && isSamePoint(w.end, p2)) ||
                            (isSamePoint(w.start, p2) && isSamePoint(w.end, p1))) {
                            count++
                        }
                    }
                }

                if (count === 1) {
                    return { ...w, thickness: 20 }
                }
                return w
            })

            return cleanupAndMergeWalls(updatedWalls)
        })
    }

    const handleUpdateWallLength = (id: string, newLength: number, side: "left" | "right", faceNormal?: Point) => {
        saveStateToHistory()
        setWalls(prevWalls => {
            const wall = prevWalls.find(w => w.id === id)
            if (!wall) return prevWalls

            const isHorizontal = Math.abs(wall.start.y - wall.end.y) < 1.0
            const isVertical = Math.abs(wall.start.x - wall.end.x) < 1.0

            let startIsMin = isHorizontal ? (wall.start.x < wall.end.x) : (wall.start.y < wall.end.y)
            let anchorEnd = (side === "left" ? (startIsMin ? "end" : "start") : (startIsMin ? "start" : "end"))
            let movingEnd = (side === "left" ? (startIsMin ? "start" : "end") : (startIsMin ? "end" : "start"))

            const anchorPoint = { x: Math.round((anchorEnd === "start" ? wall.start.x : wall.end.x) * 10) / 10, y: Math.round((anchorEnd === "start" ? wall.start.y : wall.end.y) * 10) / 10 }
            const movingPoint = { x: Math.round((movingEnd === "start" ? wall.start.x : wall.end.x) * 10) / 10, y: Math.round((movingEnd === "start" ? wall.start.y : wall.end.y) * 10) / 10 }

            const dx = wall.end.x - wall.start.x
            const dy = wall.end.y - wall.start.y
            const currentLength = Math.sqrt(dx * dx + dy * dy)
            if (currentLength === 0) return prevWalls

            let ux = dx / currentLength
            let uy = dy / currentLength

            if (isHorizontal) { ux = Math.sign(dx) || 1; uy = 0 }
            else if (isVertical) { ux = 0; uy = Math.sign(dy) || 1 }

            const newPos = {
                x: Math.round((anchorPoint.x + ux * newLength * (movingEnd === "start" ? -1 : 1)) * 10) / 10,
                y: Math.round((anchorPoint.y + uy * newLength * (movingEnd === "start" ? -1 : 1)) * 10) / 10
            }

            const delta = { x: newPos.x - movingPoint.x, y: newPos.y - movingPoint.y }

            let workingWalls = JSON.parse(JSON.stringify(prevWalls)) as Wall[]
            workingWalls.forEach(w => {
                w.start.x = Math.round(w.start.x * 10) / 10; w.start.y = Math.round(w.start.y * 10) / 10
                w.end.x = Math.round(w.end.x * 10) / 10; w.end.y = Math.round(w.end.y * 10) / 10
            })

            const TOL = 1.0
            const isSame = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL
            const processedWalls = new Set<string>([id])
            const snapshotWalls = JSON.parse(JSON.stringify(workingWalls)) as Wall[]

            const recursiveMove = (currOldP: Point, currDelta: Point, currNextP: Point) => {
                workingWalls.forEach(w => {
                    if (processedWalls.has(w.id)) return
                    const snapW = snapshotWalls.find(sw => sw.id === w.id)!
                    let sharedVertex: "start" | "end" | null = null
                    if (isSame(snapW.start, currOldP)) sharedVertex = "start"
                    else if (isSame(snapW.end, currOldP)) sharedVertex = "end"

                    if (sharedVertex) {
                        const otherVertex: "start" | "end" = sharedVertex === "start" ? "end" : "start"
                        const wallVec = { x: snapW.end.x - snapW.start.x, y: snapW.end.y - snapW.start.y }
                        const wallLen = Math.sqrt(wallVec.x * wallVec.x + wallVec.y * wallVec.y)
                        const dLen = Math.sqrt(currDelta.x * currDelta.x + currDelta.y * currDelta.y)

                        // FIX: In a length modification, PERPENDICULAR walls should SLIDE to maintain angles.
                        // PARALLEL and slanted walls should STRETCH to absorb the length change (and stop recursion).
                        const dot = wallLen > 0 && dLen > 0 ? Math.abs(wallVec.x * currDelta.x + wallVec.y * currDelta.y) / (wallLen * dLen) : 1
                        const isPerpendicular = dot < 0.1

                        let shouldSlide = isPerpendicular
                        if (faceNormal) {
                            const vToOther = { x: snapW[otherVertex].x - snapW[sharedVertex].x, y: snapW[otherVertex].y - snapW[sharedVertex].y }
                            const normLen = Math.sqrt(faceNormal.x * faceNormal.x + faceNormal.y * faceNormal.y) || 1
                            const dirDot = (vToOther.x * faceNormal.x + vToOther.y * faceNormal.y) / (wallLen * normLen)

                            // DECISIVE FIX: If the wall points TOWARDS the neighbor (away from edited face),
                            // we DO NOT move it at all. Not even stretch. This prevents slanting.
                            // fragmentWalls will automatically handle the T-junction split later.
                            if (dirDot < -0.1) {
                                processedWalls.add(w.id)
                                return
                            }

                            if (isPerpendicular && dirDot < 0.1) {
                                shouldSlide = false // Neutral perpendicular walls (rare) should stretch
                            }
                        }

                        if (shouldSlide) {
                            // SLIDE side walls - preserves angle and rectangularity
                            w.start.x += currDelta.x; w.start.y += currDelta.y
                            w.end.x += currDelta.x; w.end.y += currDelta.y
                            processedWalls.add(w.id)

                            // Recurse from the OTHER end to push parallel walls
                            const newOtherP = { x: w[otherVertex].x, y: w[otherVertex].y }
                            const oldOtherP = { x: snapW[otherVertex].x, y: snapW[otherVertex].y }
                            recursiveMove(oldOtherP, currDelta, newOtherP)
                        } else {
                            // STRETCH parallel or slanted walls (changes their length, stops recursion)
                            if (sharedVertex === "start") { w.start.x = currNextP.x; w.start.y = currNextP.y }
                            else { w.end.x = currNextP.x; w.end.y = currNextP.y }
                            processedWalls.add(w.id)
                        }
                    }
                })
            }

            const mainW = workingWalls.find(w => w.id === id)!
            if (movingEnd === "start") { mainW.start.x = newPos.x; mainW.start.y = newPos.y }
            else { mainW.end.x = newPos.x; mainW.end.y = newPos.y }

            recursiveMove(movingPoint, delta, newPos)

            const splitResult = fragmentWalls(workingWalls)

            setSelectedWallIds(prevS => prevS.map(oldId => {
                const found = splitResult.find(nw => nw.id === oldId || nw.id === `${oldId}-s0`)
                return found ? found.id : oldId
            }).filter(id => splitResult.some(nw => nw.id === id)))

            setDoors(prevDoors => prevDoors.map(door => {
                const oldWall = workingWalls.find(w => w.id === door.wallId)
                if (!oldWall) return door
                const p = {
                    x: oldWall.start.x + door.t * (oldWall.end.x - oldWall.start.x),
                    y: oldWall.start.y + door.t * (oldWall.end.y - oldWall.start.y)
                }
                const bestWall = splitResult.find(nw => isPointOnSegment(p, nw.start, nw.end, 2.0))
                if (bestWall) {
                    const dx = bestWall.end.x - bestWall.start.x
                    const dy = bestWall.end.y - bestWall.start.y
                    const lenSq = dx * dx + dy * dy
                    const t = lenSq === 0 ? 0 : ((p.x - bestWall.start.x) * dx + (p.y - bestWall.start.y) * dy) / lenSq
                    return { ...door, wallId: bestWall.id, t: Math.round(Math.max(0, Math.min(1, t)) * 1000) / 1000 }
                }
                return door
            }))

            setWindows(prevWindows => prevWindows.map(win => {
                const oldWall = workingWalls.find(w => w.id === win.wallId)
                if (!oldWall) return win
                const p = {
                    x: oldWall.start.x + win.t * (oldWall.end.x - oldWall.start.x),
                    y: oldWall.start.y + win.t * (oldWall.end.y - oldWall.start.y)
                }
                const bestWall = splitResult.find(nw => isPointOnSegment(p, nw.start, nw.end, 2.0))
                if (bestWall) {
                    const dx = bestWall.end.x - bestWall.start.x
                    const dy = bestWall.end.y - bestWall.start.y
                    const lenSq = dx * dx + dy * dy
                    const t = lenSq === 0 ? 0 : ((p.x - bestWall.start.x) * dx + (p.y - bestWall.start.y) * dy) / lenSq
                    return { ...win, wallId: bestWall.id, t: Math.round(Math.max(0, Math.min(1, t)) * 1000) / 1000 }
                }
                return win
            }))

            setRooms(detectRoomsGeometrically(splitResult, rooms))
            return splitResult
        })
    }

    const findClosestWall = (p: Point): { wallId: string, t: number, dist: number } | null => {
        let best: { wallId: string, t: number, dist: number } | null = null
        let minDist = Infinity

        walls.forEach(w => {
            const { point: snapPoint, t } = getClosestPointOnSegment(p, w.start, w.end)
            const dist = Math.sqrt(Math.pow(p.x - snapPoint.x, 2) + Math.pow(p.y - snapPoint.y, 2))
            if (dist < minDist) {
                minDist = dist
                best = { wallId: w.id, t, dist }
            }
        })
        return best
    }

    const executeClearPlan = () => {
        saveStateToHistory()
        setWalls([])
        setRooms([])
        setDoors([])
        setWindows([])
        setSelectedWallIds([])
        setSelectedRoomId(null)
        setSelectedElement(null)
        setCurrentWall(null)
        setRulerState({ start: null, end: null, active: false })
        setBgImage(null)
        setIsCalibrating(false)
        setShunts([])
        setActiveTool("select") // Security: Reset tool to avoid accidental drawing
    }

    const handleMouseDown = (point: Point) => {
        if (isCalibrating) return
        switch (activeTool) {

            case "wall":
                if (currentWall) {
                    const dist = Math.sqrt(Math.pow(point.x - currentWall.start.x, 2) + Math.pow(point.y - currentWall.start.y, 2))
                    if (dist > 5) {
                        saveStateToHistory()
                        const newWall = {
                            id: `wall-${Date.now()}`,
                            start: currentWall.start,
                            end: point,
                            thickness: 10
                        }

                        // Check for overlapping invisible walls and remove them
                        const TOL = 5.0
                        const isSame = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL

                        const filteredWalls = walls.filter(w => {
                            if (!w.isInvisible) return true
                            // If invisible, check if it is "covered" by the new wall
                            // Simple check: start and end match (in either direction)
                            // Or generally strictly collinear and congruent?
                            // Let's assume user draws exactly over it snapping to vertices.
                            const match1 = isSame(w.start, newWall.start) && isSame(w.end, newWall.end)
                            const match2 = isSame(w.start, newWall.end) && isSame(w.end, newWall.start)
                            return !(match1 || match2)
                        })

                        const newWalls = fragmentWalls([...filteredWalls, newWall])
                        setWalls(newWalls)
                        const nextRooms = detectRoomsGeometrically(newWalls, rooms)
                        setRooms(nextRooms)

                        if (nextRooms.length > rooms.length) {
                            setCurrentWall(null)
                        } else {
                            setCurrentWall({ start: point, end: point })
                        }
                    }
                } else {
                    setCurrentWall({ start: point, end: point })
                }
                break

            case "door": {
                const closest = findClosestWall(point)
                if (closest && closest.dist < 15) {
                    saveStateToHistory()
                    const newId = `door-${Date.now()}`
                    setDoors([...doors, {
                        id: newId,
                        wallId: closest.wallId,
                        t: closest.t,
                        width: 82,
                        flipX: false,
                        flipY: false
                    }])
                    setActiveTool("select")
                    setSelectedElement({ type: "door", id: newId })
                }
                break
            }

            case "window": {
                const closest = findClosestWall(point)
                if (closest && closest.dist < 15) {
                    saveStateToHistory()
                    const newId = `window-${Date.now()}`
                    setWindows([...windows, {
                        id: newId,
                        wallId: closest.wallId,
                        t: closest.t,
                        width: 100,
                        height: 100,
                        flipY: false
                    }])
                    setActiveTool("select")
                    setSelectedElement({ type: "window", id: newId })
                }
                break
            }

            case "shunt": {
                saveStateToHistory()
                const newId = `shunt-${Date.now()}`
                setShunts([...shunts, {
                    id: newId,
                    x: point.x,
                    y: point.y,
                    width: 30,
                    height: 30,
                    rotation: 0
                }])
                setActiveTool("select")
                setSelectedElement({ type: "shunt", id: newId })
                break
            }


            case "ruler":
                setRulerState({ start: point, end: point, active: true })
                break

            case "arc":
                // console.log("Arc Tool MouseDown. Step:", arcCreationStep)
                if (arcCreationStep === "start") {
                    setPhantomArc({ start: point, end: point, depth: 0 })
                    setArcCreationStep("end")
                } else if (arcCreationStep === "end") {
                    // Start dragging depth
                    if (phantomArc) {
                        setPhantomArc({ ...phantomArc, end: point })
                        setArcCreationStep("depth")
                    } else {
                        // Should not happen, reset
                        setArcCreationStep("start")
                    }
                } else if (arcCreationStep === "depth") {
                    // Confirm Arc
                    if (phantomArc) {
                        saveStateToHistory()
                        const points = generateArcPoints(phantomArc.start, phantomArc.end, phantomArc.depth)
                        // Convert points to walls
                        const newWalls: Wall[] = []
                        const now = Date.now()
                        for (let i = 0; i < points.length - 1; i++) {
                            newWalls.push({
                                id: `wall-arc-${now}-${i}`,
                                start: points[i],
                                end: points[i + 1],
                                thickness: 10
                            })
                        }

                        const mergedWalls = fragmentWalls([...walls, ...newWalls])
                        setWalls(mergedWalls)
                        setRooms(detectAndNameRooms(mergedWalls, rooms))

                        // Finish and switch to select tool
                        setActiveTool("select")
                    }
                }
                break
        }
    }

    const handleApplyCalibration = () => {
        const dx = calibrationPoints.p2.x - calibrationPoints.p1.x
        const dy = calibrationPoints.p2.y - calibrationPoints.p1.y
        const pixelDist = Math.sqrt(dx * dx + dy * dy)
        if (pixelDist > 0) {
            const newScale = (calibrationTargetValue / pixelDist) * bgConfig.scale
            setBgConfig((prev: any) => ({ ...prev, scale: newScale }))
            setIsCalibrating(false)
        }
    }

    const handleImportImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                setBgImage(event.target?.result as string)
            }
            reader.readAsDataURL(file)

            // Attempt to restore fullscreen immediately after file selection (browsers often exit fullscreen on file picker)
            setTimeout(() => {
                if (!document.fullscreenElement && editorWrapperRef.current) {
                    editorWrapperRef.current.requestFullscreen().catch(err => {
                        console.warn("Could not auto-restore fullscreen:", err)
                    })
                }
            }, 100)
        }
    }

    const handleMouseMove = (point: Point) => {
        if (isCalibrating) return
        if (activeTool === "wall" && currentWall) {
            setCurrentWall({ ...currentWall, end: point })
        }
        if (activeTool === "ruler" && rulerState.active) {
            setRulerState(prev => ({ ...prev, end: point }))
        }
        if (activeTool === "arc" && phantomArc) {
            // console.log("Arc Move. Step:", arcCreationStep) 
            if (arcCreationStep === "end") {
                setPhantomArc({ ...phantomArc, end: point })
            } else if (arcCreationStep === "depth") {
                // Calculate distance from chord to point
                // Project point onto line defined by start-end to get base
                // Depth is distance from base to point. 
                // Sign matters! We use cross product to determine sign relative to chord direction
                const dx = phantomArc.end.x - phantomArc.start.x
                const dy = phantomArc.end.y - phantomArc.start.y
                const len = Math.sqrt(dx * dx + dy * dy)
                if (len > 0.1) {
                    // Signed height logic
                    const cross = (point.x - phantomArc.start.x) * dy - (point.y - phantomArc.start.y) * dx
                    // depth = cross / len. 
                    // Cross product gives area of parallelogram. area / base = height.
                    // This naturally gives signed depth!
                    // But our generate function in geometry assumes specific depth logic? 
                    // Let's check: generate function uses depth to add vector * perp.
                    // perp = (-dy, dx). 
                    // So we need depth such that Mid + depth * perp = Peak.
                    // Let's rely on visual feedback.
                    // If cross > 0, point is to the ... left? 
                    // perp is rotated 90 deg CCW? (-dy, dx) is 90 deg CCW.
                    // (1,0) -> (0,1). Cross ((0,1) with (1,0)) is -1. 
                    // Anyway, -cross/len seems correct-ish or cross/len. 
                    // User sees the phantom arc, so as long as it tracks the mouse, it's fine.
                    // If visual guide is inverted, flip sign here.

                    const depth = -cross / len
                    setPhantomArc({ ...phantomArc, depth })
                }
            }
        }
    }

    const handleMouseUp = (point: Point) => {
        if (isCalibrating) return
        if (activeTool === "wall" && currentWall) {
            const dist = Math.sqrt(Math.pow(point.x - currentWall.start.x, 2) + Math.pow(point.y - currentWall.start.y, 2))
            if (dist > 5) {
                saveStateToHistory()
                const newWall = {
                    id: `wall-${Date.now()}`,
                    start: currentWall.start,
                    end: point,
                    thickness: 10
                }
                const newWalls = fragmentWalls([...walls, newWall])
                setWalls(newWalls)
                const nextRooms = detectRoomsGeometrically(newWalls, rooms)
                setRooms(nextRooms)

                // Si se ha cerrado una habitación (figura completa), detener el encadenamiento
                if (nextRooms.length > rooms.length) {
                    setCurrentWall(null)
                } else {
                    // MODO ENCADENADO: No hacemos null a currentWall, sino que el punto final es el nuevo inicio
                    setCurrentWall({ start: point, end: point })
                }
            }
        }
        if (activeTool === "ruler" && rulerState.active) {
            setRulerState(prev => ({ ...prev, end: point, active: false }))
        }
    }







    const handleSave = async () => {
        setIsSaving(true)
        try {
            const dataToSave = {
                walls,
                doors,
                windows,
                rooms,
                bgConfig,
                gridRotation,
                calibration: {
                    p1: calibrationPoints.p1,
                    p2: calibrationPoints.p2,
                    distance: calibrationTargetValue
                },
                shunts
            }

            if (props.onSave) {
                // Use the Exposed Snapshot method from CanvasEngine
                console.log("DEBUG: EditorContainer handleSave. Ref:", !!canvasEngineRef.current)
                const imageUrl = canvasEngineRef.current?.getSnapshot() || ""
                console.log("DEBUG: Got snapshot len:", imageUrl.length)
                await props.onSave(dataToSave, imageUrl)
            } else {
                // Legacy API call
                const response = await fetch("/api/editor-planos/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: "Plano Editor V2",
                        ...dataToSave
                    }),
                })

                if (response.ok) {
                    const data = await response.json()
                    console.log("[v0] Plano guardado con ID:", data.id)
                } else {
                    console.error("[v0] Error al guardar plano:", await response.text())
                }
            }
        } catch (error) {
            console.error("[v0] Excepción al guardar:", error)
        } finally {
            setIsSaving(false)
        }
    }


    // Mobile/Responsive States
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const checkMobile = () => {
            // Broaden check to include landscape phones and tablets
            // Also check for touch capability
            const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)
            setIsMobile(window.innerWidth <= 1100 || isTouch)
        }
        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    const handleBack = (e: React.MouseEvent) => {
        // If there are changes in history, warn the user
        if (history.length > 0) {
            e.preventDefault()
            const confirmLeave = window.confirm("Tienes cambios sin guardar. ¿Seguro que quieres salir sin guardar?")
            if (confirmLeave) {
                router.push("/dashboard/editor-planos")
            }
        } else {
            router.push("/dashboard/editor-planos")
        }
    }

    // Fullscreen auto-management on orientation change
    useEffect(() => {
        if (!isMobile) return

        const handleRotation = () => {
            const isLandscape = window.innerWidth > window.innerHeight
            if (isLandscape && !document.fullscreenElement) {
                // Try auto-trigger
                toggleFullscreen()
            }
        }

        window.addEventListener("resize", handleRotation)
        return () => window.removeEventListener("resize", handleRotation)

    }, [isMobile])

    // Keyboard support for moving shunts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only active if a Shunt is selected
            if (!selectedElement || selectedElement.type !== "shunt") return

            // Allow typing in inputs without triggering this (though likely no inputs focused when selecting shunt on canvas)
            if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return

            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault() // Prevent scrolling

                const shunt = shunts.find(s => s.id === selectedElement.id)
                if (!shunt) return

                const step = e.ctrlKey ? 10 : 1 // Ctrl: 10px, else 1px
                let { x, y } = shunt

                switch (e.key) {
                    case "ArrowUp": y -= step; break;
                    case "ArrowDown": y += step; break;
                    case "ArrowLeft": x -= step; break;
                    case "ArrowRight": x += step; break;
                }

                // Use direct update to avoid stale state issues in this closure if possible, 
                // but handleUpdateShunt uses functional update internally so it is safe.
                handleUpdateShunt(shunt.id, { x, y })
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [selectedElement, shunts]) // Re-bind when shunts change to get latest positions

    return (
        <div ref={editorWrapperRef} className="flex flex-col h-full bg-slate-50 p-2 gap-2 relative overflow-hidden">
            <style jsx global>{`
                :fullscreen {
                    background: #f8fafc !important; /* slate-50 */
                    padding: 0 !important;
                    margin: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    display: flex !important;
                    flex-direction: column !important;
                }
                :fullscreen > .p-2 { 
                    padding: 0.5rem !important; /* Keep toolbar padding if needed or adjust */
                }
            `}</style>
            <MobileOrientationGuard onEnterFullscreen={toggleFullscreen} />

            {/* Prompt for fullscreen if in landscape but not active (Mobile only) */}
            {isMobile && !document.fullscreenElement && window.innerWidth > window.innerHeight && (
                <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <Card className="p-6 max-w-sm w-full space-y-4 text-center">
                        <div className="flex justify-center">
                            <Maximize2 className="h-12 w-12 text-blue-500 animate-pulse" />
                        </div>
                        <h3 className="text-lg font-bold">Modo Editor Pantalla Completa</h3>
                        <p className="text-sm text-slate-500">Para una mejor experiencia y ocultar las barras del navegador, activa la pantalla completa.</p>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg" onClick={toggleFullscreen}>
                            Entrar en Pantalla Completa
                        </Button>
                    </Card>
                </div>
            )}
            {/* Toolbar */}
            <Card className="p-2 flex flex-nowrap items-center justify-between bg-white/95 backdrop-blur-md border-slate-200 shadow-sm z-20 gap-x-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full pb-1 md:pb-0 h-9">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-9 h-9 text-slate-500 hover:text-slate-900"
                        title="Volver"
                        onClick={handleBack}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="w-px h-6 bg-slate-200 mx-1 flex-shrink-0" />

                    {/* Primary Tools */}
                    {[
                        { id: "select", icon: MousePointer2, title: "Seleccionar (S)" },
                        { id: "wall", icon: Pencil, title: "Muro (W)" },
                        // ...(isFeatureEnabled("ADVANCED_EDITOR") ? [{ id: "arc", icon: Spline, title: "Arco" }] : []),
                        { id: "arc", icon: Spline, title: "Arco" },
                        { id: "door", icon: DoorClosed, title: "Puerta (D)" },
                        { id: "window", icon: Layout, title: "Ventana (V)" },
                        { id: "shunt", icon: Square, title: "Columna" },
                        { id: "ruler", icon: Ruler, title: "Regla (M)" },
                    ].map((tool) => (
                        <Button
                            key={tool.id}
                            variant={activeTool === tool.id ? "default" : "ghost"}
                            size="icon"
                            onClick={() => setActiveTool(tool.id as any)}
                            title={tool.title}
                            className="flex-shrink-0 w-9 h-9"
                        >
                            <tool.icon className="h-4 w-4" />
                        </Button>
                    ))}

                    <div className="w-px h-6 bg-slate-200 mx-1 flex-shrink-0" />

                    {/* Mobile Menu for Interaction Settings (Visible) */}
                    {isMobile && (
                        <div>
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="w-9 h-9 text-orange-600">
                                        <Sliders className="h-4 w-4" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[40vh]" container={editorWrapperRef.current}>
                                    <SheetHeader>
                                        <SheetTitle>Ajustes de Interacción</SheetTitle>
                                    </SheetHeader>
                                    <div className="space-y-6 py-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label className="text-base">Forzar Offset Táctil</Label>
                                                <p className="text-sm text-slate-500">Aplica el desplazamiento siempre (útil si falla la detección).</p>
                                            </div>
                                            <Switch
                                                checked={forceTouchOffset}
                                                onCheckedChange={setForceTouchOffset}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <Label className="text-base">Separación del Dedo: {touchOffset}px</Label>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="150"
                                                step="5"
                                                value={touchOffset}
                                                onChange={(e) => setTouchOffset(parseInt(e.target.value))}
                                                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                                            />
                                            <div className="flex justify-between text-xs text-slate-400">
                                                <span>Mínimo (0)</span>
                                                <span>Máximo (150)</span>
                                            </div>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    )}

                    {/* Mobile Menu for Secondary Actions */}
                    {isMobile && (
                        <div>
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="w-9 h-9">
                                        <Menu className="h-4 w-4" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[50vh]" container={editorWrapperRef.current}>
                                    <SheetHeader>
                                        <SheetTitle>Herramientas y Acciones</SheetTitle>
                                    </SheetHeader>
                                    <div className="grid grid-cols-4 gap-4 py-4">
                                        <Button variant="outline" className="flex flex-col gap-2 h-20" onClick={handleUndo} disabled={history.length === 0}>
                                            <Undo2 className="h-5 w-5" />
                                            <span className="text-xs">Deshacer</span>
                                        </Button>
                                        <Button variant="outline" className="flex flex-col gap-2 h-20" onClick={handleRedo} disabled={redoHistory.length === 0}>
                                            <Redo2 className="h-5 w-5" />
                                            <span className="text-xs">Rehacer</span>
                                        </Button>
                                        <Button variant="outline" className="flex flex-col gap-2 h-20" onClick={() => handleRotatePlan(-15)}>
                                            <RotateCcw className="h-5 w-5" />
                                            <span className="text-xs">Rotar -15</span>
                                        </Button>
                                        <Button variant="outline" className="flex flex-col gap-2 h-20" onClick={() => handleRotatePlan(15)}>
                                            <RotateCw className="h-5 w-5" />
                                            <span className="text-xs">Rotar +15</span>
                                        </Button>
                                        <Button variant="outline" className="flex flex-col gap-2 h-20" onClick={applyPerimeterThickness}>
                                            <Building2 className="h-5 w-5" />
                                            <span className="text-xs">Fachada</span>
                                        </Button>
                                        <Button variant="outline" className="flex flex-col gap-2 h-20" onClick={() => setSnappingEnabled(!snappingEnabled)}>
                                            <Magnet className={`h-5 w-5 ${!snappingEnabled ? 'text-slate-400' : 'text-blue-500'}`} />
                                            <span className="text-xs">Imanes</span>
                                        </Button>
                                        <Button variant="outline" className="flex flex-col gap-2 h-20 border-red-200 text-red-600" onClick={executeClearPlan}>
                                            <Trash2 className="h-5 w-5" />
                                            <span className="text-xs">Limpiar</span>
                                        </Button>
                                        <Button variant="outline" className="flex flex-col gap-2 h-20" onClick={toggleFullscreen}>
                                            <Maximize2 className="h-5 w-5" />
                                            <span className="text-xs">Pantalla</span>
                                        </Button>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    )}

                    {/* Desktop Secondary Actions (Hidden on Mobile) */}
                    <div className="hidden md:flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => document.getElementById('bg-import')?.click()}>
                            <ImagePlus className="h-4 w-4" />
                        </Button>
                        <input type="file" id="bg-import" className="hidden" accept="image/*" onChange={handleImportImage} />

                        <Button variant="ghost" size="icon" onClick={handleUndo} disabled={history.length === 0}><Undo2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={handleRedo} disabled={redoHistory.length === 0}><Redo2 className="h-4 w-4" /></Button>

                        <div className="w-px h-6 bg-slate-200 mx-1" />

                        <Button variant="ghost" size="icon" onClick={() => handleRotatePlan(-15)}><RotateCcw className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleRotatePlan(15)}><RotateCw className="h-4 w-4" /></Button>
                        <Button variant={snappingEnabled ? "default" : "ghost"} size="icon" onClick={() => setSnappingEnabled(!snappingEnabled)}>
                            <Magnet className="h-4 w-4" />
                        </Button>

                        <div className="w-px h-6 bg-slate-200 mx-1" />

                        <Button variant="ghost" size="icon" onClick={applyPerimeterThickness} className="text-orange-600 hover:bg-orange-50"><Building2 className="h-4 w-4" /></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Limpiar todo el plano?</AlertDialogTitle>
                                    <AlertDialogDescription>Esta acción no se puede deshacer fácilmente.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={executeClearPlan} className="bg-red-600">Limpiar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
                                <FileText className="h-4 w-4" />
                                <span className="text-xs">Resumen</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="overflow-y-auto w-[400px] sm:w-[540px]" container={editorWrapperRef.current}>
                            <SheetHeader className="mb-4">
                                <SheetTitle>Resumen del Plano</SheetTitle>
                            </SheetHeader>
                            <FloorPlanSummary
                                walls={walls}
                                doors={doors}
                                windows={windows}
                                rooms={rooms}
                            />
                        </SheetContent>
                    </Sheet>
                    <div className="w-px h-6 bg-slate-200 mx-1" />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden sm:inline-flex"
                        onClick={() => {
                            if (!document.fullscreenElement) {
                                editorWrapperRef.current?.requestFullscreen().catch((e: any) => console.error(e))
                            } else {
                                document.exitFullscreen().catch((e: any) => console.error(e))
                            }
                        }}
                    >
                        <Maximize2 className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 h-8 px-3 text-xs md:text-sm"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "..." : "Guardar"}
                        {!isSaving && <Save className="h-3 w-3 ml-1 md:ml-2" />}
                    </Button>
                </div>
            </Card>

            <div ref={containerRef} className="flex-1 relative border-t border-slate-200 overflow-hidden bg-slate-50">
                <CanvasEngine
                    onReady={(api) => { canvasEngineRef.current = api }}
                    width={dimensions.width}
                    height={dimensions.height}
                    zoom={zoom}
                    offset={offset}
                    walls={walls}
                    rooms={rooms}
                    doors={doors}
                    windows={windows}
                    currentWall={currentWall}
                    rulerPoints={rulerState.active || (rulerState.start && rulerState.end) ? { start: rulerState.start!, end: rulerState.end! } : null}
                    activeTool={activeTool}
                    hoveredWallId={hoveredWallId}
                    selectedWallIds={selectedWallIds}
                    onPan={(x: number, y: number) => setOffset({ x, y })}
                    onZoom={setZoom}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onHoverWall={setHoveredWallId}
                    onSelectWall={(id: string | null, isMultiSelect: boolean = false) => {
                        // Only select if not dragging tool
                        if (!id) {
                            setSelectedWallIds([])
                            return
                        }
                        if (isMultiSelect) {
                            setSelectedWallIds(prev => prev.includes(id) ? prev.filter(wid => wid !== id) : [...prev, id])
                        } else {
                            setSelectedWallIds([id])
                        }
                        setSelectedRoomId(null)
                        setSelectedElement(null)
                    }}
                    onDragWall={(id: string, totalDelta: Point) => handleDragWall(id, totalDelta)}
                    onDragEnd={handleDragEnd}
                    onUpdateWallLength={handleUpdateWallLength}
                    onDeleteWall={deleteWall}
                    onSplitWall={handleSplitWall}
                    onUpdateWallThickness={handleUpdateWallThickness}
                    onUpdateWallInvisible={handleUpdateWallInvisible}
                    onUpdateRoom={handleUpdateRoom}
                    onDeleteRoom={deleteRoom}
                    onCloneRoom={cloneRoom}
                    selectedRoomId={selectedRoomId}
                    snappingEnabled={activeTool === "ruler" ? false : snappingEnabled}
                    isAdvancedEnabled={isFeatureEnabled("ADVANCED_EDITOR")}
                    gridRotation={gridRotation}
                    onRotateGrid={setGridRotation}
                    onSelectRoom={(id: string | null) => {
                        setSelectedRoomId(id)
                        if (id) { setSelectedWallIds([]); setSelectedElement(null) }
                    }}
                    onDragVertex={handleDragVertex}
                    wallSnapshot={wallSnapshot}
                    bgImage={bgImage}
                    bgConfig={bgConfig}
                    onUpdateBgConfig={(updates: any) => setBgConfig(prev => ({ ...prev, ...updates }))}
                    isCalibrating={isCalibrating}
                    calibrationPoints={calibrationPoints}
                    calibrationTargetValue={calibrationTargetValue}
                    onUpdateCalibrationPoint={(id: "p1" | "p2", p: Point) => setCalibrationPoints(prev => ({ ...prev, [id]: p }))}
                    onStartDragWall={() => {
                        saveStateToHistory()
                        const snapshot = JSON.parse(JSON.stringify(walls))
                        setWallSnapshot(snapshot)
                        wallSnapshotRef.current = snapshot
                    }}
                    onDragElement={handleDragElement}
                    selectedElement={selectedElement}
                    onSelectElement={(el) => {
                        setSelectedElement(el)
                        if (el) { setSelectedWallIds([]); setSelectedRoomId(null) }
                    }}
                    onUpdateElement={handleUpdateElement}
                    onCloneElement={handleCloneElement}
                    onDeleteElement={handleDeleteElement}
                    phantomArc={phantomArc}
                    touchOffset={touchOffset}
                    forceTouchOffset={forceTouchOffset}
                    shunts={shunts}
                    onUpdateShunt={handleUpdateShunt}
                />



                {bgImage && (
                    <div className="absolute top-4 right-4 p-4 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl w-72 animate-in fade-in slide-in-from-right-4 hidden md:block">
                        {/* Desktop BG Config - Keep existing logic here if needed, or move to Menu */}
                        {/* For brevity, I'm hiding it on mobile and keeping the desktop generic one, 
                             but ideally this should also be adaptable. 
                             For now, let's keep it simple as user asked for Toolbar and Selection Properties.
                         */}
                    </div>
                )}

                {/* Properties Panel for Selected Element */}
                {selectedElement && (
                    <div className="absolute top-20 right-4 z-30">
                        {(() => {
                            if (selectedElement.type === "door") {
                                const door = doors.find(d => d.id === selectedElement.id)
                                if (!door) return null
                                return (
                                    <ElementProperties
                                        elementId={door.id}
                                        type="door"
                                        width={door.width}
                                        onUpdateWidth={(id, w) => handleUpdateElement("door", id, { width: w })}
                                        onDelete={(id) => handleDeleteElement("door", id)}
                                        onClose={() => setSelectedElement(null)}
                                    />
                                )
                            } else if (selectedElement.type === "window") {
                                const win = windows.find(w => w.id === selectedElement.id)
                                if (!win) return null
                                return (
                                    <ElementProperties
                                        elementId={win.id}
                                        type="window"
                                        width={win.width}
                                        height={win.height}
                                        onUpdateWidth={(id, w) => handleUpdateElement("window", id, { width: w })}
                                        onUpdateHeight={(id, h) => handleUpdateElement("window", id, { height: h })}
                                        onDelete={(id) => handleDeleteElement("window", id)}
                                        onClose={() => setSelectedElement(null)}
                                    />
                                )
                            } else if (selectedElement.type === "shunt") {
                                const shunt = shunts.find(s => s.id === selectedElement.id)
                                if (!shunt) return null
                                return (
                                    <ElementProperties
                                        elementId={shunt.id}
                                        type="shunt"
                                        width={shunt.width}
                                        height={shunt.height}
                                        onUpdateWidth={(id, w) => handleUpdateElement("shunt", id, { width: w })}
                                        onUpdateHeight={(id, h) => handleUpdateElement("shunt", id, { height: h })}
                                        onClone={(id) => handleCloneElement("shunt", id)}
                                        onDelete={(id) => handleDeleteElement("shunt", id)}
                                        onClose={() => setSelectedElement(null)}
                                    />
                                )
                            }
                            return null
                        })()}
                    </div>
                )}
            </div>

            {/* Global Toaster Portal for Fullscreen */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none">
                {/* Toaster should be mounted at root normally, but for fullscreen api 
                    we might need a specific container inside the fullscreen wrapper. 
                    However, radix-ui toast usually portals to body. 
                    If fullscreen is on 'editorWrapperRef', only children are visible. 
                    So we might need to portal toasts INTO here or allow Toast to assume z-index.
                    Radix Toaster usually handles this, but let's check.
                */}
            </div>

        </div >
    )
})

EditorContainer.displayName = "EditorContainer"
