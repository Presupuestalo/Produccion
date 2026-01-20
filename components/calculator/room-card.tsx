"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  Tv,
  Footprints,
  CookingPot,
  Bath,
  Bed,
  Package,
  PlusCircle,
  Shirt,
  DoorOpen,
  GalleryVertical as RulerVertical,
  RefreshCw,
  Ruler,
  Edit,
  Zap,
  SquareIcon,
  Copy,
} from "lucide-react"
import type {
  Room,
  FloorMaterialType,
  WallMaterialType,
  MeasurementMode,
  Window,
  Door,
  DoorType,
  Door as DoorTypeAlias,
  RadiatorType,
  BathroomElement,
  ElectricalConfig, // Import ElectricalConfig
  CurrentCeilingStatus, // Import CurrentCeilingStatus
  CalefaccionType, // Import CalefaccionType
} from "@/types/calculator"
import { v4 as uuidv4 } from "uuid"
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { GlobalConfig } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"
import { RoomShapeEditorModal } from "./room-shape-editor-modal"

// Helper component to display tooltips (replace with actual import if it exists)
const QuickSummaryIcon = ({
  icon: Icon,
  content,
  label,
}: { icon: React.ElementType; content: React.ReactNode; label: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-pointer">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
        <div className="mt-1">{content}</div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

// /** rest of code here **/
// // Añadir prop demolitionRoom en la interfaz
interface RoomCardProps {
  room: Room
  updateRoom: (roomId: string, updates: Partial<Room>) => void
  removeRoom: (roomId: string) => void
  standardHeight: number
  heatingType: CalefaccionType
  openCalculator?: (roomId: string, field: "width" | "length" | "area" | "perimeter") => void
  isReform?: boolean
  globalConfig?: GlobalConfig
  needsNewElectricalInstallation?: boolean
  electricalConfig?: ElectricalConfig
  onDuplicate?: (roomId: string) => void
  demolitionRoom?: Room
}

// Actualizar la desestructuración de props para incluir globalConfig y demolitionRoom
export function RoomCard({
  room,
  updateRoom,
  removeRoom,
  standardHeight,
  heatingType,
  openCalculator,
  isReform = false,
  globalConfig,
  needsNewElectricalInstallation,
  electricalConfig,
  onDuplicate,
  demolitionRoom,
}: RoomCardProps) {
  // Estado para el acordeón
  const [isOpen, setIsOpen] = useState(true)
  // Estado para la pestaña activa dentro de la habitación
  const [activeTab, setActiveTab] = useState("general")
  const [doorList, setDoorList] = useState<Door[]>(room.doorList || [])

  // Sincronizar doorList con room.doorList cuando cambie
  useEffect(() => {
    if (room.doorList && JSON.stringify(room.doorList) !== JSON.stringify(doorList)) {
      setDoorList(room.doorList)
    }
  }, [room.doorList])

  const internalUpdateRoom = useCallback(
    (updates: Partial<Room>) => {
      updateRoom(room.id, updates)
      const updatedRoom = { ...room, ...updates }
      // onUpdate(updatedRoom) // Remove onUpdate as it's not in the new props
    },
    [room, updateRoom],
  )

  const addDoor = () => {
    const newDoor: Door = {
      id: `door-${Date.now()}`,
      type: "Abatible",
    }
    const newDoorList = [...doorList, newDoor]
    setDoorList(newDoorList)
    internalUpdateRoom({ doorList: newDoorList })
  }

  const removeDoor = (doorId: string) => {
    const newDoorList = doorList.filter((door) => door.id !== doorId)
    setDoorList(newDoorList)
    internalUpdateRoom({ doorList: newDoorList })
  }

  const updateDoor = (doorId: string, type: string) => {
    const newDoorList = doorList.map((door) => (door.id === doorId ? { ...door, type } : door))
    setDoorList(newDoorList)
    internalUpdateRoom({ doorList: newDoorList })
  }

  // Asegurarse de que activeTab sea "general" cuando no estamos en reforma
  useEffect(() => {
    if (!isReform && activeTab === "windows") {
      setActiveTab("general")
    }
  }, [isReform, activeTab])

  // Estados para los inputs
  const [widthInput, setWidthInput] = useState(room.width ? formatDecimal(room.width) : "")
  const [lengthInput, setLengthInput] = useState(room.length ? formatDecimal(room.length) : "")
  const [areaInput, setAreaInput] = useState(room.area ? formatDecimal(room.area) : "")
  const [perimeterInput, setPerimeterInput] = useState(room.perimeter ? formatDecimal(room.perimeter) : "")
  // Añadir estado para el input de altura personalizada
  const [heightInput, setHeightInput] = useState(room.customHeight ? formatDecimal(room.customHeight) : "")
  // Añadir estado para el input de tipo de habitación personalizado
  const [customRoomTypeInput, setCustomRoomTypeInput] = useState(room.customRoomType || "")
  // Estado para el número de módulos del radiador
  const [radiatorModules, setRadiatorModules] = useState(6)

  // Estado para el modal del editor de formas
  const [isShapeEditorOpen, setIsShapeEditorOpen] = useState(false)

  const safeStandardHeight = standardHeight && standardHeight > 0 ? standardHeight : 2.6

  // Calcular el valor por defecto para la altura del techo (10 cm menos que la altura estándar)
  const defaultCeilingHeight = safeStandardHeight - 0.1

  const [currentCeilingHeightInput, setCurrentCeilingHeightInput] = useState(() => {
    if (room.currentCeilingHeight) {
      return formatDecimal(room.currentCeilingHeight)
    }
    if (safeStandardHeight && safeStandardHeight > 0) {
      return formatDecimal(safeStandardHeight - 0.1)
    }
    return ""
  })

  const [ceilingHeightInput, setCeilingHeightInput] = useState(() => {
    if (room.newCeilingHeight) {
      return formatDecimal(room.newCeilingHeight)
    }
    // Solo usar valor por defecto si standardHeight está definido
    if (safeStandardHeight && safeStandardHeight > 0) {
      return formatDecimal(safeStandardHeight - 0.1)
    }
    return "" // String vacío hasta que se carguen los datos
  })

  // 1. Añadir un nuevo estado para el input de altura del techo
  // const [ceilingHeightInput, setCeilingHeightInput] = useState(
  //   room.newCeilingHeight ? formatDecimal(room.newCeilingHeight) : formatDecimal(standardHeight - 0.1),
  // )

  // Inicializar la lista de puertas si no existe
  useEffect(() => {
    if (room.hasDoors && !room.doorList) {
      updateRoom(room.id, {
        doorList: [{ id: uuidv4(), type: "Abatible" }],
      })
    }
  }, [room.hasDoors, room.doorList, room.doorType, room.id, updateRoom])

  // Efecto para actualizar el input de altura personalizada cuando cambia room.customHeight
  useEffect(() => {
    if (room.customHeight) {
      setHeightInput(formatDecimal(room.customHeight))
    }
  }, [room.customHeight])

  // Efecto para actualizar el input de tipo de habitación personalizado
  useEffect(() => {
    if (room.customRoomType) {
      setCustomRoomTypeInput(room.customRoomType)
    }
  }, [room.customRoomType])

  useEffect(() => {
    if (safeStandardHeight && safeStandardHeight > 0) {
      // Si hay un valor específico guardado, usarlo
      if (room.currentCeilingHeight) {
        setCurrentCeilingHeightInput(formatDecimal(room.currentCeilingHeight))
      }
      // Si se activa "Retirar falsos techos" pero no hay valor guardado, usar el valor por defecto
      else if (room.removeFalseCeiling) {
        const defaultCeilingHeight = safeStandardHeight - 0.1
        setCurrentCeilingHeightInput(formatDecimal(defaultCeilingHeight))
      }
    }
  }, [room.currentCeilingHeight, room.removeFalseCeiling, safeStandardHeight])

  // 2. Añadir un efecto para inicializar lowerCeiling y newCeilingHeight
  useEffect(() => {
    // Si lowerCeiling no está definido, establecerlo como true por defecto
    if (room.lowerCeiling === undefined) {
      updateRoom(room.id, {
        lowerCeiling: true,
        newCeilingHeight: room.newCeilingHeight || safeStandardHeight - 0.1, // Por defecto 10cm menos que la altura estándar
      })
    }

    // Actualizar el input cuando cambia newCeilingHeight
    if (room.newCeilingHeight) {
      setCeilingHeightInput(formatDecimal(room.newCeilingHeight))
    } else if (room.lowerCeiling) {
      setCeilingHeightInput(formatDecimal(safeStandardHeight - 0.1))
    }
  }, [room.lowerCeiling, room.newCeilingHeight, room.id, safeStandardHeight, updateRoom])

  // Efecto para inicializar elementos de baño por defecto cuando se activa newBathroomElements
  useEffect(() => {
    if (room.newBathroomElements && (!room.bathroomElements || room.bathroomElements.length === 0)) {
      // Seleccionar todos los elementos por defecto excepto Bidé, Ducheta Inodoro y Bañera
      updateRoom(room.id, {
        bathroomElements: ["Inodoro", "Plato de ducha", "Mampara", "Mueble lavabo"],
      })
    }
  }, [room.newBathroomElements, room.id, room.bathroomElements, updateRoom])

  // Efecto para inicializar el material de paredes si no está definido
  useEffect(() => {
    if (!room.wallMaterial) {
      if (isReform) {
        if (room.type === "Baño" || room.type === "Terraza" || room.type === "Cocina") {
          updateRoom(room.id, { wallMaterial: "Cerámica" })
        } else if (room.type === "Cocina Abierta" || room.type === "Cocina Americana") {
          // Cocinas abiertas y americanas tienen "Lucir y pintar" por defecto
          updateRoom(room.id, { wallMaterial: "Lucir y pintar" })
        } else {
          // Para otras habitaciones, usar "No se modifica"
          updateRoom(room.id, { wallMaterial: "No se modifica" })
        }
      }
    } else if (isReform && room.wallMaterial) {
      const reformValues = ["No se modifica", "Cerámica", "Lucir y pintar", "Solo Lucir", "Solo pintar"]

      // Si el valor actual no es válido para reforma
      if (!reformValues.includes(room.wallMaterial)) {
        if (room.type === "Baño" || room.type === "Terraza" || room.type === "Cocina") {
          updateRoom(room.id, { wallMaterial: "Cerámica" })
        } else if (room.type === "Cocina Abierta" || room.type === "Cocina Americana") {
          updateRoom(room.id, { wallMaterial: "Lucir y pintar" })
        } else {
          updateRoom(room.id, { wallMaterial: "No se modifica" })
        }
      }
    }
  }, [room.id, room.wallMaterial, room.type, updateRoom, isReform])

  // Efecto para actualizar el material de paredes cuando cambia paintAndPlasterAll
  useEffect(() => {
    // Si estamos en reforma y paintAndPlasterAll está activado
    if (isReform && globalConfig?.paintAndPlasterAll === true) {
      // Y la habitación no es baño, terraza o cocina
      if (
        room.type !== "Baño" &&
        room.type !== "Terraza" &&
        room.type !== "Cocina" &&
        room.type !== "Cocina Abierta" &&
        room.type !== "Cocina Americana"
      ) {
        // Actualizar el material de paredes a "Lucir y pintar"
        if (room.wallMaterial !== "Lucir y pintar") {
          updateRoom(room.id, { wallMaterial: "Lucir y pintar" })
        }
      }
    }
  }, [isReform, globalConfig?.paintAndPlasterAll, room.type, room.id, room.wallMaterial, updateRoom])

  // Efecto para activar por defecto "Picado de cerámica paredes" y "Retirar elementos de baño"
  useEffect(() => {
    // Solo ejecutar si la habitación está en la sección de reforma
    // FIXME: 'section' is undeclared. Assuming it should be checked based on `isReform` prop.
    if (!isReform) return

    const updates: Partial<Room> = {}

    // Si es un baño, activar picado de cerámica en paredes por defecto
    if (room.type === "Baño" && room.wallCeramicRemoval === undefined) {
      updates.wallCeramicRemoval = true
    }

    // Si es un baño, activar removeBathroomElements por defecto siempre
    if (room.type === "Baño" && room.removeBathroomElements === undefined) {
      updates.removeBathroomElements = true
    }

    // Si es un baño, activar newBathroomElements por defecto (cambiar condición para que funcione correctamente)
    if (room.type === "Baño" && !room.newBathroomElements) {
      updates.newBathroomElements = true
    }

    // Si hay actualizaciones, aplicarlas
    if (Object.keys(updates).length > 0) {
      updateRoom(room.id, updates)
    }
  }, [
    room.id,
    room.type,
    room.wallCeramicRemoval,
    room.removeBathroomElements,
    room.newBathroomElements,
    isReform, // Changed from section
    updateRoom,
  ])

  // Efecto para manejar removeAllCeramic - CORREGIDO para evitar bucles infinitos
  useEffect(() => {
    if (!isReform && globalConfig?.removeAllCeramic) {
      // Solo actualizar si los valores actuales son diferentes
      if (room.removeWallTiles !== true || room.removeFloor !== true) {
        updateRoom(room.id, {
          removeWallTiles: true,
          removeFloor: true,
        })
      }
    }
  }, [globalConfig?.removeAllCeramic, isReform, room.id, room.removeWallTiles, room.removeFloor, updateRoom])

  // Efecto para manejar allWallsHaveGotele - cambiar automáticamente el material de paredes
  useEffect(() => {
    if (!isReform && globalConfig?.allWallsHaveGotele) {
      // Si el material actual es "Pintura" y no es una pared cerámica, cambiar a "Gotelé"
      if (room.wallMaterial === "Pintura" && room.wallMaterial !== "Cerámica") {
        updateRoom(room.id, {
          wallMaterial: "Gotelé",
          removeGotele: true, // Activar automáticamente "Retirar gotelé"
        })
      }
    } else if (!isReform && globalConfig?.allWallsHaveGotele === false) {
      // Si se desactiva el switch global, cambiar de "Gotelé" a "Pintura"
      if (room.wallMaterial === "Gotelé") {
        updateRoom(room.id, {
          wallMaterial: "Pintura",
          removeGotele: false, // Desactivar "Retirar gotelé"
        })
      }
    }
  }, [globalConfig?.allWallsHaveGotele, isReform, room.id, room.wallMaterial, updateRoom])

  // Efecto para manejar removeWoodenFloor global
  useEffect(() => {
    if (!isReform && globalConfig?.removeWoodenFloor && room.floorMaterial === "Madera") {
      // Si el switch global está activado y la habitación tiene suelo de madera, activar removeFloor
      if (room.removeFloor !== true) {
        updateRoom(room.id, { removeFloor: true })
      }
    }
  }, [globalConfig?.removeWoodenFloor, isReform, room.id, room.floorMaterial, room.removeFloor, updateRoom])

  useEffect(() => {
    if (isReform && globalConfig?.tileAllFloors) {
      console.log("[v0] Aplicando suelo cerámico a habitación:", room.name, "Material actual:", room.floorMaterial)
      // Si el switch global está activado, cambiar todas las habitaciones a suelo cerámico
      if (room.floorMaterial !== "Cerámico") {
        console.log("[v0] Cambiando suelo de", room.floorMaterial, "a Cerámico en", room.name)
        updateRoom(room.id, { floorMaterial: "Cerámico" })
      }
    }
  }, [globalConfig?.tileAllFloors, isReform, room.id, room.floorMaterial, updateRoom])

  // </CHANGE> Auto-convert radiators to electric when electric heating is selected
  useEffect(() => {
    if (isReform && globalConfig?.reformHeatingType === "Eléctrica") {
      // Enable radiator checkbox by default
      if (!room.hasRadiator) {
        console.log("[v0] Enabling radiator for room:", room.name, "due to electric heating")
        updateRoom(room.id, { hasRadiator: true })
      }

      // Set default radiator type to electric if not already set
      if (!room.radiators || room.radiators.length === 0) {
        console.log("[v0] Setting default electric radiator for room:", room.name)
        updateRoom(room.id, {
          radiators: [
            {
              id: uuidv4(),
              type: "Radiador eléctrico",
              modules: 6,
            },
          ],
        })
      }
    }
  }, [isReform, globalConfig?.reformHeatingType, room.id, room.hasRadiator, room.radiators, updateRoom, room.name])

  // </CHANGE> Auto-convert radiators to aluminum when gas heating is selected
  useEffect(() => {
    if (
      isReform &&
      (globalConfig?.reformHeatingType === "Caldera + Radiadores" || globalConfig?.reformHeatingType === "Central")
    ) {
      // Enable radiator checkbox by default
      if (!room.hasRadiator) {
        console.log("[v0] Enabling radiator for room:", room.name, "due to gas heating")
        updateRoom(room.id, { hasRadiator: true })
      }

      // Check if there are existing radiators and if they need to be converted
      if (room.radiators && room.radiators.length > 0) {
        const isBathroom = room.type === "Baño"
        const targetType: RadiatorType = isBathroom ? "Toallero de aluminio" : "Radiador de Aluminio"

        // Check if any radiator needs conversion
        const needsConversion = room.radiators.some((radiator) => radiator.type !== targetType)

        if (needsConversion) {
          console.log("[v0] Converting radiators to aluminum for room:", room.name)
          // Convert all radiators to aluminum type
          const updatedRadiators = room.radiators.map((radiator) => ({
            ...radiator,
            type: targetType,
            modules: targetType === "Toallero de aluminio" ? undefined : radiator.modules || 6,
          }))

          updateRoom(room.id, { radiators: updatedRadiators })
        }
      } else {
        // No radiators exist, create default aluminum radiator
        const isBathroom = room.type === "Baño"
        const defaultType: RadiatorType = isBathroom ? "Toallero de aluminio" : "Radiador de Aluminio"

        console.log("[v0] Setting default aluminum radiator for room:", room.name)
        updateRoom(room.id, {
          radiators: [
            {
              id: uuidv4(),
              type: defaultType,
              modules: isBathroom ? undefined : 6,
            },
          ],
        })
      }
    }
  }, [
    isReform,
    globalConfig?.reformHeatingType,
    room.id,
    room.hasRadiator,
    room.radiators,
    room.type,
    updateRoom,
    room.name,
  ])

  useEffect(() => {
    if (isReform && globalConfig?.reformHeatingType === "Eléctrica") {
      // Check if there are existing aluminum radiators that need to be converted
      if (room.radiators && room.radiators.length > 0) {
        const needsConversion = room.radiators.some(
          (radiator) => radiator.type === "Radiador de Aluminio" || radiator.type === "Toallero de aluminio",
        )

        if (needsConversion) {
          console.log("[v0] Converting aluminum radiators to electric for room:", room.name)
          // Convert all aluminum radiators to electric type
          const updatedRadiators = room.radiators.map((radiator) => ({
            ...radiator,
            type: "Radiador eléctrico" as RadiatorType,
            modules: 6,
          }))

          updateRoom(room.id, { radiators: updatedRadiators })
        }
      }
    }
  }, [isReform, globalConfig?.reformHeatingType, room.id, room.radiators, updateRoom, room.name])

  useEffect(() => {
    if (
      isReform &&
      (globalConfig?.reformHeatingType === "Caldera + Radiadores" || globalConfig?.reformHeatingType === "Central")
    ) {
      const isBathroom = room.type === "Baño"
      const isTerrace = room.type === "Terraza"

      // No añadir radiador en terrazas
      if (isTerrace) return

      // Activar el check de radiador si no está activo
      if (!room.hasRadiator) {
        updateRoom(room.id, { hasRadiator: true })
      }

      // Crear radiador por defecto si no existe
      if (!room.radiators || room.radiators.length === 0) {
        const defaultType: RadiatorType = isBathroom ? "Toallero de aluminio" : "Radiador de Aluminio"
        updateRoom(room.id, {
          hasRadiator: true,
          radiators: [
            {
              id: uuidv4(),
              type: defaultType,
              modules: isBathroom ? undefined : 6,
            },
          ],
        })
      } else {
        // Convertir radiadores existentes al tipo correcto
        const targetType: RadiatorType = isBathroom ? "Toallero de aluminio" : "Radiador de Aluminio"
        const needsConversion = room.radiators.some((radiator) => radiator.type !== targetType)

        if (needsConversion) {
          const updatedRadiators = room.radiators.map((radiator) => ({
            ...radiator,
            type: targetType,
            modules: targetType === "Toallero de aluminio" ? undefined : radiator.modules || 6,
          }))
          updateRoom(room.id, { radiators: updatedRadiators })
        }
      }
    }
  }, [isReform, globalConfig?.reformHeatingType, room.id, room.type])

  // Modificar la función formatDecimal para que use comas en lugar de puntos:
  function formatDecimal(value: number): string {
    return value.toFixed(2).replace(".", ",")
  }

  // Modificar la función validateAndParseNumber para manejar correctamente las comas:
  function validateAndParseNumber(value: string): number | null {
    // Reemplazar coma por punto para el parsing
    const normalizedValue = value.replace(",", ".")
    const parsedValue = Number.parseFloat(normalizedValue)

    if (isNaN(parsedValue)) return null

    // Redondear a 2 decimales
    return Number.parseFloat(parsedValue.toFixed(2))
  }

  // Función para manejar el cambio de ancho
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWidthInput(e.target.value)
  }

  // Función para manejar el cambio de largo
  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLengthInput(e.target.value)
  }

  // Función para manejar el cambio de área
  const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAreaInput(e.target.value)
  }

  // Función para manejar el cambio de perímetro
  const handlePerimeterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPerimeterInput(e.target.value)
  }

  // Añadir función para manejar el cambio de altura personalizada
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeightInput(e.target.value)
  }

  // Función para manejar el cambio de altura actual del techo
  const handleCurrentCeilingHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentCeilingHeightInput(e.target.value)
  }

  const handleCurrentCeilingStatusChange = (value: string) => {
    const updates: Partial<Room> = {
      currentCeilingStatus: value as CurrentCeilingStatus,
      removeFalseCeiling: value === "lowered_remove", // true si se van a retirar
    }

    // Si selecciona "lowered_keep", establecer altura por defecto
    if (value === "lowered_keep" && !room.currentCeilingHeight) {
      const defaultHeight = safeStandardHeight - 0.1
      updates.currentCeilingHeight = defaultHeight
      setCurrentCeilingHeightInput(formatDecimal(defaultHeight))
    }

    // Si cambia a otra opción, limpiar altura actual
    if (value !== "lowered_keep") {
      updates.currentCeilingHeight = undefined
    }

    updateRoom(room.id, updates)
  }

  // 3. Añadir función para manejar el cambio de altura del techo
  const handleCeilingHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCeilingHeightInput(e.target.value)
  }

  // Añadir función para manejar el cambio de tipo de habitación personalizado
  const handleCustomRoomTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomRoomTypeInput(e.target.value)
  }

  // Función para guardar el tipo de habitación personalizado
  const saveCustomRoomType = () => {
    if (customRoomTypeInput.trim()) {
      updateRoom(room.id, { customRoomType: customRoomTypeInput.trim() })
    }
  }

  const saveCurrentCeilingHeight = () => {
    if (currentCeilingHeightInput === "") {
      updateRoom(room.id, { currentCeilingHeight: defaultCeilingHeight })
      setCurrentCeilingHeightInput(formatDecimal(defaultCeilingHeight))
      return
    }

    const value = validateAndParseNumber(currentCeilingHeightInput)
    if (value !== null && value > 0) {
      // Actualizar la altura actual del techo
      updateRoom(room.id, { currentCeilingHeight: value })
      setCurrentCeilingHeightInput(formatDecimal(value))
    } else {
      // Si el valor no es válido, restaurar el valor por defecto (10 cm menos)
      setCurrentCeilingHeightInput(formatDecimal(defaultCeilingHeight))
      updateRoom(room.id, { currentCeilingHeight: defaultCeilingHeight })
    }
  }

  // Función para guardar el ancho
  const saveWidth = () => {
    if (widthInput === "") {
      updateRoom(room.id, { width: 0 })
      return
    }

    const value = validateAndParseNumber(widthInput)
    if (value !== null) {
      // Update display with formatted value
      setWidthInput(formatDecimal(value))
      updateRoom(room.id, { width: value })

      // Actualizar área y perímetro si tenemos largo
      if (room.length) {
        const newArea = Number.parseFloat((value * room.length).toFixed(2))
        const newPerimeter = Number.parseFloat((2 * (value + room.length)).toFixed(2))

        // Usar altura personalizada si existe, sino usar la estándar
        const heightToUse = room.customHeight || standardHeight
        const newWallSurface = Number.parseFloat((newPerimeter * heightToUse).toFixed(2))

        updateRoom(room.id, {
          area: newArea,
          perimeter: newPerimeter,
          wallSurface: newWallSurface,
        })
      }
    }
  }

  // Función para guardar el largo
  const saveLength = () => {
    if (lengthInput === "") {
      updateRoom(room.id, { length: 0 })
      return
    }

    const value = validateAndParseNumber(lengthInput)
    if (value !== null) {
      // Update display with formatted value
      setLengthInput(formatDecimal(value))
      updateRoom(room.id, { length: value })

      // Actualizar área y perímetro si tenemos ancho
      if (room.width) {
        const newArea = Number.parseFloat((value * room.width).toFixed(2))
        const newPerimeter = Number.parseFloat((2 * (value + room.width)).toFixed(2))

        // Usar altura personalizada si existe, sino usar la estándar
        const heightToUse = room.customHeight || standardHeight
        const newWallSurface = Number.parseFloat((newPerimeter * heightToUse).toFixed(2))

        updateRoom(room.id, {
          area: newArea,
          perimeter: newPerimeter,
          wallSurface: newWallSurface,
        })
      }
    }
  }

  // Función para guardar el área
  const saveArea = () => {
    if (areaInput === "") {
      updateRoom(room.id, { area: 0 })
      return
    }

    const value = validateAndParseNumber(areaInput)
    if (value !== null) {
      updateRoom(room.id, { area: value })

      // Si tenemos perímetro, actualizar la superficie de pared
      if (room.perimeter) {
        const heightToUse = room.customHeight || safeStandardHeight
        const newWallSurface = Number.parseFloat((room.perimeter * heightToUse).toFixed(2))
        updateRoom(room.id, { wallSurface: newWallSurface })
      }
    }
  }

  // Modificar la función savePerimeter para usar la altura personalizada si existe
  const savePerimeter = () => {
    if (perimeterInput === "") {
      updateRoom(room.id, { perimeter: 0 })
      return
    }

    const value = validateAndParseNumber(perimeterInput)
    if (value !== null) {
      updateRoom(room.id, { perimeter: value })

      const heightToUse = room.customHeight || safeStandardHeight
      const newWallSurface = Number.parseFloat((value * heightToUse).toFixed(2))
      updateRoom(room.id, { wallSurface: newWallSurface })
    }
  }

  // Añadir función para guardar la altura personalizada
  const saveHeight = () => {
    if (heightInput === "") {
      updateRoom(room.id, { customHeight: undefined })
      return
    }

    const value = validateAndParseNumber(heightInput)
    if (value !== null && value > 0) {
      // Actualizar la altura personalizada
      updateRoom(room.id, { customHeight: value })

      // Recalcular la superficie de pared con la nueva altura
      if (room.perimeter) {
        const newWallSurface = Number.parseFloat((room.perimeter * value).toFixed(2))
        updateRoom(room.id, { wallSurface: newWallSurface })
      }

      // Actualizar el input con el formato correcto
      setHeightInput(formatDecimal(value))
    } else {
      // Si el valor no es válido, restaurar el valor anterior
      if (room.customHeight) {
        setHeightInput(formatDecimal(room.customHeight))
      } else {
        setHeightInput("")
      }
    }
  }

  // 4. Añadir función para guardar la altura del techo
  const saveCeilingHeight = () => {
    if (ceilingHeightInput === "") {
      updateRoom(room.id, { newCeilingHeight: safeStandardHeight - 0.1 })
      setCeilingHeightInput(formatDecimal(safeStandardHeight - 0.1))
      return
    }

    const value = validateAndParseNumber(ceilingHeightInput)
    if (value !== null && value > 0) {
      // Actualizar la altura del techo
      updateRoom(room.id, { newCeilingHeight: value })

      // Recalcular la superficie de pared con la nueva altura
      if (room.perimeter) {
        // La superficie de pared ahora se calcula con la nueva altura del techo
        const newWallSurface = Number.parseFloat((room.perimeter * value).toFixed(2))
        updateRoom(room.id, { wallSurface: newWallSurface })
      }

      setCeilingHeightInput(formatDecimal(value))
    } else {
      // Si el valor no es válido, restaurar el valor anterior
      if (room.newCeilingHeight) {
        setCeilingHeightInput(formatDecimal(room.newCeilingHeight))
      } else {
        setCeilingHeightInput(formatDecimal(safeStandardHeight - 0.1))
      }
    }
  }

  // Función para manejar las medidas del editor de formas
  const handleApplyShapeMeasurements = (area: number, perimeter: number) => {
    // Actualizar área y perímetro
    updateRoom(room.id, {
      area: Number(area.toFixed(2)),
      perimeter: Number(perimeter.toFixed(2)),
    })

    // Actualizar los inputs locales
    setAreaInput(formatDecimal(area))
    setPerimeterInput(formatDecimal(perimeter))
  }

  // Función para eliminar habitación
  const handleDelete = () => {
    removeRoom(room.id)
  }

  // Función para cambiar el modo de medición
  const toggleMeasurementMode = () => {
    const newMode: MeasurementMode = room.measurementMode === "rectangular" ? "area-perimeter" : "rectangular"
    updateRoom(room.id, { measurementMode: newMode })
  }

  // Función para actualizar las ventanas
  const updateWindows = (windows: Window[]) => {
    updateRoom(room.id, { windows })
  }

  // Función para añadir una nueva puerta
  const addDoorOld = () => {
    // Si es un baño, no permitir añadir más puertas
    if (room.type === "Baño" && room.doorList && room.doorList.length >= 1) {
      return
    }

    const currentDoors = room.doorList || []
    const newDoor: DoorTypeAlias = {
      id: uuidv4(),
      type: "Abatible",
    }
    updateRoom(room.id, { doorList: [...currentDoors, newDoor] })
  }

  // Función para eliminar una puerta
  const removeDoorOld = (doorId: string) => {
    if (!room.doorList) return

    const updatedDoors = room.doorList.filter((door) => door.id !== doorId)

    // Si no quedan puertas, desmarcar hasDoors
    if (updatedDoors.length === 0) {
      updateRoom(room.id, { hasDoors: false, doorList: [] })
    } else {
      updateRoom(room.id, { doorList: updatedDoors })
    }
  }

  // Función para actualizar el tipo de una puerta
  const updateDoorTypeOld = (doorId: string, type: DoorType) => {
    if (!room.doorList) return

    const updatedDoors = room.doorList.map((door) => (door.id === doorId ? { ...door, type } : door))

    updateRoom(room.id, { doorList: updatedDoors })
  }

  // Manejar el cambio en el checkbox de puerta
  const handleDoorChange = (checked: boolean) => {
    if (checked) {
      // Si se marca, crear una puerta por defecto
      updateRoom(room.id, {
        hasDoors: true,
        doorList: [{ id: uuidv4(), type: "Abatible" }],
      })
    } else {
      // Si se desmarca, eliminar todas las puertas
      updateRoom(room.id, {
        hasDoors: false,
        doorList: [],
        doorType: undefined,
      })
    }
  }

  // Función para incrementar el número de módulos
  const incrementModules = () => {
    setRadiatorModules((prev) => prev + 1)
    updateRoom(room.id, { radiatorModules: radiatorModules + 1 })
  }

  // Función para decrementar el número de módulos
  const decrementModules = () => {
    if (radiatorModules > 1) {
      setRadiatorModules((prev) => prev - 1)
      updateRoom(room.id, { radiatorModules: radiatorModules - 1 })
    }
  }

  // Función para manejar el cambio en el tipo de radiador
  const handleRadiatorTypeChange = (value: RadiatorType) => {
    updateRoom(room.id, { radiatorType: value })
  }

  // Función para manejar el cambio en los elementos de baño
  const handleBathroomElementChange = (element: BathroomElement, checked: boolean) => {
    const currentElements = room.bathroomElements || []

    if (checked) {
      // Añadir el elemento si no existe
      if (!currentElements.includes(element)) {
        updateRoom(room.id, { bathroomElements: [...currentElements, element] })
      }
    } else {
      // Eliminar el elemento si existe
      updateRoom(room.id, {
        bathroomElements: currentElements.filter((item) => item !== element),
      })
    }
  }

  // Formatear el título de la habitación
  const formatRoomTitle = () => {
    // Para tipos específicos no mostrar número
    if (
      room.type === "Salón" ||
      room.type === "Cocina" ||
      room.type === "Cocina Abierta" ||
      room.type === "Cocina Americana" ||
      room.type === "Trastero"
    ) {
      return room.type
    }
    // Para tipo "Otro", mostrar el tipo personalizado si existe
    if (room.type === "Otro" && room.customRoomType) {
      return room.customRoomType
    }
    // Para el resto, mostrar número
    return `${room.type} ${room.number}`
  }

  // Modificar la función formatNumber para asegurar que siempre muestre 2 decimales
  // Reemplazar la función formatNumber actual:
  // Formatear un número para mostrar
  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null) return "0,00"
    // Asegurar que siempre se muestren 2 decimales
    return value.toFixed(2).replace(".", ",")
  }

  // Obtener ícono según el tipo de habitación
  const getRoomIcon = () => {
    switch (room.type) {
      case "Salón":
        return <Tv className="h-4 w-4" />
      case "Pasillo":
        return <Footprints className="h-4 w-4" />
      case "Cocina":
      case "Cocina Abierta":
      case "Cocina Americana":
        return <CookingPot className="h-4 w-4" />
      case "Baño":
        return <Bath className="h-4 w-4" />
      case "Dormitorio":
        return <Bed className="h-4 w-4" />
      case "Trastero":
        return <Package className="h-4 w-4" />
      case "Vestidor":
        return <Shirt className="h-4 w-4" />
      case "Hall":
        return <Footprints className="h-4 w-4" />
      case "Terraza":
        return <Tv className="h-4 w-4" rotate={90} />
      default:
        return <Tv className="h-4 w-4" />
    }
  }

  const getElectricalSummary = () => {
    const items: string[] = []

    // Los elementos eléctricos están guardados directamente en el objeto room
    const roomElectricalData = room.electricalElements

    if (roomElectricalData && Array.isArray(roomElectricalData)) {
      // Los elementos eléctricos son un array de objetos con type y quantity
      roomElectricalData.forEach((element) => {
        if (element.quantity > 0) {
          items.push(`${element.quantity} ${element.type.toLowerCase()}`)
        }
      })
    }

    console.log(
      "[v0] ROOM CARD - Electrical summary for room:",
      room.type,
      "Items found:",
      items.length,
      "electricalElements:",
      roomElectricalData?.map((e) => `${e.id}:${e.quantity}`).join(", "),
    )
    // </CHANGE>

    if (items.length === 0) {
      return <span className="text-muted-foreground italic">Sin elementos eléctricos</span>
    }

    return (
      <div className="space-y-0.5">
        {items.map((item, index) => (
          <div key={index}>• {item}</div>
        ))}
      </div>
    )
  }

  const getWindowsSummary = () => {
    if (!room.windows || !Array.isArray(room.windows) || room.windows.length === 0) {
      return <span className="text-muted-foreground italic">Sin ventanas</span>
    }

    return (
      <div className="space-y-1">
        <div className="font-medium">
          {room.windows.length} ventana{room.windows.length > 1 ? "s" : ""}
        </div>
        {room.windows.map((window, index) => (
          <div key={window.id} className="text-xs">
            • Ventana {index + 1}: {window.width}×{window.height}m
            {window.type && <div className="ml-2 text-muted-foreground">{window.type}</div>}
          </div>
        ))}
      </div>
    )
  }

  const isWallMaterialDisabled =
    isReform &&
    globalConfig?.paintAndPlasterAll === true &&
    room.type !== "Baño" &&
    room.type !== "Terraza" &&
    room.type !== "Cocina" &&
    room.type !== "Cocina Abierta" &&
    room.type !== "Cocina Americana"

  const wallMaterialValue = room.wallMaterial || ""

  const handleRemoveFalseCeilingChange = (checked: boolean) => {
    updateRoom(room.id, { removeFalseCeiling: checked === true })

    // Si se activa "Retirar falsos techos", establecer el valor por defecto para la altura actual
    if (checked) {
      updateRoom(room.id, { currentCeilingHeight: defaultCeilingHeight })
      setCurrentCeilingHeightInput(formatDecimal(defaultCeilingHeight))
    }
  }

  const isFloorWooden = room.floorMaterial === "Madera"
  const handleRemoveWoodenFloorChange = (checked: boolean) => {
    updateRoom(room.id, { removeFloor: checked })
  }

  const isFloorCeramic = room.floorMaterial === "Cerámico" || room.floorMaterial === "Cerámica"

  const handleRemoveGoteleChange = (checked: boolean) => {
    updateRoom(room.id, { removeGotele: checked === true })
  }

  const shouldShowRadiator = isReform
    ? globalConfig?.reformHeatingType === "Caldera + Radiadores" ||
    globalConfig?.reformHeatingType === "Central" ||
    globalConfig?.reformHeatingType === "Eléctrica"
    : heatingType === "Caldera + Radiadores" || heatingType === "Central"

  const getDefaultRadiatorType = (): RadiatorType => {
    const isBathroom = room.type === "Baño"

    // Si es calefacción eléctrica
    if (globalConfig?.reformHeatingType === "Eléctrica") {
      // En baños: toallero eléctrico
      if (isBathroom) {
        return "Radiador toallero eléctrico"
      }
      // En otras habitaciones: radiador eléctrico
      return "Radiador eléctrico"
    }

    // Si es caldera + radiadores o central
    if (
      heatingType === "Caldera + Radiadores" ||
      heatingType === "Central" ||
      globalConfig?.reformHeatingType === "Caldera + Radiadores"
    ) {
      // En baños: toallero de aluminio
      if (isBathroom) {
        return "Toallero de aluminio"
      }
      // En otras habitaciones: radiador de aluminio
      return "Radiador de Aluminio"
    }

    // Fallback por defecto
    return "Radiador eléctrico"
  }
  // </CHANGE>

  const isBathroomElementSelected = (element: BathroomElement): boolean => {
    return !!room.bathroomElements && room.bathroomElements.includes(element)
  }

  // Determinar si mostrar el checkbox de suelo de madera
  const showWoodenFloorCheckbox = room.floorMaterial === "Madera" && !globalConfig?.removeWoodenFloor

  // Función para obtener el color del borde basado en el modo
  const getBorderColor = () => {
    if (isReform) {
      return "border-green-500" // Verde para reforma
    }
    return "border-orange-500" // Naranja para demolición (o color por defecto)
  }

  // Handler para el cambio del material de las paredes
  const handleWallMaterialChange = (value: string) => {
    // Si no estamos en reforma, el valor del material de pared se actualiza directamente
    if (!isReform) {
      updateRoom(room.id, { wallMaterial: value as WallMaterialType })
      return
    }

    // Si estamos en reforma, se aplica la lógica de "Lucir y pintar todo"
    if (isReform && globalConfig?.paintAndPlasterAll === true) {
      // Si la habitación NO es un baño, terraza, cocina, cocina abierta o cocina americana
      if (
        room.type !== "Baño" &&
        room.type !== "Terraza" &&
        room.type !== "Cocina" &&
        room.type !== "Cocina Abierta" &&
        room.type !== "Cocina Americana"
      ) {
        // Si el material seleccionado es "Lucir y pintar", se permite
        if (value === "Lucir y pintar") {
          updateRoom(room.id, { wallMaterial: value as WallMaterialType })
        }
        // Si no, se mantiene el valor actual (probablemente "No se modifica" o "Cerámica")
        // y se muestra una alerta o se deshabilita la opción
        // En este caso, simplemente no actualizamos si no es "Lucir y pintar"
        return
      }
    }
    // Para baños, terrazas y cocinas en reforma, o si "Lucir y pintar todo" está desactivado,
    // se permite la selección normal.
    updateRoom(room.id, { wallMaterial: value as WallMaterialType })
  }

  // FIXME: needsNewElectricalInstallation is undeclared. Assuming it should be derived or passed as prop.
  // const needsNewElectricalInstallation = isReform && globalConfig?.needsNewElectricalInstallation // This line is removed to fix redeclaration

  return (
    <Card className={`border-l-4 transition-all duration-200 ${getBorderColor()} bg-card shadow-sm hover:shadow-md overflow-hidden`}>
      <CardHeader className="p-3 md:p-4 flex flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 flex items-center justify-center"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <div className="flex items-center gap-1">
              {getRoomIcon()}
              <CardTitle className="text-sm">{formatRoomTitle()}</CardTitle>
              {isReform && needsNewElectricalInstallation && (
                <div className="flex items-center gap-1 ml-2">
                  <QuickSummaryIcon icon={Zap} content={getElectricalSummary()} label="Resumen de electricidad" />
                  <QuickSummaryIcon icon={SquareIcon} content={getWindowsSummary()} label="Resumen de ventanas" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Resumen compacto de medidas */}
            <div className="text-xs text-muted-foreground mr-2 flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center">{formatNumber(room.area)} m²</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Área de la habitación</p>
                  </TooltipContent>
                </Tooltip>

                {room.hasDoors && room.doorList && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="ml-2 flex items-center">
                          <DoorOpen className="h-3 w-3 mr-1" />
                          {room.doorList.length}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Puertas</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {room.customHeight && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-2 flex items-center">
                        <RulerVertical className="h-3 w-3 mr-1" />
                        {formatNumber(room.customHeight)}m
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Altura personalizada</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>

            {onDuplicate && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onDuplicate(room.id)}
                      className="h-7 w-7 p-0"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Duplicar habitación</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {/* </CHANGE> */}

            <Button type="button" variant="destructive" size="sm" onClick={handleDelete} className="h-7 w-7 p-0">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="p-3 pt-0">
          <div className="space-y-4">
            {/* Campo de texto personalizado para tipo "Otro" */}
            {room.type === "Otro" && (
              <div className="space-y-1">
                <Label htmlFor={`customRoomType-${room.id}`} className="text-xs">
                  Tipo de habitación personalizado
                </Label>
                <Input
                  id={`customRoomType-${room.id}`}
                  type="text"
                  value={customRoomTypeInput}
                  onChange={handleCustomRoomTypeChange}
                  onBlur={saveCustomRoomType}
                  placeholder="Especifique el tipo de habitación"
                  className="h-7 text-sm"
                />
              </div>
            )}

            {/* Materiales (juntos) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`floorMaterial-${room.id}`} className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Suelo
                </Label>
                <Select
                  value={room.floorMaterial}
                  onValueChange={(value) => updateRoom(room.id, { floorMaterial: value as FloorMaterialType })}
                >
                  <SelectTrigger id={`floorMaterial-${room.id}`} className="h-8 text-xs bg-white dark:bg-slate-950">
                    <SelectValue placeholder="Material" />
                  </SelectTrigger>
                  <SelectContent>
                    {isReform ? (
                      // Opciones para Reforma
                      <>
                        <SelectItem value="No se modifica">No se modifica</SelectItem>
                        <SelectItem value="Cerámico">Cerámico</SelectItem>
                        <SelectItem value="Parquet flotante">Parquet flotante</SelectItem>
                        <SelectItem value="Suelo laminado">Suelo laminado</SelectItem>
                        <SelectItem value="Suelo vinílico">Suelo vinílico</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </>
                    ) : (
                      // Opciones para Demolición
                      <>
                        <SelectItem value="No se modifica">No se modifica</SelectItem>
                        <SelectItem value="Madera">Madera</SelectItem>
                        <SelectItem value="Cerámica">Cerámica</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`wallMaterial-${room.id}`} className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Material paredes
                </Label>
                <Select
                  value={wallMaterialValue}
                  onValueChange={handleWallMaterialChange}
                  disabled={isWallMaterialDisabled}
                  required
                >
                  <SelectTrigger id={`wallMaterial-${room.id}`} className="h-8 text-xs bg-white dark:bg-slate-950">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isReform ? (
                      <>
                        <SelectItem value="No se modifica">No se modifica</SelectItem>
                        <SelectItem value="Cerámica">Cerámica</SelectItem>
                        <SelectItem value="Lucir y pintar">Lucir y pintar</SelectItem>
                        <SelectItem value="Solo lucir">Solo lucir</SelectItem>
                        <SelectItem value="Solo pintar">Solo pintar</SelectItem>
                      </>
                    ) : (
                      // Opciones para demoliciones
                      <>
                        <SelectItem value="No se modifica">No se modifica</SelectItem>
                        <SelectItem value="Cerámica">Cerámica</SelectItem>
                        <SelectItem value="Gotelé">Gotelé</SelectItem>
                        <SelectItem value="Papel">Papel</SelectItem>
                        <SelectItem value="Pintura">Pintura</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Medidas - Sección destacada */}
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center">
                  <Ruler className="h-4 w-4 mr-1" />
                  Medidas de la habitación
                </h3>
                <div className="text-xs text-blue-600 dark:text-blue-400">* Campos obligatorios</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {room.measurementMode === "rectangular" ? (
                  <>
                    <div className="space-y-1 relative">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`width-${room.id}`}
                          className="text-xs font-medium text-blue-700 dark:text-blue-300 block h-5"
                        >
                          Ancho (m) *
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMeasurementMode()}
                          className="h-5 w-5 p-0 flex items-center justify-center text-blue-600"
                          title={
                            room.measurementMode === "rectangular"
                              ? "Cambiar a área y perímetro"
                              : "Cambiar a ancho y largo"
                          }
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        id={`width-${room.id}`}
                        type="text"
                        value={widthInput}
                        onChange={handleWidthChange}
                        onBlur={saveWidth}
                        className="h-9 text-sm border-blue-300 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Introduce el ancho"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`length-${room.id}`}
                        className="text-xs font-medium text-blue-700 dark:text-blue-300 block h-5"
                      >
                        Largo (m) *
                      </Label>
                      <Input
                        id={`length-${room.id}`}
                        type="text"
                        value={lengthInput}
                        onChange={handleLengthChange}
                        onBlur={saveLength}
                        className="h-9 text-sm border-blue-300 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Introduce el largo"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1 relative">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`area-${room.id}`}
                          className="text-xs font-medium text-blue-700 dark:text-blue-300 block h-5"
                        >
                          Área (m²) *
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMeasurementMode()}
                          className="h-5 w-5 p-0 flex items-center justify-center text-blue-600"
                          title={
                            room.measurementMode === "rectangular"
                              ? "Cambiar a área y perímetro"
                              : "Cambiar a ancho y largo"
                          }
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        {room.measurementMode === "area-perimeter" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsShapeEditorOpen(true)}
                            className="h-5 w-5 p-0 flex items-center justify-center text-green-600"
                            title="Abrir editor de formas"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <Input
                        id={`area-${room.id}`}
                        type="text"
                        value={areaInput}
                        onChange={handleAreaChange}
                        onBlur={saveArea}
                        className="h-9 text-sm border-blue-300 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Introduce el área"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`perimeter-${room.id}`}
                        className="text-xs font-medium text-blue-700 dark:text-blue-300 block h-5"
                      >
                        Perímetro (m) *
                      </Label>
                      <Input
                        id={`perimeter-${room.id}`}
                        type="text"
                        value={perimeterInput}
                        onChange={handlePerimeterChange}
                        onBlur={savePerimeter}
                        className="h-9 text-sm border-blue-300 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Introduce el perímetr"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Resultados calculados */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Área</Label>
                <div className="h-7 flex items-center text-sm font-medium">{formatNumber(room.area)} m²</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Perímetro</Label>
                <div className="h-7 flex items-center text-sm font-medium">{formatNumber(room.perimeter)} m</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Sup. Pared</Label>
                <div className="h-7 flex items-center text-sm font-medium">
                  {formatNumber(
                    room.perimeter *
                    (() => {
                      // Si está en reforma y se baja el techo, usar la nueva altura
                      if (isReform && room.lowerCeiling && room.newCeilingHeight) {
                        return room.newCeilingHeight
                      }
                      // Si tiene techos bajados que se quedan (lowered_keep), usar altura actual
                      if (room.currentCeilingStatus === "lowered_keep" && room.currentCeilingHeight) {
                        return room.currentCeilingHeight
                      }
                      // Si usa altura personalizada o altura estándar
                      return room.customHeight || standardHeight
                    })(),
                  )}{" "}
                  m²
                </div>
              </div>
            </div>

            {/* Opciones (juntos) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {!isReform ? (
                // Opciones para la sección de demolición
                <>
                  <div className="space-y-3 p-3 border border-border rounded-md bg-muted/30 col-span-2">
                    <div className="space-y-2">
                      <Label htmlFor={`currentCeilingStatus-${room.id}`} className="text-xs font-medium">
                        Techo actual
                      </Label>
                      <Select
                        value={room.currentCeilingStatus || "no_false_ceiling"}
                        onValueChange={(value: "lowered_remove" | "lowered_keep" | "no_false_ceiling") => {
                          const updates: Partial<Room> = {
                            currentCeilingStatus: value,
                          }
                          // Si cambia a otra opción, limpiar altura actual
                          if (value !== "lowered_keep") {
                            updates.currentCeilingHeight = undefined
                          }
                          updateRoom(room.id, updates)
                        }}
                      >
                        <SelectTrigger id={`currentCeilingStatus-${room.id}`} className="h-9 text-sm">
                          <SelectValue placeholder="Seleccionar estado del techo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lowered_remove">Están bajados y se retiran</SelectItem>
                          <SelectItem value="lowered_keep">Están bajados y se dejan así</SelectItem>
                          <SelectItem value="no_false_ceiling">No hay falsos techos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Campo de altura solo visible cuando los techos están bajados y se quedan */}
                    {room.currentCeilingStatus === "lowered_keep" && (
                      <div className="space-y-1">
                        <Label htmlFor={`currentCeilingHeight-${room.id}`} className="text-xs">
                          Altura actual (m)
                        </Label>
                        <Input
                          id={`currentCeilingHeight-${room.id}`}
                          type="number"
                          step="0.01"
                          min="2.0"
                          max={safeStandardHeight}
                          value={room.currentCeilingHeight || ""}
                          onChange={(e) => {
                            const value = Number.parseFloat(e.target.value)
                            if (!isNaN(value) && value <= safeStandardHeight) {
                              updateRoom(room.id, { currentCeilingHeight: value })
                            } else if (!isNaN(value) && value > safeStandardHeight) {
                              updateRoom(room.id, { currentCeilingHeight: safeStandardHeight })
                            }
                          }}
                          className="h-7 text-sm"
                          placeholder="2.50"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Máximo: {formatDecimal(safeStandardHeight)}m (altura del proyecto)
                        </p>
                      </div>
                    )}
                  </div>

                  {room.type !== "Terraza" && (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`hasDoors-${room.id}`}
                          checked={room.hasDoors}
                          onCheckedChange={(checked) => handleDoorChange(checked === true)}
                        />
                        <Label htmlFor={`hasDoors-${room.id}`} className="text-xs cursor-pointer">
                          {room.type === "Baño" ? "Retirar puerta" : "Retirar puertas"}
                        </Label>
                        {room.hasDoors && room.type !== "Baño" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={addDoorOld}
                            className="h-5 w-5 p-0 ml-1"
                            title="Añadir otra puerta"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Lista de puertas (solo visible si hasDoors es true) */}
                      {room.hasDoors && room.doorList && room.doorList.length > 0 && (
                        <div className="ml-6 space-y-2">
                          {room.doorList.map((door, index) => (
                            <div key={door.id} className="flex items-center space-x-2">
                              <Select
                                value={door.type}
                                onValueChange={(value) => updateDoorTypeOld(door.id, value as DoorType)}
                              >
                                <SelectTrigger className="h-7 text-xs flex-1">
                                  <SelectValue placeholder="Tipo de puerta" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Abatible">Abatible</SelectItem>
                                  <SelectItem value="Corredera empotrada">Corredera empotrada</SelectItem>
                                  <SelectItem value="Corredera exterior con carril">
                                    Corredera exterior con carril
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {room.doorList.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeDoorOld(door.id)}
                                  className="h-5 w-5 p-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Opción para retirar suelo de madera - LÓGICA MEJORADA */}
                  {isFloorWooden && !globalConfig?.removeWoodenFloor && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`removeWoodenFloor-${room.id}`}
                        checked={room.removeFloor === true}
                        onCheckedChange={handleRemoveWoodenFloorChange}
                      />
                      <Label htmlFor={`removeWoodenFloor-${room.id}`} className="text-xs cursor-pointer">
                        Retirada del suelo de madera
                      </Label>
                    </div>
                  )}

                  {!globalConfig?.removeAllCeramic && room.wallMaterial === "Cerámica" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`removeWallTiles-${room.id}`}
                        checked={room.removeWallTiles === true}
                        onCheckedChange={(checked) => updateRoom(room.id, { removeWallTiles: checked === true })}
                      />
                      <Label htmlFor={`removeWallTiles-${room.id}`} className="text-xs cursor-pointer">
                        Picado de cerámica paredes
                      </Label>
                    </div>
                  )}

                  {/* Añadir opción para picar cerámica del suelo si el material es cerámico */}
                  {!globalConfig?.removeAllCeramic && isFloorCeramic && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`removeFloorTiles-${room.id}`}
                        checked={room.removeFloor !== false}
                        defaultChecked={true}
                        onCheckedChange={(checked) => updateRoom(room.id, { removeFloor: checked === true })}
                      />
                      <Label htmlFor={`removeFloorTiles-${room.id}`} className="text-xs cursor-pointer">
                        Picado de cerámica suelo
                      </Label>
                    </div>
                  )}

                  {/* Añadir opción para retirar gotelé - solo visible si el material de pared es gotelé y NO es "No se modifica" */}
                  {room.wallMaterial === "Gotelé" && room.wallMaterial !== "No se modifica" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`removeGotele-${room.id}`}
                        checked={room.removeGotele === true}
                        onCheckedChange={handleRemoveGoteleChange}
                      />
                      <Label htmlFor={`removeGotele-${room.id}`} className="text-xs cursor-pointer">
                        Retirar gotelé
                      </Label>
                    </div>
                  )}

                  {/* Mostrar radiadores solo si la calefacción es con caldera o central */}
                  {shouldShowRadiator && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`hasRadiator-${room.id}`}
                        checked={room.hasRadiator}
                        onCheckedChange={(checked) => updateRoom(room.id, { hasRadiator: checked === true })}
                      />
                      <Label htmlFor={`hasRadiator-${room.id}`} className="text-xs cursor-pointer">
                        Retirar radiador
                      </Label>
                    </div>
                  )}

                  {/* Mostrar retirada de bajantes fecales solo en baños */}
                  {room.type === "Baño" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`removeSewagePipes-${room.id}`}
                        checked={room.removeSewagePipes}
                        onCheckedChange={(checked) => updateRoom(room.id, { removeSewagePipes: checked === true })}
                      />
                      <Label htmlFor={`removeSewagePipes-${room.id}`} className="text-xs cursor-pointer">
                        Retirada de bajantes fecales
                      </Label>
                    </div>
                  )}

                  {/* Opciones específicas según tipo de habitación (sin título) */}
                  {room.type === "Baño" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`removeBathroomElements-${room.id}`}
                        checked={room.removeBathroomElements !== false} // Siempre true a menos que explícitamente sea false
                        defaultChecked={true}
                        onCheckedChange={(checked) => updateRoom(room.id, { removeBathroomElements: checked === true })}
                      />
                      <Label htmlFor={`removeBathroomElements-${room.id}`} className="text-xs cursor-pointer">
                        Retirar elementos de baño
                      </Label>
                    </div>
                  )}

                  {(room.type === "Cocina" || room.type === "Cocina Abierta" || room.type === "Cocina Americana") && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`removeKitchenFurniture-${room.id}`}
                        checked={room.removeKitchenFurniture}
                        onCheckedChange={(checked) => updateRoom(room.id, { removeKitchenFurniture: checked === true })}
                      />
                      <Label htmlFor={`removeKitchenFurniture-${room.id}`} className="text-xs cursor-pointer">
                        Retirar muebles de cocina
                      </Label>
                    </div>
                  )}

                  {(room.type === "Salón" || room.type === "Cocina Abierta" || room.type === "Cocina Americana") && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`removeLivingRoomFurniture-${room.id}`}
                        checked={room.removeLivingRoomFurniture}
                        onCheckedChange={(checked) =>
                          updateRoom(room.id, { removeLivingRoomFurniture: checked === true })
                        }
                      />
                      <Label htmlFor={`removeLivingRoomFurniture-${room.id}`} className="text-xs cursor-pointer">
                        Retirar muebles de salón
                      </Label>
                    </div>
                  )}
                </>
              ) : (
                // Opciones para la sección de reforma
                <>
                  {(() => {
                    const ceilingStatus = demolitionRoom?.currentCeilingStatus || room.currentCeilingStatus
                    console.log(
                      "[v0] Reforma ceiling check - Room:",
                      room.type,
                      room.number,
                      "demolitionRoom status:",
                      demolitionRoom?.currentCeilingStatus,
                      "room status:",
                      room.currentCeilingStatus,
                      "using status:",
                      ceilingStatus,
                      "Should show lower ceiling:",
                      ceilingStatus !== "lowered_keep",
                    )
                    return null
                  })()}

                  {(demolitionRoom?.currentCeilingStatus || room.currentCeilingStatus) !== "lowered_keep" && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`lowerCeiling-${room.id}`}
                          checked={room.lowerCeiling === true}
                          onCheckedChange={(checked) => {
                            updateRoom(room.id, { lowerCeiling: checked === true })

                            if (checked) {
                              const defaultNewHeight = safeStandardHeight - 0.1
                              updateRoom(room.id, { newCeilingHeight: defaultNewHeight })
                              setCeilingHeightInput(formatDecimal(defaultNewHeight))
                            }
                          }}
                        />
                        <Label htmlFor={`lowerCeiling-${room.id}`} className="text-xs cursor-pointer">
                          Bajar techo
                        </Label>
                      </div>

                      {room.lowerCeiling && (
                        <div className="ml-6 space-y-1">
                          <Label htmlFor={`newCeilingHeight-${room.id}`} className="text-xs">
                            Nueva altura (m)
                          </Label>
                          <Input
                            id={`newCeilingHeight-${room.id}`}
                            type="text"
                            value={ceilingHeightInput}
                            onChange={(e) => {
                              const inputValue = e.target.value
                              setCeilingHeightInput(inputValue)
                              const numValue = Number.parseFloat(inputValue.replace(",", "."))
                              if (!isNaN(numValue) && numValue > safeStandardHeight) {
                                setCeilingHeightInput(formatDecimal(safeStandardHeight))
                                updateRoom(room.id, { newCeilingHeight: safeStandardHeight })
                              }
                            }}
                            onBlur={() => {
                              const numValue = Number.parseFloat(ceilingHeightInput.replace(",", "."))
                              if (!isNaN(numValue)) {
                                const finalValue = Math.min(numValue, safeStandardHeight)
                                updateRoom(room.id, { newCeilingHeight: finalValue })
                                setCeilingHeightInput(formatDecimal(finalValue))
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const numValue = Number.parseFloat(ceilingHeightInput.replace(",", "."))
                                if (!isNaN(numValue)) {
                                  const finalValue = Math.min(numValue, safeStandardHeight)
                                  updateRoom(room.id, { newCeilingHeight: finalValue })
                                  setCeilingHeightInput(formatDecimal(finalValue))
                                }
                              }
                            }}
                            className="h-8 text-xs"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Máximo: {formatDecimal(safeStandardHeight)}m (altura del proyecto)
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Radiadores */}
                  {room.type !== "Terraza" && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`hasRadiator-${room.id}`}
                          checked={room.hasRadiator}
                          onCheckedChange={(checked) => updateRoom(room.id, { hasRadiator: checked === true })}
                        />
                        <Label htmlFor={`hasRadiator-${room.id}`} className="text-xs cursor-pointer">
                          Radiador
                        </Label>
                        {room.hasRadiator && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Añadir un nuevo radiador a la lista
                              const currentRadiators = room.radiators || []
                              const newRadiator = {
                                id: uuidv4(),
                                type: getDefaultRadiatorType(),
                                modules: 6,
                              }
                              updateRoom(room.id, { radiators: [...currentRadiators, newRadiator] })
                            }}
                            className="h-5 w-5 p-0 ml-1"
                            title="Añadir otro radiador"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      {room.hasRadiator && (
                        <div className="ml-6 space-y-3">
                          {/* Si no hay radiadores definidos, mostrar la interfaz simple */}
                          {!room.radiators || room.radiators.length === 0 ? (
                            <div className="space-y-2">
                              <Select
                                value={room.radiatorType || getDefaultRadiatorType()}
                                onValueChange={(value) => handleRadiatorTypeChange(value as RadiatorType)}
                              >
                                <SelectTrigger id={`radiatorType-${room.id}`} className="h-7 text-xs">
                                  <SelectValue placeholder="Tipo de radiador" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Radiador de Aluminio">Radiador de Aluminio</SelectItem>
                                  {heatingType !== "Caldera + Radiadores" && (
                                    <>
                                      <SelectItem value="Radiador eléctrico">Radiador eléctrico</SelectItem>
                                      <SelectItem value="Toallero eléctrico">Toallero eléctrico</SelectItem>
                                    </>
                                  )}
                                  <SelectItem value="Toallero de aluminio">Toallero de aluminio</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            // Mostrar la lista de radiadores
                            <div className="space-y-3">
                              {room.radiators.map((radiator, index) => (
                                <div
                                  key={radiator.id}
                                  className="space-y-2 border-b pb-2 border-gray-100 dark:border-gray-800"
                                >
                                  <Select
                                    value={radiator.type}
                                    onValueChange={(value) => {
                                      // Actualizar tipo para este radiador específico
                                      const updatedRadiators = room.radiators?.map((r) =>
                                        r.id === radiator.id ? { ...r, type: value as RadiatorType } : r,
                                      )
                                      updateRoom(room.id, { radiators: updatedRadiators })
                                    }}
                                  >
                                    <SelectTrigger id={`radiatorType-${radiator.id}`} className="h-7 text-xs flex-1">
                                      <SelectValue placeholder="Tipo de radiador" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Radiador de Aluminio">Radiador de Aluminio</SelectItem>
                                      {heatingType !== "Caldera + Radiadores" && (
                                        <>
                                          <SelectItem value="Radiador eléctrico">Radiador eléctrico</SelectItem>
                                          <SelectItem value="Toallero eléctrico">Toallero eléctrico</SelectItem>
                                        </>
                                      )}
                                      <SelectItem value="Toallero de aluminio">Toallero de aluminio</SelectItem>
                                    </SelectContent>
                                  </Select>

                                  {room.radiators && room.radiators.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        // Eliminar este radiador específico
                                        const updatedRadiators = room.radiators?.filter((r) => r.id !== radiator.id)
                                        updateRoom(room.id, { radiators: updatedRadiators })
                                      }}
                                      className="h-7 w-7 p-0"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {isReform && (
                <>
                  {/* Instalar puertas - SOLO EN REFORMA */}
                  {room.type !== "Terraza" && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`newDoors-${room.id}`}
                          checked={room.newDoors === true}
                          onCheckedChange={(checked) => {
                            updateRoom(room.id, { newDoors: checked === true })
                            if (checked && (!room.newDoorList || room.newDoorList.length === 0)) {
                              updateRoom(room.id, {
                                newDoorList: [{ id: uuidv4(), type: "Abatible" as DoorType }],
                              })
                            }
                          }}
                        />
                        <Label htmlFor={`newDoors-${room.id}`} className="text-xs cursor-pointer">
                          {room.type === "Baño" ? "Instalar puerta" : "Instalar puertas"}
                        </Label>
                        {room.newDoors && room.type !== "Baño" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentDoors = room.newDoorList || []
                              updateRoom(room.id, {
                                newDoorList: [...currentDoors, { id: uuidv4(), type: "Abatible" as DoorType }],
                              })
                            }}
                            className="h-5 w-5 p-0 ml-1"
                            title="Añadir otra puerta"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      {room.newDoors && room.newDoorList && room.newDoorList.length > 0 && (
                        <div className="ml-6 space-y-2">
                          {room.newDoorList.map((door, index) => (
                            <div key={door.id} className="flex items-center space-x-2">
                              <Select
                                value={door.type}
                                onValueChange={(value) => {
                                  const updatedDoors = room.newDoorList?.map((d) =>
                                    d.id === door.id ? { ...d, type: value as DoorType } : d,
                                  )
                                  updateRoom(room.id, { newDoorList: updatedDoors })
                                }}
                              >
                                <SelectTrigger className="h-7 text-xs flex-1">
                                  <SelectValue placeholder="Tipo de puerta" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Abatible">Abatible</SelectItem>
                                  <SelectItem value="Corredera empotrada">Corredera empotrada</SelectItem>
                                </SelectContent>
                              </Select>
                              {(room.newDoorList.length > 1 || room.type !== "Baño") && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const updatedDoors = room.newDoorList?.filter((d) => d.id !== door.id)
                                    updateRoom(room.id, { newDoorList: updatedDoors })
                                    if (!updatedDoors || updatedDoors.length === 0) {
                                      updateRoom(room.id, { newDoors: false })
                                    }
                                  }}
                                  className="h-5 w-5 p-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Elementos de baño - SOLO EN REFORMA */}
                  {room.type === "Baño" && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`newBathroomElements-${room.id}`}
                          checked={room.newBathroomElements}
                          onCheckedChange={(checked) => updateRoom(room.id, { newBathroomElements: checked === true })}
                        />
                        <Label htmlFor={`newBathroomElements-${room.id}`} className="text-xs cursor-pointer">
                          Elementos de baño
                        </Label>
                      </div>

                      {room.newBathroomElements && (
                        <div className="ml-4 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`bathroomElement-inodoro-${room.id}`}
                              checked={isBathroomElementSelected("Inodoro")}
                              onCheckedChange={(checked) => handleBathroomElementChange("Inodoro", checked === true)}
                            />
                            <Label htmlFor={`bathroomElement-inodoro-${room.id}`} className="text-xs cursor-pointer">
                              Inodoro
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`bathroomElement-bide-${room.id}`}
                              checked={isBathroomElementSelected("Bidé")}
                              onCheckedChange={(checked) => handleBathroomElementChange("Bidé", checked === true)}
                            />
                            <Label htmlFor={`bathroomElement-bide-${room.id}`} className="text-xs cursor-pointer">
                              Bidé
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`bathroomElement-duchetaInodoro-${room.id}`}
                              checked={isBathroomElementSelected("Ducheta Inodoro")}
                              onCheckedChange={(checked) =>
                                handleBathroomElementChange("Ducheta Inodoro", checked === true)
                              }
                            />
                            <Label
                              htmlFor={`bathroomElement-duchetaInodoro-${room.id}`}
                              className="text-xs cursor-pointer"
                            >
                              Ducheta Inodoro
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`bathroomElement-platoDucha-${room.id}`}
                              checked={isBathroomElementSelected("Plato de ducha")}
                              onCheckedChange={(checked) =>
                                handleBathroomElementChange("Plato de ducha", checked === true)
                              }
                            />
                            <Label htmlFor={`bathroomElement-platoDucha-${room.id}`} className="text-xs cursor-pointer">
                              Plato de ducha
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`bathroomElement-banera-${room.id}`}
                              checked={isBathroomElementSelected("Bañera")}
                              onCheckedChange={(checked) => handleBathroomElementChange("Bañera", checked === true)}
                            />
                            <Label htmlFor={`bathroomElement-banera-${room.id}`} className="text-xs cursor-pointer">
                              Bañera
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`bathroomElement-mampara-${room.id}`}
                              checked={isBathroomElementSelected("Mampara")}
                              onCheckedChange={(checked) => handleBathroomElementChange("Mampara", checked === true)}
                            />
                            <Label htmlFor={`bathroomElement-mampara-${room.id}`} className="text-xs cursor-pointer">
                              Mampara
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`bathroomElement-muebleLavabo-${room.id}`}
                              checked={isBathroomElementSelected("Mueble lavabo")}
                              onCheckedChange={(checked) =>
                                handleBathroomElementChange("Mueble lavabo", checked === true)
                              }
                            />
                            <Label
                              htmlFor={`bathroomElement-muebleLavabo-${room.id}`}
                              className="text-xs cursor-pointer"
                            >
                              Mueble lavabo
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      )}
      {/* Modal del editor de formas */}
      <RoomShapeEditorModal
        isOpen={isShapeEditorOpen}
        onClose={() => setIsShapeEditorOpen(false)}
        onApplyMeasurements={handleApplyShapeMeasurements}
        roomName={formatRoomTitle()}
      />
    </Card>
  )
}
