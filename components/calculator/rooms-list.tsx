"use client"

import { RoomCard } from "./room-card"
import type { Room, CalefaccionType, ElectricalConfig } from "@/types/calculator"
import type { GlobalConfig } from "@/types"

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
      {rooms.map((room) => {
        const matchingDemolitionRoom = isReform
          ? demolitionRooms.find((dr) => dr.type === room.type && dr.number === room.number)
          : undefined

        // Mostrar número si hay más de una habitación del mismo tipo o si siempre debería mostrarse
        const forceShowNumber = roomCounts[room.type] > 1

        return (
          <RoomCard
            key={room.id}
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
        )
      })}
    </div>
  )
}
