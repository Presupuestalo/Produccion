"use client"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Room, Wall, isPointOnSegment } from "@/lib/utils/geometry"
import { Ruler, DoorOpen, Maximize, Boxes } from "lucide-react"

// Helper for point in polygon
function isPointInPolygon(p: { x: number, y: number }, polygon: { x: number, y: number }[]) {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y
        const xj = polygon[j].x, yj = polygon[j].y
        const intersect = ((yi > p.y) !== (yj > p.y)) &&
            (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi)
        if (intersect) inside = !inside
    }
    return inside
}

interface Door { id: string; wallId: string; width: number, openType?: "single" | "double" | "sliding" }
interface Window { id: string; wallId: string; width: number, openType?: "single" | "double" }
interface Shunt { id: string; x: number; y: number; width: number; height: number }

interface FloorPlanSummaryProps {
    rooms: Room[]
    walls: Wall[]
    doors: Door[]
    windows: Window[]
    shunts: Shunt[]
}

export function FloorPlanSummary({ rooms, walls, doors, windows, shunts }: FloorPlanSummaryProps) {
    // 1. Global Stats
    const totalArea = rooms.reduce((acc, r) => acc + r.area, 0)
    const totalWallsLength = walls.reduce((acc, w) => {
        if (w.isInvisible) return acc
        const len = Math.sqrt(Math.pow(w.end.x - w.start.x, 2) + Math.pow(w.end.y - w.start.y, 2))
        return acc + len
    }, 0) / 100 // Convert cm to meters

    // Global Breakdown
    const doorsSimple = doors.filter(d => !d.openType || d.openType === "single").length
    const doorsDouble = doors.filter(d => d.openType === "double").length
    const doorsSliding = doors.filter(d => d.openType === "sliding").length
    const totalDoors = doors.length

    const winSimple = windows.filter(w => !w.openType || w.openType === "single").length
    const winDouble = windows.filter(w => w.openType === "double").length
    const totalWindows = windows.length

    // 2. Per Room Stats
    const roomStats = rooms.map(room => {
        // Calculate Wall Perimeter
        let wallPerimeter = 0
        for (let i = 0; i < room.polygon.length; i++) {
            const p1 = room.polygon[i]
            const p2 = room.polygon[(i + 1) % room.polygon.length]
            const segmentLen = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))

            // Check if this segment corresponds to an invisible wall
            const midX = (p1.x + p2.x) / 2
            const midY = (p1.y + p2.y) / 2

            const isOnInvisible = walls.some(w => {
                if (!w.isInvisible) return false
                return isPointOnSegment({ x: midX, y: midY }, w.start, w.end)
            })

            if (!isOnInvisible) {
                wallPerimeter += segmentLen
            }
        }

        // Calculate Column (Shunt) Perimeter
        // A shunt is inside if its center is inside the room polygon
        const roomShunts = shunts.filter(s => isPointInPolygon({ x: s.x, y: s.y }, room.polygon))
        const columnPerimeter = roomShunts.reduce((acc, s) => acc + (s.width * 2 + s.height * 2), 0)

        const wallPerimM = wallPerimeter / 100
        const colPerimM = columnPerimeter / 100

        return {
            ...room,
            wallPerimeter: wallPerimM,
            columnPerimeter: colPerimM,
            totalPerimeter: wallPerimM + colPerimM
        }
    })

    return (
        <div className="space-y-6">
            {/* Global Cards - 2x2 Grid for better fit in sidebar */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-xs font-medium">Área Total</CardTitle>
                        <Maximize className="h-3 w-3 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-xl font-bold">{totalArea.toFixed(2)} m²</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-xs font-medium">Muros (Total)</CardTitle>
                        <Ruler className="h-3 w-3 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-xl font-bold">{totalWallsLength.toFixed(2)} ml</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-xs font-medium">Puertas</CardTitle>
                        <DoorOpen className="h-3 w-3 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-xl font-bold">{totalDoors}</div>
                        <div className="text-[10px] text-muted-foreground mt-2 space-y-1">
                            <div className="flex justify-between items-center">
                                <span>Abatibles</span>
                                <span className="font-medium text-foreground">{doorsSimple}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Dobles</span>
                                <span className="font-medium text-foreground">{doorsDouble}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Correderas</span>
                                <span className="font-medium text-foreground">{doorsSliding}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-xs font-medium">Ventanas</CardTitle>
                        <Boxes className="h-3 w-3 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-xl font-bold">{totalWindows}</div>
                        <div className="text-[10px] text-muted-foreground mt-2 space-y-1">
                            <div className="flex justify-between items-center">
                                <span>Simples</span>
                                <span className="font-medium text-foreground">{winSimple}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Dobles</span>
                                <span className="font-medium text-foreground">{winDouble}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Separator />

            {/* Room Table */}
            <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px] h-8 text-xs">Habitación</TableHead>
                                <TableHead className="h-8 text-xs text-right">Área</TableHead>
                                <TableHead className="h-8 text-xs text-right">P. Muros</TableHead>
                                <TableHead className="h-8 text-xs text-right text-orange-600">P. Col.</TableHead>
                                <TableHead className="h-8 text-xs text-right font-bold">P. Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roomStats.map((room) => (
                                <TableRow key={room.id} className="h-9">
                                    <TableCell className="font-medium text-xs py-1 truncate max-w-[100px]" title={room.name}>{room.name || "-"}</TableCell>
                                    <TableCell className="text-xs text-right py-1">{room.area.toFixed(2)}</TableCell>
                                    <TableCell className="text-xs text-right py-1">{room.wallPerimeter.toFixed(2)}</TableCell>
                                    <TableCell className="text-xs text-right py-1 text-orange-600 font-medium">{room.columnPerimeter > 0 ? room.columnPerimeter.toFixed(2) : "-"}</TableCell>
                                    <TableCell className="text-xs text-right py-1 font-bold">{room.totalPerimeter.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                            {roomStats.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-16 text-xs text-muted-foreground">
                                        No hay habitaciones.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
