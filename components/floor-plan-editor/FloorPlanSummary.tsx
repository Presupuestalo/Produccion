"use client"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Room, Wall, isPointOnSegment, isPointInPolygon, calculateRoomStats } from "@/lib/utils/geometry"
import { Ruler, DoorOpen, Maximize, Grid3X3 } from "lucide-react"

// Custom Window Icon: Simplified clean design with central division and sill
const CustomWindowIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* Marco principal de la ventana */}
        <rect x="3" y="4" width="18" height="15" rx="1" />
        {/* DivisiÃ³n central vertical */}
        <line x1="12" y1="4" x2="12" y2="19" />
        {/* Base / Repisa inferior (mÃ¡s ancha para carÃ¡cter arquitectÃ³nico) */}
        <line x1="1" y1="21" x2="23" y2="21" strokeWidth="2.5" />
    </svg>
)



interface Door { id: string; wallId: string; width: number, openType?: "single" | "double" | "sliding_rail" | "sliding_pocket" | "sliding" | "double_swing" | "exterior_sliding" }
interface Window { id: string; wallId: string; width: number, openType?: "single" | "double" | "sliding" }
interface Shunt { id: string; x: number; y: number; width: number; height: number }

interface FloorPlanSummaryProps {
    rooms: Room[]
    walls: Wall[]
    doors: Door[]
    windows: Window[]
    shunts: Shunt[]
    ceilingHeight?: number
}

export function FloorPlanSummary({ rooms, walls, doors, windows, shunts, ceilingHeight }: FloorPlanSummaryProps) {
    const filteredRooms = rooms.filter(r => r.area >= 1.0)

    // 1. Global Stats
    const totalArea = filteredRooms.reduce((acc, r) => acc + r.area, 0)
    const totalWallsLength = walls.reduce((acc, w) => {
        if (w.isInvisible) return acc
        const len = Math.sqrt(Math.pow(w.end.x - w.start.x, 2) + Math.pow(w.end.y - w.start.y, 2))
        return acc + len
    }, 0) / 100 // Convert cm to meters

    // Global Breakdown
    const doorsSimple = doors.filter(d => !d.openType || d.openType === "single").length
    const doorsDouble = doors.filter(d => d.openType === "double").length
    const doorsDoubleSwing = doors.filter(d => d.openType === "double_swing").length
    const doorsSlidingRail = doors.filter(d => d.openType === "sliding_rail" || d.openType === "exterior_sliding").length
    const doorsSlidingPocket = doors.filter(d => d.openType === "sliding_pocket" || d.openType === "sliding").length
    const totalDoors = doors.length

    const winSimple = windows.filter(w => !w.openType || w.openType === "single").length
    const winDouble = windows.filter(w => w.openType === "double").length
    const totalWindows = windows.length

    // 2. Per Room Stats
    const roomStats = filteredRooms.map(room => {
        const stats = calculateRoomStats(room, walls, shunts)
        return {
            ...room,
            ...stats
        }
    })

    const totalCeramicFloorArea = roomStats.reduce((acc, r) => acc + (r.hasCeramicFloor ? r.area : 0), 0)
    const totalCeramicWallArea = roomStats.reduce((acc, r) => acc + (r.ceramicWallLength || 0), 0) * ((ceilingHeight || 250) / 100)

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
                        <div className="text-xl font-bold">{totalArea.toFixed(2).replace('.', ',')} m²</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-xs font-medium">Muros (Total)</CardTitle>
                        <Ruler className="h-3 w-3 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-xl font-bold">{totalWallsLength.toFixed(2).replace('.', ',')} ml</div>
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
                                <span>Abatibles Dobles</span>
                                <span className="font-medium text-foreground">{doorsDouble}</span>
                            </div>
                            {doorsDoubleSwing > 0 && (
                                <div className="flex justify-between items-center">
                                    <span>Doble Abatible</span>
                                    <span className="font-medium text-foreground">{doorsDoubleSwing}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span>Corredera Exterior</span>
                                <span className="font-medium text-foreground">{doorsSlidingRail}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Corredera Empotrada</span>
                                <span className="font-medium text-foreground">{doorsSlidingPocket}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-xs font-medium">Ventanas</CardTitle>
                        <CustomWindowIcon className="h-3 w-3 text-muted-foreground" />
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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-xs font-medium">Cerámica</CardTitle>
                        <Grid3X3 className="h-3 w-3 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-[10px] text-muted-foreground space-y-2">
                            <div className="flex justify-between items-center">
                                <span>Suelo Cerámico</span>
                                <span className="font-bold text-foreground">{totalCeramicFloorArea.toFixed(2).replace('.', ',')} m²</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Paredes Cerámicas</span>
                                <span className="font-bold text-foreground">{totalCeramicWallArea.toFixed(2).replace('.', ',')} m²</span>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                                <span>Altura (Ref)</span>
                                <span className="font-medium text-foreground">{(ceilingHeight || 250)} cm</span>
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
                            {roomStats
                                .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { numeric: true, sensitivity: 'base' }))
                                .map((room) => (
                                    <TableRow key={room.id} className="h-9">
                                        <TableCell className="font-medium text-xs py-1 truncate max-w-[100px]" title={room.name}>{room.name || "-"}</TableCell>
                                        <TableCell className="text-xs text-right py-1">{room.area.toFixed(2).replace('.', ',')}</TableCell>
                                        <TableCell className="text-xs text-right py-1">{room.wallPerimeter.toFixed(2).replace('.', ',')}</TableCell>
                                        <TableCell className="text-xs text-right py-1 text-orange-600 font-medium">{room.columnPerimeter > 0 ? room.columnPerimeter.toFixed(2).replace('.', ',') : "-"}</TableCell>
                                        <TableCell className="text-xs text-right py-1 font-bold">{room.totalPerimeter.toFixed(2).replace('.', ',')}</TableCell>
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
