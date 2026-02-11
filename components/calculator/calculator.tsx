"use client"

import { useImperativeHandle } from "react"

import React from "react"

import { useState, useEffect, useCallback, useRef, forwardRef, useMemo } from "react"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Copy, Plus, Save, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { GlobalConfigSection } from "./global-config-section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  Room,
  GlobalConfig,
  DemolitionSummary as DemolitionSummaryType,
  DemolitionSettings as DemolitionSettingsType,
  DebrisCalculation,
  ElectricalConfig,
  Window as CalculatorWindow,
  Door,
  FloorMaterialType,
  WallMaterialType,
  MeasurementMode,
  RoomType,
} from "@/types/calculator"
// Importar servicios para la base de datos
import {
  getCalculatorConfig,
  getDemolitionSettings,
  getRooms,
  getReformRooms,
  ensureCalculatorTableExists,
  saveAllProjectData,
  getElectricalConfig,
  getPartitions, // Importar getPartitions
  getWallLinings, // Importar getWallLinings
} from "@/lib/services/calculator-service"
import { getSupabase } from "@/lib/supabase/client"
import { canAddRoom } from "@/lib/services/subscription-limits-service"
import { InfoIcon } from "lucide-react"
import { RoomsList } from "./rooms-list"
import { checkRoomConflict } from "@/lib/room-validation"
import { getProjectById } from "@/lib/services/project-service"

import { PartitionsSection, type Partition, type WallLining } from "./partitions-section"
import { WindowsSection } from "./windows-section"
import { DemolitionSummary } from "./demolition-summary"
import { ReformSummary } from "./reform-summary"
import { ElectricalSection } from "./electrical-section"
import { RoomsSummary } from "./rooms-summary"
import { AppointmentsHistory } from "./appointments-history"
import { BudgetSection } from "@/components/budget/budget-section"
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



// Importar PaymentsSection
import { PaymentsSection } from "@/components/payments/payments-section"

import { ChevronRight } from "lucide-react"
import { FloorPlanDashboard } from "@/components/dashboard/floor-plan-dashboard"
import { useUserProfile } from "@/hooks/use-user-profile"

function InfoTooltip({ content }: { content: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const handleMouseEnter = () => {
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    setIsOpen(false)
  }

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    // Pequeño retraso para evitar que el tooltip se cierre inmediatamente
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  return (
    <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 text-blue-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Más información"
      >
        <InfoIcon className="h-3 w-3" />
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          className="absolute z-50 w-64 p-3 mt-2 -translate-x-1/2 left-1/2 transform bg-blue-50 text-blue-900 rounded-md shadow-lg border border-blue-200"
          style={{ top: "-0.5rem", transform: "translateX(-50%) translateY(-100%)" }}
          role="tooltip"
        >
          <div className="relative">
            {content}
            <div
              className="absolute w-3 h-3 bg-blue-50 rotate-45 border-r border-b border-blue-200"
              style={{ bottom: "-1.5rem", left: "calc(50% - 0.375rem)" }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}

// Tipo para los datos del proyecto
type ProjectData = {
  rooms: Room[]
  reformRooms: Room[]
  demolitionConfig?: GlobalConfig
  reformConfig?: GlobalConfig
  demolitionSettings?: DemolitionSettingsType
  electricalConfig?: ElectricalConfig
  partitions: Partition[] // Añadir partitions a ProjectData
  wallLinings: WallLining[] // Añadir wallLinings a ProjectData
  lastUpdated: string
}

// Componente para mostrar mensaje de error de base de datos
function DatabaseErrorMessage({ instructions, onClose }: { instructions: string; onClose: () => void }) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error de base de datos</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          Se ha detectado un problema con la estructura de la base de datos. Es necesario crear manualmente la tabla
          calculator_data.
        </p>
        <div className="bg-gray-800 text-white p-3 rounded text-xs overflow-auto max-h-60 my-2">
          <pre>{instructions}</pre>
        </div>
        <p className="text-sm mt-2">
          Copia este código SQL y ejecútalo en el Editor SQL de Supabase. Luego, vuelve a cargar esta página.
        </p>
        <Button variant="outline" size="sm" className="mt-2 bg-transparent" onClick={onClose}>
          Entendido
        </Button>
      </AlertDescription>
    </Alert>
  )
}

type CalculatorProps = {
  projectId?: string
  onSave?: () => void // Added onSave prop for potential external save triggers
  initialData?: any // Añadido initialData
  project?: any // Añadido project prop
}

export interface CalculatorHandle {
  saveCurrentData: () => Promise<void>
  handleRoomsDetectedFromFloorPlan: (demolitionRooms: Room[], reformRooms: Room[]) => void
  handlePartitionsDetectedFromFloorPlan: (
    partitions: Array<{ location: string; length: number; type: "remove" | "add" }>,
  ) => void
  handleApplyDiff: (diff: any) => void // Callback for dashboard
  setActiveTab: (tab: string) => void // Añadiendo método para cambiar el tab activo desde fuera
  addStandaloneWindow: () => void // Nueva función para añadir ventanas independientes
}

const Calculator = forwardRef<CalculatorHandle, CalculatorProps>(function Calculator(
  { projectId, onSave, initialData, project },
  ref,
) {
  const { toast } = useToast()
  const heightInputRef = useRef<HTMLInputElement>(null)
  const { userProfile } = useUserProfile()
  const isOwner = userProfile?.user_type === "homeowner"

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedHashRef = useRef<string>("")
  const isInitialLoadRef = useRef<boolean>(true)
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved")
  const hasCompletedInitialLoadRef = useRef<boolean>(false)
  const isSavingRef = useRef<boolean>(false)
  const pendingSaveRef = useRef<boolean>(false)

  // Sistema de guardado simple sin dependencias circulares
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveDataRef = useRef<string>("")
  const lastSaveAttemptRef = useRef<number>(0)
  const isUpdatingStateRef = useRef<boolean>(false)

  const saveData = useRef<() => void>(() => { })

  // Estado para las habitaciones de demolición
  const [rooms, setRooms] = useState<Room[]>(() => {
    // Inicializar con un array vacío, pero los datos reales se cargarán en el useEffect
    return []
  })

  // Estado para las habitaciones de reforma
  const [reformRooms, setReformRooms] = useState<Room[]>(() => {
    // Inicializar con un array vacío, pero los datos reales se cargarán en el useEffect
    return []
  })

  const [partitions, setPartitions] = useState<Partition[]>([])
  const [wallLinings, setWallLinings] = useState<WallLining[]>([])

  // States needed for UI elements and logic
  const [activeTab, setActiveTab] = useState<string>("demolition") // Estado para la pestaña activa
  const [selectedRoomType, setSelectedRoomType] = useState<string>("Salón") // Estado para el tipo de habitación seleccionado
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null) // Estado para el ID de la habitación seleccionada
  const [isSaving, setIsSaving] = useState<boolean>(false) // Estado para indicar si se está guardando
  const [isLoadingFromDB, setIsLoadingFromDB] = useState<boolean>(true) // Estado para indicar si se está cargando desde la DB
  const [tableExists, setTableExists] = useState<boolean>(false) // Estado para indicar si la tabla existe
  const [isConfigLoaded, setIsConfigLoaded] = useState<boolean>(false) // Estado para indicar si la configuración se ha cargado
  const [lastSaved, setLastSaved] = useState<Date | null>(null) // Estado para la fecha del último guardado
  const [databaseError, setDatabaseError] = useState<{ show: boolean; instructions?: string }>({ show: false })
  const [highlightedRoomId, setHighlightedRoomId] = useState<string | null>(null)

  // Referencia para saber si es la carga inicial
  const [calculatorOpen, setCalculatorOpen] = useState<boolean>(false) // Estado para controlar la apertura de la calculadora
  const [calculatorField, setCalculatorField] = useState<{
    roomId: string
    field: "width" | "length" | "area" | "perimeter"
  } | null>(null) // Estado para el campo de la calculadora
  const [showDemolitionSettings, setShowDemolitionSettings] = useState<boolean>(false) // Estado para mostrar/ocultar ajustes de demolición
  const [originalDemolitionSettings, setOriginalDemolitionSettings] = useState<DemolitionSettingsType | null>(null) // Estado para guardar ajustes originales de demolición
  const [isDemolitionSettingsChanged, setIsDemolitionSettingsChanged] = useState<boolean>(false) // Estado para indicar si los ajustes de demolición han cambiado

  const [showRoomLimitDialog, setShowRoomLimitDialog] = useState(false)
  const [roomLimitMessage, setRoomLimitMessage] = useState("")

  const [hasApprovedBudget, setHasApprovedBudget] = useState(false)
  // Add state for approved budget object
  const [approvedBudget, setApprovedBudget] = useState<any | null>(null)

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

  // Get user profile for user type detection
  // userProfile is already destructured at line 218

  useEffect(() => {
    // Removed the scrollLeft logic from here as it's now handled within the TabsList styling
  }, [])

  // Updated checkApprovedBudget function
  const checkApprovedBudget = useCallback(async () => {
    const supabase = await getSupabase()
    if (!supabase) {
      console.error("[v0] Supabase client is not initialized")
      return
    }

    if (!projectId) return

    try {
      const { data: budgets, error } = await supabase
        .from("budgets")
        .select("*") // Select all columns to get the entire budget object
        .eq("project_id", projectId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        console.error("[v0] Error fetching approved budget:", error)
        return
      }

      if (budgets && budgets.length > 0) {
        setHasApprovedBudget(true)
        // Store the entire budget object
        setApprovedBudget(budgets[0])
      } else {
        setHasApprovedBudget(false)
        setApprovedBudget(null)
      }
    } catch (error) {
      console.error("[v0] Exception checking budgets:", error)
    }
  }, [projectId])

  useEffect(() => {
    checkApprovedBudget()
  }, [checkApprovedBudget])

  useEffect(() => {
    if (activeTab !== "presupuesto") {
      checkApprovedBudget()
    }
  }, [activeTab, checkApprovedBudget])

  useEffect(() => {
    const loadProjectHeight = async () => {
      if (!projectId) return

      try {
        const project = await getProjectById(projectId)
        if (project && project.ceiling_height) {
          const projectHeight =
            typeof project.ceiling_height === "number"
              ? project.ceiling_height
              : Number.parseFloat(project.ceiling_height.toString()) || 2.6

          // Actualizar ambas configuraciones con la altura del proyecto
          setDemolitionConfig((prev) => ({
            ...prev,
            standardHeight: projectHeight,
          }))
          setReformConfig((prev) => ({
            ...prev,
            standardHeight: projectHeight,
          }))
        }
      } catch (error) {
        console.error("Error al cargar altura del proyecto:", error)
      }
    }

    loadProjectHeight()
  }, [projectId])

  const [demolitionConfig, setDemolitionConfig] = useState<GlobalConfig>({
    standardHeight: 2.6, // Se actualizará con la altura del proyecto
    structureType: "Hormigón",
    heatingType: "No Tiene",
    removeWoodenFloor: false,
    projectId: projectId,
    lowerAllCeilings: true,
  })
  const [reformConfig, setReformConfig] = useState<GlobalConfig>({
    standardHeight: 2.6, // Se actualizará con la altura del proyecto
    structureType: "Hormigón",
    heatingType: "No Tiene",
    reformHeatingType: "No", // Inicializar con valor por defecto
    projectId: projectId,
    lowerAllCeilings: true,
    removeWoodenFloor: false, // Inicializar con valor por defecto para cumplir con la interfaz
  })
  const [demolitionSettings, setDemolitionSettings] = useState<DemolitionSettingsType>({
    wallThickness: 10,
    floorTileThickness: 0.01,
    wallTileThickness: 0.01,
    woodExpansionCoef: 1.4,
    ceramicExpansionCoef: 1.4,
    containerSize: 5,
    mortarBaseThickness: 0.08,
    mortarBaseExpansionCoef: 1.4,
    woodenFloorThickness: 0.02,
    woodenFloorExpansionCoef: 1.4,
    floorTileExpansionCoef: 1.4,
    wallExpansionCoef: 1.3,
    ceilingThickness: 0.015,
    ceilingExpansionCoef: 1.4,
  })

  // Estado para la configuración eléctrica
  const [electricalConfig, setElectricalConfig] = useState<ElectricalConfig>({
    generalItems: [],
    totalGeneral: 0,
    needsNewInstallation: false,
    installationType: "Básica",
    hasCertificate: false,
  })

  // Estado para el resumen de demolición
  const [demolitionSummary, setDemolitionSummary] = useState<DemolitionSummaryType>({
    skirting: 0,
    wallpaperRemoval: 0,
    goteleRemoval: 0,
    wallDemolition: 0,
    ceilingDemolition: 0,
    floorTileRemoval: 0,
    woodenFloorRemoval: 0,
    wallTileRemoval: 0,
    bathroomElementsRemoval: 0,
    moldingsRemoval: 0,
    kitchenFurnitureRemoval: 0,
    bedroomFurnitureRemoval: 0,
    sewagePipesRemoval: 0,
    totalDoors: 0,
    totalArea: 0,
    radiatorsRemoval: 0,
    mortarBaseRemoval: 0,
  })

  // Estado para el cálculo de escombros
  const [debrisCalculation, setDebrisCalculation] = useState<DebrisCalculation>({
    wallDebris: 0,
    floorTileDebris: 0,
    wallTileDebris: 0,
    woodenFloorDebris: 0,
    mortarBaseDebris: 0,
    totalDebris: 0,
    containersNeeded: 0,
  })

  // Calculate Demolition Summary and Debris
  useEffect(() => {
    const newSummary: DemolitionSummaryType = {
      skirting: 0,
      wallpaperRemoval: 0,
      goteleRemoval: 0,
      wallDemolition: 0,
      ceilingDemolition: 0,
      floorTileRemoval: 0,
      woodenFloorRemoval: 0,
      wallTileRemoval: 0,
      bathroomElementsRemoval: 0,
      moldingsRemoval: 0,
      kitchenFurnitureRemoval: 0,
      bedroomFurnitureRemoval: 0,
      sewagePipesRemoval: 0,
      totalDoors: 0,
      totalArea: 0,
      radiatorsRemoval: 0,
      mortarBaseRemoval: 0,
    }

    console.log("[v0] DEMOLITION SUMMARY - Calculando resumen para", rooms.length, "habitaciones")

    // Solo calcular si hay habitaciones
    if (rooms.length > 0) {
      rooms.forEach((room) => {
        // Calcular picado de pavimento cerámico
        if (room.removeFloor && (room.floorMaterial === "Cerámica" || room.floorType === "Cerámico")) {
          newSummary.floorTileRemoval += room.area || 0
          console.log(`[v0] ${room.type} ${room.number} - Picado suelo cerámico: ${room.area} m²`)
        }

        // Calcular levantado de suelo de madera
        if (room.removeFloor && (room.floorMaterial === "Madera" || room.floorType === "Madera")) {
          newSummary.woodenFloorRemoval += room.area || 0
          console.log(`[v0] ${room.type} ${room.number} - Levantado suelo madera: ${room.area} m²`)
        }

        const isBathOrKitchen = room.type === "Baño" || room.type === "Cocina"
        const hasWallTiles = room.removeWallTiles && room.tiledWallSurfaceArea && room.tiledWallSurfaceArea > 0
        const hasCeramicWalls = room.removeWallTiles && room.wallMaterial === "Cerámica" && (room.wallSurface || 0) > 0

        if (hasWallTiles) {
          // Usar tiledWallSurfaceArea si está disponible (cálculo específico de área con cerámica)
          newSummary.wallTileRemoval += room.tiledWallSurfaceArea || 0
          console.log(
            `[v0] ${room.type} ${room.number} - Picado paredes cerámicas (tiledWallSurfaceArea): ${room.tiledWallSurfaceArea} m²`,
          )
        } else if (hasCeramicWalls) {
          // Fallback a wallSurface si wallMaterial es Cerámica
          newSummary.wallTileRemoval += room.wallSurface || 0
          console.log(
            `[v0] ${room.type} ${room.number} - Picado paredes cerámicas (wallSurface): ${room.wallSurface} m²`,
          )
        } else if (isBathOrKitchen && room.removeWallTiles) {
          // Para baños/cocinas con removeWallTiles, calcular superficie de pared
          let wallSurface = room.wallSurface || 0

          // Si no hay wallSurface pero sí hay área, estimar perímetro asumiendo habitación cuadrada
          // Perímetro de cuadrado = 4 * sqrt(área)
          if (wallSurface === 0 && room.area && room.area > 0) {
            const estimatedPerimeter = room.perimeter || 4 * Math.sqrt(room.area)
            const height = room.customHeight || demolitionConfig.standardHeight || 2.6
            wallSurface = estimatedPerimeter * height
            console.log(
              `[v0] ${room.type} ${room.number} - Estimando wallSurface: perímetro=${estimatedPerimeter.toFixed(2)}, altura=${height}, wallSurface=${wallSurface.toFixed(2)} m²`,
            )
          }

          if (wallSurface > 0) {
            newSummary.wallTileRemoval += wallSurface
            console.log(
              `[v0] ${room.type} ${room.number} - Picado paredes cerámicas (baño/cocina): ${wallSurface.toFixed(2)} m²`,
            )
          } else {
            console.log(
              `[v0] ${room.type} ${room.number} - Sin superficie de pared cerámica calculada (área: ${room.area})`,
            )
          }
        } else {
          console.log(
            `[v0] ${room.type} ${room.number} - NO picado paredes (removeWallTiles: ${room.removeWallTiles}, wallMaterial: ${room.wallMaterial})`,
          )
        }
        // </CHANGE>

        // Calcular picado de solera base mortero
        if (room.removeMortarBase) {
          newSummary.mortarBaseRemoval += room.area || 0
        }

        // Calcular retirada de elementos de baño
        if (room.removeBathroomElements) {
          newSummary.bathroomElementsRemoval += 1
        }

        // Calcular retirada de muebles de cocina
        if (room.removeKitchenFurniture) {
          newSummary.kitchenFurnitureRemoval += 1
        }

        // Calcular retirada de muebles de dormitorio
        if (room.removeBedroomFurniture) {
          newSummary.bedroomFurnitureRemoval += 1
        }

        if (room.removeGotele && room.wallMaterial === "Gotelé") {
          // Calcular altura de paredes según el estado del techo
          const standardHeight = demolitionConfig.standardHeight || 2.8
          let wallHeight = standardHeight

          if (room.currentCeilingStatus === "lowered_keep" && room.currentCeilingHeight) {
            wallHeight = room.currentCeilingHeight
          } else if (room.lowerCeiling && room.newCeilingHeight) {
            wallHeight = room.newCeilingHeight
          } else if (room.customHeight) {
            wallHeight = room.customHeight
          }

          const goteleArea = (room.perimeter || 0) * wallHeight
          newSummary.goteleRemoval += goteleArea
          console.log(
            `[v0] ${room.type} ${room.number} - Retirada gotelé: ${goteleArea.toFixed(2)} m² (perimeter: ${room.perimeter}, height: ${wallHeight})`,
          )
        }

        // Calcular área total
        newSummary.totalArea += room.area || 0
      })

      console.log(`[v0] DEMOLITION SUMMARY - Total wallTileRemoval: ${newSummary.wallTileRemoval} m²`)
      console.log(`[v0] DEMOLITION SUMMARY - Total floorTileRemoval: ${newSummary.floorTileRemoval} m²`)
    } else {
      console.log("[v0] DEMOLITION SUMMARY - No hay habitaciones, estableciendo todos los valores a 0")
    }

    setDemolitionSummary(newSummary)

    // Calcular escombros
    const floorTileDebris =
      newSummary.floorTileRemoval *
      (demolitionSettings.floorTileThickness || 0.01) *
      (demolitionSettings.ceramicExpansionCoef || 1.4)
    const wallTileDebris =
      newSummary.wallTileRemoval *
      (demolitionSettings.wallTileThickness || 0.01) *
      (demolitionSettings.ceramicExpansionCoef || 1.4)
    const woodenFloorDebris =
      newSummary.woodenFloorRemoval *
      (demolitionSettings.woodenFloorThickness || 0.02) *
      (demolitionSettings.woodenFloorExpansionCoef || 1.4)
    const mortarBaseDebris =
      newSummary.mortarBaseRemoval *
      (demolitionSettings.mortarBaseThickness || 0.08) *
      (demolitionSettings.mortarBaseExpansionCoef || 1.4)

    const totalDebris = floorTileDebris + wallTileDebris + woodenFloorDebris + mortarBaseDebris
    const containersNeeded = Math.ceil(totalDebris / (demolitionSettings.containerSize || 5))

    console.log(`[v0] DEMOLITION SUMMARY - Total debris: ${totalDebris} m³`)

    setDebrisCalculation({
      wallDebris: 0,
      floorTileDebris,
      wallTileDebris,
      woodenFloorDebris,
      mortarBaseDebris,
      totalDebris,
      containersNeeded,
    })
  }, [rooms, demolitionSettings, demolitionConfig.standardHeight])

  // Update saveData ref when dependencies change, but don't trigger re-renders
  useEffect(() => {
    saveData.current = async () => {
      if (!projectId || isLoadingFromDB || !tableExists) return

      try {
        // Save to localStorage first as backup
        const dataToSave = {
          rooms,
          reformRooms,
          demolitionConfig,
          reformConfig,
          demolitionSettings,
          electricalConfig,
          partitions, // Añadir partitions a las dependencias
          wallLinings, // Añadir wallLinings a las dependencias
        }
        localStorage.setItem(`calculator_backup_${projectId}`, JSON.stringify(dataToSave))

        // Then save to Supabase
        const success = await saveAllProjectData(projectId, dataToSave)
        if (success) {
          setLastSaved(new Date())
        }
      } catch (error) {
        console.error("Error saving data:", error)
      }
    }
  }, [
    projectId,
    rooms,
    reformRooms,
    demolitionConfig,
    reformConfig,
    demolitionSettings,
    electricalConfig,
    partitions, // Añadir partitions a las dependencias
    wallLinings, // Añadir wallLinings a las dependencias
    isLoadingFromDB,
    tableExists,
  ])

  // Función para verificar si todas las habitaciones tienen medidas válidas
  const allRoomsHaveMeasurements = (roomsList: Room[]) => {
    return roomsList.every(
      (room) =>
        (room.measurementMode === "rectangular" && room.width > 0 && room.length > 0) ||
        (room.measurementMode === "area-perimeter" && room.area > 0 && room.perimeter > 0),
    )
  }

  // Función para guardar datos en localStorage
  const saveToLocalStorage = useCallback(() => {
    if (!projectId) return

    try {
      const storageKey = `presupuestalo_${projectId}`
      const dataToSave: ProjectData = {
        rooms,
        reformRooms,
        demolitionConfig,
        reformConfig,
        demolitionSettings,
        electricalConfig,
        partitions, // Añadir partitions
        wallLinings, // Añadir wallLinings
        lastUpdated: new Date().toISOString(),
      }

      localStorage.setItem(storageKey, JSON.stringify(dataToSave))
      console.log(`[BACKUP] Datos guardados en localStorage como respaldo`)
    } catch (error) {
      console.error("Error al guardar respaldo en localStorage:", error)
    }
  }, [
    projectId,
    rooms,
    reformRooms,
    demolitionConfig,
    reformConfig,
    demolitionSettings,
    electricalConfig,
    partitions,
    wallLinings,
  ])

  // Función para guardar datos en Supabase con reintentos
  const saveToSupabase = useCallback(async () => {
    if (!projectId || !tableExists) return false

    const now = Date.now()
    if (now - lastSaveAttemptRef.current < 2000) {
      console.log("[SUPABASE] Evitando guardado demasiado frecuente")
      return false
    }

    lastSaveAttemptRef.current = now
    setIsSaving(true)

    try {
      console.log("[v0] SAVE - Guardando datos en Supabase:")
      console.log(`[v0] SAVE - Habitaciones demolición: ${rooms.length}`)
      console.log(`[v0] SAVE - Habitaciones reforma: ${reformRooms.length}`)
      console.log(`[v0] SAVE - Tabiques: ${partitions.length}`)
      console.log(`[v0] SAVE - Trasdosados: ${wallLinings.length}`)

      const dataToSave = {
        rooms,
        reformRooms,
        demolitionConfig,
        reformConfig,
        demolitionSettings,
        electricalConfig,
        partitions,
        wallLinings,
      }

      console.log("[v0] SAVE - Datos completos:", JSON.stringify(dataToSave, null, 2))

      // Guardar todos los datos incluyendo la configuración eléctrica
      const success = await saveAllProjectData(projectId, dataToSave)

      if (success) {
        console.log("[SUPABASE] Datos guardados correctamente en Supabase")
        setLastSaved(new Date())
        return true
      } else {
        throw new Error("Error al guardar los datos")
      }
    } catch (error) {
      console.error("[SUPABASE] Error al guardar en Supabase:", error)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [
    projectId,
    tableExists,
    rooms,
    reformRooms,
    demolitionConfig,
    reformConfig,
    demolitionSettings,
    electricalConfig,
    partitions,
    wallLinings,
  ])

  // Removed saveToLocalStorage function and its usage here, as saveToSupabase now handles it implicitly if needed.
  // The saveToLocalStorage function is still defined and used elsewhere for explicit local backups.

  const saveDataSimple = useRef(async (projectId: string, data: any) => {
    const now = Date.now()
    if (now - lastSaveAttemptRef.current < 2000) {
      return // Evitar guardados muy frecuentes
    }

    lastSaveAttemptRef.current = now

    try {
      const storageKey = `calc_backup_${projectId}`
      const success = await saveAllProjectData(projectId, data)
      if (success) {
        localStorage.setItem(storageKey, JSON.stringify(data))
      }
    } catch (error) {
      console.error("Error al guardar:", error)
    }
  })

  const saveImmediately = useCallback(async () => {
    if (!projectId || !tableExists) return

    const currentDataHash = JSON.stringify({
      rooms,
      reformRooms,
      demolitionConfig,
      reformConfig,
      demolitionSettings,
      electricalConfig,
      partitions, // Añadir partitions
      wallLinings, // Añadir wallLinings
    })

    if (currentDataHash === lastSaveDataRef.current) {
      return
    }

    setIsSaving(true)

    try {
      const success = await saveAllProjectData(projectId, {
        rooms,
        reformRooms,
        demolitionConfig,
        reformConfig,
        demolitionSettings,
        electricalConfig,
        partitions, // Añadir partitions
        wallLinings, // Añadir wallLinings
      })

      if (success) {
        lastSaveDataRef.current = currentDataHash
        // Guardar en localStorage como respaldo
        saveToLocalStorage()
      }
    } catch (error) {
      console.error("Error al guardar en Supabase:", error)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [
    projectId,
    tableExists,
    rooms,
    reformRooms,
    demolitionConfig,
    reformConfig,
    demolitionSettings,
    electricalConfig,
    partitions, // Añadir partitions a las dependencias
    wallLinings, // Añadir wallLinings a las dependencias
    saveToLocalStorage,
  ])

  const calculateStateHash = useCallback(() => {
    // Escoger campos clave para el hash, evitando circularidad pero detectando cambios reales
    const stateToHash = {
      rooms: rooms.map(r => ({ id: r.id, area: r.area, perimeter: r.perimeter, type: r.type, floor: r.floorMaterial, wall: r.wallMaterial, windows: r.windows?.length })),
      reformRooms: reformRooms.map(r => ({ id: r.id, area: r.area, perimeter: r.perimeter, type: r.type, floor: r.floorMaterial, wall: r.wallMaterial })),
      partitions: partitions.map(p => ({ id: p.id, linearMeters: p.linearMeters })),
      wallLiningsLength: wallLinings.length,
      demolitionConfig: { h: demolitionConfig.standardHeight, s: demolitionConfig.structureType },
      reformConfig: { h: reformConfig.standardHeight, t: reformConfig.reformHeatingType },
      demolitionSettings: { t: demolitionSettings.wallThickness, c: demolitionSettings.containerSize },
      electrical: { n: electricalConfig.needsNewInstallation, t: electricalConfig.installationType }
    }
    return JSON.stringify(stateToHash)
  }, [rooms, reformRooms, partitions, wallLinings, demolitionConfig, reformConfig, demolitionSettings, electricalConfig])

  const triggerAutoSaveRef = useRef<() => void>(() => { })

  triggerAutoSaveRef.current = useCallback(() => {
    if (
      isInitialLoadRef.current ||
      isLoadingFromDB ||
      !hasCompletedInitialLoadRef.current ||
      isSavingRef.current ||
      isUpdatingStateRef.current
    ) {
      return
    }

    const now = Date.now()
    if (now - lastSaveAttemptRef.current < 3000) {
      return
    }

    // Calcular hash del estado actual
    const currentHash = calculateStateHash()

    // Si no hay cambios reales, no guardar
    if (currentHash === lastSavedHashRef.current) {
      return
    }

    // Limpiar timeout anterior si existe
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Marcar como "sin guardar"
    setSaveStatus("unsaved")

    autoSaveTimeoutRef.current = setTimeout(async () => {
      // Doble verificación para evitar guardados durante actualizaciones
      if (isSavingRef.current || isUpdatingStateRef.current) {
        pendingSaveRef.current = true
        return
      }

      if (!projectId) {
        console.warn("[v0] AUTO-SAVE: No projectId available, skipping save")
        return
      }

      isSavingRef.current = true
      lastSaveAttemptRef.current = Date.now()
      setSaveStatus("saving")

      const dataToSave = {
        rooms,
        reformRooms,
        demolitionConfig,
        reformConfig,
        demolitionSettings,
        electricalConfig,
        partitions,
        wallLinings,
      }

      try {
        isUpdatingStateRef.current = true
        const success = await saveAllProjectData(projectId, dataToSave)

        if (success) {
          lastSavedHashRef.current = currentHash
          setSaveStatus("saved")
        } else {
          setSaveStatus("unsaved")
        }
      } catch (error) {
        setSaveStatus("unsaved")
        console.error("[v0] AUTO-SAVE: Error al guardar:", error)
      } finally {
        isSavingRef.current = false
        setTimeout(() => {
          isUpdatingStateRef.current = false
        }, 500)

        // Si hay un guardado pendiente, ejecutarlo después de un delay mayor
        if (pendingSaveRef.current) {
          pendingSaveRef.current = false
          setTimeout(() => triggerAutoSaveRef.current(), 3000)
        }
      }
    }, 3000) // Debounce de 3 segundos
  }, [
    projectId,
    rooms,
    reformRooms,
    demolitionConfig,
    reformConfig,
    demolitionSettings,
    electricalConfig,
    partitions,
    wallLinings,
    calculateStateHash,
    isLoadingFromDB,
  ])

  // Filtrar habitaciones para mostrar en la lista (ocultar "Otras ventanas")
  const visibleRooms = useMemo(
    () => rooms.filter((r) => r.customRoomType !== "Otras ventanas" && r.name !== "Otras ventanas"),
    [rooms]
  )

  const visibleReformRooms = useMemo(
    () => reformRooms.filter((r) => r.customRoomType !== "Otras ventanas" && r.name !== "Otras ventanas"),
    [reformRooms]
  )

  useEffect(() => {
    // Saltar durante la carga inicial
    if (isInitialLoadRef.current || isLoadingFromDB || !hasCompletedInitialLoadRef.current) {
      return
    }

    // No disparar si estamos en medio de una actualización de estado
    if (isUpdatingStateRef.current || isSavingRef.current) {
      return
    }

    // Usar la ref para evitar el bucle de dependencias
    triggerAutoSaveRef.current()
  }, [
    rooms,
    reformRooms,
    partitions,
    wallLinings,
    demolitionConfig,
    reformConfig,
    demolitionSettings,
    electricalConfig,
    isLoadingFromDB
  ])

  // Verificar si la tabla existe y cargar datos desde la base de datos al iniciar
  useEffect(() => {
    if (projectId) {
      const loadDataFromSupabase = async () => {
        setIsLoadingFromDB(true)
        isInitialLoadRef.current = true

        try {
          // Verificar si la tabla existe
          const exists = await ensureCalculatorTableExists()
          setTableExists(exists)

          let roomsData: Room[] = []
          let reformRoomsData: Room[] = []
          let config: GlobalConfig | null = null
          let reformConfigData: { reform_config: GlobalConfig } | null = null // Changed to let
          let settings: DemolitionSettingsType | null = null
          let electricalData: ElectricalConfig | null = null
          let partitionsData: Partition[] = []
          let wallLiningsData: WallLining[] = []

          if (exists) {
            console.log("[SUPABASE] Tabla calculator_data existe, cargando datos...")

            // Cargar habitaciones de demolición
            roomsData = (await getRooms(projectId)) || []
            console.log(`[v0] LOAD - Habitaciones demolición desde Supabase: ${roomsData?.length || 0}`)

            if (roomsData && roomsData.length > 0) {
              console.log(`[SUPABASE] ${roomsData.length} habitaciones cargadas`)
              const roomsWithWindows = roomsData.map((room) => ({
                ...room,
                windows: room.windows || [],
              }))
              setRooms(roomsWithWindows)
            } else {
              console.log("[SUPABASE] No se encontraron habitaciones en Supabase")
              setRooms([])
            }

            // Cargar habitaciones de reforma
            reformRoomsData = (await getReformRooms(projectId)) || []
            console.log(`[v0] LOAD - Habitaciones reforma desde Supabase: ${reformRoomsData?.length || 0}`)

            if (reformRoomsData && reformRoomsData.length > 0) {
              console.log(`[SUPABASE] ${reformRoomsData.length} habitaciones de reforma cargadas`)

              const storageKey = `electrical_settings_${projectId}`
              const savedSettings = localStorage.getItem(storageKey)

              let syncedReformRooms = reformRoomsData.map((room) => ({
                ...room,
                windows: room.windows || [],
              }))

              if (savedSettings) {
                try {
                  const settings = JSON.parse(savedSettings)
                  console.log("[v0] LOAD - Ajustes eléctricos desde localStorage:", settings)

                  syncedReformRooms = syncedReformRooms.map((room) => {
                    const roomSettings = settings[room.id]
                    if (!roomSettings) return room

                    const updatedElements = (room.electricalElements || []).map((element) => {
                      const quantity = element.id ? (roomSettings[element.id] || 0) : 0
                      return { ...element, quantity }
                    })

                    const hasTomaTV = updatedElements.some((e) => e.id === "tomaTV")
                    const hasFocosEmpotrados = updatedElements.some((e) => e.id === "focosEmpotrados")

                    if (!hasTomaTV)
                      updatedElements.push({ id: "tomaTV", type: "Toma TV", quantity: roomSettings.tomaTV || 0 })
                    if (!hasFocosEmpotrados)
                      updatedElements.push({
                        id: "focosEmpotrados",
                        type: "Foco empotrado",
                        quantity: roomSettings.focosEmpotrados || 0,
                      })

                    return { ...room, electricalElements: updatedElements }
                  })

                  console.log("[v0] LOAD - Sincronización completada, guardando en Supabase...")
                  await saveAllProjectData(projectId, { reformRooms: syncedReformRooms })
                  console.log("[v0] LOAD - Habitaciones sincronizadas guardadas en Supabase")
                } catch (error) {
                  console.error("[v0] LOAD - Error al sincronizar elementos eléctricos:", error)
                }
              } else {
                console.log("[v0] LOAD - No hay ajustes eléctricos en localStorage")
              }
              setReformRooms(syncedReformRooms)
            } else {
              console.log("[SUPABASE] No se encontraron habitaciones de reforma")
              setReformRooms([])
            }

            config = await getCalculatorConfig(projectId)
            console.log("[v0] LOAD - Configuración global (demolitionConfig) desde Supabase:", config)

            const project = await getProjectById(projectId)
            const projectHeight = project?.ceiling_height
              ? typeof project.ceiling_height === "number"
                ? project.ceiling_height
                : Number.parseFloat(project.ceiling_height.toString()) || 2.6
              : config?.standardHeight || 2.6

            if (config) {
              const configWithDefaults = { ...config, standardHeight: projectHeight, projectId }
              setDemolitionConfig((prev) => ({ ...prev, ...configWithDefaults }))

              console.log("[v0] LOAD - Intentando cargar reformConfig desde Supabase...")
              const supabase = await getSupabase()
              if (!supabase) {
                console.log("[v0] LOAD - Supabase client not available")
                setReformConfig((prev) => ({ ...prev, ...configWithDefaults }))
              } else {
                const { data: reformConfigDataResult, error: reformConfigError } = await supabase
                  .from("calculator_data")
                  .select("reform_config")
                  .eq("project_id", projectId)
                  .single()

                if (reformConfigError) {
                  console.log("[v0] LOAD - Error al cargar reformConfig:", reformConfigError)
                } else if (reformConfigDataResult && reformConfigDataResult.reform_config) {
                  reformConfigData = { reform_config: reformConfigDataResult.reform_config }
                  console.log("[v0] LOAD - reformConfig cargado desde Supabase:", reformConfigData.reform_config)
                  const reformConfigWithDefaults = {
                    ...reformConfigData.reform_config,
                    standardHeight: projectHeight,
                    projectId,
                  }
                  setReformConfig((prev) => ({ ...prev, ...reformConfigWithDefaults }))
                } else {
                  console.log("[v0] LOAD - No se encontró reformConfig en Supabase, usando valores por defecto")
                  setReformConfig((prev) => ({ ...prev, ...configWithDefaults }))
                }
              }
              setIsConfigLoaded(true)
            } else {
              console.log("[SUPABASE] No se encontró configuración global")
              if (typeof window !== "undefined") {
                const storageKey = `presupuestalo_${projectId}`
                const localData = localStorage.getItem(storageKey)
                if (localData) {
                  try {
                    const parsedData = JSON.parse(localData)
                    if (parsedData.demolitionConfig) {
                      console.log("[LOCAL] Configuración de demolición encontrada en localStorage")
                      const configWithDefaults = {
                        ...parsedData.demolitionConfig,
                        standardHeight: projectHeight,
                        projectId,
                      }
                      setDemolitionConfig((prev) => ({ ...prev, ...configWithDefaults }))
                      saveAllProjectData(projectId, { demolitionConfig: configWithDefaults })
                    }
                    if (parsedData.reformConfig) {
                      console.log("[LOCAL] Configuración de reforma encontrada en localStorage")
                      const configWithDefaults = {
                        ...parsedData.reformConfig,
                        standardHeight: projectHeight,
                        projectId,
                      }
                      setReformConfig((prev) => ({ ...prev, ...configWithDefaults }))
                    }
                  } catch (e) {
                    console.error("Error al parsear datos locales:", e)
                  }
                }
              }
              if (!config) {
                const defaultConfig = {
                  standardHeight: projectHeight,
                  structureType: "Hormigón" as const,
                  heatingType: "No Tiene" as const,
                  removeWoodenFloor: false,
                  projectId: projectId,
                  lowerAllCeilings: true,
                }
                setDemolitionConfig((prev) => ({ ...prev, ...defaultConfig }))
                setReformConfig((prev) => ({ ...prev, ...defaultConfig }))
                setIsConfigLoaded(true)
              }
            }

            settings = await getDemolitionSettings(projectId)
            if (settings) {
              console.log("[SUPABASE] Ajustes de demolición cargados:", settings)
              setDemolitionSettings(settings)
              setOriginalDemolitionSettings(settings)
            } else {
              console.log("[SUPABASE] No se encontraron ajustes de demolición")
              if (typeof window !== "undefined") {
                const storageKey = `presupuestalo_${projectId}`
                const localData = localStorage.getItem(storageKey)
                if (localData) {
                  try {
                    const parsedData = JSON.parse(localData)
                    if (parsedData.demolitionSettings) {
                      console.log("[LOCAL] Ajustes de demolición encontrados en localStorage")
                      setDemolitionSettings(parsedData.demolitionSettings)
                      setOriginalDemolitionSettings(parsedData.demolitionSettings)
                      saveAllProjectData(projectId, { demolitionSettings: parsedData.demolitionSettings })
                    }
                  } catch (e) {
                    console.error("Error al parsear datos locales:", e)
                  }
                }
              }
            }

            electricalData = await getElectricalConfig(projectId)
            if (electricalData) {
              console.log("[SUPABASE] Configuración eléctrica cargada:", electricalData)
              setElectricalConfig(electricalData)
            } else {
              console.log("[SUPABASE] No se encontró configuración eléctrica")
              if (typeof window !== "undefined") {
                const storageKey = `presupuestalo_${projectId}`
                const localData = localStorage.getItem(storageKey)
                if (localData) {
                  try {
                    const parsedData = JSON.parse(localData)
                    if (parsedData.electricalConfig) {
                      console.log("[LOCAL] Configuración eléctrica encontrada en localStorage")
                      setElectricalConfig(parsedData.electricalConfig)
                      saveAllProjectData(projectId, { electricalConfig: parsedData.electricalConfig })
                    }
                  } catch (e) {
                    console.error("Error al parsear datos locales:", e)
                  }
                }
              }
            }

            console.log("[v0] LOAD - Cargando partitions desde Supabase...")
            partitionsData = await getPartitions(projectId)
            console.log(`[v0] LOAD - Partitions desde Supabase: ${partitionsData?.length || 0}`)

            console.log("[v0] LOAD - Cargando wallLinings desde Supabase...")
            wallLiningsData = await getWallLinings(projectId)
            console.log(`[v0] LOAD - WallLinings desde Supabase: ${wallLiningsData?.length || 0}`)

            if (partitionsData && partitionsData.length > 0) {
              console.log(`[SUPABASE] ${partitionsData.length} tabiques cargados desde Supabase`)
              setPartitions(partitionsData)
            } else {
              console.log("[SUPABASE] No se encontraron tabiques en Supabase")
              setPartitions([])
            }

            if (wallLiningsData && wallLiningsData.length > 0) {
              console.log(`[SUPABASE] ${wallLiningsData.length} trasdosados cargados desde Supabase`)
              setWallLinings(wallLiningsData)
            } else {
              console.log("[SUPABASE] No se encontraron trasdosados en Supabase")
              setWallLinings([])
            }

            if (typeof window !== "undefined") {
              const storageKey = `presupuestalo_${projectId}`
              const localData = localStorage.getItem(storageKey)
              if (localData) {
                try {
                  const parsedData = JSON.parse(localData)
                  if (!partitionsData || partitionsData.length === 0) {
                    partitionsData =
                      parsedData.partitions && Array.isArray(parsedData.partitions) ? parsedData.partitions : []
                    if (partitionsData.length > 0) {
                      console.log(`[LOCAL] Encontrados ${partitionsData.length} tabiques en localStorage (fallback)`)
                      setPartitions(partitionsData)
                    }
                  }
                  if (!wallLiningsData || wallLiningsData.length === 0) {
                    wallLiningsData =
                      parsedData.wallLinings && Array.isArray(parsedData.wallLinings) ? parsedData.wallLinings : []
                    if (wallLiningsData.length > 0) {
                      console.log(
                        `[LOCAL] Encontrados ${wallLiningsData.length} trasdosados en localStorage (fallback)`,
                      )
                      setWallLinings(wallLiningsData)
                    }
                  }
                } catch (e) {
                  console.error("Error al parsear datos locales:", e)
                }
              } else {
                console.log("[LOCAL] No hay datos de respaldo en localStorage para partitions y wallLinings.")
              }
            }
          } else {
            console.log("[SUPABASE] La tabla calculator_data no existe, inicializando estados vacíos.")
            setRooms([])
            setReformRooms([])
            setPartitions([])
            setWallLinings([])
            const project = await getProjectById(projectId)
            const projectHeight = project?.ceiling_height
              ? typeof project.ceiling_height === "number"
                ? project.ceiling_height
                : Number.parseFloat(project.ceiling_height.toString()) || 2.6
              : 2.6
            setDemolitionConfig({
              standardHeight: projectHeight,
              structureType: "Hormigón",
              heatingType: "No Tiene",
              removeWoodenFloor: false,
              projectId: projectId,
              lowerAllCeilings: true,
            })
            setReformConfig({
              standardHeight: projectHeight,
              structureType: "Hormigón",
              heatingType: "No Tiene",
              reformHeatingType: "No",
              removeWoodenFloor: false,
              projectId: projectId,
              lowerAllCeilings: true,
            })
            const initialSettings = {
              wallThickness: 10,
              floorTileThickness: 0.015,
              wallTileThickness: 0.015,
              woodExpansionCoef: 1.2,
              ceramicExpansionCoef: 1.5,
              containerSize: 6,
              mortarBaseThickness: 0.05,
              mortarBaseExpansionCoef: 1.3,
              woodenFloorThickness: 0.015,
              woodenFloorExpansionCoef: 1.2,
              floorTileExpansionCoef: 1.5,
              wallExpansionCoef: 1.3,
              ceilingThickness: 0.015,
              ceilingExpansionCoef: 1.3,
            }
            setDemolitionSettings(initialSettings)
            setElectricalConfig({
              generalItems: [],
              totalGeneral: 0,
              needsNewInstallation: false,
              installationType: "Básica",
              hasCertificate: false,
            })
            setIsConfigLoaded(true)
          }

          const initialHash = JSON.stringify({
            rooms: roomsData,
            reformRooms: reformRoomsData,
            demolitionConfig: config || demolitionConfig,
            reformConfig: reformConfigData?.reform_config || reformConfig,
            demolitionSettings: settings || demolitionSettings,
            electricalConfig: electricalData || electricalConfig,
            partitions: partitionsData,
            wallLinings: wallLiningsData,
          })
          lastSavedHashRef.current = initialHash
          setSaveStatus("saved")

          // Marcar que la carga inicial ha terminado después de un pequeño delay
          setTimeout(() => {
            isInitialLoadRef.current = false
            hasCompletedInitialLoadRef.current = true
            setIsLoadingFromDB(false)
            console.log("[v0] AUTO-SAVE: ✅ Carga inicial completada, autoguardado activado")
          }, 200)
        } catch (error: any) {
          console.error("[SUPABASE] Error al cargar datos desde la base de datos:", error)
          if (
            error.message &&
            (error.message.includes("exec_sql") ||
              error.message.includes("does not exist") ||
              error.message.includes("no such table"))
          ) {
            try {
              const response = await fetch("/api/fix-calculator-table", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              })
              const data = await response.json()
              if (data.needsManualCreation && data.instructions) {
                setDatabaseError({ show: true, instructions: data.instructions })
              }
            } catch (fetchError) {
              console.error("Error al obtener instrucciones:", fetchError)
            }
          }
        } finally {
          setIsLoadingFromDB(false)
        }
      }

      loadDataFromSupabase()
    }
  }, [projectId])

  const handleUpdateGlobalConfig = useCallback((newConfig: Partial<GlobalConfig>, isReform?: boolean) => {
    if (isReform) {
      setReformConfig((prev) => {
        const updatedConfig = { ...prev, ...newConfig }
        return updatedConfig
      })
    } else {
      setDemolitionConfig((prev) => {
        const updatedConfig = { ...prev, ...newConfig }
        return updatedConfig
      })
    }
    // El autoguardado se activará automáticamente por el
  }, [])

  const addRoom = useCallback(async () => {
    if (!projectId) return
    console.log("[v0] Verificando límites de habitaciones para proyecto:", projectId, "sección:", activeTab)
    const limitCheck = await canAddRoom(projectId, activeTab as "demolition" | "reform")
    if (!limitCheck.allowed) {
      console.log("[v0] Límite de habitaciones alcanzado:", limitCheck.reason)
      setRoomLimitMessage(limitCheck.reason || "Has alcanzado el límite de habitaciones de tu plan.")
      setShowRoomLimitDialog(true)
      return
    }
    console.log("[v0] Límites OK, añadiendo habitación...")

    const handler = activeTab === "demolition" ? setRooms : setReformRooms
    const existingRooms = activeTab === "demolition" ? rooms : reformRooms

    // Validation Check
    const { hasConflict, message } = checkRoomConflict(selectedRoomType, existingRooms)
    if (hasConflict && message) {
      setValidationAlert({
        isOpen: true,
        title: "Posible duplicidad o conflicto",
        description: message,
        onConfirm: () => proceedAddRoom(activeTab, existingRooms, handler),
      })
      return
    }

    proceedAddRoom(activeTab, existingRooms, handler)
  }, [activeTab, rooms, reformRooms, setRooms, setReformRooms, selectedRoomType, projectId, toast])

  const proceedAddRoom = useCallback(
    (
      currentTab: string,
      currentExistingRooms: Room[],
      handler: React.Dispatch<React.SetStateAction<Room[]>>
    ) => {
      // Re-calculate derived values since we are in a callback/continuation
      // or duplicate logic slightly. Best to extract "creation logic" into helper but limited scope here.
      // Use values from closure or re-derive.
      const roomsOfSameType = currentExistingRooms.filter((r) => r.type === selectedRoomType)
      const nextNumber = roomsOfSameType.length + 1

      const isCeramicRoom = selectedRoomType === "Baño" || selectedRoomType === "Cocina"
      const isTerrace = selectedRoomType === "Terraza"

      let defaultFloorType: string
      let defaultFloorMaterial: string
      let defaultWallMaterial: string

      if (currentTab === "demolition") {
        defaultFloorType = isCeramicRoom ? "Cerámica" : "Madera"
        defaultFloorMaterial = defaultFloorType
        defaultWallMaterial = isCeramicRoom ? "Cerámica" : "Pintura"
      } else {
        if (isCeramicRoom) {
          defaultFloorMaterial = "Cerámico"
          defaultWallMaterial = "Cerámica"
        } else if (isTerrace) {
          defaultFloorMaterial = "Cerámico"
          defaultWallMaterial = "No se modifica"
        } else {
          defaultFloorMaterial = "Parquet flotante"
          defaultWallMaterial = "Lucir y pintar"
        }
        defaultFloorType = isCeramicRoom || isTerrace ? "Cerámico" : "Madera"
      }

      const defaultRemoveWallTiles = currentTab === "demolition" && isCeramicRoom ? true : false
      const defaultRemoveFloor = currentTab === "demolition" && isCeramicRoom ? true : false
      const defaultHasDoors = currentTab === "demolition" ? true : false
      const defaultDoorList: Door[] = defaultHasDoors ? [{ id: uuidv4(), type: "Abatible", width: 72, height: 203 }] : []

      const newRoom: Room = {
        id: uuidv4(),
        number: nextNumber,
        type: selectedRoomType as RoomType,
        customRoomType: selectedRoomType === "Otro" ? "" : selectedRoomType,
        width: 3,
        length: 4,
        area: 12,
        perimeter: 14,
        measurementMode: "rectangular",
        floorMaterial: defaultFloorMaterial as FloorMaterialType,
        wallMaterial: defaultWallMaterial as WallMaterialType,
        windows: [],
        radiators: [],
        electricalElements: [],
        doorList: defaultDoorList,
        notes: "",
        material: "default",
        wallThickness: 10,
        floorThickness: 0.01,
        ceilingThickness: 0.01,
        wallTileThickness: 0.01,
        floorTileThickness: 0.01,
        gotele: false,
        skirting: false,
        wallpaperRemoval: false,
        demolishWalls: false,
        demolishCeiling: false,
        removeWoodenFloor: false,
        removeWallTiles: defaultRemoveWallTiles,
        removeFloorTiles: false,
        removeFloor: defaultRemoveFloor,
        removeBathroomElements: false,
        removeMoldings: false,
        removeKitchenFurniture: false,
        removeBedroomFurniture: false,
        removeRadiators: false,
        removeMortarBase: false,
        hasDoors: defaultHasDoors,
        doors: defaultHasDoors ? 1 : 0,
        falseCeiling: false,
        moldings: false,
        removeWallMaterial: false,
        removeCeilingMaterial: false,
        newDoors: false,
        name: `${selectedRoomType} ${nextNumber}`,
        wallArea: 0,
        ceilingArea: 0,
        ceilingMaterial: "Pintura",
        demolitionCost: 0,
        reformCost: 0,
      }

      handler((prevRooms) => [newRoom, ...prevRooms])
      setHighlightedRoomId(newRoom.id)
    },
    [selectedRoomType]
  )

  const duplicateRoom = useCallback(
    async (roomId: string) => {
      if (!projectId) return
      console.log(
        "[v0] Verificando límites de habitaciones para duplicar en proyecto:",
        projectId,
        "sección:",
        activeTab,
      )
      const limitCheck = await canAddRoom(projectId, activeTab as "demolition" | "reform")
      if (!limitCheck.allowed) {
        console.log("[v0] Límite de habitaciones alcanzado:", limitCheck.reason)
        setRoomLimitMessage(limitCheck.reason || "Has alcanzado el límite de habitaciones de tu plan.")
        setShowRoomLimitDialog(true)
        return
      }

      const handler = activeTab === "demolition" ? setRooms : setReformRooms
      const existingRooms = activeTab === "demolition" ? rooms : reformRooms

      const roomToDuplicate = existingRooms.find((r) => r.id === roomId)
      if (!roomToDuplicate) return

      // Validation Check for Duplication
      const { hasConflict, message } = checkRoomConflict(roomToDuplicate.type, existingRooms)
      if (hasConflict && message) {
        setValidationAlert({
          isOpen: true,
          title: "Posible duplicidad o conflicto",
          description: message,
          onConfirm: () => proceedDuplicateRoom(activeTab, existingRooms, handler, roomToDuplicate),
        })
        return
      }

      proceedDuplicateRoom(activeTab, existingRooms, handler, roomToDuplicate)
    },
    [activeTab, rooms, reformRooms, setRooms, setReformRooms, projectId, toast],
  )

  const proceedDuplicateRoom = useCallback(
    (
      currentTab: string,
      currentExistingRooms: Room[],
      handler: React.Dispatch<React.SetStateAction<Room[]>>,
      roomToDuplicate: Room
    ) => {
      // Encontrar todas las habitaciones del mismo tipo
      // Note: Re-filter from currentExistingRooms to be safe, though usage of closure in proceedDuplicateRoom is tricky if not careful.
      // Better to pass currentExistingRooms explicitly.
      const roomsOfSameType = currentExistingRooms.filter((r) => r.type === roomToDuplicate.type)
      const nextNumber = Math.max(...roomsOfSameType.map((r) => r.number || 0)) + 1

      // Crear la habitación duplicada con un nuevo ID y número incrementado
      const duplicatedRoom: Room = {
        ...roomToDuplicate,
        id: uuidv4(),
        number: nextNumber,
        // Generar nuevos IDs para las puertas si existen
        doorList: roomToDuplicate.doorList?.map((door) => ({
          ...door,
          id: uuidv4(),
        })),
        // Generar nuevos IDs para las ventanas si existen
        windows: roomToDuplicate.windows?.map((window) => ({
          ...window,
          id: uuidv4(),
        })),
        // Generar nuevos IDs para los radiadores si existen
        radiators: roomToDuplicate.radiators?.map((radiator) => ({
          ...radiator,
          id: uuidv4(),
        })),
      }

      handler((prevRooms) => [duplicatedRoom, ...prevRooms])
      setHighlightedRoomId(duplicatedRoom.id)

      toast({
        title: "Habitación duplicada",
        description: `Se ha creado una copia de ${roomToDuplicate.type} ${roomToDuplicate.number}`,
      })
    },
    [toast]
  )

  const removeRoom = useCallback(
    (roomId: string) => {
      const handler = activeTab === "demolition" ? setRooms : setReformRooms
      handler((prevRooms) => prevRooms.filter((room) => room.id !== roomId))
    },
    [activeTab, setRooms, setReformRooms],
  )

  const updateRoom = useCallback(
    (roomId: string, updatedRoomData: Partial<Room>) => {
      const handler = activeTab === "demolition" ? setRooms : setReformRooms
      handler((prevRooms) => prevRooms.map((room) => (room.id === roomId ? { ...room, ...updatedRoomData } : room)))
    },
    [activeTab, setRooms, setReformRooms],
  )

  const copyRoomsToReform = useCallback(() => {
    if (!allRoomsHaveMeasurements(rooms)) {
      toast({
        title: "Error",
        description: "Por favor, completa las medidas de todas las habitaciones de demolición antes de copiar.",
        variant: "destructive",
      })
      return
    }
    setReformRooms(rooms.map((room) => ({ ...room, id: uuidv4() }))) // Generar nuevos IDs para evitar duplicados
    setActiveTab("reform")
    toast({
      title: "Éxito",
      description: "Habitaciones copiadas a la sección de reforma.",
    })
  }, [rooms, toast])

  const handleUpdateElectricalConfig = useCallback((newConfig: Partial<ElectricalConfig>) => {
    setElectricalConfig((prev) => {
      const updatedConfig = { ...prev, ...newConfig }
      return updatedConfig
    })
  }, [])

  // Función para guardar todos los datos, usada por el botón "Guardar"
  const saveAllData = useCallback(async () => {
    setIsSaving(true)
    try {
      const success = await saveToSupabase()
      if (success) {
        toast({ title: "¡Guardado!", description: "Tus cambios se han guardado correctamente." })
        if (onSave) {
          onSave() // Call the onSave prop if provided
        }
      } else {
        toast({ title: "Error al guardar", description: "No se pudieron guardar tus cambios.", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error al guardar todos los datos:", error)
      toast({ title: "Error inesperado", description: "Ocurrió un error al guardar.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }, [saveToSupabase, toast, onSave])

  // Manejar el guardado antes de que la ventana se cierre
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (typeof window !== "undefined" && (window as any).__PRESUPUESTALO_SKIP_BEFOREUNLOAD__) {
        return
      }

      if (!projectId || isSaving) return

      const isDirty =
        lastSaved === null ||
        (typeof window !== "undefined" &&
          localStorage.getItem(`presupuestalo_${projectId}`) !==
          JSON.stringify({
            rooms,
            reformRooms,
            demolitionConfig,
            reformConfig,
            demolitionSettings,
            electricalConfig,
            partitions,
            wallLinings,
            lastUpdated: new Date().toISOString(),
          }))

      if (isDirty) {
        event.preventDefault()
        event.returnValue = ""
        saveToLocalStorage()
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeunload", handleBeforeUnload)
      }
    }
  }, [
    projectId,
    lastSaved,
    isSaving,
    saveToLocalStorage,
    rooms,
    reformRooms,
    demolitionConfig,
    reformConfig,
    demolitionSettings,
    electricalConfig,
    partitions,
    wallLinings,
  ])

  // Función para abrir la calculadora
  const openCalculator = (roomId: string, field: "width" | "length" | "area" | "perimeter") => {
    setCalculatorField({ roomId, field })
    setCalculatorOpen(true)
  }

  // Función para manejar el resultado de la calculadora
  const handleCalculatorResult = (result: number) => {
    if (calculatorField) {
      const { roomId, field } = calculatorField
      updateRoom(roomId, { [field]: result })
    }
    setCalculatorOpen(false)
    setCalculatorField(null)
  }

  // Obtener el valor inicial para la calculadora
  const getCalculatorInitialValue = () => {
    if (!calculatorField) return 0

    const { roomId, field } = calculatorField
    const currentRooms = activeTab === "demolition" ? rooms : reformRooms
    const room = currentRooms.find((r) => r.id === roomId)
    if (!room) return 0

    return room[field] || 0
  }

  // Función para abrir el diálogo de ajustes de demolición
  const openDemolitionSettings = () => {
    setOriginalDemolitionSettings({ ...demolitionSettings })
    setIsDemolitionSettingsChanged(false)
    setShowDemolitionSettings(true)
  }

  // Función para manejar el guardado general (tanto para botón como para antes de cerrar)
  const handleSave = async (forceSave?: boolean) => {
    if (!projectId || !tableExists) return

    const currentHash = calculateStateHash()
    const isDataChanged =
      lastSavedHashRef.current === "" || // Si nunca se ha guardado, considerar que ha cambiado
      currentHash !== lastSavedHashRef.current

    if (!isDataChanged && !forceSave) {
      console.log("[handleSave] No hay cambios, omitiendo guardado.")
      return
    }

    console.log("[handleSave] Iniciando guardado...")
    setIsSaving(true)
    setSaveStatus(forceSave ? "saving" : "saving") // Cambia a "saving" para indicar actividad

    try {
      const dataToSave = {
        rooms,
        reformRooms,
        demolitionConfig,
        reformConfig,
        demolitionSettings,
        electricalConfig,
        partitions,
        wallLinings,
      }
      const success = await saveAllProjectData(projectId, dataToSave)

      if (success) {
        lastSavedHashRef.current = currentHash
        setLastSaved(new Date())
        setSaveStatus("saved")
        console.log("[handleSave] Guardado exitoso.")
        if (forceSave && onSave) {
          onSave() // Llama al callback onSave si se está forzando el guardado
        }
      } else {
        setSaveStatus("unsaved")
        console.error("[handleSave] Error al guardar - la función retornó false")
      }
    } catch (error) {
      setSaveStatus("unsaved")
      console.error("[handleSave] Error inesperado al guardar:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRoomsDetectedFromFloorPlan = useCallback(
    (demolitionRooms: Room[], reformRooms: Room[]) => {
      const processedDemolitionRooms = demolitionRooms.map((room) => {
        const normalizedType = room.type
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()

        const isBathroomOrKitchen =
          normalizedType.includes("bano") || normalizedType.includes("cocina") || normalizedType.includes("aseo")
        const isTerrace = normalizedType.includes("terraza")

        return {
          ...room,
          id: uuidv4(),
          floorMaterial: (isBathroomOrKitchen || isTerrace ? "Cerámica" : "Madera") as FloorMaterialType,
          wallMaterial: (isTerrace ? "No se modifica" : isBathroomOrKitchen ? "Cerámica" : "Pintura") as WallMaterialType,
          removeWallTiles: isBathroomOrKitchen ? true : false,
          removeFloor: isBathroomOrKitchen ? true : false,
          hasDoors: true,
          doorList: room.doorList || [{ id: uuidv4(), type: "Abatible", width: 0.72, height: 2.03 }],
          windows: room.windows || [],
          name: room.name || `${room.type} ${room.number}`,
          doors: room.doors || (room.doorList?.length || 1),
          falseCeiling: room.falseCeiling || false,
          moldings: room.moldings || false,
          measurementMode: room.measurementMode || "rectangular",
          wallArea: room.wallArea || 0,
          ceilingArea: room.ceilingArea || 0,
          ceilingMaterial: room.ceilingMaterial || "Pintura",
          removeWallMaterial: room.removeWallMaterial || false,
          removeCeilingMaterial: room.removeCeilingMaterial || false,
        } as Room
      })

      const processedReformRooms = reformRooms.map((room) => {
        const normalizedType = room.type
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()

        const isBathroomOrKitchen =
          normalizedType.includes("bano") || normalizedType.includes("cocina") || normalizedType.includes("aseo")
        const isTerrace = normalizedType.includes("terraza")

        return {
          ...room,
          id: uuidv4(),
          floorMaterial: (isBathroomOrKitchen || isTerrace ? "Cerámico" : "Parquet flotante") as FloorMaterialType,
          wallMaterial: (isTerrace ? "No se modifica" : isBathroomOrKitchen ? "Cerámica" : "Lucir y pintar") as WallMaterialType,
          windows: room.windows || [],
          name: room.name || `${room.type} ${room.number}`,
          doors: room.doors || (room.doorList?.length || 0),
          falseCeiling: room.falseCeiling || false,
          moldings: room.moldings || false,
          measurementMode: room.measurementMode || "rectangular",
          wallArea: room.wallArea || 0,
          ceilingArea: room.ceilingArea || 0,
          ceilingMaterial: room.ceilingMaterial || "Pintura",
          removeFloor: room.removeFloor || false,
          removeWallMaterial: room.removeWallMaterial || false,
          removeCeilingMaterial: room.removeCeilingMaterial || false,
        } as Room
      })
      setRooms(processedDemolitionRooms)
      setReformRooms(processedReformRooms)
      toast({
        title: "Habitaciones detectadas",
        description: `Se han añadido ${processedDemolitionRooms.length} habitaciones a demolición y ${processedReformRooms.length} a reforma.`,
      })
    },
    [toast],
  )

  useImperativeHandle(ref, () => ({
    saveCurrentData: async () => {
      await handleSave(true)
    },
    handleRoomsDetectedFromFloorPlan: (demolitionRooms, reformRooms) => {
      handleRoomsDetectedFromFloorPlan(demolitionRooms, reformRooms)
    },
    handleApplyDiff: (diff: any) => {
      // 1. Demolition
      if (diff.demolition?.areaSqMeters > 0) {
        const length = diff.demolition.areaSqMeters / (demolitionConfig.standardHeight || 2.5)
        const id = crypto.randomUUID()
        setDemolitionConfig((prev: any) => ({
          ...prev,
          wallDemolitions: [...(prev.wallDemolitions || []), {
            id,
            length: length,
            thickness: 10,
            wallHeight: demolitionConfig.standardHeight || 2.5,
            description: "Demolición según plano"
          }]
        }))
      }
      // 2. Construction
      if (diff.construction?.areaSqMeters > 0) {
        const length = diff.construction.areaSqMeters / (reformConfig.standardHeight || 2.5)
        setPartitions((prev: any[]) => [...prev, {
          id: crypto.randomUUID(),
          type: "placa_yeso",
          linearMeters: length,
          height: reformConfig.standardHeight || 2.5,
          location: "Plano: Muros nuevos"
        }])
      }
      toast({ title: "Cambios aplicados", description: "Partidas de demolición y tabiquería añadidas." })
      setActiveTab("partitions")
    },
    handlePartitionsDetectedFromFloorPlan: (partitionsArr: Array<{ location: string; length: number; type: "remove" | "add" }>) => {
      // 1. Separar tabiques nuevos (add) de derribos (remove)
      const newPartitions = partitionsArr.filter(p => !p.type || p.type === 'add')
      const removalPartitions = partitionsArr.filter(p => p.type === 'remove')

      // 2. Procesar Tabiques Nuevos (Construcción)
      if (newPartitions.length > 0) {
        const formattedNew = newPartitions.map((p: any) => ({
          id: crypto.randomUUID(),
          type: "placa_yeso",
          linearMeters: p.length || 0,
          height: p.height || demolitionConfig.standardHeight || 2.6,
        }))
        setPartitions((prev: any[]) => [...prev, ...formattedNew])
      }

      // 3. Procesar Derribos de Tabiques (Demolición)
      if (removalPartitions.length > 0) {
        const formattedRemovals = removalPartitions.map((p: any) => ({
          id: crypto.randomUUID(),
          length: p.length || 0,
          thickness: 10, // Grosor por defecto solicitado
          wallHeight: demolitionConfig.standardHeight || 2.6,
        }))

        setDemolitionConfig((prev: any) => ({
          ...prev,
          wallDemolitions: [...(prev.wallDemolitions || []), ...formattedRemovals]
        }))
      }

      // 4. Mostrar notificaciones de éxito
      if (newPartitions.length > 0 || removalPartitions.length > 0) {
        let message = ""
        if (newPartitions.length > 0 && removalPartitions.length > 0) {
          message = `Se han detectado ${newPartitions.length} tabiques nuevos y ${removalPartitions.length} derribos.`
        } else if (newPartitions.length > 0) {
          message = `Se han detectado ${newPartitions.length} tabiques nuevos.`
        } else {
          message = `Se han detectado ${removalPartitions.length} derribos de tabiques.`
        }

        toast({
          title: "Cambios estructurales detectados",
          description: message,
        })
      }
    },
    setActiveTab: (tab: string) => {
      setActiveTab(tab)
    },
    addStandaloneWindow: () => {
      // Buscar si ya existe la habitación "Otras ventanas"
      const handler = reformRooms.length > 0 || rooms.length === 0 ? setReformRooms : setRooms
      const existingRooms = reformRooms.length > 0 || rooms.length === 0 ? reformRooms : rooms

      let extrasRoom = existingRooms.find(r => r.customRoomType === "Otras ventanas" || r.name === "Otras ventanas")

      if (!extrasRoom) {
        extrasRoom = {
          id: uuidv4(),
          name: "Otras ventanas",
          type: "Otro",
          customRoomType: "Otras ventanas",
          number: 1,
          doors: 0,
          falseCeiling: false,
          moldings: false,
          measurementMode: "area-perimeter",
          width: 0,
          length: 0,
          area: 0,
          perimeter: 0,
          wallArea: 0,
          ceilingArea: 0,
          floorMaterial: "No se modifica",
          wallMaterial: "No se modifica",
          ceilingMaterial: "Pintura",
          windows: [],
          removeFloor: false,
          removeWallMaterial: false,
          removeCeilingMaterial: false
        }
        handler((prev) => [extrasRoom!, ...prev])
      }

      // El añadir la ventana en sí se puede manejar aquí o en el componente CalculatorWindowsSection
      // Para que sea atómico, añadimos una ventana vacía por defecto
      const defaultWidth = 1.2
      const defaultHeight = 1.2
      const newCalculatorWindow: CalculatorWindow = {
        id: crypto.randomUUID(),
        width: defaultWidth,
        height: defaultHeight,
        type: "Ventana simple",
        material: "PVC",
        opening: "Oscilo-Batiente",
        hasBlind: true,
        color: "Blanco",
        glassType: "Doble",
        hasMosquitera: false,
        outerColor: "Blanco",
        hasCatFlap: false,
        hasFixedPanel: false,
        hasMotor: false,
      }

      handler((prev) => prev.map(r => r.id === extrasRoom!.id ? { ...r, windows: [...(r.windows || []), newCalculatorWindow] } : r))

      toast({
        title: "Ventana añadida",
        description: "Se ha añadido una ventana en la sección 'Otras ventanas'",
      })
    }
  }))

  // Añadir lógica para inicializar datos si están presentes
  useEffect(() => {
    if (initialData) {
      setRooms(initialData.rooms || [])
      setReformRooms(initialData.reformRooms || [])
      setDemolitionConfig(initialData.demolitionConfig || {})
      setReformConfig(initialData.reformConfig || {})
      setDemolitionSettings(initialData.demolitionSettings || {})
      setElectricalConfig(initialData.electricalConfig || {})
      setPartitions(initialData.partitions || [])
      setWallLinings(initialData.wallLinings || [])
      setLastSaved(initialData.lastUpdated ? new Date(initialData.lastUpdated) : null)
      setIsLoadingFromDB(false) // Asumir que la carga ha terminado si hay initialData
      hasCompletedInitialLoadRef.current = true
    }
  }, [initialData])

  const floors = Array.from({ length: 3 }, (_, i) => i + 1) // Ejemplo de pisos, esto podría venir de la config del proyecto
  // Placeholder for electricalSettings, which will be populated by the useEffect above
  const electricalSettings = {
    generalItems: electricalConfig.generalItems,
    installationType: electricalConfig.installationType,
    needsNewInstallation: electricalConfig.needsNewInstallation,
  }

  const handleElectricalConfigChange = useCallback(
    (newConfig: Partial<ElectricalConfig>) => {
      setElectricalConfig((prev) => ({ ...prev, ...newConfig }))
    },
    [setElectricalConfig],
  )

  const globalConfig = demolitionConfig // Assuming demolitionConfig is representative for globalConfig

  useEffect(() => {
    const handleBudgetApproved = () => {
      console.log("[v0] Budget approved event received, refreshing...")
      checkApprovedBudget()
    }

    window.addEventListener("budgetApproved", handleBudgetApproved)

    return () => {
      window.removeEventListener("budgetApproved", handleBudgetApproved)
    }
  }, [checkApprovedBudget])

  return (
    <div className="flex flex-col h-full">
      <div className="fixed bottom-4 right-4 z-50 hidden md:flex">
        {saveStatus === "saving" && (
          <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-4 py-2 rounded-lg shadow-lg">
            <Save className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium">Guardando...</span>
          </div>
        )}
        {saveStatus === "unsaved" && (
          <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-4 py-2 rounded-lg shadow-lg">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Cambios sin guardar</span>
          </div>
        )}
        {saveStatus === "saved" && !isInitialLoadRef.current && (
          <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 px-4 py-2 rounded-lg shadow-lg">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Guardado</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="relative w-full mb-4">
          <div className="w-full overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            <TabsList className="flex h-auto bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl gap-1 lg:grid lg:grid-cols-5 lg:w-full w-max border shadow-sm">
              <TabsTrigger
                value="demolition"
                className="whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all"
              >
                Demolición
              </TabsTrigger>
              <TabsTrigger
                value="reform"
                className="whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all"
              >
                Reforma
              </TabsTrigger>
              <TabsTrigger
                value="partitions"
                className="whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all"
              >
                Tabiquería
              </TabsTrigger>
              <TabsTrigger
                value="windows"
                className="whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all"
              >
                Ventanas
              </TabsTrigger>
              <TabsTrigger
                value="electrical"
                className="whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all"
              >
                Electricidad
              </TabsTrigger>

              {hasApprovedBudget && (
                <TabsTrigger
                  value="cobros"
                  className="whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all"
                >
                  Cobros
                </TabsTrigger>
              )}

              {/* Tab presupuesto oculto pero accesible */}
              <TabsTrigger value="presupuesto" className="hidden">
                Presupuesto
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Indicador visual para móvil: muestra que hay más pestañas */}
          <div className="lg:hidden text-center text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <span>Desliza para ver más opciones</span>
            <ChevronRight className="w-3 h-3 animate-pulse" />
          </div>
        </div>        <div className="space-y-2 w-full pt-1 overflow-x-hidden">


          {/* Mostrar mensaje de error de base de datos si es necesario */}
          {databaseError.show && (
            <DatabaseErrorMessage
              instructions={databaseError.instructions || ""}
              onClose={() => setDatabaseError({ show: false, instructions: "" })}
            />
          )}


          <TabsContent value="demolition" className="mt-6">
            <div className="lg:grid lg:grid-cols-[240px_1.5fr_1fr] lg:gap-6 lg:max-w-none lg:mx-0">
              {/* COLUMNA IZQUIERDA: Resumen de habitaciones y citas (solo desktop) */}
              <div className="hidden lg:block space-y-4 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
                <RoomsSummary rooms={visibleRooms} />
                {!isOwner && projectId && <AppointmentsHistory projectId={projectId} />}
              </div>

              {/* COLUMNA CENTRAL: Contenido principal de la calculadora */}
              <div className="space-y-3">
                {/* Configuración global para demolición */}
                <GlobalConfigSection
                  config={demolitionConfig}
                  updateConfig={handleUpdateGlobalConfig}
                  isReform={false}
                  projectId={projectId}
                  onConfigUpdate={(updatedConfig) => setDemolitionConfig((prev) => ({ ...prev, ...updatedConfig }))}
                />

                <div className="space-y-2">
                  {/* Alerta si no todas las habitaciones tienen medidas */}
                  {visibleRooms.length > 0 && !allRoomsHaveMeasurements(visibleRooms) && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>Completa las medidas de todas las habitaciones.</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor="roomType" className="mb-2 block">
                        Añadir habitación
                      </Label>
                      <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                        <SelectTrigger id="roomType" className="w-full">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Salón">Salón</SelectItem>
                          <SelectItem value="Cocina">Cocina</SelectItem>
                          <SelectItem value="Cocina Abierta">Cocina Abierta</SelectItem>
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
                    <div className="flex gap-2">
                      <Button
                        onClick={addRoom}
                        className="gap-1 flex-1 sm:w-auto sm:min-w-[120px]"
                        disabled={!allRoomsHaveMeasurements(visibleRooms)}
                      >
                        <Plus className="h-4 w-4" /> Añadir
                      </Button>

                      {/* Botón para copiar habitaciones a reforma en móvil - Integrado aquí */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyRoomsToReform}
                        className="lg:hidden h-10 w-10 border-blue-200 text-blue-600"
                        title="Copiar a Reforma"
                        disabled={!allRoomsHaveMeasurements(visibleRooms)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Botón para copiar habitaciones a reforma - Solo desktop */}
                  <div className="hidden lg:block lg:min-w-[200px]">
                    <Button
                      variant="default"
                      size="default"
                      onClick={copyRoomsToReform}
                      className="w-full gap-1 bg-blue-600 hover:bg-blue-700 font-medium"
                      disabled={!allRoomsHaveMeasurements(visibleRooms)}
                    >
                      <Copy className="h-4 w-4" />
                      Copiar a Reforma
                      {!allRoomsHaveMeasurements(visibleRooms) && (
                        <span className="ml-1 text-xs opacity-70">(Completa medidas)</span>
                      )}
                    </Button>
                  </div>
                </div>

                <RoomsList
                  rooms={visibleRooms}
                  updateRoom={updateRoom}
                  removeRoom={removeRoom}
                  duplicateRoom={duplicateRoom} // Pasar la función duplicateRoom
                  selectedRoomId={selectedRoomId}
                  setSelectedRoomId={setSelectedRoomId}
                  openCalculator={openCalculator}
                  activeTab={activeTab}
                  standardHeight={demolitionConfig.standardHeight || 2.6}
                  heatingType={demolitionConfig.heatingType || "ninguna"}
                  globalConfig={demolitionConfig}
                />
              </div>

              {/* COLUMNA DERECHA: Resumen de demolición (solo desktop) */}
              <div className="hidden lg:block lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
                <DemolitionSummary
                  summary={demolitionSummary}
                  debrisCalculation={debrisCalculation}
                  projectId={projectId}
                  globalConfig={demolitionConfig}
                  demolitionSettings={demolitionSettings}
                  rooms={rooms}
                />
              </div>
            </div>

            {/* Resumen de demolición en móvil (debajo de todo) */}
            <div className="lg:hidden">
              <DemolitionSummary
                summary={demolitionSummary}
                debrisCalculation={debrisCalculation}
                projectId={projectId}
                globalConfig={demolitionConfig}
                demolitionSettings={demolitionSettings}
                rooms={rooms}
              />
            </div>
          </TabsContent>

          <TabsContent value="reform" className="mt-6">
            <div className="lg:grid lg:grid-cols-[240px_1.5fr_1fr] lg:gap-6 lg:max-w-none lg:mx-0">
              {/* COLUMNA IZQUIERDA: Resumen de habitaciones y citas (solo desktop) */}
              <div className="hidden lg:block space-y-4 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
                <RoomsSummary rooms={visibleReformRooms} />
                {!isOwner && <AppointmentsHistory projectId={projectId} />}
              </div>

              {/* COLUMNA CENTRAL: Contenido principal de la calculadora */}
              <div className="space-y-3">
                {/* Configuración global para reforma */}
                <GlobalConfigSection
                  config={reformConfig}
                  updateConfig={handleUpdateGlobalConfig}
                  isReform={true}
                  demolitionConfig={demolitionConfig}
                  projectId={projectId}
                />

                <div className="space-y-2">
                  {/* Alerta si no todas las habitaciones tienen medidas */}
                  {visibleReformRooms.length > 0 && !allRoomsHaveMeasurements(visibleReformRooms) && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>Completa las medidas de todas las habitaciones.</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor="roomTypeReform" className="mb-2 block">
                        Añadir habitación
                      </Label>
                      <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                        <SelectTrigger id="roomTypeReform" className="w-full">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Salón">Salón</SelectItem>
                          <SelectItem value="Cocina">Cocina</SelectItem>
                          <SelectItem value="Cocina Abierta">Cocina Abierta</SelectItem>
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
                      onClick={addRoom}
                      className="gap-1 w-full sm:w-auto sm:min-w-[120px]"
                      disabled={!allRoomsHaveMeasurements(visibleReformRooms)}
                    >
                      <Plus className="h-4 w-4" /> Añadir
                    </Button>
                  </div>
                </div>

                {/* Lista de habitaciones de reforma */}
                <RoomsList
                  rooms={visibleReformRooms}
                  updateRoom={updateRoom}
                  removeRoom={removeRoom}
                  duplicateRoom={duplicateRoom}
                  selectedRoomId={selectedRoomId}
                  setSelectedRoomId={setSelectedRoomId}
                  openCalculator={openCalculator}
                  activeTab={activeTab}
                  standardHeight={reformConfig.standardHeight || 2.6}
                  heatingType={reformConfig.heatingType || "ninguna"}
                  isReform={true}
                  globalConfig={reformConfig}
                  electricalConfig={electricalConfig}
                  demolitionRooms={rooms}
                  highlightedRoomId={highlightedRoomId}
                />
              </div>

              {/* COLUMNA DERECHA: Resumen de reforma (solo desktop) */}
              <div className="hidden lg:block lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
                <ReformSummary
                  rooms={reformRooms}
                  globalConfig={reformConfig}
                  electricalConfig={electricalConfig}
                  partitions={partitions}
                  wallLinings={wallLinings}
                />
              </div>
            </div>

            {/* Resumen de reforma en móvil (debajo de todo) */}
            <div className="lg:hidden">
              <ReformSummary
                rooms={reformRooms}
                globalConfig={reformConfig}
                electricalConfig={electricalConfig}
                partitions={partitions}
                wallLinings={wallLinings}
              />
            </div>
          </TabsContent>

          <TabsContent value="windows" className="space-y-3">
            <WindowsSection
              rooms={reformRooms.length > 0 ? reformRooms : rooms}
              updateRoom={updateRoom}
              projectId={projectId}
              onAddStandaloneWindow={() => {
                // Llamar a la función local que implementamos
                const handler = reformRooms.length > 0 || rooms.length === 0 ? setReformRooms : setRooms
                const existingRooms = reformRooms.length > 0 || rooms.length === 0 ? reformRooms : rooms

                let extrasRoom = existingRooms.find(r => r.customRoomType === "Otras ventanas" || r.name === "Otras ventanas")

                if (!extrasRoom) {
                  extrasRoom = {
                    id: uuidv4(),
                    name: "Otras ventanas",
                    type: "Otro",
                    customRoomType: "Otras ventanas",
                    number: 1,
                    doors: 0,
                    falseCeiling: false,
                    moldings: false,
                    measurementMode: "area-perimeter",
                    width: 0,
                    length: 0,
                    area: 0,
                    perimeter: 0,
                    wallArea: 0,
                    ceilingArea: 0,
                    floorMaterial: "No se modifica",
                    wallMaterial: "No se modifica",
                    ceilingMaterial: "Pintura",
                    windows: [],
                    removeFloor: false,
                    removeWallMaterial: false,
                    removeCeilingMaterial: false
                  }
                  handler((prev) => [extrasRoom!, ...prev])
                }

                const newWindow: CalculatorWindow = {
                  id: crypto.randomUUID(),
                  width: 1.2,
                  height: 1.2,
                  type: "Ventana simple",
                  material: "PVC",
                  opening: "Oscilo-Batiente",
                  hasBlind: true,
                  glassType: "Doble",
                  hasMosquitera: false,
                  description: "",
                  price: 0,
                  innerColor: "Blanco",
                  outerColor: "Blanco",
                  hasCatFlap: false,
                  hasFixedPanel: false,
                  hasMotor: false,
                }

                const currentWindows = Array.isArray(extrasRoom!.windows) ? extrasRoom!.windows : []
                const updatedWindows = [...currentWindows, newWindow]
                handler((prev) => prev.map(r => r.id === extrasRoom!.id ? { ...r, windows: updatedWindows } : r))

                toast({
                  title: "Ventana añadida",
                  description: "Se ha añadido una ventana en la sección 'Otras ventanas'",
                })
              }}
            />
          </TabsContent>

          <TabsContent value="electrical" className="space-y-3">
            <ElectricalSection
              projectId={projectId}
              rooms={reformRooms.length > 0 ? reformRooms : rooms}
              electricalConfig={electricalConfig}
              onUpdateConfig={handleElectricalConfigChange}
              onUpdateRoom={updateRoom}
              globalConfig={reformConfig}
            />
          </TabsContent>

          <TabsContent value="partitions" className="space-y-3">
            <PartitionsSection
              partitions={partitions}
              wallLinings={wallLinings}
              standardHeight={demolitionConfig.standardHeight || 2.6}
              onUpdatePartitions={setPartitions}
              onUpdateWallLinings={setWallLinings}
              reformRooms={reformRooms}
            />
          </TabsContent>

          {hasApprovedBudget && (
            <TabsContent value="cobros" className="space-y-3">
              {/* Pass the entire approvedBudget object to PaymentsSection */}
              {projectId && (
                <PaymentsSection projectId={projectId} budgetAmount={approvedBudget?.total} budget={approvedBudget} />
              )}
            </TabsContent>
          )}

          <TabsContent value="presupuesto" className="space-y-6">
            {projectId && (
              <BudgetSection
                projectId={projectId}
                calculatorData={{
                  demolition: {
                    rooms: rooms,
                    config: demolitionConfig,
                    summary: demolitionSummary,
                  },
                  reform: {
                    rooms: reformRooms,
                    config: reformConfig,
                    partitions: partitions,
                    wallLinings: wallLinings,
                  },
                  electrical: {
                    config: electricalConfig,
                  },
                  globalConfig: globalConfig,
                }}
                calculatorLastSaved={lastSaved}
              />
            )}
          </TabsContent>

          {/* Botones de guardar y estado de guardado */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              {lastSaved ? (
                <>
                  Última actualización: {lastSaved.toLocaleTimeString()}
                  {isSaving && " (Guardando...)"}
                </>
              ) : (
                "Sin guardar"
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => handleSave(true)} disabled={isSaving}>
              Guardar
            </Button>
          </div>
        </div>
      </Tabs >

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

      <AlertDialog open={validationAlert.isOpen} onOpenChange={(isOpen) => setValidationAlert(prev => ({ ...prev, isOpen }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{validationAlert.title}</AlertDialogTitle>
            <AlertDialogDescription>{validationAlert.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setValidationAlert(prev => ({ ...prev, isOpen: false }))}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              validationAlert.onConfirm()
              setValidationAlert(prev => ({ ...prev, isOpen: false }))
            }}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  )
})

Calculator.displayName = "Calculator"

export default Calculator
export { Calculator }
