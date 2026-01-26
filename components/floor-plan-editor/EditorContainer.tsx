"use client"
import React, { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
const CanvasEngine = dynamic(() => import("./CanvasEngine").then((mod) => mod.CanvasEngine), { ssr: false })
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MousePointer2, Pencil, Eraser, ZoomIn, ZoomOut, Maximize, Sparkles, Save, Undo2, Redo2, DoorClosed, Layout, Trash2 } from "lucide-react"
import { detectRoomsGeometrically } from "@/lib/utils/geometry"

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
    const [doors, setDoors] = useState<any[]>([])
    const [windows, setWindows] = useState<any[]>([])
    const [activeTool, setActiveTool] = useState<"select" | "wall" | "erase" | "door" | "window">("wall")
    const [selectedWallId, setSelectedWallId] = useState<string | null>(null)
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Historial para deshacer/rehacer
    const [history, setHistory] = useState<any[]>([])
    const historyRef = useRef<any[]>([])
    const [redoHistory, setRedoHistory] = useState<any[]>([])
    const redoHistoryRef = useRef<any[]>([])

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
    }, [])

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

    const splitWallsAtIntersections = (wallsToProcess: Wall[]) => {
        let result = [...wallsToProcess]
        let changed = true

        while (changed) {
            changed = false
            for (let i = 0; i < result.length; i++) {
                const w1 = result[i]
                let splitPoint: Point | null = null
                let wallToSplitIndex = -1

                for (let j = 0; j < result.length; j++) {
                    if (i === j) continue
                    const w2 = result[j]

                    const TOL = 2.0
                    const onSegment = (p: Point, s: Point, e: Point) => {
                        const d = Math.sqrt(Math.pow(e.x - s.x, 2) + Math.pow(e.y - s.y, 2))
                        if (d < 1) return false
                        const d1 = Math.sqrt(Math.pow(p.x - s.x, 2) + Math.pow(p.y - s.y, 2))
                        const d2 = Math.sqrt(Math.pow(p.x - e.x, 2) + Math.pow(p.y - e.y, 2))
                        return Math.abs(d - (d1 + d2)) < TOL && d1 > TOL && d2 > TOL
                    }

                    if (onSegment(w2.start, w1.start, w1.end)) {
                        splitPoint = w2.start
                        wallToSplitIndex = i
                        break
                    }
                    if (onSegment(w2.end, w1.start, w1.end)) {
                        splitPoint = w2.end
                        wallToSplitIndex = i
                        break
                    }
                }

                if (splitPoint && wallToSplitIndex !== -1) {
                    const original = result[wallToSplitIndex]
                    const part1 = { ...original, id: `wall-${original.id}-p1-${Date.now()}`, end: splitPoint }
                    const part2 = { ...original, id: `wall-${original.id}-p2-${Date.now()}`, start: splitPoint }
                    result.splice(wallToSplitIndex, 1, part1, part2)
                    changed = true
                    break
                }
            }
        }
        return result
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

    const handleDragWall = (id: string, delta: Point) => {
        setWalls(prevWalls => {
            const wallToMove = prevWalls.find(w => w.id === id)
            if (!wallToMove) return prevWalls

            const isH = Math.abs(wallToMove.start.y - wallToMove.end.y) < 1
            const isV = Math.abs(wallToMove.start.x - wallToMove.end.x) < 1

            const forcedDelta = {
                x: isV ? delta.x : (isH ? 0 : delta.x),
                y: isH ? delta.y : (isV ? 0 : delta.y)
            }

            const TOL = 5.0 // Connection tolerance
            const isSame = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL

            return prevWalls.map(w => {
                if (w.id === id) {
                    return {
                        ...w,
                        start: { x: w.start.x + forcedDelta.x, y: w.start.y + forcedDelta.y },
                        end: { x: w.end.x + forcedDelta.x, y: w.end.y + forcedDelta.y }
                    }
                }

                let newStart = { ...w.start }
                let newEnd = { ...w.end }
                let changed = false

                if (isSame(w.start, wallToMove.start) || isSame(w.start, wallToMove.end)) {
                    newStart.x += forcedDelta.x
                    newStart.y += forcedDelta.y
                    changed = true
                }
                if (isSame(w.end, wallToMove.start) || isSame(w.end, wallToMove.end)) {
                    newEnd.x += forcedDelta.x
                    newEnd.y += forcedDelta.y
                    changed = true
                }

                return changed ? { ...w, start: newStart, end: newEnd } : w
            })
        })
    }

    const handleDragVertex = (originalPoint: Point, delta: Point) => {
        setWalls(prevWalls => {
            const TOL = 5.0
            const isSame = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL

            const updatedWalls = prevWalls.map(w => {
                let newStart = { ...w.start }
                let newEnd = { ...w.end }
                let changed = false

                const isWHorizontal = Math.abs(w.start.y - w.end.y) < 1.0
                const isWVertical = Math.abs(w.start.x - w.end.x) < 1.0

                if (isSame(w.start, originalPoint)) {
                    if (isWHorizontal) newStart.y += delta.y // Si es horizontal y muevo en Y, muevo toda la línea? No, eso es dragWall.
                    // En estirar vértice:
                    // Si la pared es HORIZONTAL, el vértice solo puede moverse en X para estirar?
                    // No, si muevo el vértice en Y, la pared se inclinaría.
                    // Para SEGUIR siendo horizontal, si muevo el vértice en Y debo mover el otro punto también? No, eso es mover la pared.
                    // El usuario dice "estirar". 
                    if (isWHorizontal) {
                        newStart.x += delta.x
                    } else if (isWVertical) {
                        newStart.y += delta.y
                    } else {
                        newStart.x += delta.x
                        newStart.y += delta.y
                    }
                    changed = true
                }
                if (isSame(w.end, originalPoint)) {
                    if (isWHorizontal) {
                        newEnd.x += delta.x
                    } else if (isWVertical) {
                        newEnd.y += delta.y
                    } else {
                        newEnd.x += delta.x
                        newEnd.y += delta.y
                    }
                    changed = true
                }

                return changed ? { ...w, start: newStart, end: newEnd } : w
            })

            return updatedWalls
        })
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

            const splitResult = splitWallsAtIntersections(finalWalls)
            setRooms(detectRoomsGeometrically(splitResult, rooms))
            return splitResult
        })
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
        if (activeTool === "erase" && hoveredWallId) {
            deleteWall(hoveredWallId)
            return
        }

        if (activeTool === "wall") {
            // Si ya hay una pared en progreso (chaining), el click la "confirma" e inicia la siguiente
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
                    const newWalls = splitWallsAtIntersections([...walls, newWall])
                    setWalls(newWalls)
                    const nextRooms = detectRoomsGeometrically(newWalls, rooms)
                    setRooms(nextRooms)

                    // Si se ha cerrado una habitación, detener el encadenamiento
                    if (nextRooms.length > rooms.length) {
                        setCurrentWall(null)
                    } else {
                        // Iniciar la siguiente automáticamente desde donde terminó esta
                        setCurrentWall({ start: point, end: point })
                    }
                }
            } else {
                // Inicio normal de la primera pared
                setCurrentWall({ start: point, end: point })
            }
        }

        if (activeTool === "door") {
            saveStateToHistory()
            setDoors([...doors, {
                id: `door-${Date.now()}`,
                position: point,
                width: 40,
                angle: 0
            }])
        }

        if (activeTool === "window") {
            saveStateToHistory()
            setWindows([...windows, {
                id: `window-${Date.now()}`,
                position: point,
                width: 60,
                angle: 0
            }])
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
                const newWalls = splitWallsAtIntersections([...walls, newWall])
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

    const handleDragEnd = () => {
        const splitResult = splitWallsAtIntersections(walls)
        setWalls(splitResult)
        setRooms(detectRoomsGeometrically(splitResult, rooms))
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
                    onDragWall={(id: string, delta: Point) => handleDragWall(id, delta)}
                    onDragEnd={handleDragEnd}
                    onUpdateWallLength={handleUpdateWallLength}
                    onDeleteWall={deleteWall}
                    onSplitWall={handleSplitWall}
                    onUpdateWallThickness={handleUpdateWallThickness}
                    onUpdateRoom={handleUpdateRoom}
                    selectedRoomId={selectedRoomId}
                    onSelectRoom={(id: string | null) => {
                        setSelectedRoomId(id)
                        // No limpiamos el wallId si se selecciona un room, es útil para el contexto
                    }}
                    onDragVertex={handleDragVertex}
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
