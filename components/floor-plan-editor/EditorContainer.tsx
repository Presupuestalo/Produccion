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
import { MousePointer2, Pencil, ZoomIn, ZoomOut, Maximize, Maximize2, Minimize2, Sparkles, Save, Undo2, Redo2, DoorClosed, Layout, LayoutGrid, Trash2, ImagePlus, Sliders, Move, Magnet, Ruler, Building2, ArrowLeft, RotateCcw, RotateCw, RefreshCw, FileText, ClipboardList, Spline, Menu, Square, ChevronDown, ChevronRight, ChevronLeft, DoorOpen, GalleryVerticalEnd, AppWindow, Columns } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

import { useToast } from "@/hooks/use-toast"
import { ToastProvider } from "@/components/ui/toast-provider"

interface Point { x: number; y: number }
interface Wall { id: string; start: Point; end: Point; thickness: number; isInvisible?: boolean }
interface Room { id: string; name: string; polygon: Point[]; area: number; color: string; visualCenter?: Point }
interface Door { id: string; wallId: string; t: number; width: number; height: number; flipX?: boolean; flipY?: boolean; openType?: "single" | "double" | "sliding" }
interface Window { id: string; wallId: string; t: number; width: number; height: number; flipY?: boolean; openType?: "single" | "double" }
interface Shunt { id: string; x: number; y: number; width: number; height: number; rotation: number }

export const EditorContainer = forwardRef((props: any, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const editorWrapperRef = useRef<HTMLDivElement>(null)
    const [fullscreenContainer, setFullscreenContainer] = useState<HTMLElement | null>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const canvasEngineRef = useRef<CanvasEngineRef>(null)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const [zoom, setZoom] = useState(1)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const router = useRouter()
    const { toast } = useToast()

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
    // Toolbar visibility
    const [isToolbarVisible, setIsToolbarVisible] = useState(true)

    // Toolbar Grouping and Search
    // Rotation/Translation Drag Support
    const [isRotating, setIsRotating] = useState(false)
    const lastRotationX = useRef<number>(0)

    // Arc Tool State
    const [arcCreationStep, setArcCreationStep] = useState<"start" | "end" | "depth">("start")
    const [phantomArc, setPhantomArc] = useState<{ start: Point, end: Point, depth: number } | undefined>(undefined)

    // Wrapper to ensure clean state transitions
    const setActiveTool = (tool: "select" | "wall" | "door" | "window" | "ruler" | "arc" | "shunt") => {
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
    const [showAllQuotes, setShowAllQuotes] = useState(false)


    // Historial para deshacer/rehacer
    const [history, setHistory] = useState<any[]>([])
    const historyRef = useRef<any[]>([])
    const [redoHistory, setRedoHistory] = useState<any[]>([])
    const redoHistoryRef = useRef<any[]>([])
    // Snapshots para arrastre suave y rígido
    const [wallSnapshot, setWallSnapshot] = useState<Wall[] | null>(null)
    const wallSnapshotRef = useRef<Wall[] | null>(null)
    const lastRoomDetectionTime = useRef<number>(0)
    const lastMousePosRef = useRef<Point | null>(null)

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
    const [isDrawMenuOpen, setIsDrawMenuOpen] = useState(false)

    const toggleFullscreen = () => {
        if (!editorWrapperRef.current) return

        if (!document.fullscreenElement) {
            editorWrapperRef.current.requestFullscreen()
                .then(() => setIsFullscreen(true))
                .catch((e: any) => console.error(e))
        } else {
            document.exitFullscreen()
                .then(() => setIsFullscreen(false))
                .catch((e: any) => console.error(e))
        }
    }

    useImperativeHandle(ref, () => ({
        clearPlan: executeClearPlan,
        fullscreenContainer,
        isFullscreen
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
            windows: JSON.parse(JSON.stringify(windows)),
            currentWall: currentWall ? { ...currentWall } : null // Persist drawing state
        }
        historyRef.current = [...historyRef.current, state].slice(-20)
        setHistory(historyRef.current)
        // Al hacer una acción nueva, limpiamos el redo
        redoHistoryRef.current = []
        setRedoHistory([])
    }

    // Cleanup zoom on unmount (Mobile)
    useEffect(() => {
        return () => {
            const viewport = document.querySelector("meta[name=viewport]");
            if (viewport) {
                viewport.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1");
            }
        }
    }, [])

    const handleUndo = () => {
        if (historyRef.current.length === 0) return

        // Guardar estado actual en Redo antes de volver atrás
        const currentState = {
            walls: JSON.parse(JSON.stringify(walls)),
            rooms: JSON.parse(JSON.stringify(rooms)),
            doors: JSON.parse(JSON.stringify(doors)),
            windows: JSON.parse(JSON.stringify(windows)),
            currentWall: currentWall ? { ...currentWall } : null
        }
        redoHistoryRef.current = [...redoHistoryRef.current, currentState]
        setRedoHistory(redoHistoryRef.current)

        const lastState = historyRef.current[historyRef.current.length - 1]
        const newHistory = historyRef.current.slice(0, -1)

        setWalls(lastState.walls)
        setRooms(lastState.rooms)
        setDoors(lastState.doors)
        setWindows(lastState.windows)
        // FIX: Resume drawing from the last vertex if in wall tool, satisfying user request to continue drawing after undo
        if (activeTool === "wall" && lastState.walls.length > 0) {
            const lastWall = lastState.walls[lastState.walls.length - 1]
            setCurrentWall({ start: lastWall.end, end: lastWall.end })
        } else {
            setCurrentWall(null)
        }

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
            windows: JSON.parse(JSON.stringify(windows)),
            currentWall: currentWall ? { ...currentWall } : null
        }
        historyRef.current = [...historyRef.current, currentState]
        setHistory(historyRef.current)

        setWalls(nextState.walls)
        setRooms(nextState.rooms)
        setDoors(nextState.doors)
        setWindows(nextState.windows)

        if (nextState.currentWall) {
            // Set end to start to make it invisible until mouse moves
            setCurrentWall({ ...nextState.currentWall, end: nextState.currentWall.start })
        } else {
            setCurrentWall(null)
        }

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
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                })
            }
        }

        updateDimensions()
        window.addEventListener("resize", updateDimensions)

        // Global mouse/touch handlers for rotation drag
        const handleGlobalMove = (clientX: number) => {
            if (isRotating) {
                const delta = clientX - lastRotationX.current
                if (Math.abs(delta) > 5) {
                    handleRotatePlanInteractive(delta > 0 ? 1 : -1)
                    lastRotationX.current = clientX
                }
            }
        }

        const handleGlobalMouseMove = (e: MouseEvent) => handleGlobalMove(e.clientX)
        const handleGlobalTouchMove = (e: TouchEvent) => handleGlobalMove(e.touches[0].clientX)

        const handleGlobalUp = () => {
            if (isRotating) {
                setIsRotating(false)
                saveStateToHistory() // Save final state after rotation drag ends
                document.body.style.cursor = 'default'
            }
        }

        window.addEventListener("mousemove", handleGlobalMouseMove)
        window.addEventListener("mouseup", handleGlobalUp)
        window.addEventListener("touchmove", handleGlobalTouchMove)
        window.addEventListener("touchend", handleGlobalUp)

        return () => {
            window.removeEventListener("resize", updateDimensions)
            window.removeEventListener("mousemove", handleGlobalMouseMove)
            window.removeEventListener("mouseup", handleGlobalUp)
            window.removeEventListener("touchmove", handleGlobalTouchMove)
            window.removeEventListener("touchend", handleGlobalUp)
        }
    }, [isRotating])

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
        saveStateToHistory()
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
        handleRotatePlanInteractive(angleIncrement)
    }

    const handleRotatePlanInteractive = (angleIncrement: number) => {
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

        // 4. Rotar Shunts
        const rotatedShunts = shunts.map(s => ({
            ...s,
            ...rotatePoint({ x: s.x, y: s.y }, center, angleIncrement),
            rotation: (s.rotation || 0) + angleIncrement
        }))

        // 5. Rotar Fondo (si existe)
        let newBgConfig = { ...bgConfig }
        if (bgImage) {
            const bgPos = { x: bgConfig.x, y: bgConfig.y }
            const newBgPos = rotatePoint(bgPos, center, angleIncrement)
            newBgConfig.x = newBgPos.x
            newBgConfig.y = newBgPos.y
            newBgConfig.rotation = (newBgConfig.rotation || 0) + angleIncrement
        }

        setWalls(rotatedWalls)
        setRooms(rotatedRooms)
        setShunts(rotatedShunts)
        setBgConfig(newBgConfig)
    }

    const handleCloneElement = (type: "door" | "window" | "shunt", id: string) => {
        saveStateToHistory()
        if (type === "door") {
            const door = doors.find(d => d.id === id)
            if (door) {
                const wall = walls.find(w => w.id === door.wallId)
                let increment = 0.1
                if (wall) {
                    const wallLen = Math.sqrt(Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.y - wall.start.y, 2))
                    if (wallLen > 0) increment = (door.width + 10) / wallLen // Width + 10cm gap
                }

                // Try placing to the right (higher t)
                let newT = door.t + increment
                // If runs off the end, try to the left
                if (newT > 0.95) newT = door.t - increment

                // Clamp
                newT = Math.max(0.05, Math.min(0.95, newT))

                const newDoor = { ...door, id: `door-${Date.now()}`, t: newT }
                setDoors([...doors, newDoor])
                setSelectedElement({ type: "door", id: newDoor.id })
            }
        } else if (type === "window") {
            const window = windows.find(w => w.id === id)
            if (window) {
                const wall = walls.find(w => w.id === window.wallId)
                let increment = 0.1
                if (wall) {
                    const wallLen = Math.sqrt(Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.y - wall.start.y, 2))
                    if (wallLen > 0) increment = (window.width + 10) / wallLen // Width + 10cm gap
                }

                // Try placing to the right (higher t)
                let newT = window.t + increment
                // If runs off the end, try to the left
                if (newT > 0.95) newT = window.t - increment

                // Clamp
                newT = Math.max(0.05, Math.min(0.95, newT))

                const newWindow = { ...window, id: `window-${Date.now()}`, t: newT }
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

    const applyFacadeHighlight = () => {
        saveStateToHistory()
        setWalls(prevWalls => {
            const fragmented = fragmentWalls(prevWalls)
            const detectedRooms = detectRoomsGeometrically(fragmented)

            // 1. Identificar muros exteriores
            const outerWallIds = new Set<string>()
            fragmented.forEach(w => {
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
                if (count === 1) outerWallIds.add(w.id)
            })

            // 2. Aplicar grosor solo a muros exteriores, SIN ortogonalizar
            return fragmented.map(w => ({
                ...w,
                thickness: outerWallIds.has(w.id) ? 20 : w.thickness
            }))
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
        setCalibrationPoints({ p1: null, p2: null })
        setCalibrationTargetValue(500)
        setShunts([])
        setActiveTool("select") // Security: Reset tool to avoid accidental drawing
    }

    // Tool Creation State
    const [creationDoorType, setCreationDoorType] = useState<"single" | "double" | "sliding">("single")
    const [creationWindowType, setCreationWindowType] = useState<"single" | "double">("single")

    // ... existing handleMouseDown ...
    const handleMouseDown = (point: Point) => {
        if (isCalibrating) {
            // ... existing calibration logic ...
            if (!calibrationPoints.p1) {
                setCalibrationPoints(prev => ({ ...prev, p1: point }))
            } else if (!calibrationPoints.p2) {
                setCalibrationPoints(prev => ({ ...prev, p2: point }))
            }
            return
        }
        switch (activeTool) {

            case "wall":
                if (currentWall) {
                    // Desktop flow: Second click finalizes the wall
                    // Mobile flow: This is just updating the preview (actual creation in mouseUp)
                    // To differentiate, we check if distance is significant
                    const dist = Math.sqrt(Math.pow(point.x - currentWall.start.x, 2) + Math.pow(point.y - currentWall.start.y, 2))

                    // Only create wall on mouseDown for desktop (second click after moving cursor)
                    // For touch, this will be skipped and wall is created on mouseUp instead
                    // We detect touch by checking if the wall end point moved significantly
                    // If it didn't move much, it's likely a desktop click, not a touch drag
                    const cursorMoved = Math.sqrt(Math.pow(currentWall.end.x - currentWall.start.x, 2) + Math.pow(currentWall.end.y - currentWall.start.y, 2)) > 10

                    if (dist > 5 && cursorMoved) {
                        // This is a desktop second-click (cursor moved during preview)
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
                    // If cursor didn't move, this might be a touch tap or a click right after starting
                    // Do nothing here - let mouseUp handle it for touch, or wait for cursor movement for desktop
                } else {
                    // First click/touch: Start a new wall
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
                        width: creationDoorType === "double" ? 120 : (creationDoorType === "sliding" ? 150 : 82),
                        height: 205,
                        flipX: false,
                        flipY: false,
                        openType: creationDoorType
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
                        width: creationWindowType === "double" ? 120 : 100,
                        height: 100,
                        flipY: false,
                        openType: creationWindowType
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
        if (!calibrationPoints.p1 || !calibrationPoints.p2) return
        const dx = calibrationPoints.p2.x - calibrationPoints.p1.x
        const dy = calibrationPoints.p2.y - calibrationPoints.p1.y
        const pixelDist = Math.sqrt(dx * dx + dy * dy)
        if (pixelDist > 0) {
            const newScale = (calibrationTargetValue / pixelDist) * bgConfig.scale
            setBgConfig((prev: any) => ({ ...prev, scale: newScale }))
            setIsCalibrating(false)
            setCalibrationPoints({ p1: null, p2: null })
        }
    }

    const handleImportImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            const result = e.target?.result as string
            setBgImage(result)
            setBgConfig({
                ...bgConfig,
                x: 0,
                y: 0,
                scale: 1, // Reset scale or keep context logic if desired
                opacity: 0.5
            })
            // Reset calibration
            setCalibrationPoints({ p1: { x: 200, y: 200 }, p2: { x: 500, y: 200 } })
            setIsCalibrating(false)
            setActiveTool("select") // Reset tool to avoid accidental drawing
        }
        reader.readAsDataURL(file)

        // Reset input value to allow re-upload of same file if needed in future
        e.target.value = ''
    }

    const handleTriggerImageUpload = () => {
        const isLandscape = typeof window !== 'undefined' && window.innerWidth > window.innerHeight
        if (isMobile && isLandscape) {
            toast({
                title: "Sugerencia de visualización",
                description: "Gira el móvil a vertical para ver mejor tus fotos al seleccionarlas.",
                duration: 4000,
            })
        }
        document.getElementById('bg-import')?.click()
    }

    const handleMouseMove = (point: Point) => {
        lastMousePosRef.current = point
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

        // Wall creation on mouseUp is only for TOUCH events (drag-to-draw workflow)
        // For MOUSE events, wall creation happens on mouseDown (click-to-place workflow)
        // This prevents duplicate walls on desktop while enabling proper mobile drawing
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
                    toast({
                        title: "Guardado correctamente",
                        description: `El plano se ha guardado con ID: ${data.id?.substring(0, 8)}...`,
                    })
                } else {
                    console.error("[v0] Error al guardar plano:", await response.text())
                    toast({
                        title: "Error al guardar",
                        description: "Hubo un problema al guardar el plano. Inténtalo de nuevo.",
                        variant: "destructive"
                    })
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
    // Fullscreen and Orientation Management
    useEffect(() => {
        const handleRotation = () => {
            if (!isMobile) return

            const isLandscape = window.innerWidth > window.innerHeight
            if (isLandscape && !document.fullscreenElement) {
                // Try auto-trigger
                // toggleFullscreen() // Auto-trigger often blocked by browser policy without user interaction
            }
        }

        const handleFullscreenChange = () => {
            const isFull = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement || !!(document as any).mozFullScreenElement
            setIsFullscreen(isFull)
        }

        window.addEventListener("resize", handleRotation)
        document.addEventListener("fullscreenchange", handleFullscreenChange)
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
        document.addEventListener("mozfullscreenchange", handleFullscreenChange)

        // Initial check
        handleFullscreenChange()

        return () => {
            window.removeEventListener("resize", handleRotation)
            document.removeEventListener("fullscreenchange", handleFullscreenChange)
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
            document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
        }
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
        // ... (JSX wrapper)
        <div
            ref={(node) => {
                editorWrapperRef.current = node
                if (node !== fullscreenContainer) setFullscreenContainer(node)
            }}
            className="flex flex-col h-full bg-slate-50 relative overflow-hidden"
        >
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

            <div ref={containerRef} className="flex-1 relative border-t border-slate-200 overflow-hidden bg-slate-50">
                {/* Vertical Collapsible Toolbar */}
                <div className={`absolute left-0 bottom-0 ${isFullscreen ? "top-0" : "top-[50px]"} z-40 transition-all duration-300 ease-in-out flex flex-col items-start translate-x-0`}>
                    <Card className="p-2 flex flex-col items-center justify-between gap-1 bg-white/95 backdrop-blur-md border-slate-200 shadow-xl pointer-events-auto rounded-none border-l-0 border-t-0 border-b-0 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        {!isFullscreen && (
                            <>
                                <Button variant="ghost" size="icon" onClick={handleBack} title="Volver" className="w-12 h-12 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div className="h-px w-8 bg-slate-200 my-1 flex-shrink-0" />
                            </>
                        )}
                        {/* ... existing tool buttons ... */}
                        <Button variant={activeTool === "select" ? "default" : "ghost"} size="icon" onClick={() => setActiveTool("select")} title={isMobile ? "Seleccionar" : "Seleccionar (S)"} className="w-12 h-12">
                            <MousePointer2 className="h-5 w-5" />
                        </Button>

                        {/* PENCIL: Walls, Arcs, Facades + Mobile Tools */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant={["wall", "arc", "door", "window", "shunt"].includes(activeTool) ? "default" : "ghost"}
                                    size="icon"
                                    title="Dibujar"
                                    className="w-12 h-12 relative"
                                >
                                    <Pencil className="h-5 w-5" />
                                    <ChevronRight className={`h-3 w-3 absolute bottom-1 right-1 opacity-50 transition-transform duration-300 rotate-90`} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent container={fullscreenContainer} side="right" align="start" sideOffset={10} className="w-48 ml-2 flex flex-col gap-1">
                                <DropdownMenuItem onSelect={() => setActiveTool("wall")} className="gap-3 py-2 cursor-pointer">
                                    <Pencil className="h-4 w-4" /> <span>Muros {isMobile ? "" : "(W)"}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setActiveTool("arc")} className="gap-3 py-2 cursor-pointer">
                                    <Spline className="h-4 w-4" /> <span>Arco</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => { setActiveTool("wall"); applyFacadeHighlight(); toast({ title: "Fachada", description: "Dibujar muro de fachada" }) }} className="gap-3 py-2 cursor-pointer">
                                    <Building2 className="h-4 w-4" /> <span>Fachada</span>
                                </DropdownMenuItem>

                                {isMobile && (
                                    <>
                                        <div className="h-px bg-slate-100 my-1" />
                                        <DropdownMenuItem onSelect={() => { setActiveTool("door"); setCreationDoorType("single") }} className="gap-3 py-2 cursor-pointer">
                                            <DoorClosed className="h-4 w-4" /> <span>Puerta</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => { setActiveTool("window"); setCreationWindowType("single") }} className="gap-3 py-2 cursor-pointer">
                                            <Layout className="h-4 w-4" /> <span>Ventana</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => setActiveTool("shunt")} className="gap-3 py-2 cursor-pointer">
                                            <Square className="h-4 w-4" /> <span>Columna</span>
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* DOOR: Single, Double, Sliding - Desktop Only */}
                        {!isMobile && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant={activeTool === "door" ? "default" : "ghost"}
                                        size="icon"
                                        title="Puertas"
                                        className="w-12 h-12 relative"
                                    >
                                        <DoorClosed className="h-5 w-5" />
                                        <ChevronRight className={`h-3 w-3 absolute bottom-1 right-1 opacity-50 transition-transform duration-300 rotate-90`} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent container={fullscreenContainer} side="right" align="start" sideOffset={10} className="w-48 ml-2 flex flex-col gap-1">
                                    <DropdownMenuItem onSelect={() => { setActiveTool("door"); setCreationDoorType("single") }} className="gap-3 py-2 cursor-pointer">
                                        <DoorClosed className="h-4 w-4" /> <span>Simple</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => { setActiveTool("door"); setCreationDoorType("double") }} className="gap-3 py-2 cursor-pointer">
                                        <DoorOpen className="h-4 w-4" /> <span>Doble</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => { setActiveTool("door"); setCreationDoorType("sliding") }} className="gap-3 py-2 cursor-pointer">
                                        <GalleryVerticalEnd className="h-4 w-4" /> <span>Corredera</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* WINDOW: Single, Double - Desktop Only */}
                        {!isMobile && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant={activeTool === "window" ? "default" : "ghost"}
                                        size="icon"
                                        title="Ventanas"
                                        className="w-12 h-12 relative"
                                    >
                                        <Layout className="h-5 w-5" />
                                        <ChevronRight className={`h-3 w-3 absolute bottom-1 right-1 opacity-50 transition-transform duration-300 rotate-90`} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent container={fullscreenContainer} side="right" align="start" sideOffset={10} className="w-48 ml-2 flex flex-col gap-1">
                                    <DropdownMenuItem onSelect={() => { setActiveTool("window"); setCreationWindowType("single") }} className="gap-3 py-2 cursor-pointer">
                                        <AppWindow className="h-4 w-4" /> <span>Sencilla</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => { setActiveTool("window"); setCreationWindowType("double") }} className="gap-3 py-2 cursor-pointer">
                                        <Columns className="h-4 w-4" /> <span>Doble</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* COLUMN: Shunt - Desktop Only */}
                        {!isMobile && (
                            <Button variant={activeTool === "shunt" ? "default" : "ghost"} size="icon" onClick={() => setActiveTool("shunt")} title="Columna" className="w-12 h-12">
                                <Square className="h-5 w-5" />
                            </Button>
                        )}
                        <Button
                            variant={showAllQuotes ? "default" : "ghost"}
                            size="icon"
                            onClick={() => setShowAllQuotes(!showAllQuotes)}
                            title={showAllQuotes ? "Ocultar todas las cotas" : "Mostrar todas las cotas"}
                            className="w-12 h-12"
                        >
                            <LayoutGrid className={`h-5 w-5 ${showAllQuotes ? "text-white" : "text-slate-600"}`} />
                        </Button>

                        <div className="h-px w-8 bg-slate-200 my-1 flex-shrink-0" />

                        <Button variant="ghost" size="icon" onClick={handleUndo} disabled={history.length === 0} title={isMobile ? "Deshacer" : "Deshacer (Ctrl+Z)"} className="w-12 h-12">
                            <Undo2 className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleRedo} disabled={redoHistory.length === 0} title={isMobile ? "Rehacer" : "Rehacer (Ctrl+Y)"} className="w-12 h-12">
                            <Redo2 className="h-5 w-5" />
                        </Button>

                        <div className="h-px w-8 bg-slate-200 my-1 flex-shrink-0" />

                        <Button variant="ghost" size="icon" onClick={handleTriggerImageUpload} title="Subir Imagen de Fondo" className="w-12 h-12">
                            <ImagePlus className="h-5 w-5" />
                        </Button>



                        <div className="h-px w-8 bg-slate-200 my-1 flex-shrink-0" />

                        {/* Trash directly on bar */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-12 h-12 text-red-500 hover:bg-red-50 hover:text-red-600" title="Limpiar Plano">
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent container={fullscreenContainer}>
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

                        <div className="h-px w-8 bg-slate-200 my-1 flex-shrink-0" />

                        <Sheet onOpenChange={setShowSummary} open={showSummary}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" title="Resumen" className="w-12 h-12 text-slate-500">
                                    <FileText className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent container={fullscreenContainer} side="right" className="overflow-y-auto w-[400px] sm:w-[540px]">
                                <SheetHeader className="mb-4">
                                    <SheetTitle>Resumen del Plano</SheetTitle>
                                </SheetHeader>
                                <FloorPlanSummary
                                    walls={walls}
                                    doors={doors}
                                    windows={windows}
                                    rooms={rooms}
                                    shunts={shunts}
                                />
                            </SheetContent>
                        </Sheet>

                        <Button
                            size="icon"
                            variant="ghost"
                            className="w-12 h-12 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={handleSave}
                            disabled={isSaving}
                            title="Guardar"
                        >
                            {isSaving ? "..." : <Save className="h-5 w-5" />}
                        </Button>

                        <div className="h-px w-8 bg-slate-200 my-1 flex-shrink-0" />

                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-12 h-12"
                            onClick={toggleFullscreen}
                            title="Pantalla Completa"
                        >
                            <Maximize2 className="h-5 w-5 text-slate-500" />
                        </Button>
                    </Card>


                </div>
                <input type="file" id="bg-import" className="hidden" accept="image/*" onChange={handleImportImage} />
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
                    onUpdateBgConfig={(updates: any) => setBgConfig((prev: any) => ({ ...prev, ...updates }))}
                    isCalibrating={isCalibrating}
                    calibrationPoints={calibrationPoints}
                    calibrationTargetValue={calibrationTargetValue}
                    onUpdateCalibrationValue={(val) => {
                        setCalibrationTargetValue(val)
                        // Auto-apply if we have points and valid value
                        if (calibrationPoints.p1 && calibrationPoints.p2 && val > 0) {
                            const dx = calibrationPoints.p2.x - calibrationPoints.p1.x
                            const dy = calibrationPoints.p2.y - calibrationPoints.p1.y
                            const pixelDist = Math.sqrt(dx * dx + dy * dy)
                            if (pixelDist > 0) {
                                const newScale = (val / pixelDist) * bgConfig.scale
                                setBgConfig((prev: any) => ({ ...prev, scale: newScale }))
                                setIsCalibrating(false)
                                setCalibrationPoints({ p1: null, p2: null })
                            }
                        }
                    }}
                    onUpdateCalibrationPoint={(id: "p1" | "p2", p: Point) => setCalibrationPoints((prev: any) => ({ ...prev, [id]: p }))}
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
                    touchOffset={activeTool === "door" || activeTool === "window" ? 0 : touchOffset}
                    forceTouchOffset={forceTouchOffset}
                    shunts={shunts}
                    onUpdateShunt={handleUpdateShunt}
                    hideFloatingUI={showSummary || (isMobile && !isFullscreen && typeof window !== 'undefined' && window.innerWidth > window.innerHeight)}
                    showAllQuotes={showAllQuotes}
                />



                {bgImage && (
                    <div className="absolute top-20 right-4 z-30 flex flex-col gap-2 pointer-events-none">
                        <Card className="p-4 w-72 max-w-[calc(100vw-32px)] shadow-lg bg-white/95 backdrop-blur pointer-events-auto max-h-[calc(100vh-160px)] overflow-y-auto">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm">Opacidad del Plano</h4>
                                    <span className="text-xs text-muted-foreground">{Math.round(bgConfig.opacity * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1"
                                    step="0.05"
                                    value={bgConfig.opacity}
                                    onChange={(e) => setBgConfig({ ...bgConfig, opacity: parseFloat(e.target.value) })}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                />

                                <Separator />

                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Calibración</h4>
                                    <p className="text-xs text-slate-500">
                                        {isCalibrating
                                            ? "Haz clic en dos puntos del plano para definir una distancia conocida."
                                            : "Si las medidas no coinciden, calibra el plano usando una distancia conocida (ej. una puerta de 80cm)."}
                                    </p>
                                    {!isCalibrating ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => setIsCalibrating(true)}
                                        >
                                            <Ruler className="w-4 h-4 mr-2" />
                                            Calibrar Escala
                                        </Button>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <p className="text-xs font-semibold text-orange-600">
                                                Distancia actual: {calibrationTargetValue} cm
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                                                    disabled={!calibrationPoints.p1 || !calibrationPoints.p2 || calibrationTargetValue <= 0}
                                                    onClick={handleApplyCalibration}
                                                >
                                                    Aplicar
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => {
                                                        setIsCalibrating(false)
                                                        setCalibrationPoints({ p1: null, p2: null })
                                                    }}
                                                >
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => {
                                            if (confirm("¿Estás seguro de que quieres eliminar la imagen de fondo?")) {
                                                setBgImage(null)
                                                setBgConfig({ x: 0, y: 0, scale: 1, rotation: 0, opacity: 0.5 })
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Eliminar Imagen
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Properties Panel for Selected Element */}
                {selectedElement && !showSummary && (
                    <div className="absolute top-20 right-4 z-30">
                        {(() => {
                            // Shunt properties removed as per user request (inline editing)
                            return null
                        })()}
                    </div>
                )}

                {/* Floating Navigation Controls (Right Bottom) */}
                {!showSummary && (
                    <div className="absolute bottom-6 right-6 flex flex-col gap-1 items-center p-1 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm z-30 opacity-70 hover:opacity-100 transition-opacity duration-200">
                        <Button variant="ghost" size="icon" onClick={() => handleRotatePlan(15)} title={isMobile ? "Girar" : "Girar (])"} className="w-8 h-8 rounded-md hover:bg-slate-200/50">
                            <RotateCw className="h-4 w-4 text-slate-600" />
                        </Button>
                        <div className="w-5 h-px bg-slate-200 my-0.5" />
                        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(3, z + 0.1))} title="Acercar" className="w-8 h-8 rounded-md hover:bg-slate-200/50">
                            <ZoomIn className="h-4 w-4 text-slate-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} title="Alejar" className="w-8 h-8 rounded-md hover:bg-slate-200/50">
                            <ZoomOut className="h-4 w-4 text-slate-600" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Global Toaster Portal for Fullscreen */}
            {/* Global Toaster Portal for Fullscreen */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none">
                {/* Toaster should be mounted at root normally, but for fullscreen api 
                    we might need a specific container inside the fullscreen wrapper. 
                */}
            </div>

            {/* Render local ToastProvider when in fullscreen to ensure visibility */}
            {isFullscreen && (
                <div className="absolute inset-0 pointer-events-none z-[100]">
                    <ToastProvider />
                </div>
            )}

        </div >
    )
})

EditorContainer.displayName = "EditorContainer"
