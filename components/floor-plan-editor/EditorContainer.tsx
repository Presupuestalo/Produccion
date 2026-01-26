"use client"
import React, { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
const CanvasEngine = dynamic(() => import("./CanvasEngine").then((mod) => mod.CanvasEngine), { ssr: false })
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MousePointer2, Pencil, Eraser, ZoomIn, ZoomOut, Maximize, Sparkles, Save, Undo2, Redo2, DoorClosed, Layout, Trash2 } from "lucide-react"
import { detectRoomsGeometrically, fragmentWalls, getClosestPointOnSegment } from "@/lib/utils/geometry"

export const EditorContainer = () => {
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
    interface Door { id: string; wallId: string; t: number; width: number; flip?: boolean }
    interface Window { id: string; wallId: string; t: number; width: number; height: number }
    const [doors, setDoors] = useState<Door[]>([])
    const [windows, setWindows] = useState<Window[]>([])
    const [activeTool, setActiveTool] = useState<"select" | "wall" | "erase" | "door" | "window">("wall")
    const [selectedWallId, setSelectedWallId] = useState<string | null>(null)
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Historial para deshacer/rehacer
    const [history, setHistory] = useState<any[]>([])
    const historyRef = useRef<any[]>([])
    const [redoHistory, setRedoHistory] = useState<any[]>([])
    const redoHistoryRef = useRef<any[]>([])
    // Snapshots para arrastre suave y rígido
    const [wallSnapshot, setWallSnapshot] = useState<Wall[] | null>(null)

    // Limpiar estados al cambiar de herramienta o cancelar
    useEffect(() => {
        setCurrentWall(null)
        setSelectedWallId(null)
        setSelectedRoomId(null)
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
                setSelectedWallId(null)
                setSelectedRoomId(null)
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedWallId) {
                    deleteWall(selectedWallId)
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedWallId, walls, redoHistory])

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
        if (selectedWallId === id) setSelectedWallId(null)
        setRooms(detectRoomsGeometrically(newWalls, rooms))
    }

    const handleSplitWall = (id: string) => {
        saveStateToHistory()
        const now = Date.now()
        const p1Id = `wall-${id}-p1-${now}`
        const p2Id = `wall-${id}-p2-${now}`

        setWalls(prev => {
            const wall = prev.find(w => w.id === id)
            if (!wall) return prev
            const mid = {
                x: (wall.start.x + wall.end.x) / 2,
                y: (wall.start.y + wall.end.y) / 2
            }
            const p1 = { ...wall, id: p1Id, end: mid }
            const p2 = { ...wall, id: p2Id, start: mid }
            const newWalls = prev.filter(w => w.id !== id).concat([p1, p2])
            setRooms(detectRoomsGeometrically(newWalls, rooms))
            return newWalls
        })
        setSelectedWallId(p1Id)
    }

    const handleUpdateRoom = (id: string, updates: Partial<Room>) => {
        saveStateToHistory()
        setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
    }

    const handleUpdateWallThickness = (id: string, thickness: number) => {
        saveStateToHistory()
        setWalls(prev => prev.map(w => w.id === id ? { ...w, thickness } : w))
    }

    const handleDragElement = (type: "door" | "window", id: string, newT: number) => {
        if (type === "door") {
            setDoors(prev => prev.map(d => d.id === id ? { ...d, t: newT } : d))
        } else {
            setWindows(prev => prev.map(w => w.id === id ? { ...w, t: newT } : w))
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
            return workingWalls.concat(addedJogs)
        })
    }

    const handleDragVertex = (originalPoint: Point, totalDelta: Point) => {
        setWalls(prevWalls => {
            if (!wallSnapshot) return prevWalls

            let workingWalls = JSON.parse(JSON.stringify(wallSnapshot)) as Wall[]
            const movedNodes = new Set<string>()

            const recursivePush = (p: Point, d: Point) => {
                const key = `${Math.round(p.x)},${Math.round(p.y)}`
                if (movedNodes.has(key)) return
                movedNodes.add(key)

                const TOL = 5.0
                const isSame = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL

                workingWalls.forEach(w => {
                    const isWH = Math.abs(w.start.y - w.end.y) < 1.0
                    const isWV = Math.abs(w.start.x - w.end.x) < 1.0

                    if (isSame(w.start, p)) {
                        if (isWV && d.x !== 0) {
                            w.start.x += d.x
                            recursivePush({ x: w.end.x - d.x, y: w.end.y }, { x: d.x, y: 0 })
                            w.end.x += d.x
                        } else if (isWH && d.y !== 0) {
                            w.start.y += d.y
                            recursivePush({ x: w.end.x, y: w.end.y - d.y }, { x: 0, y: d.y })
                            w.end.y += d.y
                        } else {
                            w.start.x += d.x
                            w.start.y += d.y
                        }
                    } else if (isSame(w.end, p)) {
                        if (isWV && d.x !== 0) {
                            w.end.x += d.x
                            recursivePush({ x: w.start.x - d.x, y: w.start.y }, { x: d.x, y: 0 })
                            w.start.x += d.x
                        } else if (isWH && d.y !== 0) {
                            w.end.y += d.y
                            recursivePush({ x: w.start.x, y: w.start.y - d.y }, { x: 0, y: d.y })
                            w.start.y += d.y
                        } else {
                            w.end.x += d.x
                            w.end.y += d.y
                        }
                    }
                })
            }

            // Iniciamos la propagación desde el vértice arrastrado
            recursivePush(originalPoint, totalDelta)

            return workingWalls
        })
    }

    const handleDragEnd = () => {
        setWallSnapshot(null)
        setWalls(prev => {
            const processed = prev.map(w => {
                if (w.id.startsWith('jog-')) {
                    return { ...w, id: `w-${Math.random().toString(36).substr(2, 9)}` }
                }
                return w
            })
            const splitResult = fragmentWalls(processed)
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

            const isHorizontal = Math.abs(wall.start.y - wall.end.y) < 1
            const isVertical = Math.abs(wall.start.x - wall.end.x) < 1

            let startIsMin = isHorizontal ? (wall.start.x < wall.end.x) : (wall.start.y < wall.end.y)
            let anchorEnd = (side === "left" ? (startIsMin ? "end" : "start") : (startIsMin ? "start" : "end"))
            let movingEnd = (side === "left" ? (startIsMin ? "start" : "end") : (startIsMin ? "end" : "start"))

            const anchorPoint = anchorEnd === "start" ? wall.start : wall.end
            const movingPoint = movingEnd === "start" ? wall.start : wall.end

            const dx = wall.end.x - wall.start.x
            const dy = wall.end.y - wall.start.y
            const currentLength = Math.sqrt(dx * dx + dy * dy)
            if (currentLength === 0) return prevWalls

            const ux = dx / currentLength
            const uy = dy / currentLength

            let newPoint = {
                x: Math.round(anchorPoint.x + ux * newLength * (movingEnd === "start" ? -1 : 1)),
                y: Math.round(anchorPoint.y + uy * newLength * (movingEnd === "start" ? -1 : 1))
            }

            const delta = { x: newPoint.x - movingPoint.x, y: newPoint.y - movingPoint.y }

            let workingWalls = JSON.parse(JSON.stringify(prevWalls)) as Wall[]
            const movedVertices = new Set<string>()

            const recursiveMove = (p: Point, d: Point) => {
                const rx = Math.round(p.x)
                const ry = Math.round(p.y)
                const pKey = `${rx},${ry}`
                if (movedVertices.has(pKey)) return
                movedVertices.add(pKey)

                const TOL = 5.0
                const isSame = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL

                workingWalls.forEach(w => {
                    const isWHorizontal = Math.abs(w.start.y - w.end.y) < 1.0
                    const isWVertical = Math.abs(w.start.x - w.end.x) < 1.0

                    if (isSame(w.start, p)) {
                        w.start.x += d.x; w.start.y += d.y
                        if ((isWHorizontal && d.y !== 0) || (isWVertical && d.x !== 0)) {
                            recursiveMove({ x: w.end.x - d.x, y: w.end.y - d.y }, d)
                        }
                    } else if (isSame(w.end, p)) {
                        w.end.x += d.x; w.end.y += d.y
                        if ((isWHorizontal && d.y !== 0) || (isWVertical && d.x !== 0)) {
                            recursiveMove({ x: w.start.x - d.x, y: w.start.y - d.y }, d)
                        }
                    }
                })
            }

            recursiveMove(movingPoint, delta)

            let finalWalls = workingWalls.map(w => ({
                ...w,
                start: { x: Math.round(w.start.x), y: Math.round(w.start.y) },
                end: { x: Math.round(w.end.x), y: Math.round(w.end.y) }
            }))

            const splitResult = fragmentWalls(finalWalls)
            setRooms(detectRoomsGeometrically(splitResult, rooms))
            return splitResult
        })
    }

    const findClosestWall = (p: Point) => {
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
        }
    }

    const handleMouseDown = (point: Point) => {
        switch (activeTool) {
            case "erase":
                if (hoveredWallId) {
                    deleteWall(hoveredWallId)
                }
                break

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
                if (closest && closest.dist < 20) {
                    saveStateToHistory()
                    setDoors([...doors, {
                        id: `door-${Date.now()}`,
                        wallId: closest.wallId,
                        t: closest.t,
                        width: 80
                    }])
                }
                break
            }

            case "window": {
                const closest = findClosestWall(point)
                if (closest && closest.dist < 20) {
                    saveStateToHistory()
                    setWindows([...windows, {
                        id: `window-${Date.now()}`,
                        wallId: closest.wallId,
                        t: closest.t,
                        width: 100,
                        height: 10
                    }])
                }
                break
            }
        }
    }
    const handleMouseMove = (point: Point) => {
        if (activeTool === "wall" && currentWall) {
            setCurrentWall({ ...currentWall, end: point })
        }
    }

    const handleMouseUp = (point: Point) => {
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
            console.error("[v0] Exception saving plan:", error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] w-full gap-4">
            <Card className="p-2 flex items-center justify-between bg-white/80 backdrop-blur shadow-sm border-slate-200">
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
                        variant={activeTool === "erase" ? "default" : "ghost"}
                        size="icon"
                        onClick={() => setActiveTool("erase")}
                        title="Borrar (E)"
                    >
                        <Eraser className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClearPlan}
                        title="Limpiar Todo"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
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
                    activeTool={activeTool}
                    hoveredWallId={hoveredWallId}
                    selectedWallId={selectedWallId}
                    onPan={(x: number, y: number) => setOffset({ x, y })}
                    onZoom={setZoom}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onHoverWall={setHoveredWallId}
                    onSelectWall={(id: string | null) => {
                        setSelectedWallId(id)
                        // No limpiamos el roomId si se selecciona un wall, es útil para el contexto
                    }}
                    onDragWall={(id: string, totalDelta: Point) => handleDragWall(id, totalDelta)}
                    onDragEnd={handleDragEnd}
                    onUpdateWallLength={handleUpdateWallLength}
                    onDeleteWall={deleteWall}
                    onSplitWall={handleSplitWall}
                    onUpdateWallThickness={handleUpdateWallThickness}
                    onUpdateRoom={handleUpdateRoom}
                    selectedRoomId={selectedRoomId}
                    onSelectRoom={(id: string | null) => {
                        setSelectedRoomId(id)
                    }}
                    onDragVertex={handleDragVertex}
                    wallSnapshot={wallSnapshot}
                    onStartDragWall={() => {
                        saveStateToHistory()
                        setWallSnapshot(JSON.parse(JSON.stringify(walls)))
                    }}
                    onDragElement={handleDragElement}
                />

                <div className="absolute bottom-4 left-4 p-3 bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200 text-[10px] text-slate-500 shadow-sm pointer-events-none">
                    <p>• Rueda: Zoom</p>
                    <p>• Click derecho/Arrastrar: Pan</p>
                    <p>• Click: Dibujar punto</p>
                </div>
            </div>
        </div>
    )
}
