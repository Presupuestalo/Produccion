"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Pencil,
  Layers,
  Droplets,
  ShowerHead,
  Box,
  Sparkles,
  Droplet
} from "lucide-react"

import { checkRoomConflict } from "@/lib/room-validation"
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
import { Badge } from "@/components/ui/badge"
import type {
  Room,
  FloorMaterialType,
  WallMaterialType,
  MeasurementMode,
  Window,
  Door,
  RadiatorType,
  BathroomElement,
  BathroomElementConfig,
  ElectricalConfig,
  CurrentCeilingStatus,
  CalefaccionType,
  RoomType,
  GlobalConfig,
  DoorType,
} from "@/types/calculator"
import { getDefaultMaterials } from "@/lib/room-utils"
import { v4 as uuidv4 } from "uuid"
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { RoomShapeEditorModal } from "./room-shape-editor-modal"

// Helper component to display tooltips (replace with actual import if it exists)
const QuickSummaryIcon = ({
  icon: Icon,
  content,
  label,
}: { icon: any; content: React.ReactNode; label: string }) => (
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
  isHighlighted?: boolean
  forceShowNumber?: boolean
  existingRooms?: Room[]
  isReadOnly?: boolean
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
  needsNewElectricalInstallation = false,
  electricalConfig,
  onDuplicate,
  demolitionRoom,
  isHighlighted = false,
  forceShowNumber = false,
  existingRooms = [],
  isReadOnly = false,
}: RoomCardProps) {
  // Estado para el acordeón
  const [isOpen, setIsOpen] = useState(true)
  // Estado para la pestaña activa dentro de la habitación
  const [activeTab, setActiveTab] = useState("general")
  const [doorList, setDoorList] = useState<Door[]>(room.doorList || [])
  const [isEditingName, setIsEditingName] = useState(false)
  const [showDimensions, setShowDimensions] = useState(false)
  const [tiledAreaInput, setTiledAreaInput] = useState<string>(room.tiledWallSurfaceArea?.toString() ?? "")
  const cardRef = useRef<HTMLDivElement>(null)
  const prevGlobalConfigRef = useRef<GlobalConfig | undefined>(globalConfig)

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
      // Optional: Add a temporary glowing effect
    }
  }, [isHighlighted])

  // Sincronizar doorList con room.doorList cuando cambie
  useEffect(() => {
    if (room.doorList && JSON.stringify(room.doorList) !== JSON.stringify(doorList)) {
      setDoorList(room.doorList)
    }
  }, [room.doorList])

  useEffect(() => {
    if (room.tiledWallSurfaceArea !== undefined) {
      const currentStr = room.tiledWallSurfaceArea.toString()
      if (currentStr !== tiledAreaInput && parseFloat(tiledAreaInput) !== room.tiledWallSurfaceArea) {
        setTiledAreaInput(currentStr)
      }
    } else {
      setTiledAreaInput("")
    }
  }, [room.tiledWallSurfaceArea])

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
      width: 72,
      height: 203,
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

  const updateDoor = (doorId: string, type: DoorType) => {
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
        doorList: [{ id: uuidv4(), type: "Abatible", width: 0.725, height: 2.03 }],
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

  // Efecto para inicializar el material de suelo si no está definido o es inválido para el modo
  useEffect(() => {
    if (!room.floorMaterial) {
      if (isReform) {
        const defaults = getDefaultMaterials(room.type, true)
        updateRoom(room.id, { floorMaterial: defaults.floor as FloorMaterialType })
      }
    } else if (isReform && room.floorMaterial) {
      const reformValues = ["No se modifica", "Cerámico", "Parquet flotante", "Suelo laminado", "Suelo vinílico", "Otro"]

      // Si el valor actual no es válido para reforma (ej. "Madera" o "Cerámica" de demolición)
      if (!reformValues.includes(room.floorMaterial)) {
        const defaults = getDefaultMaterials(room.type, true)
        console.log(`[v0] Normalizando suelo de ${room.floorMaterial} a ${defaults.floor} en ${room.name || room.type}`)
        updateRoom(room.id, { floorMaterial: defaults.floor as FloorMaterialType })
      }
    }
  }, [room.id, room.floorMaterial, room.type, updateRoom, isReform, room.name])

  // Efecto para actualizar el material de paredes cuando cambia paintAndPlasterAll
  useEffect(() => {
    const prev = prevGlobalConfigRef.current
    // Solo aplicar si transitions de false/undefined/null a true
    const justEnabled = globalConfig?.paintAndPlasterAll === true && (!prev || prev.paintAndPlasterAll !== true)

    if (isReform && justEnabled) {
      if (
        room.type !== "Baño" &&
        room.type !== "Terraza" &&
        room.type !== "Cocina" &&
        room.type !== "Cocina Abierta" &&
        room.type !== "Cocina Americana"
      ) {
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

    // Si es un baño, activar newBathroomElements por defecto (solo si no se ha definido aún)
    if (room.type === "Baño" && room.newBathroomElements === undefined) {
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

  // Efecto para manejar removeAllCeramic - Transition based
  useEffect(() => {
    const prev = prevGlobalConfigRef.current
    const justEnabled = globalConfig?.removeAllCeramic === true && (!prev || prev.removeAllCeramic !== true)

    if (!isReform && justEnabled) {
      if (room.removeWallTiles !== true || room.removeFloor !== true) {
        updateRoom(room.id, {
          removeWallTiles: true,
          removeFloor: true,
        })
      }
    }
  }, [globalConfig?.removeAllCeramic, isReform, room.id, room.removeWallTiles, room.removeFloor, updateRoom])

  // Efecto para manejar allWallsHaveGotele - Transition based
  useEffect(() => {
    const prev = prevGlobalConfigRef.current

    if (!isReform && globalConfig?.allWallsHaveGotele === true && (!prev || prev.allWallsHaveGotele !== true)) {
      if (room.wallMaterial === "Pintura") {
        updateRoom(room.id, {
          wallMaterial: "Gotelé",
          removeGotele: true,
        })
      }
    } else if (!isReform && globalConfig?.allWallsHaveGotele === false && prev?.allWallsHaveGotele === true) {
      if (room.wallMaterial === "Gotelé") {
        updateRoom(room.id, {
          wallMaterial: "Pintura",
          removeGotele: false,
        })
      }
    }
  }, [globalConfig?.allWallsHaveGotele, isReform, room.id, room.wallMaterial, updateRoom])

  // Efecto para manejar removeWoodenFloor global - Transition based
  useEffect(() => {
    const prev = prevGlobalConfigRef.current
    if (!isReform && globalConfig?.removeWoodenFloor === true && (!prev || prev.removeWoodenFloor !== true)) {
      if (room.floorMaterial === "Madera" && room.removeFloor !== true) {
        updateRoom(room.id, { removeFloor: true })
      }
    }
  }, [globalConfig?.removeWoodenFloor, isReform, room.id, room.floorMaterial, room.removeFloor, updateRoom])

  // Efecto para manejar tileAllFloors - Transition based
  useEffect(() => {
    const prev = prevGlobalConfigRef.current
    if (isReform && globalConfig?.tileAllFloors === true && (!prev || prev.tileAllFloors !== true)) {
      if (room.floorMaterial !== "Cerámico") {
        updateRoom(room.id, { floorMaterial: "Cerámico" })
      }
    }
  }, [globalConfig?.tileAllFloors, isReform, room.id, room.floorMaterial, updateRoom])

  // </CHANGE> Auto-convert radiators to electric when electric heating is selected - Transition based
  useEffect(() => {
    const prev = prevGlobalConfigRef.current
    const justChangedToElectric = globalConfig?.reformHeatingType === "Eléctrica" && prev?.reformHeatingType !== "Eléctrica"

    if (isReform && justChangedToElectric) {
      if (room.hasRadiator === undefined) {
        updateRoom(room.id, { hasRadiator: true })
      }

      if (!room.radiators || room.radiators.length === 0) {
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

  // </CHANGE> Auto-convert radiators to aluminum when gas heating is selected - Transition based
  useEffect(() => {
    const prev = prevGlobalConfigRef.current
    const isGasCentral = globalConfig?.reformHeatingType === "Caldera + Radiadores" || globalConfig?.reformHeatingType === "Central"
    const prevWasGasCentral = prev?.reformHeatingType === "Caldera + Radiadores" || prev?.reformHeatingType === "Central"
    const justChangedToGasCentral = isGasCentral && !prevWasGasCentral

    if (isReform && justChangedToGasCentral) {
      if (room.hasRadiator === undefined) {
        updateRoom(room.id, { hasRadiator: true })
      }

      if (room.radiators && room.radiators.length > 0) {
        const isBathroom = room.type === "Baño"
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
      } else if (room.hasRadiator !== false) {
        const isBathroom = room.type === "Baño"
        const defaultType: RadiatorType = isBathroom ? "Toallero de aluminio" : "Radiador de Aluminio"

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

  // Extra conversion check removed as it's handled above

  // Extra conversion check removed as it's handled above

  // Sincronizar el ref del globalConfig después de que se ejecuten los efectos
  useEffect(() => {
    prevGlobalConfigRef.current = globalConfig
  }, [globalConfig])

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

    let value = validateAndParseNumber(widthInput)
    if (value !== null) {
      if (value > 20) value = 20
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

    let value = validateAndParseNumber(lengthInput)
    if (value !== null) {
      if (value > 20) value = 20
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
    const newDoor: Door = {
      id: uuidv4(),
      type: "Abatible",
      width: 0.725,
      height: 2.03,
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
        doorList: [{ id: uuidv4(), type: "Abatible", width: 0.725, height: 2.03 }],
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

  // Helpers para bathroomElementsConfig (nueva) con fallback a bathroomElements (legado)
  const getElementsConfig = (): BathroomElementConfig[] => {
    if (room.bathroomElementsConfig && room.bathroomElementsConfig.length > 0) {
      return room.bathroomElementsConfig
    }
    // Migración automática desde bathroomElements legado
    return (room.bathroomElements || []).map((element) => ({ element, includeSupply: true }))
  }

  const isElementInstalled = (element: BathroomElement): boolean => {
    const config = getElementsConfig()
    return config.some((c) => c.element === element)
  }

  const elementIncludesSupply = (element: BathroomElement): boolean => {
    const config = getElementsConfig()
    const entry = config.find((c) => c.element === element)
    return entry ? entry.includeSupply : true
  }

  const handleBathroomElementInstall = (element: BathroomElement, checked: boolean) => {
    const config = getElementsConfig()
    let newConfig: BathroomElementConfig[]
    if (checked) {
      if (!config.some((c) => c.element === element)) {
        newConfig = [...config, { element, includeSupply: true }]
      } else {
        newConfig = config
      }
    } else {
      newConfig = config.filter((c) => c.element !== element)
    }
    updateRoom(room.id, {
      bathroomElementsConfig: newConfig,
      bathroomElements: newConfig.map((c) => c.element), // mantener compatibilidad
    })
  }

  const handleBathroomElementSupply = (element: BathroomElement, includeSupply: boolean) => {
    const config = getElementsConfig()
    const newConfig = config.map((c) => c.element === element ? { ...c, includeSupply } : c)
    updateRoom(room.id, { bathroomElementsConfig: newConfig })
  }

  // Mantener por retrocompatibilidad (usado en código legado si quedara alguna referencia)
  const handleBathroomElementChange = (element: BathroomElement, checked: boolean) => {
    handleBathroomElementInstall(element, checked)
  }

  // Formatear el título de la habitación
  const formatRoomTitle = () => {
    if (room.name) return room.name

    // Si se fuerza mostrar el número (porque hay duplicados) siempre devolver el formato tipo + número
    if (forceShowNumber) return `${room.type} ${room.number}`

    if (
      room.type === "Salón" ||
      room.type === "Cocina" ||
      room.type === "Cocina Americana" ||
      room.type === "Baño" ||
      room.type === "Hall" ||
      room.type === "Trastero" ||
      room.type === "Vestidor"
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
        if (element.quantity && element.quantity > 0) {
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

  const currentHeatingType = isReform
    ? (globalConfig?.reformHeatingType || globalConfig?.heatingType || "No")
    : (heatingType || "No Tiene")

  const shouldShowRadiator =
    currentHeatingType === "Caldera + Radiadores" ||
    currentHeatingType === "Central" ||
    currentHeatingType === "Eléctrica" ||
    currentHeatingType === "Aerotermia" ||
    currentHeatingType === "Otra"

  // Debug logging for radiator visibility
  useEffect(() => {
    if (isReform) {
      console.log(`[v0] RoomCard Debug (${room.type} ${room.number}) - isReform: ${isReform}, shouldShowRadiator: ${shouldShowRadiator}, reformHeatingType: ${globalConfig?.reformHeatingType}, installRadiators: ${globalConfig?.installRadiators}`)
    }
  }, [isReform, shouldShowRadiator, globalConfig?.reformHeatingType, globalConfig?.installRadiators, room.type, room.number])

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
    return isElementInstalled(element)
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

  // Estado para el diálogo de confirmación
  const [validationAlert, setValidationAlert] = useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => { },
  })

  // Import checkRoomConflict if not imported or pass it differently. 
  // Since I cannot easily add top-level imports without reading the top, I will assume I need to add the import first.
  // Actually, I should probably add the import statement first.

  return (
    <>
      <AlertDialog open={validationAlert.isOpen} onOpenChange={(open) => setValidationAlert((prev) => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{validationAlert.title}</AlertDialogTitle>
            <AlertDialogDescription>{validationAlert.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              validationAlert.onConfirm()
              setValidationAlert((prev) => ({ ...prev, isOpen: false }))
            }}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card
        ref={cardRef}
        className={`relative transition-all duration-500 ${isHighlighted ? "ring-2 ring-primary shadow-lg scale-[1.01]" : ""
          } border-l-4 transition-all duration-200 ${getBorderColor()} bg-card shadow-sm hover:shadow-md overflow-hidden`}>
        <CardHeader className="p-2 md:p-3 flex flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
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
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={room.type}
                      onValueChange={(value) => {
                        const defaultMaterials = getDefaultMaterials(value, isReform)
                        updateRoom(room.id, {
                          type: value as RoomType,
                          name: "", // Clear custom name to let type take precedence
                          floorMaterial: defaultMaterials.floor as any, // Cast to any/string to match type definition
                          wallMaterial: defaultMaterials.wall as any,
                        })
                        setIsEditingName(false)
                      }}
                    >
                      <SelectTrigger className="h-7 w-[180px] text-xs" disabled={isReadOnly}>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Salón">Salón</SelectItem>
                        <SelectItem value="Cocina">Cocina</SelectItem>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setIsEditingName(false)}
                    >
                      <ChevronUp className="h-3 w-3 rotate-90" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{formatRoomTitle()}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 dark:hover:text-orange-400 opacity-60 hover:opacity-100 transition-all duration-200 hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsEditingName(true)
                      }}
                      disabled={isReadOnly}
                    >
                      <Pencil className="h-2.5 w-2.5 transition-transform duration-200" />
                    </Button>
                  </div>
                )}
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
                        className="h-6 w-6 p-0"
                        disabled={isReadOnly}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Duplicar habitación</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {/* </CHANGE> */}

              <Button type="button" variant="destructive" size="sm" onClick={handleDelete} className="h-6 w-6 p-0" disabled={isReadOnly}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {isOpen && (
          <CardContent className="p-2 md:p-3 pt-0">
            <div className="space-y-3">
              {/* Materials Section Redesign */}
              <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden mt-1 shadow-sm">
                <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-primary/10 rounded-md">
                      <Layers className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{isReform ? "Acabados y Materiales" : "Estado Actual"}</span>
                  </div>
                </div>

                <div className="p-3 space-y-3">
                  {/* Campo de texto personalizado para tipo "Otro" integrado aquí */}
                  {room.type === "Otro" && (
                    <div className="space-y-1 pb-1 border-b border-slate-100 dark:border-slate-800">
                      <Label htmlFor={`customRoomType-${room.id}`} className="text-[9px] font-semibold text-slate-500 uppercase ml-1">
                        Especifique el tipo
                      </Label>
                      <Input
                        id={`customRoomType-${room.id}`}
                        type="text"
                        value={customRoomTypeInput}
                        onChange={handleCustomRoomTypeChange}
                        onBlur={saveCustomRoomType}
                        placeholder="Ej. Despensa..."
                        disabled={isReadOnly}
                        className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-primary transition-all"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {/* Suelo */}
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor={`floorMaterial-${room.id}`} className="text-[9px] font-semibold text-slate-500 uppercase ml-1">
                        Suelo
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                          <img src="/images/illustrations/floor.png" alt="" className="h-7 w-7 object-contain" />
                        </div>
                        <Select
                          value={room.floorMaterial}
                          onValueChange={(value) => updateRoom(room.id, { floorMaterial: value as FloorMaterialType })}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger id={`floorMaterial-${room.id}`} className="h-8 text-[11px] font-medium bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 transition-all">
                            <SelectValue placeholder="Material" />
                          </SelectTrigger>
                          <SelectContent>
                            {isReform ? (
                              <>
                                <SelectItem value="No se modifica">No se modifica</SelectItem>
                                <SelectItem value="Cerámico">Cerámico</SelectItem>
                                <SelectItem value="Parquet flotante">Parquet flotante</SelectItem>
                                <SelectItem value="Suelo laminado">Suelo laminado</SelectItem>
                                <SelectItem value="Suelo vinílico">Suelo vinílico</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="No se modifica">No se cambia</SelectItem>
                                <SelectItem value="Madera">Madera</SelectItem>
                                <SelectItem value="Cerámica">Cerámica</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Paredes */}
                    <div className="flex flex-col space-y-1 col-span-2 md:col-span-1">
                      <Label htmlFor={`wallMaterial-${room.id}`} className="text-[9px] font-semibold text-slate-500 uppercase ml-1">
                        Paredes
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                          <img src="/images/illustrations/wall.png" alt="" className="h-7 w-7 object-contain" />
                        </div>
                        <Select
                          value={wallMaterialValue}
                          onValueChange={(v) => {
                            handleWallMaterialChange(v)
                            // Si dejan de ser Cerámica, limpiar datos parciales
                            if (v !== "Cerámica") {
                              updateRoom(room.id, { tiledWallSurfaceArea: undefined, nonCeramicWallPerimeter: undefined, nonCeramicWallArea: undefined, nonCeramicWallMaterial: undefined })
                            }
                          }}
                          disabled={isWallMaterialDisabled || isReadOnly}
                          required
                        >
                          <SelectTrigger id={`wallMaterial-${room.id}`} className="h-8 text-[11px] font-medium bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 transition-all">
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
                              <>
                                <SelectItem value="No se modifica">No se cambia</SelectItem>
                                <SelectItem value="Cerámica">Cerámica</SelectItem>
                                <SelectItem value="Gotelé">Gotelé</SelectItem>
                                <SelectItem value="Papel">Papel</SelectItem>
                                <SelectItem value="Pintura">Pintura</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Bloque Avanzado: cerámica parcial — visible cuando wallMaterial es Cerámica */}
                      {wallMaterialValue === "Cerámica" && (() => {
                        const stdH = (() => {
                          if (isReform && room.lowerCeiling && room.newCeilingHeight) return room.newCeilingHeight
                          if (room.currentCeilingStatus === "lowered_keep" && room.currentCeilingHeight) return room.currentCeilingHeight
                          return room.customHeight || standardHeight
                        })()
                        const totalWallM2 = parseFloat(((room.perimeter || 0) * stdH).toFixed(2))
                        const ceramicM2 = room.tiledWallSurfaceArea ?? totalWallM2
                        const restM2 = parseFloat(Math.max(0, totalWallM2 - ceramicM2).toFixed(2))
                        const hasPartial = room.tiledWallSurfaceArea !== undefined && room.tiledWallSurfaceArea < totalWallM2 - 0.01
                        return (
                          <div className="mt-1 rounded-md border border-blue-100/50 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/10 p-1 animate-in fade-in duration-200">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* m2 cerámica */}
                              <div className="relative w-[75px]">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={tiledAreaInput}
                                  disabled={isReadOnly}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setTiledAreaInput(val);

                                    if (val === "") {
                                      updateRoom(room.id, {
                                        tiledWallSurfaceArea: undefined,
                                        nonCeramicWallPerimeter: undefined,
                                        nonCeramicWallArea: undefined,
                                        nonCeramicWallMaterial: undefined,
                                      });
                                      return;
                                    }

                                    const parsed = parseFloat(val.replace(',', '.'));
                                    if (!isNaN(parsed)) {
                                      const clamped = Math.min(Math.max(0, parsed), totalWallM2);
                                      const rest = parseFloat(Math.max(0, totalWallM2 - clamped).toFixed(2));
                                      updateRoom(room.id, {
                                        tiledWallSurfaceArea: clamped,
                                        nonCeramicWallPerimeter: rest > 0 ? rest / stdH : undefined,
                                        nonCeramicWallArea: rest > 0 ? rest : undefined,
                                        nonCeramicWallMaterial: rest > 0 ? (room.nonCeramicWallMaterial || (isReform ? "Lucir y pintar" : "Pintura")) : undefined,
                                      });
                                    }
                                  }}
                                  onBlur={() => {
                                    if (tiledAreaInput === "" || isNaN(parseFloat(tiledAreaInput.replace(',', '.')))) {
                                      setTiledAreaInput(room.tiledWallSurfaceArea?.toString() ?? "")
                                    } else {
                                      const val = parseFloat(tiledAreaInput.replace(',', '.'));
                                      setTiledAreaInput(val.toString());
                                    }
                                  }}
                                  className="h-6 text-[10px] font-bold pr-4 bg-white dark:bg-slate-950 border-blue-100 dark:border-blue-900/50"
                                  placeholder="m² cer."
                                />
                                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[7px] text-slate-400">m²</span>
                              </div>

                              {/* m2 restantes */}
                              <div className="h-6 px-1.5 flex items-center text-[9px] font-medium text-slate-500 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded pointer-events-none whitespace-nowrap">
                                <span className="opacity-60 mr-1">Resto:</span>
                                <span className="font-bold">{restM2}m²</span>
                              </div>

                              {/* Material del resto */}
                              {restM2 > 0 && (
                                <div className="flex-1 min-w-[100px]">
                                  <Select
                                    value={(() => {
                                      const val = room.nonCeramicWallMaterial || (isReform ? "Lucir y pintar" : "Pintura");
                                      const validOptions = isReform ? ["Lucir y pintar", "Pintura", "No se modifica"] : ["Pintura", "Gotelé", "No se modifica"];
                                      return validOptions.includes(val) ? val : (isReform ? "Lucir y pintar" : "Pintura");
                                    })()}
                                    onValueChange={(v) => updateRoom(room.id, { nonCeramicWallMaterial: v as any })}
                                    disabled={isReadOnly}
                                  >
                                    <SelectTrigger className="h-6 text-[9px] bg-white dark:bg-slate-950 border-blue-100 dark:border-blue-900/50">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {isReform ? (
                                        <>
                                          <SelectItem value="Lucir y pintar">Lucir y pintar</SelectItem>
                                          <SelectItem value="Pintura">Pintura</SelectItem>
                                          <SelectItem value="No se modifica">No se modifica</SelectItem>
                                        </>
                                      ) : (
                                        <>
                                          <SelectItem value="Pintura">Pintura</SelectItem>
                                          <SelectItem value="Gotelé">Gotelé</SelectItem>
                                          <SelectItem value="No se modifica">No se modifica</SelectItem>
                                        </>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                              {/* Botón restablecer - Minimalista */}
                              {hasPartial && (
                                <button
                                  type="button"
                                  onClick={() => updateRoom(room.id, { tiledWallSurfaceArea: undefined, nonCeramicWallPerimeter: undefined, nonCeramicWallArea: undefined, nonCeramicWallMaterial: undefined })}
                                  className="p-1 text-slate-400 hover:text-red-400 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Restablecer cerámica completa"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Techo - Integrado aquí para ahorrar espacio */}
                    <div className="flex flex-col space-y-1 col-span-2 md:col-span-1">
                      <Label className="text-[9px] font-semibold text-slate-500 uppercase ml-1">
                        Techo
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                          <img src="/images/illustrations/ceiling.png" alt="" className="h-7 w-7 object-contain" />
                        </div>
                        <div className="flex-1">
                          {!isReform ? (
                            <div className="flex items-center gap-1.5">
                              <Tabs
                                value={room.currentCeilingStatus || "no_false_ceiling"}
                                onValueChange={handleCurrentCeilingStatusChange}
                                className="flex-1"
                              >
                                <TabsList className="grid grid-cols-3 h-8 p-1 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                                  <TabsTrigger
                                    value="no_false_ceiling"
                                    disabled={isReadOnly}
                                    className="text-[9px] h-6 px-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all font-medium"
                                  >
                                    Ninguno
                                  </TabsTrigger>
                                  <TabsTrigger
                                    value="lowered_remove"
                                    disabled={isReadOnly}
                                    className="text-[9px] h-6 px-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all font-medium"
                                  >
                                    Retirar
                                  </TabsTrigger>
                                  <TabsTrigger
                                    value="lowered_keep"
                                    disabled={isReadOnly}
                                    className="text-[9px] h-6 px-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all font-medium"
                                  >
                                    Mantener
                                  </TabsTrigger>
                                </TabsList>
                              </Tabs>

                              {room.currentCeilingStatus === "lowered_keep" && (
                                <div className="relative group animate-in fade-in slide-in-from-top-1 duration-200 w-20">
                                  <Input
                                    id={`currentCeilingHeight-${room.id}`}
                                    type="text"
                                    value={currentCeilingHeightInput}
                                    onChange={handleCurrentCeilingHeightChange}
                                    onBlur={saveCurrentCeilingHeight}
                                    disabled={isReadOnly}
                                    className="h-8 text-[11px] font-bold pr-5 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                                    placeholder="..."
                                  />
                                  <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-medium">m</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-2 h-8 px-2 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 flex-1">
                                <Checkbox
                                  id={`lowerCeiling-integrated-${room.id}`}
                                  checked={room.lowerCeiling === true}
                                  onCheckedChange={(checked) => {
                                    updateRoom(room.id, { lowerCeiling: checked === true })
                                    if (checked) {
                                      const defaultNewHeight = safeStandardHeight - 0.1
                                      updateRoom(room.id, { newCeilingHeight: defaultNewHeight })
                                      setCeilingHeightInput(formatDecimal(defaultNewHeight))
                                    }
                                  }}
                                  disabled={isReadOnly}
                                  className="h-3.5 w-3.5"
                                />
                                <Label htmlFor={`lowerCeiling-integrated-${room.id}`} className="text-[10px] cursor-pointer font-medium">Bajar techo</Label>
                              </div>
                              {room.lowerCeiling && (
                                <div className="relative group w-20">
                                  <Input
                                    id={`newCeilingHeight-integrated-${room.id}`}
                                    type="text"
                                    value={ceilingHeightInput}
                                    onChange={(e) => {
                                      setCeilingHeightInput(e.target.value)
                                      const numValue = Number.parseFloat(e.target.value.replace(",", "."))
                                      if (!Number.isNaN(numValue)) {
                                        updateRoom(room.id, { newCeilingHeight: numValue })
                                      }
                                    }}
                                    disabled={isReadOnly}
                                    className="h-8 text-[11px] font-bold pr-5 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                                  />
                                  <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-medium">m</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              {/* Measures Section Redesign */}
              <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden mt-2 shadow-sm">
                <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-primary/10 rounded-md">
                      <Ruler className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Dimensiones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[8px] font-medium h-4 px-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500">
                      MÁX. 20m
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMeasurementMode()}
                      className="h-6 w-6 p-0 hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors"
                      title="Cambiar modo de medición"
                      disabled={isReadOnly}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 items-center">
                  {/* Inputs Section */}
                  <div className="space-y-3">
                    {room.measurementMode === "rectangular" ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor={`width-${room.id}`} className="text-[9px] font-semibold text-slate-500 uppercase ml-1">Ancho (m)</Label>
                          <div className="relative group">
                            <Input
                              id={`width-${room.id}`}
                              type="text"
                              value={widthInput}
                              onChange={handleWidthChange}
                              onBlur={saveWidth}
                              disabled={isReadOnly}
                              className="h-8 text-xs font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-primary focus:border-primary transition-all pr-6"
                              placeholder="0,00"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-medium group-focus-within:text-primary transition-colors">m</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`length-${room.id}`} className="text-[9px] font-semibold text-slate-500 uppercase ml-1">Largo (m)</Label>
                          <div className="relative group">
                            <Input
                              id={`length-${room.id}`}
                              type="text"
                              value={lengthInput}
                              onChange={handleLengthChange}
                              onBlur={saveLength}
                              disabled={isReadOnly}
                              className="h-8 text-xs font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-primary focus:border-primary transition-all pr-6"
                              placeholder="0,00"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-medium group-focus-within:text-primary transition-colors">m</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between pr-1">
                            <Label htmlFor={`area-${room.id}`} className="text-[9px] font-semibold text-slate-500 uppercase ml-1">Superficie (m²)</Label>
                            {room.measurementMode === "area-perimeter" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsShapeEditorOpen(true)}
                                className="h-4 w-4 p-0 text-primary hover:bg-primary/10 rounded-full transition-transform hover:scale-110"
                                title="Editor de formas"
                                disabled={isReadOnly}
                              >
                                <Edit className="h-2.5 w-2.5" />
                              </Button>
                            )}
                          </div>
                          <div className="relative group flex items-center">
                            <Input
                              id={`area-${room.id}`}
                              type="text"
                              value={areaInput}
                              onChange={handleAreaChange}
                              onBlur={saveArea}
                              disabled={isReadOnly}
                              className="h-8 text-xs font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-primary focus:border-primary transition-all pr-7"
                              placeholder="0,00"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-medium group-focus-within:text-primary transition-colors">m²</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`perimeter-${room.id}`} className="text-[9px] font-semibold text-slate-500 uppercase ml-1">Perímetro (m)</Label>
                          <div className="relative group">
                            <Input
                              id={`perimeter-${room.id}`}
                              type="text"
                              value={perimeterInput}
                              onChange={handlePerimeterChange}
                              onBlur={savePerimeter}
                              disabled={isReadOnly}
                              className="h-8 text-xs font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-primary focus:border-primary transition-all pr-6"
                              placeholder="0,00"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-medium group-focus-within:text-primary transition-colors">m</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Results Section */}
                  <div className="grid grid-cols-3 gap-1 bg-white dark:bg-slate-900 rounded-lg p-2 shadow-inner border border-slate-100 dark:border-slate-800">
                    <div className="text-center space-y-0.5">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Área</p>
                      <p className="text-xs font-black text-slate-700 dark:text-slate-200">{formatNumber(room.area)}<span className="text-[9px] font-normal ml-0.5 opacity-60">m²</span></p>
                    </div>
                    <div className="text-center space-y-0.5 border-x border-slate-100 dark:border-slate-800">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Perím.</p>
                      <p className="text-xs font-black text-slate-700 dark:text-slate-200">{formatNumber(room.perimeter)}<span className="text-[9px] font-normal ml-0.5 opacity-60">m</span></p>
                    </div>
                    <div className="text-center space-y-0.5">
                      <p className="text-[8px] font-bold text-primary/70 uppercase tracking-tighter">Pared</p>
                      <p className="text-xs font-black text-primary">
                        {formatNumber(
                          room.perimeter *
                          (() => {
                            if (isReform && room.lowerCeiling && room.newCeilingHeight) return room.newCeilingHeight
                            if (room.currentCeilingStatus === "lowered_keep" && room.currentCeilingHeight) return room.currentCeilingHeight
                            return room.customHeight || standardHeight
                          })(),
                        )}
                        <span className="text-[9px] font-normal ml-0.5 opacity-70">m²</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opciones (juntos) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {!isReform ? (
                  // Opciones para la sección de demolición
                  <>
                    {/* El techo ha sido movido a la sección de especificaciones superior */}


                    {room.type !== "Terraza" && (
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`hasDoors-${room.id}`}
                            checked={room.hasDoors}
                            onCheckedChange={(checked) => handleDoorChange(checked === true)}
                            disabled={isReadOnly}
                            className="h-3.5 w-3.5"
                          />
                          <Label htmlFor={`hasDoors-${room.id}`} className="text-[11px] cursor-pointer">
                            {room.type === "Baño" ? "Retirar puerta" : "Retirar puertas"}
                          </Label>
                          {room.hasDoors && room.type !== "Baño" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={addDoorOld}
                              disabled={isReadOnly}
                              className="h-5 w-5 p-0 ml-1"
                              title="Añadir otra puerta"
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>

                        {/* Lista de puertas (solo visible si hasDoors es true) */}
                        {room.hasDoors && room.doorList && room.doorList.length > 0 && (
                          <div className="ml-5 space-y-1.5">
                            {room.doorList.map((door, index) => (
                              <div key={door.id} className="flex items-center space-x-1.5">
                                <Select
                                  value={door.type}
                                  onValueChange={(value) => updateDoorTypeOld(door.id, value as DoorType)}
                                >
                                  <SelectTrigger className="h-7 text-[10px] flex-1">
                                    <SelectValue placeholder="Tipo de puerta" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Abatible">Abatible</SelectItem>
                                    <SelectItem value="Doble abatible">Puerta doble abatible</SelectItem>
                                    <SelectItem value="Corredera empotrada">Corredera empotrada</SelectItem>
                                    <SelectItem value="Corredera exterior con carril">
                                      Corredera exterior
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                {room.doorList && room.doorList.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeDoorOld(door.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
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
                          disabled={isReadOnly}
                          className="h-3.5 w-3.5"
                        />
                        <Label htmlFor={`removeWoodenFloor-${room.id}`} className="text-[11px] cursor-pointer">
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
                          disabled={isReadOnly}
                          className="h-3.5 w-3.5"
                        />
                        <Label htmlFor={`removeWallTiles-${room.id}`} className="text-[11px] cursor-pointer">
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
                          disabled={isReadOnly}
                          className="h-3.5 w-3.5"
                        />
                        <Label htmlFor={`removeFloorTiles-${room.id}`} className="text-[11px] cursor-pointer">
                          Picado de cerámica suelo
                        </Label>
                      </div>
                    )}

                    {isFloorCeramic && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`removeSkirting-${room.id}`}
                          checked={room.removeSkirting === true}
                          onCheckedChange={(checked) => updateRoom(room.id, { removeSkirting: checked === true })}
                          disabled={isReadOnly}
                          className="h-3.5 w-3.5"
                        />
                        <Label htmlFor={`removeSkirting-${room.id}`} className="text-[11px] cursor-pointer">
                          Retirar rodapié cerámico
                        </Label>
                      </div>
                    )}

                    {/* Añadir opción para retirar gotelé - solo visible si el material de pared es gotelé */}
                    {room.wallMaterial === "Gotelé" && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`removeGotele-${room.id}`}
                          checked={room.removeGotele === true}
                          onCheckedChange={handleRemoveGoteleChange}
                          disabled={isReadOnly}
                          className="h-3.5 w-3.5"
                        />
                        <Label htmlFor={`removeGotele-${room.id}`} className="text-[11px] cursor-pointer">
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
                          disabled={isReadOnly}
                          className="h-3.5 w-3.5"
                        />
                        <Label htmlFor={`hasRadiator-${room.id}`} className="text-[11px] cursor-pointer">
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
                          className="h-3.5 w-3.5"
                        />
                        <Label htmlFor={`removeSewagePipes-${room.id}`} className="text-[11px] cursor-pointer">
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
                          className="h-3.5 w-3.5"
                        />
                        <Label htmlFor={`removeBathroomElements-${room.id}`} className="text-[11px] cursor-pointer">
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
                          className="h-3.5 w-3.5"
                        />
                        <Label htmlFor={`removeKitchenFurniture-${room.id}`} className="text-[11px] cursor-pointer">
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
                          className="h-3.5 w-3.5"
                        />
                        <Label htmlFor={`removeLivingRoomFurniture-${room.id}`} className="text-[11px] cursor-pointer">
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

                    {/* Opción de bajar techo movida a la sección superior */}
                  </>
                )}
              </div>

              {/* Radiadores para REFORMA */}
              {isReform && shouldShowRadiator && room.type !== "Terraza" && (
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`hasRadiator-reform-${room.id}`}
                      checked={room.hasRadiator}
                      onCheckedChange={(checked) => updateRoom(room.id, { hasRadiator: checked === true })}
                      disabled={isReadOnly}
                      className="h-3.5 w-3.5"
                    />
                    <Label htmlFor={`hasRadiator-reform-${room.id}`} className="text-[11px] cursor-pointer">
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
                        disabled={isReadOnly}
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
                            disabled={isReadOnly}
                          >
                            <SelectTrigger id={`radiatorType-${room.id}`} className="h-7 text-xs" disabled={isReadOnly}>
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
                                  const handleTypeChange = (newType: RadiatorType) => {
                                    const updatedRadiators = room.radiators?.map((r) =>
                                      r.id === radiator.id ? { ...r, type: newType } : r,
                                    );
                                    updateRoom(room.id, { radiators: updatedRadiators });
                                  };

                                  handleTypeChange(value as RadiatorType);
                                }}
                              >
                                <SelectTrigger id={`radiatorType-${radiator.id}`} className="h-7 text-xs flex-1" disabled={isReadOnly}>
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


              {isReform && (
                <>
                  {/* Instalar puertas - SOLO EN REFORMA */}
                  {room.type !== "Terraza" && (
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`newDoors-${room.id}`}
                          checked={room.newDoors === true}
                          onCheckedChange={(checked) => {
                            updateRoom(room.id, { newDoors: checked === true })
                            if (checked && (!room.newDoorList || room.newDoorList.length === 0)) {
                              updateRoom(room.id, {
                                newDoorList: [
                                  {
                                    id: uuidv4(),
                                    type: "Abatible" as DoorType,
                                    width: 0.725,
                                    height: 2.03,
                                  },
                                ],
                              })
                            }
                          }}
                          disabled={isReadOnly}
                          className="h-3.5 w-3.5"
                        />
                        <Label htmlFor={`newDoors-${room.id}`} className="text-[11px] cursor-pointer">
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
                                newDoorList: [
                                  ...currentDoors,
                                  {
                                    id: uuidv4(),
                                    type: "Abatible" as DoorType,
                                    width: 0.725,
                                    height: 2.03,
                                  },
                                ],
                              })
                            }}
                            className="h-5 w-5 p-0 ml-1"
                            title="Añadir otra puerta"
                            disabled={isReadOnly}
                          >
                            <PlusCircle className="h-3 w-3" />
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
                                <SelectTrigger className="h-7 text-xs flex-1" disabled={isReadOnly}>
                                  <SelectValue placeholder="Tipo de puerta" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Abatible">Abatible</SelectItem>
                                  <SelectItem value="Doble abatible">Puerta doble abatible</SelectItem>
                                  <SelectItem value="Corredera empotrada">Corredera empotrada</SelectItem>
                                  <SelectItem value="Corredera exterior con carril">Corredera exterior</SelectItem>
                                </SelectContent>
                              </Select>
                              {((room.newDoorList?.length ?? 0) > 1 || room.type !== "Baño") && (
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
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`newBathroomElements-${room.id}`}
                          checked={room.newBathroomElements}
                          onCheckedChange={(checked) => updateRoom(room.id, { newBathroomElements: checked === true })}
                          disabled={isReadOnly}
                          className="h-3.5 w-3.5"
                        />
                        <Label htmlFor={`newBathroomElements-${room.id}`} className="text-[11px] cursor-pointer">
                          Elementos de baño
                        </Label>
                      </div>

                      {room.newBathroomElements && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {(["Inodoro", "Bidé", "Ducheta Inodoro", "Plato de ducha", "Bañera", "Mampara", "Mueble lavabo"] as BathroomElement[]).map((element) => {
                            const isInstalled = isElementInstalled(element);

                            const getIcon = () => {
                              switch (element) {
                                case "Inodoro":
                                case "Bidé": return <Droplets className="h-4 w-4 text-sky-500/80" />;
                                case "Ducheta Inodoro":
                                case "Plato de ducha": return <ShowerHead className="h-4 w-4 text-cyan-500/80" />;
                                case "Bañera": return <Bath className="h-4 w-4 text-indigo-500/80" />;
                                case "Mampara": return <Sparkles className="h-4 w-4 text-amber-500/80" />;
                                case "Mueble lavabo": return <Box className="h-4 w-4 text-emerald-500/80" />;
                                default: return <Droplet className="h-4 w-4 text-gray-500" />;
                              }
                            };

                            return (
                              <div
                                key={element}
                                className={`relative flex flex-col gap-2 p-2.5 rounded-xl border transition-all duration-200 ${isInstalled
                                  ? "bg-primary/[0.03] border-primary/30 shadow-sm"
                                  : "bg-background border-border hover:bg-muted/40"
                                  }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <Checkbox
                                    disabled={isReadOnly}
                                    id={`bathInstall-${element}-${room.id}`}
                                    checked={isInstalled}
                                    onCheckedChange={(checked) => handleBathroomElementInstall(element, checked === true)}
                                    className="h-4 w-4 rounded-[4px] data-[state=checked]:bg-primary"
                                  />
                                  <Label
                                    htmlFor={`bathInstall-${element}-${room.id}`}
                                    className={`flex items-center gap-2 text-sm cursor-pointer select-none transition-colors ${isInstalled ? "font-semibold text-foreground" : "text-muted-foreground font-medium"
                                      }`}
                                  >
                                    {getIcon()}
                                    {element === "Ducheta Inodoro" ? "Ducheta Inod." : element}
                                  </Label>
                                </div>

                                {/* Suministro en la parte inferior, anidado */}
                                <div
                                  className={`overflow-hidden transition-all duration-300 ease-in-out pl-7 ${isInstalled ? "max-h-12 opacity-100 mt-0.5" : "max-h-0 opacity-0 mt-0"
                                    }`}
                                >
                                  <div className="flex items-center gap-2 bg-background border px-2.5 py-1.5 rounded-md shadow-sm w-max">
                                    <Checkbox
                                      disabled={isReadOnly}
                                      id={`bathSupply-${element}-${room.id}`}
                                      checked={elementIncludesSupply(element)}
                                      onCheckedChange={(checked) => handleBathroomElementSupply(element, checked === true)}
                                      className="h-3.5 w-3.5 rounded-[3px]"
                                    />
                                    <Label
                                      htmlFor={`bathSupply-${element}-${room.id}`}
                                      className="text-[11px] text-muted-foreground cursor-pointer select-none font-medium"
                                    >
                                      + Material
                                    </Label>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}                    </div>
                  )}
                </>
              )}
            </div>

          </CardContent >
        )
        }

        {/* Modal del editor de formas */}
        <RoomShapeEditorModal
          isOpen={isShapeEditorOpen}
          onClose={() => setIsShapeEditorOpen(false)}
          onApplyMeasurements={handleApplyShapeMeasurements}
          roomName={formatRoomTitle()}
        />
      </Card >
    </>
  )
}
