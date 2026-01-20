"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Room, RoomType } from "@/types/calculator"
import { canAddRoom } from "@/lib/services/subscription-limits-service"

interface RoomTemplatesProps {
  addRoom: (room: Room) => void
  standardHeight: number
  projectId?: string
  activeTab?: "demolition" | "reform"
}

export function RoomTemplates({ addRoom, standardHeight, projectId, activeTab = "reform" }: RoomTemplatesProps) {
  const [selectedType, setSelectedType] = useState<RoomType>("Salón")
  const [customRoomType, setCustomRoomType] = useState("")
  const [showRoomLimitDialog, setShowRoomLimitDialog] = useState(false)
  const [roomLimitMessage, setRoomLimitMessage] = useState("")

  const getDefaultMaterials = (roomType: string) => {
    switch (roomType) {
      case "Baño":
      case "Cocina":
        return { floor: "Cerámico", wall: "Cerámica" }
      case "Terraza":
        return { floor: "Cerámico", wall: "No se modifica" }
      default:
        // Cocina Americana, Cocina Abierta, Salón, Dormitorio, etc.
        return { floor: "Parquet flotante", wall: "Lucir y pintar" }
    }
  }

  const createRoom = async () => {
    if (projectId) {
      console.log(
        "[v0] RoomTemplates - Verificando límites de habitaciones para proyecto:",
        projectId,
        "sección:",
        activeTab,
      )
      const limitCheck = await canAddRoom(projectId, activeTab)
      if (!limitCheck.allowed) {
        console.log("[v0] RoomTemplates - Límite de habitaciones alcanzado:", limitCheck.reason)
        setRoomLimitMessage(limitCheck.reason || "Has alcanzado el límite de habitaciones de tu plan.")
        setShowRoomLimitDialog(true)
        return
      }
      console.log("[v0] RoomTemplates - Límites OK, añadiendo habitación...")
    }

    const roomNumber = 1

    const defaultMaterials = getDefaultMaterials(selectedType)

    const newRoom: Room = {
      id: crypto.randomUUID(), // Usando crypto.randomUUID()
      type: selectedType,
      number: roomNumber,
      doors: 0,
      falseCeiling: false,
      moldings: false,
      measurementMode: "rectangular",
      width: 0,
      length: 0,
      area: 0,
      perimeter: 0,
      wallSurface: 0,
      floorMaterial: defaultMaterials.floor,
      wallMaterial: defaultMaterials.wall,
      windows: [],
      demolishWall: false,
      demolishCeiling: false,
      removeFloor: false,
      removeWallTiles: false,
      removeBathroomElements: false,
      removeKitchenFurniture: false,
      removeBedroomFurniture: false,
      hasRadiator: false,
      removeSewagePipes: false,
      hasDoors: false,
    }

    if (selectedType === "Otro" && customRoomType.trim()) {
      newRoom.customRoomType = customRoomType.trim()
    }

    addRoom(newRoom)

    if (selectedType === "Otro") {
      setCustomRoomType("")
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="p-3">
          <CardTitle className="text-sm">Añadir habitación</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="roomType" className="text-xs">
                Tipo de habitación
              </Label>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as RoomType)}>
                <SelectTrigger id="roomType" className="h-8 text-xs">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Salón">Salón</SelectItem>
                  <SelectItem value="Cocina">Cocina</SelectItem>
                  {/* Cocina Abierta removida - ahora usa valores por defecto como Cocina Americana */}
                  <SelectItem value="Cocina Americana">Cocina Americana</SelectItem>
                  <SelectItem value="Baño">Baño</SelectItem>
                  <SelectItem value="Dormitorio">Dormitorio</SelectItem>
                  <SelectItem value="Pasillo">Pasillo</SelectItem>
                  <SelectItem value="Hall">Hall</SelectItem>
                  <SelectItem value="Terraza">Terraza</SelectItem>
                  <SelectItem value="Trastero">Trastero</SelectItem>
                  <SelectItem value="Vestidor">Vestidor</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={createRoom}
              className="h-8 text-xs shrink-0"
              disabled={selectedType === "Otro" && !customRoomType.trim()}
            >
              + Añadir
            </Button>
          </div>

          {selectedType === "Otro" && (
            <div className="space-y-1">
              <Label htmlFor="customRoomType" className="text-xs">
                Especificar tipo
              </Label>
              <Input
                id="customRoomType"
                value={customRoomType}
                onChange={(e) => setCustomRoomType(e.target.value)}
                placeholder="Ej: Biblioteca, Gimnasio, etc."
                className="h-8 text-xs"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showRoomLimitDialog} onOpenChange={setShowRoomLimitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Límite de habitaciones alcanzado</AlertDialogTitle>
            <AlertDialogDescription>{roomLimitMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => (window.location.href = "/dashboard/planes")}>
              Ver Planes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
