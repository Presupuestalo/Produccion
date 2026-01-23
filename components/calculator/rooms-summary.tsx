"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home } from "lucide-react"
import type { Room } from "@/types/calculator"
import { formatNumber } from "@/lib/utils/format"

interface RoomsSummaryProps {
  rooms: Room[]
}

const TIPOS_SIN_NUMERAR = [
  "pasillo",
  "cocina",
  "cocina abierta",
  "cocina americana",
  "cocina ampliada",
  "salon",
  "salón",
  "salon comedor",
  "salón comedor",
  "trastero",
  "hall",
  "recibidor",
  "terraza",
  "balcon",
  "balcón",
  "lavadero",
  "despensa",
  "comedor",
]

export function RoomsSummary({ rooms }: RoomsSummaryProps) {
  const totalArea = rooms.reduce((sum, room) => sum + (room.area || 0), 0)

  const getRoomDisplayName = (room: Room): string => {
    // Si tiene nombre personalizado, usarlo directamente
    if (room.name) {
      const tipoBase = room.name
        .replace(/\s*\d+$/, "")
        .toLowerCase()
        .trim()
      if (TIPOS_SIN_NUMERAR.includes(tipoBase)) {
        // Quitar el número si existe
        return room.name.replace(/\s*\d+$/, "").trim()
      }
      return room.name
    }

    // Si es tipo "Otro" y tiene customRoomType, mostrar el tipo personalizado
    if (room.type === "Otro" && room.customRoomType) {
      return room.customRoomType
    }

    const tipoNormalizado = (room.type || "").toLowerCase().trim()

    // Si es un tipo que no necesita número, mostrar solo el tipo
    if (TIPOS_SIN_NUMERAR.includes(tipoNormalizado)) {
      return room.type || ""
    }

    // Para otros tipos (dormitorios, baños), mostrar tipo + número
    return `${room.type || ""} ${room.number || ""}`.trim()
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Home className="h-4 w-4" />
          Resumen de Habitaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          {rooms.map((room, index) => (
            <div
              key={room.id || index}
              className="flex justify-between items-center py-1 text-xs border-b last:border-b-0"
            >
              <span className="font-medium truncate">{getRoomDisplayName(room)}</span>
              <span className="font-semibold whitespace-nowrap ml-2">{formatNumber(room.area || 0)} m²</span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t-2 border-primary/20">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold">Total</span>
            <span className="text-sm font-bold text-primary">{formatNumber(totalArea)} m²</span>
          </div>
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-xs">No hay habitaciones añadidas</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
