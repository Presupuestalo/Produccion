"use client"
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import dynamic from "next/dynamic"
const CanvasEngine = dynamic(() => import("./CanvasEngine").then((mod) => mod.CanvasEngine), { ssr: false })
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MousePointer2, Pencil, ZoomIn, ZoomOut, Maximize, Sparkles, Save, Undo2, Redo2, DoorClosed, Layout, Trash2, ImagePlus, Sliders, Move, Magnet, Ruler } from "lucide-react"
import { detectRoomsGeometrically, fragmentWalls, getClosestPointOnSegment, isPointOnSegment } from "@/lib/utils/geometry"

export const EditorContainer = forwardRef((props, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const [zoom, setZoom] = useState(1)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    interface Point { x: number; y: number }
    interface Wall { id: string; start: Point; end: Point; thickness: number }

    interface Room { id: string; name: string; polygon: Point[]; area: number; color: string; visualCenter?: Point }

    const [walls, setWalls] = useState<Wall[]>([])
    const [rooms, setRooms] = useState<Room[]>([])
    const [currentWall, setCurrentWall] = useState<{ start: Point; end: Point } | null>(null)
    const [hoveredWallId, setHoveredWallId] = useState<string | null>(null)
    interface Door { id: string; wallId: string; t: number; width: number; flipX?: boolean; flipY?: boolean }
    interface Window { id: string; wallId: string; t: number; width: number; height: number; flipY?: boolean }
    const [doors, setDoors] = useState<Door[]>([])
    const [windows, setWindows] = useState<Window[]>([])
    const [selectedElement, setSelectedElement] = useState<{ type: "door" | "window", id: string } | null>(null)
    const [activeTool, setActiveTool] = useState<"select" | "wall" | "door" | "window" | "ruler">("wall")
    const [selectedWallIds, setSelectedWallIds] = useState<string[]>([])
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Historial para deshacer/rehacer
    const [history, setHistory] = useState<any[]>([])
    const historyRef = useRef<any[]>([])
    const [redoHistory, setRedoHistory] = useState<any[]>([])
    const redoHistoryRef = useRef<any[]>([])
    // Snapshots para arrastre suave y rígido
    const [wallSnapshot, setWallSnapshot] = useState<Wall[] | null>(null)

    // Estado del plano de fondo (Plantilla)
    const [bgImage, setBgImage] = useState<string | null>(null)
    const [bgConfig, setBgConfig] = useState({ opacity: 0.5, scale: 1, x: 0, y: 0, rotation: 0 })
    const [isCalibrating, setIsCalibrating] = useState(false)
    const [calibrationPoints, setCalibrationPoints] = useState({ p1: { x: 200, y: 200 }, p2: { x: 500, y: 200 } })
    const [calibrationTargetValue, setCalibrationTargetValue] = useState(500)
    const [snappingEnabled, setSnappingEnabled] = useState(true)
    const [rulerState, setRulerState] = useState<{ start: Point | null, end: Point | null, active: boolean }>({ start: null, end: null, active: false })

    useImperativeHandle(ref, () => ({
        clearPlan: handleClearPlan
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
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedWallIds.length > 0) {
                    selectedWallIds.forEach(id => deleteWall(id))
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
        return Math.abs(total) / 2 / (100 * 100)
    }

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


    const deleteWall = (id: string) => {
        saveStateToHistory()
        const newWalls = walls.filter(w => w.id !== id)
        setWalls(newWalls)
        setSelectedWallIds(prev => prev.filter(wid => wid !== id))
        setRooms(detectRoomsGeometrically(newWalls, rooms))
        setDoors(prev => prev.filter(d => d.wallId !== id))
        setWindows(prev => prev.filter(w => w.wallId !== id))
        if (selectedElement?.type === "door" && doors.find(d => d.id === selectedElement.id)?.wallId === id) setSelectedElement(null)
        if (selectedElement?.type === "window" && windows.find(w => w.id === selectedElement.id)?.wallId === id) setSelectedElement(null)
    }

    const handleDeleteElement = (type: "door" | "window", id: string) => {
        saveStateToHistory()
        if (type === "door") {
            setDoors(prev => prev.filter(d => d.id !== id))
        } else {
            setWindows(prev => prev.filter(w => w.id !== id))
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
            setRooms(detectRoomsGeometrically(newWalls, rooms))
            return newWalls
        })
        setSelectedWallIds([p1Id])
    }

    const handleUpdateRoom = (id: string, updates: Partial<Room>) => {
        saveStateToHistory()
        setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
    }

    const handleUpdateWallThickness = (id: string, thickness: number) => {
        saveStateToHistory()
        setWalls(prev => prev.map(w => w.id === id ? { ...w, thickness } : w))
    }

    const handleDragElement = (type: "door" | "window", id: string, pointer: Point) => {
        const closest = findClosestWall(pointer)
        if (!closest || closest.dist > 30) return // Umbral para "saltar" entre muros

        const wall = walls.find(w => w.id === closest.wallId)
        if (!wall) return

        // Lógica de flip dinámico segun lado del muro
        // Calculamos de qué lado del muro está el puntero
        const dx = wall.end.x - wall.start.x
        const dy = wall.end.y - wall.start.y
        // Cambiamos el signo de det porque el usuario siente que va al revés
        const det = (pointer.x - wall.start.x) * dy - (pointer.y - wall.start.y) * dx
        const isFlippedY = det < 0

        if (type === "door") {
            setDoors(prev => prev.map(d => d.id === id ? { ...d, t: closest.t, wallId: closest.wallId, flipY: isFlippedY } : d))
        } else {
            setWindows(prev => prev.map(w => w.id === id ? { ...w, t: closest.t, wallId: closest.wallId, flipY: isFlippedY } : w))
        }
    }
    const handleCloneElement = (type: "door" | "window", id: string) => {
        saveStateToHistory()
        if (type === "door") {
            const door = doors.find(d => d.id === id)
            if (door) {
                const newDoor = { ...door, id: `door-${Date.now()}`, t: Math.min(0.9, door.t + 0.1) }
                setDoors([...doors, newDoor])
                setSelectedElement({ type: "door", id: newDoor.id })
            }
        } else {
            const window = windows.find(w => w.id === id)
            if (window) {
                const newWindow = { ...window, id: `window-${Date.now()}`, t: Math.min(0.9, window.t + 0.1) }
                setWindows([...windows, newWindow])
                setSelectedElement({ type: "window", id: newWindow.id })
            }
        }
    }

    const handleUpdateElement = (type: "door" | "window", id: string, updates: any) => {
        saveStateToHistory()
        if (type === "door") {
            setDoors(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
        } else {
            setWindows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w))
        }
    }
    const handleDragWall = (id: string, totalDelta: Point) => {
        setWalls(prevWalls => {
            if (!wallSnapshot) return prevWalls
            const wallToMove = wallSnapshot.find(w => w.id === id)
            if (!wallToMove) return prevWalls

            const isH = Math.abs(wallToMove.start.y - wallToMove.end.y) < 1
            const isV = Math.abs(wallToMove.start.x - wallToMove.end.x) < 1

            const cleanDelta = {
                x: (isV || (!isH && !isV)) ? totalDelta.x : 0,
                y: (isH || (!isH && !isV)) ? totalDelta.y : 0
            }

            let workingWalls = JSON.parse(JSON.stringify(wallSnapshot)) as Wall[]
            const addedJogs: Wall[] = []

            const TOL = 5.0
            const isSame = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL

            // Movemos el muro principal
            const wTarget = workingWalls.find(w => w.id === id)!
            wTarget.start.x += cleanDelta.x; wTarget.start.y += cleanDelta.y
            wTarget.end.x += cleanDelta.x; wTarget.end.y += cleanDelta.y

            // Procesamos el resto de muros
            workingWalls.forEach(w => {
                if (w.id === id) return
                const isWH = Math.abs(w.start.y - w.end.y) < 2
                const isWV = Math.abs(w.start.x - w.end.x) < 2

                // Conexiones al INICIO del muro arrastrado
                if (isSame(w.start, wallToMove.start)) {
                    if ((isV && isWH) || (isH && isWV)) {
                        w.start.x += cleanDelta.x; w.start.y += cleanDelta.y
                    } else if ((isV && isWV) || (isH && isWH)) {
                        addedJogs.push({ id: `jog-s-${id}-${w.id}`, start: { ...w.start }, end: { ...wTarget.start }, thickness: wTarget.thickness })
                    }
                } else if (isSame(w.end, wallToMove.start)) {
                    if ((isV && isWH) || (isH && isWV)) {
                        w.end.x += cleanDelta.x; w.end.y += cleanDelta.y
                    } else if ((isV && isWV) || (isH && isWH)) {
                        addedJogs.push({ id: `jog-e-${id}-${w.id}`, start: { ...w.end }, end: { ...wTarget.start }, thickness: wTarget.thickness })
                    }
                }

                // Conexiones al FINAL del muro arrastrado
                if (isSame(w.start, wallToMove.end)) {
                    if ((isV && isWH) || (isH && isWV)) {
                        w.start.x += cleanDelta.x; w.start.y += cleanDelta.y
                    } else if ((isV && isWV) || (isH && isWH)) {
                        addedJogs.push({ id: `jog-fs-${id}-${w.id}`, start: { ...w.start }, end: { ...wTarget.end }, thickness: wTarget.thickness })
                    }
                } else if (isSame(w.end, wallToMove.end)) {
                    if ((isV && isWH) || (isH && isWV)) {
                        w.end.x += cleanDelta.x; w.end.y += cleanDelta.y
                    } else if ((isV && isWV) || (isH && isWH)) {
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
        setWalls(prevWalls => {
            if (!wallSnapshot) return prevWalls

            const TOL = 5.0
            const isSame = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL
            const idsToMove = activeIds || (selectedWallIds.length > 0 ? selectedWallIds : (hoveredWallId ? [hoveredWallId] : []))

            // 1. Shallow copy walls (only clone the ones that move)
            let workingWalls = wallSnapshot.map(w => {
                if (!idsToMove.includes(w.id)) return w
                return { ...w, start: { ...w.start }, end: { ...w.end } }
            })

            const idsToMoveSet = new Set(idsToMove)

            // 2. Identify vertex in snapshot
            let tx = originalPoint.x + totalDelta.x
            let ty = originalPoint.y + totalDelta.y

            // --- Snapping ---
            const SNAP_THRESHOLD = 15 // 15cm
            let snapped = false

            // 1. Snapping a otros vértices
            if (snappingEnabled) {
                for (const w of wallSnapshot) {
                    for (const p of [w.start, w.end]) {
                        if (isSame(p, originalPoint)) continue
                        const d = Math.sqrt(Math.pow(p.x - tx, 2) + Math.pow(p.y - ty, 2))
                        if (d < SNAP_THRESHOLD) {
                            tx = p.x; ty = p.y
                            snapped = true
                            break
                        }
                    }
                    if (snapped) break
                }

                // 2. Snapping Ortogonal (si no hay snap a vértice)
                if (!snapped) {
                    idsToMove.forEach(id => {
                        const w = wallSnapshot.find(sw => sw.id === id)
                        if (!w) return
                        const fixedP = isSame(w.start, originalPoint) ? w.end : w.start
                        if (Math.abs(tx - fixedP.x) < SNAP_THRESHOLD) tx = fixedP.x
                        if (Math.abs(ty - fixedP.y) < SNAP_THRESHOLD) ty = fixedP.y
                    })
                }
            }

            // Aplicar movimiento
            workingWalls.forEach(w => {
                if (!idsToMoveSet.has(w.id)) return
                if (isSame(w.start, originalPoint)) {
                    w.start.x = tx; w.start.y = ty
                }
                if (isSame(w.end, originalPoint)) {
                    w.end.x = tx; w.end.y = ty
                }
            })

            setRooms(detectRoomsGeometrically(workingWalls, rooms))
            return workingWalls
        })
    }

    const handleDragEnd = () => {
        setWallSnapshot(null)
        setWalls(prev => {
            const processed = prev.map(w => ({
                ...w,
                id: w.id.startsWith('jog-') ? `w-${Math.random().toString(36).substr(2, 9)}` : w.id,
                start: { x: Math.round(w.start.x), y: Math.round(w.start.y) },
                end: { x: Math.round(w.end.x), y: Math.round(w.end.y) }
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

    const handleUpdateWallLength = (id: string, newLength: number, side: "left" | "right") => {
        saveStateToHistory()
        setWalls(prevWalls => {
            const wall = prevWalls.find(w => w.id === id)
            if (!wall) return prevWalls

            const isHorizontal = Math.abs(wall.start.y - wall.end.y) < 1.5
            const isVertical = Math.abs(wall.start.x - wall.end.x) < 1.5

            let startIsMin = isHorizontal ? (wall.start.x < wall.end.x) : (wall.start.y < wall.end.y)
            let anchorEnd = (side === "left" ? (startIsMin ? "end" : "start") : (startIsMin ? "start" : "end"))
            let movingEnd = (side === "left" ? (startIsMin ? "start" : "end") : (startIsMin ? "end" : "start"))

            const anchorPoint = { x: Math.round(anchorEnd === "start" ? wall.start.x : wall.end.x), y: Math.round(anchorEnd === "start" ? wall.start.y : wall.end.y) }
            const movingPoint = { x: Math.round(movingEnd === "start" ? wall.start.x : wall.end.x), y: Math.round(movingEnd === "start" ? wall.start.y : wall.end.y) }

            const dx = wall.end.x - wall.start.x
            const dy = wall.end.y - wall.start.y
            const currentLength = Math.sqrt(dx * dx + dy * dy)
            if (currentLength === 0) return prevWalls

            let ux = dx / currentLength
            let uy = dy / currentLength

            if (isHorizontal) { ux = Math.sign(dx) || 1; uy = 0 }
            else if (isVertical) { ux = 0; uy = Math.sign(dy) || 1 }

            const newPos = {
                x: Math.round(anchorPoint.x + ux * newLength * (movingEnd === "start" ? -1 : 1)),
                y: Math.round(anchorPoint.y + uy * newLength * (movingEnd === "start" ? -1 : 1))
            }

            const delta = { x: newPos.x - movingPoint.x, y: newPos.y - movingPoint.y }

            let workingWalls = JSON.parse(JSON.stringify(prevWalls)) as Wall[]
            // Round all working walls to integer grid first to ensure consistency
            workingWalls.forEach(w => {
                w.start.x = Math.round(w.start.x); w.start.y = Math.round(w.start.y)
                w.end.x = Math.round(w.end.x); w.end.y = Math.round(w.end.y)
            })

            const movedVertices = new Set<string>()
            // PROTECT ANCHOR: mark it as moved to prevent recursion logic from shifting it
            movedVertices.add(`${anchorPoint.x},${anchorPoint.y}`)

            const recursiveMove = (oldP: Point, d: Point, newP: Point) => {
                const pKey = `${oldP.x},${oldP.y}`
                if (movedVertices.has(pKey)) return
                movedVertices.add(pKey)

                const TOL = 5.0
                const isSame = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL

                workingWalls.forEach(w => {
                    const isWH = Math.abs(w.start.y - w.end.y) < 2
                    const isWV = Math.abs(w.start.x - w.end.x) < 2

                    if (isSame(w.start, oldP)) {
                        const nextOld = { ...w.end }
                        w.start.x = newP.x; w.start.y = newP.y // Use exact SNAP destination
                        // Rigid propagation for orthogonal integrity
                        if ((isWH && Math.abs(d.y) > 0.1) || (isWV && Math.abs(d.x) > 0.1)) {
                            recursiveMove(nextOld, d, { x: nextOld.x + d.x, y: nextOld.y + d.y })
                        }
                    } else if (isSame(w.end, oldP)) {
                        const nextOld = { ...w.start }
                        w.end.x = newP.x; w.end.y = newP.y
                        if ((isWH && Math.abs(d.y) > 0.1) || (isWV && Math.abs(d.x) > 0.1)) {
                            recursiveMove(nextOld, d, { x: nextOld.x + d.x, y: nextOld.y + d.y })
                        }
                    }
                })
            }

            recursiveMove(movingPoint, delta, newPos)

            const splitResult = fragmentWalls(workingWalls)

            // Mantener selección si el ID cambió pero el muro es el mismo (o el primer segmento)
            setSelectedWallIds(prev => prev.map(oldId => {
                const found = splitResult.find(nw => nw.id === oldId || nw.id === `${oldId}-s0`)
                return found ? found.id : oldId
            }).filter(id => splitResult.some(nw => nw.id === id)))

            // Re-vincular puertas y ventanas
            const updatedDoors = doors.map(door => {
                const oldWall = prevWalls.find(w => w.id === door.wallId)
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
            })
            setDoors(updatedDoors)

            const updatedWindows = windows.map(win => {
                const oldWall = prevWalls.find(w => w.id === win.wallId)
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
            })
            setWindows(updatedWindows)

            setRooms(detectRoomsGeometrically(splitResult, (rooms || [])))
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

    const handleClearPlan = () => {
        if (window.confirm("¿Estás seguro de que quieres limpiar todo el plano?")) {
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
        }
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
                        const newWalls = fragmentWalls([...walls, newWall])
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

            case "ruler":
                setRulerState({ start: point, end: point, active: true })
                break
        }
    }

    const handleApplyCalibration = () => {
        const dx = calibrationPoints.p2.x - calibrationPoints.p1.x
        const dy = calibrationPoints.p2.y - calibrationPoints.p1.y
        const pixelDist = Math.sqrt(dx * dx + dy * dy)
        if (pixelDist > 0) {
            const newScale = (calibrationTargetValue / pixelDist) * bgConfig.scale
            setBgConfig(prev => ({ ...prev, scale: newScale }))
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
            const response = await fetch("/api/editor-planos/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "Plano Editor V2",
                    walls,
                    doors,
                    windows,
                    rooms
                }),
            })

            if (response.ok) {
                const data = await response.json()
                console.log("[v0] Plano guardado con ID:", data.id)
            } else {
                console.error("[v0] Error al guardar plano:", await response.text())
            }
        } catch (error) {
            console.error("[v0] Excepción al guardar:", error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 p-4 gap-4">
            <Card className="p-2 flex items-center justify-between bg-white/80 backdrop-blur-md border-slate-200 shadow-lg">
                <div className="flex items-center gap-1">
                    <Button
                        variant={activeTool === "select" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setActiveTool("select")}
                        title="Seleccionar (S)"
                    >
                        <MousePointer2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={activeTool === "wall" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setActiveTool("wall")}
                        title="Dibujar Muro (W)"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <Button
                        variant={activeTool === "door" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setActiveTool("door")}
                        title="Puerta (D)"
                    >
                        <DoorClosed className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={activeTool === "window" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setActiveTool("window")}
                        title="Ventana (V)"
                    >
                        <Layout className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <Button
                        variant={activeTool === "ruler" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setActiveTool("ruler")}
                        title="Regla (M)"
                    >
                        <Ruler className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => document.getElementById('bg-import')?.click()}
                        title="Importar Plano (Plantilla)"
                    >
                        <ImagePlus className="h-4 w-4" />
                    </Button>
                    <input
                        type="file"
                        id="bg-import"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImportImage}
                    />
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleUndo}
                        disabled={history.length === 0}
                        title="Deshacer (Ctrl+Z)"
                    >
                        <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRedo}
                        disabled={redoHistory.length === 0}
                        title="Rehacer (Ctrl+Y)"
                    >
                        <Redo2 className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <Button
                        variant={snappingEnabled ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setSnappingEnabled(!snappingEnabled)}
                        title={snappingEnabled ? "Desactivar Imanes" : "Activar Imanes"}
                        className={!snappingEnabled ? "text-slate-400" : ""}
                    >
                        <Magnet className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <div className="text-xs font-medium text-slate-500 mr-2">
                        {Math.round(zoom * 100)}%
                    </div>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(z => z * 1.1)}>
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(z => z / 1.1)}>
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleResetView}>
                        <Maximize className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "Guardando..." : "Guardar"}
                        {!isSaving && <Save className="h-3 w-3 ml-2" />}
                    </Button>
                </div>
            </Card>

            <div ref={containerRef} className="flex-1 relative rounded-xl border border-slate-200 shadow-inner overflow-hidden bg-slate-50">
                <CanvasEngine
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
                        if (!id) {
                            setSelectedWallIds([])
                            return
                        }
                        if (isMultiSelect) {
                            setSelectedWallIds(prev =>
                                prev.includes(id) ? prev.filter(wid => wid !== id) : [...prev, id]
                            )
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
                    onUpdateRoom={handleUpdateRoom}
                    selectedRoomId={selectedRoomId}
                    snappingEnabled={activeTool === "ruler" ? false : snappingEnabled}
                    onSelectRoom={(id: string | null) => {
                        setSelectedRoomId(id)
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
                        setWallSnapshot(JSON.parse(JSON.stringify(walls)))
                    }}
                    onDragElement={handleDragElement}
                    selectedElement={selectedElement}
                    onSelectElement={setSelectedElement}
                    onUpdateElement={handleUpdateElement}
                    onCloneElement={handleCloneElement}
                    onDeleteElement={handleDeleteElement}
                />
                {bgImage && (
                    <div className="absolute top-4 right-4 p-4 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl w-72 animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Sliders className="h-4 w-4 text-sky-600" />
                                {isCalibrating ? "Calibrar Escala" : "Ajustar Plantilla"}
                            </h3>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setBgImage(null); setIsCalibrating(false); }}>
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {!isCalibrating ? (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            <span>Opacidad</span>
                                            <span>{Math.round(bgConfig.opacity * 100)}%</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="1" step="0.05"
                                            value={bgConfig.opacity}
                                            onChange={(e) => setBgConfig(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            <span>Rotación</span>
                                            <span>{bgConfig.rotation || 0}°</span>
                                        </div>
                                        <input
                                            type="range" min="-180" max="180" step="1"
                                            value={bgConfig.rotation || 0}
                                            onChange={(e) => setBgConfig(prev => ({ ...prev, rotation: parseInt(e.target.value) }))}
                                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Pos X</label>
                                            <input
                                                type="number"
                                                value={Math.round(bgConfig.x)}
                                                onChange={(e) => setBgConfig(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Pos Y</label>
                                            <input
                                                type="number"
                                                value={Math.round(bgConfig.y)}
                                                onChange={(e) => setBgConfig(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-8 text-xs font-bold gap-2 bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100"
                                        onClick={() => setIsCalibrating(true)}
                                    >
                                        <Maximize className="h-3.5 w-3.5" />
                                        Calibrar Escala REAL
                                    </Button>
                                </>
                            ) : (
                                <div className="space-y-4 animate-in slide-in-from-right-4">
                                    <p className="text-[11px] text-slate-600 leading-relaxed bg-amber-50 p-2 rounded-lg border border-amber-100">
                                        Mueve los marcadores sobre una pared o pasillo del que sepas su medida real.
                                    </p>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Medida Real (cm)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={calibrationTargetValue}
                                                onChange={(e) => setCalibrationTargetValue(parseInt(e.target.value) || 0)}
                                                className="flex-1 px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                                            />
                                            <span className="flex items-center text-xs font-bold text-slate-400">cm</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 text-xs"
                                            onClick={() => setIsCalibrating(false)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-sky-600 text-xs text-white"
                                            onClick={handleApplyCalibration}
                                        >
                                            Validar Escala
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {!isCalibrating && (
                                <p className="text-[10px] text-slate-400 text-center italic mt-2">
                                    Ajusta la plantilla para que coincida con la cuadrícula
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>


        </div>
    )
})

EditorContainer.displayName = "EditorContainer"
