"use client"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Room, Wall, isPointOnSegment } from "@/lib/utils/geometry"
import { Ruler, DoorOpen, Maximize, Boxes } from "lucide-react"

interface Door { id: string; wallId: string; width: number }
interface Window { id: string; wallId: string; width: number }

interface FloorPlanSummaryProps {
    rooms: Room[]
    walls: Wall[]
    doors: Door[]
    windows: Window[]
}

export function FloorPlanSummary({ rooms, walls, doors, windows }: FloorPlanSummaryProps) {
    // 1. Global Stats (Exclude invisible walls)
    const totalArea = rooms.reduce((acc, r) => acc + r.area, 0)
    const totalWallsLength = walls.reduce((acc, w) => {
        if (w.isInvisible) return acc
        const len = Math.sqrt(Math.pow(w.end.x - w.start.x, 2) + Math.pow(w.end.y - w.start.y, 2))
        return acc + len
    }, 0) / 100 // Convert cm to meters

    const totalDoors = doors.length
    const totalWindows = windows.length

    // 2. Per Room Stats
    const roomStats = rooms.map(room => {
        // Calculate Perimeter
        let perimeter = 0
        for (let i = 0; i < room.polygon.length; i++) {
            const p1 = room.polygon[i]
            const p2 = room.polygon[(i + 1) % room.polygon.length]
            const segmentLen = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))

            // Check if this segment corresponds to an invisible wall
            // We check if the midpoint of the segment lies on any invisible wall
            const midX = (p1.x + p2.x) / 2
            const midY = (p1.y + p2.y) / 2

            // Should match exactly an invisible wall segment or be part of it
            const isOnInvisible = walls.some(w => {
                if (!w.isInvisible) return false
                // Check if midpoint of polygon edge is on the wall segment
                // Tolerance 1.0 is default in geometry utils
                return isPointOnSegment({ x: midX, y: midY }, w.start, w.end)
            })

            if (!isOnInvisible) {
                perimeter += segmentLen
            }
        }

        // Count associated doors/windows
        const roomWalls = walls.filter(w => {
            const TOL = 5.0
            const isSame = (p1: { x: number, y: number }, p2: { x: number, y: number }) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < TOL

            // A wall belongs to a room if BOTH its start and end are vertices of the room polygon?
            // No, walls are shared. A wall is "part of" the room if it aligns with the polygon edges.
            // We can use the same logic as above: check if wall midpoint is on room polygon perimeter?
            // Or check if wall endpoints match polygon vertices.

            // Since walls are fragmented, wall endpoints should match polygon vertices (possibly skipping vertices if wall is long? no, fragmentation ensures split).

            const startIn = room.polygon.some(p => isSame(p, w.start))
            const endIn = room.polygon.some(p => isSame(p, w.end))
            return startIn && endIn
        })

        const roomDoors = doors.filter(d => roomWalls.some(w => w.id === d.wallId)).length
        const roomWindows = windows.filter(win => roomWalls.some(w => w.id === win.wallId)).length

        return {
            ...room,
            perimeter: perimeter / 100, // m
            doorCount: roomDoors,
            windowCount: roomWindows
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
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-xs font-medium">Ventanas</CardTitle>
                        <Boxes className="h-3 w-3 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-xl font-bold">{totalWindows}</div>
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
                                <TableHead className="h-8 text-xs text-right">Perímetro</TableHead>
                                <TableHead className="h-8 text-xs text-right">P.</TableHead>
                                <TableHead className="h-8 text-xs text-right">V.</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roomStats.map((room) => (
                                <TableRow key={room.id} className="h-9">
                                    <TableCell className="font-medium text-xs py-1">{room.name || "-"}</TableCell>
                                    <TableCell className="text-xs text-right py-1">{room.area.toFixed(2)}</TableCell>
                                    <TableCell className="text-xs text-right py-1">{room.perimeter.toFixed(2)}</TableCell>
                                    <TableCell className="text-xs text-right py-1">{room.doorCount}</TableCell>
                                    <TableCell className="text-xs text-right py-1">{room.windowCount}</TableCell>
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
