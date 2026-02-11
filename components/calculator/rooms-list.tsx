"use client"

import { useState } from "react"
import { RoomCard } from "./room-card"
import type { Room, CalefaccionType, ElectricalConfig, GlobalConfig } from "@/types/calculator"
import { cn } from "@/lib/utils"
import { List, Columns2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RoomsListProps {
  rooms: Room[]
  updateRoom: (roomId: string, updates: Partial<Room>) => void
  removeRoom: (roomId: string) => void
  standardHeight: number
  heatingType: CalefaccionType
  openCalculator?: (roomId: string, field: "width" | "length" | "area" | "perimeter") => void
  isReform?: boolean
  globalConfig?: GlobalConfig
  electricalConfig?: ElectricalConfig
  duplicateRoom?: (roomId: string) => void
  demolitionRooms?: Room[]
  highlightedRoomId?: string | null
  selectedRoomId?: string | null
  setSelectedRoomId?: (id: string | null) => void
  activeTab?: string
}

export function RoomsList({
  rooms,
  updateRoom,
  removeRoom,
  standardHeight,
  heatingType,
  openCalculator,
  isReform = false,
  globalConfig,
  electricalConfig,
  duplicateRoom,
  demolitionRooms = [],
  highlightedRoomId,
}: RoomsListProps) {
  const [viewMode, setViewMode] = useState<"list" | "slide">("list")

  // Calcular conteo de habitaciones por tipo
  const roomCounts = rooms.reduce(
    (acc, room) => {
      acc[room.type] = (acc[room.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-4">
      {/* Selector de vista en móvil */}
      <div className="flex justify-between items-center lg:hidden bg-slate-50 p-2 rounded-lg border border-slate-200">
        <span className="text-sm font-medium text-slate-600 ml-2">Vista de habitaciones</span>
        <div className="flex gap-1 bg-white p-1 rounded-md border border-slate-200 shadow-sm">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-8 px-3 gap-2",
              viewMode === "list" ? "bg-orange-500 hover:bg-orange-600 text-white" : "text-slate-500",
            )}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
            <span className="text-xs">Lista</span>
          </Button>
          <Button
            variant={viewMode === "slide" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-8 px-3 gap-2",
              viewMode === "slide" ? "bg-orange-500 hover:bg-orange-600 text-white" : "text-slate-500",
            )}
            onClick={() => setViewMode("slide")}
          >
            <Columns2 className="h-4 w-4" />
            <span className="text-xs">Slide</span>
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "grid gap-4",
          viewMode === "list"
            ? "grid-cols-1"
            : "flex lg:grid lg:grid-cols-1 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none pb-4 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide",
        )}
      >
        {rooms.map((room) => {
          const matchingDemolitionRoom = isReform
            ? demolitionRooms.find((dr) => dr.type === room.type && dr.number === room.number)
            : undefined

          // Mostrar número si hay más de una habitación del mismo tipo o si siempre debería mostrarse
          const forceShowNumber = roomCounts[room.type] > 1

          return (
            <div
              key={room.id}
              className={cn(
                "w-full transition-all duration-300",
                viewMode === "slide" && "min-w-[85vw] sm:min-w-[70vw] lg:min-w-full snap-center",
                highlightedRoomId === room.id && "ring-2 ring-orange-500 rounded-lg shadow-lg",
              )}
            >
              <RoomCard
                room={room}
                updateRoom={updateRoom}
                removeRoom={removeRoom}
                standardHeight={standardHeight}
                heatingType={heatingType}
                openCalculator={openCalculator}
                isReform={isReform}
                globalConfig={globalConfig}
                needsNewElectricalInstallation={electricalConfig?.needsNewInstallation}
                electricalConfig={electricalConfig}
                onDuplicate={duplicateRoom}
                demolitionRoom={matchingDemolitionRoom}
                isHighlighted={room.id === highlightedRoomId}
                forceShowNumber={forceShowNumber}
                existingRooms={rooms}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
