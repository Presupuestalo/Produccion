"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  InfoIcon,
  Plus,
  Trash2,
  BatteryLow as WaterDrop,
  Hammer,
  Paintbrush,
  Square,
  DoorOpen,
  ToyBrick as Brick,
  Palette,
} from "lucide-react"
import type { GlobalConfig, CalefaccionType, ReformHeatingType } from "@/types/calculator"
import { saveCalculatorConfig } from "@/lib/services/calculator-config-service"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface GlobalConfigSectionProps {
  config: GlobalConfig
  updateConfig: (config: Partial<GlobalConfig>, isReform?: boolean) => void
  isReform?: boolean
  demolitionConfig?: GlobalConfig
  projectId?: string
  onUpdateRooms?: (rooms: any[]) => void
  onConfigUpdate?: (config: Partial<GlobalConfig>) => void
  onUpdateAllRoomsLowerCeiling?: (value: boolean) => void
}

// Interfaz para los derribos de tabiques
interface WallDemolition {
  id: string
  length: number // Metros lineales
  area?: number // Área calculada (metros lineales * altura)
  thickness: number
  hasTiles?: boolean
  tilesSides?: "one" | "both"
  tileThickness?: number
  wallHeight?: number
}

// Constantes para los cálculos
const DEFAULT_TILE_THICKNESS = 1.5 // 1.5 cm
const DEFAULT_WALL_HEIGHT = 2.7

// Modificar el componente InfoTooltip para que se cierre al hacer clic fuera
// Reemplazar la función InfoTooltip actual con esta versión mejorada:

function InfoTooltip({ content, label }: { content: React.ReactNode; label: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Efecto para manejar clics fuera del tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        tooltipRef.current &&
        buttonRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    // Añadir event listener cuando el tooltip está abierto
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    // Limpiar event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        className="h-5 w-5 p-0 rounded-full bg-muted/40 hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
        aria-label={label}
        onClick={() => setIsOpen(!isOpen)}
      >
        <InfoIcon className="h-3 w-3 text-blue-600" />
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          className="absolute z-50 w-64 p-3 bg-white rounded-lg shadow-lg border border-gray-200"
          style={{
            left: "-8rem",
            top: "2rem",
          }}
          role="tooltip"
        >
          <div className="text-sm text-blue-900">{content}</div>
        </div>
      )}
    </div>
  )
}

function WallDemolitionInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: number
  onChange: (value: number) => void
  placeholder: string
  label: string
}) {
  const [localValue, setLocalValue] = useState(value.toFixed(2).replace(".", ","))
  const inputRef = useRef<HTMLInputElement>(null)

  // Actualizar valor local cuando cambia el valor externo (pero no si estamos editando)
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalValue(value.toFixed(2).replace(".", ","))
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir escribir libremente
    setLocalValue(e.target.value)
  }

  const handleBlur = () => {
    // Al perder foco, parsear y guardar
    const numValue = Number.parseFloat(localValue.replace(",", ".")) || 0
    onChange(numValue)
    // Formatear el valor
    setLocalValue(numValue.toFixed(2).replace(".", ","))
  }

  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        pattern="[0-9]*[,.]?[0-9]*"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className="mt-1"
        placeholder={placeholder}
      />
    </div>
  )
}

export function GlobalConfigSection({
  config,
  updateConfig,
  isReform = false,
  demolitionConfig,
  projectId,
  onUpdateRooms,
  onConfigUpdate,
  onUpdateAllRoomsLowerCeiling,
}: GlobalConfigSectionProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedDataRef = useRef<string>("")
  const isSavingRef = useRef(false)

  // Estado para manejar múltiples derribos de tabiques
  const [wallDemolitions, setWallDemolitions] = useState<WallDemolition[]>([])

  // Estado para controlar si se cambia la caldera
  const [changeBoiler, setChangeBoiler] = useState(config.changeBoiler || false)

  // Estado para controlar si se retira el termo
  const [removeWaterHeater, setRemoveWaterHeater] = useState(config.removeWaterHeater || false)

  const [installGasBoiler, setInstallGasBoiler] = useState(false)
  const [installGasConnection, setInstallGasConnection] = useState(false)
  const [installWaterHeater, setInstallWaterHeater] = useState(false)

  // Función para determinar si debe mostrar el checkbox "Retirar caldera"
  const shouldShowChangeBoiler = () => {
    return config.heatingType === "Caldera + Radiadores"
  }

  // Función para determinar si debe mostrar el checkbox "Retirar termo"
  const shouldShowRemoveWaterHeater = () => {
    return (
      config.heatingType === "No Tiene" ||
      config.heatingType === "Acometida de Gas" ||
      config.heatingType === "Eléctrica"
    )
  }

  // Inicializar los derribos de tabiques desde config
  useEffect(() => {
    if (config.wallDemolitions && config.wallDemolitions.length > 0) {
      const updatedDemolitions = config.wallDemolitions.map((demolition) => {
        const wallHeight = config.standardHeight || DEFAULT_WALL_HEIGHT
        const length = demolition.length || (demolition.area ? demolition.area / wallHeight : 0)
        const area = length * wallHeight

        return {
          ...demolition,
          length,
          area,
          tileThickness: demolition.tileThickness || DEFAULT_TILE_THICKNESS,
          wallHeight,
        }
      })
      setWallDemolitions(updatedDemolitions)
    } else {
      setWallDemolitions([])
    }
  }, [config])

  // Sincronizar el estado del checkbox con la configuración
  useEffect(() => {
    if (config.changeBoiler !== undefined) {
      setChangeBoiler(config.changeBoiler)
    }
  }, [config.changeBoiler])

  // Sincronizar el estado del checkbox de<bos>ira termo con la configuración
  useEffect(() => {
    if (config.removeWaterHeater !== undefined) {
      setRemoveWaterHeater(config.removeWaterHeater)
    }
  }, [config.removeWaterHeater])

  useEffect(() => {
    if (config.installGasBoiler !== undefined) {
      setInstallGasBoiler(config.installGasBoiler)
    }
  }, [config.installGasBoiler])

  useEffect(() => {
    if (config.installGasConnection !== undefined) {
      setInstallGasConnection(config.installGasConnection)
    }
  }, [config.installGasConnection])

  useEffect(() => {
    if (config.installWaterHeater !== undefined) {
      setInstallWaterHeater(config.installWaterHeater)
    }
  }, [config.installWaterHeater])

  const handleChangeBoilerToggle = (checked: boolean) => {
    setChangeBoiler(checked)
    // Immediately update the parent config so it propagates to DemolitionSummary and BudgetGenerator
    updateConfig({ changeBoiler: checked }, isReform)
  }

  const handleRemoveWaterHeaterToggle = (checked: boolean) => {
    setRemoveWaterHeater(checked)
    // Immediately update the parent config so it propagates to DemolitionSummary and BudgetGenerator
    updateConfig({ removeWaterHeater: checked }, isReform)
  }

  // Efecto para limpiar checkboxes cuando cambia el tipo de calefacción
  useEffect(() => {
    if (!shouldShowChangeBoiler() && changeBoiler) {
      setChangeBoiler(false)
      updateConfig({ changeBoiler: false }, isReform)
    }

    if (!shouldShowRemoveWaterHeater() && removeWaterHeater) {
      setRemoveWaterHeater(false)
      updateConfig({ removeWaterHeater: false }, isReform)
    }
  }, [config.heatingType])

  useEffect(() => {
    if (isReform) {
      const shouldAutoInstallBoiler =
        demolitionConfig?.changeBoiler === true && config.reformHeatingType === "Caldera + Radiadores"

      if (shouldAutoInstallBoiler) {
        if (!config.installGasBoiler) {
          updateConfig({ installGasBoiler: true })
        }
      }
    }
  }, [isReform, demolitionConfig?.changeBoiler, config.reformHeatingType, config.installGasBoiler, updateConfig])

  useEffect(() => {
    if (isReform && config.reformHeatingType === "Eléctrica" && onUpdateRooms) {
      console.log("[v0] Electric heating selected - enabling radiators in all rooms")
    }
  }, [isReform, config.reformHeatingType, onUpdateRooms])

  // Función para calcular el área total de azulejos y el volumen de escombros
  const calculateTiledAreaAndDebris = (demolitions: WallDemolition[]) => {
    let tiledWallArea = 0
    let tiledWallSurfaceArea = 0
    let wallDebrisVolume = 0
    let tileDebrisVolume = 0

    demolitions.forEach((demolition) => {
      const wallHeight = config.standardHeight || DEFAULT_WALL_HEIGHT
      const area = demolition.length * wallHeight

      if (demolition.hasTiles) {
        tiledWallArea += area

        const sidesFactor = demolition.tilesSides === "both" ? 2 : 1

        tiledWallSurfaceArea += area * sidesFactor

        const wallThicknessInMeters = demolition.thickness / 100
        wallDebrisVolume += area * wallThicknessInMeters

        const tileThickness = (demolition.tileThickness || DEFAULT_TILE_THICKNESS) / 100
        tileDebrisVolume += area * tileThickness * sidesFactor
      } else {
        const wallThicknessInMeters = demolition.thickness / 100
        wallDebrisVolume += area * wallThicknessInMeters
      }
    })

    return {
      tiledWallArea,
      tiledWallSurfaceArea,
      wallDebrisVolume,
      tileDebrisVolume,
      totalDebrisVolume: wallDebrisVolume + tileDebrisVolume,
    }
  }

  // Función para calcular el área total de demolición de tabiques
  const calculateTotalWallDemolitionArea = (demolitions: WallDemolition[]) => {
    return demolitions.reduce((total, demolition) => {
      const wallHeight = config.standardHeight || DEFAULT_WALL_HEIGHT
      return total + demolition.length * wallHeight
    }, 0)
  }

  const handleConfigUpdate = useCallback(
    (newConfig: Partial<GlobalConfig>) => {
      updateConfig(newConfig, isReform)
    },
    [updateConfig, isReform],
  )

  const saveData = async () => {
    // Evitar guardados duplicados
    if (isSavingRef.current || !projectId || isReform) return

    const updatedConfig = {
      standardHeight: config.standardHeight,
      structureType: config.structureType,
      heatingType: config.heatingType,
      removeWoodenFloor: config.removeWoodenFloor,
      projectId: projectId,
      lowerAllCeilings: config.lowerAllCeilings,
      changeBoiler: changeBoiler,
      removeWaterHeater: removeWaterHeater,
      wallDemolitions: wallDemolitions,
      wallDemolitionArea: calculateTotalWallDemolitionArea(wallDemolitions),
      tiledWallDemolitionArea: calculateTiledAreaAndDebris(wallDemolitions).tiledWallArea,
      tiledWallSurfaceArea: calculateTiledAreaAndDebris(wallDemolitions).tiledWallSurfaceArea,
      wallDebrisVolume: calculateTiledAreaAndDebris(wallDemolitions).wallDebrisVolume,
      tileDebrisVolume: calculateTiledAreaAndDebris(wallDemolitions).tileDebrisVolume,
      totalWallDebrisVolume: calculateTiledAreaAndDebris(wallDemolitions).totalDebrisVolume,
      installGasBoiler: installGasBoiler,
      installGasConnection: installGasConnection,
      installWaterHeater: installWaterHeater,
    }

    // Comparar con datos guardados anteriormente para evitar guardados innecesarios
    const dataHash = JSON.stringify(updatedConfig)
    if (dataHash === lastSavedDataRef.current) {
      return
    }

    isSavingRef.current = true
    setIsSaving(true)

    try {
      const success = await saveCalculatorConfig(projectId, updatedConfig)

      if (success) {
        lastSavedDataRef.current = dataHash
        setLastSaved(new Date())
        // Los cambios ya están en el estado local
      }
    } catch (error) {
      console.error("Error al guardar los datos:", error)
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los datos. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (!projectId || isReform) return

    // Limpiar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Solo guardar después de 2 segundos de inactividad
    saveTimeoutRef.current = setTimeout(() => {
      saveData()
    }, 2000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [
    projectId,
    isReform,
    wallDemolitions.length,
    changeBoiler,
    removeWaterHeater,
    installGasBoiler,
    installGasConnection,
    config.lowerAllCeilings,
    config.removeWoodenFloor,
    installWaterHeater,
  ])

  const updateConfigAndSave = (newConfig: Partial<GlobalConfig>) => {
    updateConfig(newConfig)
    if (onConfigUpdate && (newConfig.tiledWallSurfaceArea !== undefined || newConfig.wallDemolitions !== undefined)) {
      onConfigUpdate({
        tiledWallSurfaceArea: newConfig.tiledWallSurfaceArea,
        tiledWallDemolitionArea: newConfig.tiledWallDemolitionArea,
        wallDemolitionArea: newConfig.wallDemolitionArea,
        wallDemolitions: newConfig.wallDemolitions,
      })
    }
  }

  // Función para añadir un nuevo derribo de tabique
  const addWallDemolition = () => {
    const newId = `wall-${Date.now()}`
    const wallHeight = config.standardHeight || DEFAULT_WALL_HEIGHT

    const newDemolitions = [
      ...wallDemolitions,
      {
        id: newId,
        length: 0,
        area: 0,
        thickness: 10,
        hasTiles: false,
        tilesSides: "one",
        tileThickness: DEFAULT_TILE_THICKNESS,
        wallHeight,
      },
    ]

    setWallDemolitions(newDemolitions)

    const { tiledWallArea, tiledWallSurfaceArea, wallDebrisVolume, tileDebrisVolume, totalDebrisVolume } =
      calculateTiledAreaAndDebris(newDemolitions)

    const totalWallDemolitionArea = calculateTotalWallDemolitionArea(newDemolitions)

    const newConfig = {
      wallDemolitions: newDemolitions,
      wallDemolitionArea: totalWallDemolitionArea,
      tiledWallDemolitionArea: tiledWallArea,
      tiledWallSurfaceArea: tiledWallSurfaceArea,
      wallDebrisVolume,
      tileDebrisVolume,
      totalWallDebrisVolume: totalDebrisVolume,
      subtractTiledWallArea: true,
    }

    updateConfigAndSave(newConfig)
  }

  // Función para eliminar un derribo de tabique
  const removeWallDemolition = (id: string) => {
    const newDemolitions = wallDemolitions.filter((demolition) => demolition.id !== id)
    setWallDemolitions(newDemolitions)

    if (newDemolitions.length === 0) {
      const newConfig = {
        wallDemolitions: [],
        wallDemolitionArea: 0,
        tiledWallDemolitionArea: 0,
        tiledWallSurfaceArea: 0,
        wallDebrisVolume: 0,
        tileDebrisVolume: 0,
        totalWallDebrisVolume: 0,
        subtractTiledWallArea: true,
      }
      updateConfigAndSave(newConfig)
      return
    }

    const { tiledWallArea, tiledWallSurfaceArea, wallDebrisVolume, tileDebrisVolume, totalDebrisVolume } =
      calculateTiledAreaAndDebris(newDemolitions)

    const totalWallDemolitionArea = calculateTotalWallDemolitionArea(newDemolitions)

    const newConfig = {
      wallDemolitions: newDemolitions,
      wallDemolitionArea: totalWallDemolitionArea,
      tiledWallDemolitionArea: tiledWallArea,
      tiledWallSurfaceArea: tiledWallSurfaceArea,
      wallDebrisVolume,
      tileDebrisVolume,
      totalWallDebrisVolume: totalDebrisVolume,
      subtractTiledWallArea: true,
    }

    updateConfigAndSave(newConfig)
  }

  // Función para actualizar un derribo de tabique
  // Modificar para aceptar un objeto parcial de WallDemolition
  const updateWallDemolition = (id: string, updates: Partial<WallDemolition>) => {
    const newDemolitions = wallDemolitions.map((demolition) => {
      if (demolition.id === id) {
        return { ...demolition, ...updates }
      }
      return demolition
    })

    // Actualizar inmediatamente el estado local
    setWallDemolitions(newDemolitions)

    const { tiledWallArea, tiledWallSurfaceArea, wallDebrisVolume, tileDebrisVolume, totalDebrisVolume } =
      calculateTiledAreaAndDebris(newDemolitions)

    const totalWallDemolitionArea = calculateTotalWallDemolitionArea(newDemolitions)

    const newConfig = {
      wallDemolitions: newDemolitions,
      wallDemolitionArea: totalWallDemolitionArea,
      tiledWallDemolitionArea: tiledWallArea,
      tiledWallSurfaceArea: tiledWallSurfaceArea,
      wallDebrisVolume,
      tileDebrisVolume,
      totalWallDebrisVolume: totalDebrisVolume,
      subtractTiledWallArea: true,
    }

    updateConfigAndSave(newConfig)
  }

  const getRemoveHeatingLabel = () => {
    return config.heatingType === "Caldera + Radiadores" ? "Retirar caldera" : "Retirar termo"
  }

  const handleHeatingRemovalToggle = (checked: boolean) => {
    if (config.heatingType === "Caldera + Radiadores") {
      // When heatingType is "Caldera + Radiadores", update changeBoiler
      setChangeBoiler(checked)
      updateConfig({ changeBoiler: checked, removeWaterHeater: false }, isReform)
    } else {
      // For other heating types, update removeWaterHeater
      setRemoveWaterHeater(checked)
      updateConfig({ removeWaterHeater: checked, changeBoiler: false }, isReform)
    }
  }

  const getHeatingRemovalChecked = () => {
    if (config.heatingType === "Caldera + Radiadores") {
      return changeBoiler
    }
    return removeWaterHeater
  }

  useEffect(() => {
    if (changeBoiler !== undefined || removeWaterHeater !== undefined) {
      const updatedConfig: Partial<GlobalConfig> = {
        ...config,
        changeBoiler,
        removeWaterHeater,
      }

      // Call the parent callback if it exists
      if (onUpdateRooms) {
        updateConfig(updatedConfig)
      }
    }
  }, [changeBoiler, removeWaterHeater])

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (changeBoiler !== config.changeBoiler || removeWaterHeater !== config.removeWaterHeater) {
        updateConfig({ changeBoiler, removeWaterHeater }, isReform)
        if (onConfigUpdate) {
          onConfigUpdate({ changeBoiler, removeWaterHeater })
        }
      }
    }, 500)
    return () => clearTimeout(timerId)
  }, [
    changeBoiler,
    removeWaterHeater,
    config.changeBoiler,
    config.removeWaterHeater,
    updateConfig,
    isReform,
    onConfigUpdate,
  ])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Configuración General</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Calefacción */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex items-center min-w-0">
            <Label htmlFor="heatingType" className="text-sm font-medium whitespace-nowrap shrink-0">
              {isReform ? "Calefacción a instalar" : "Calefacción actual"}
            </Label>
            <span className="ml-1 shrink-0">
              <InfoTooltip
                label="Información sobre calefacción"
                content={
                  <p>
                    {isReform
                      ? "Selecciona el tipo de calefacción que se va a instalar en la reforma."
                      : "Indica el tipo de calefacción que tiene actualmente la vivienda."}
                  </p>
                }
              />
            </span>
          </div>
          <div className="w-full sm:w-64">
            <Select
              value={
                isReform
                  ? demolitionConfig?.heatingType === "Central"
                    ? "Central"
                    : config.reformHeatingType || "No"
                  : config.heatingType || "No Tiene"
              }
              onValueChange={(value: CalefaccionType | ReformHeatingType) => {
                if (isReform) {
                  handleConfigUpdate({ reformHeatingType: value as ReformHeatingType })
                } else {
                  handleConfigUpdate({ heatingType: value as CalefaccionType })
                }
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  if (isReform && demolitionConfig?.heatingType === "Central") {
                    return <SelectItem value="Central">Central</SelectItem>
                  } else if (isReform) {
                    return (
                      <>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Caldera + Radiadores">Caldera + Radiadores</SelectItem>
                        <SelectItem value="Eléctrica">Eléctrica</SelectItem>
                        <SelectItem value="Suelo Radiante">Suelo Radiante</SelectItem>
                        <SelectItem value="Aerotermia">Aerotermia</SelectItem>
                        <SelectItem value="Otra">Otra</SelectItem>
                      </>
                    )
                  } else {
                    return (
                      <>
                        <SelectItem value="No Tiene">Sin Calefacción</SelectItem>
                        <SelectItem value="Acometida de Gas">Acometida de Gas</SelectItem>
                        <SelectItem value="Caldera + Radiadores">Caldera + Radiadores</SelectItem>
                        <SelectItem value="Central">Central</SelectItem>
                        <SelectItem value="Eléctrica">Eléctrica</SelectItem>
                      </>
                    )
                  }
                })()}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isReform &&
          config.reformHeatingType === "Caldera + Radiadores" &&
          demolitionConfig?.heatingType !== "Central" && (
            <>
              <div className="flex items-center gap-2 mt-4">
                <Switch
                  id="installGasBoiler"
                  checked={config.installGasBoiler || false}
                  onCheckedChange={(checked) => {
                    handleConfigUpdate({ installGasBoiler: checked as boolean })
                  }}
                />
                <Label htmlFor="installGasBoiler" className="text-sm font-medium cursor-pointer">
                  Instalar caldera de gas
                </Label>
              </div>

              {(demolitionConfig?.heatingType === "No Tiene" || demolitionConfig?.heatingType === "Eléctrica") && (
                <div className="flex items-center gap-2 mt-2">
                  <Switch
                    id="installGasConnection"
                    checked={config.installGasConnection || false}
                    onCheckedChange={(checked) => {
                      handleConfigUpdate({ installGasConnection: checked as boolean })
                    }}
                  />
                  <Label htmlFor="installGasConnection" className="text-sm font-medium cursor-pointer">
                    Instalar acometida de gas
                  </Label>
                </div>
              )}
            </>
          )}

        {isReform && config.reformHeatingType === "Suelo Radiante" && demolitionConfig?.heatingType !== "Central" && (
          <>
            <div className="flex items-center gap-2 mt-4">
              <Switch
                id="installGasBoiler"
                checked={config.installGasBoiler || false}
                onCheckedChange={(checked) => {
                  handleConfigUpdate({ installGasBoiler: checked as boolean })
                }}
              />
              <Label htmlFor="installGasBoiler" className="text-sm font-medium cursor-pointer">
                Instalar caldera de gas (para suelo radiante)
              </Label>
            </div>

            {(demolitionConfig?.heatingType === "No Tiene" || demolitionConfig?.heatingType === "Eléctrica") && (
              <div className="flex items-center gap-2 mt-2">
                <Switch
                  id="installGasConnection"
                  checked={config.installGasConnection || false}
                  onCheckedChange={(checked) => {
                    handleConfigUpdate({ installGasConnection: checked as boolean })
                  }}
                />
                <Label htmlFor="installGasConnection" className="text-sm font-medium cursor-pointer">
                  Instalar acometida de gas
                </Label>
              </div>
            )}
          </>
        )}

        {isReform &&
          (config.reformHeatingType === "Eléctrica" ||
            config.reformHeatingType === "ninguna" ||
            config.reformHeatingType === "No Tiene") &&
          (demolitionConfig?.heatingType === "No Tiene" || demolitionConfig?.heatingType === "Eléctrica") && (
            <div className="flex items-center gap-2 mt-4">
              <Switch
                id="installWaterHeater"
                checked={config.installWaterHeater || false}
                onCheckedChange={(checked) => {
                  handleConfigUpdate({ installWaterHeater: checked as boolean })
                }}
              />
              <Label htmlFor="installWaterHeater" className="text-sm font-medium cursor-pointer">
                Instalar termo eléctrico
              </Label>
            </div>
          )}

        {!isReform && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
            <Card className="border-2 border-red-100 hover:border-red-300 transition-colors duration-200 bg-gradient-to-br from-red-50/30 to-transparent">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                      <WaterDrop className="h-4 w-4 text-red-600" />
                    </div>
                    <Label htmlFor="removeWaterHeater" className="font-medium cursor-pointer text-sm">
                      {getRemoveHeatingLabel()}
                    </Label>
                  </div>
                  <Switch
                    id="removeWaterHeater"
                    checked={getHeatingRemovalChecked()}
                    onCheckedChange={handleHeatingRemovalToggle}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-100 hover:border-amber-300 transition-colors duration-200 bg-gradient-to-br from-amber-50/30 to-transparent">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                      <Hammer className="h-4 w-4 text-amber-600" />
                    </div>
                    <Label htmlFor="removeWoodenFloor" className="font-medium cursor-pointer text-sm">
                      Retirar suelo de madera en toda la vivienda
                    </Label>
                  </div>
                  <Switch
                    id="removeWoodenFloor"
                    checked={config.removeWoodenFloor || false}
                    onCheckedChange={(checked) => {
                      handleConfigUpdate({ removeWoodenFloor: checked as boolean })
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-100 hover:border-orange-300 transition-colors duration-200 bg-gradient-to-br from-orange-50/30 to-transparent">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
                      <Square className="h-4 w-4 text-orange-600" />
                    </div>
                    <Label htmlFor="removeAllCeramic" className="font-medium cursor-pointer text-sm">
                      Picar toda la cerámica de la vivienda
                    </Label>
                  </div>
                  <Switch
                    id="removeAllCeramic"
                    checked={config.removeAllCeramic || false}
                    onCheckedChange={(checked) => {
                      handleConfigUpdate({ removeAllCeramic: checked as boolean })
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-100 hover:border-purple-300 transition-colors duration-200 bg-gradient-to-br from-purple-50/30 to-transparent">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                      <Paintbrush className="h-4 w-4 text-purple-600" />
                    </div>
                    <Label htmlFor="allWallsHaveGotele" className="font-medium cursor-pointer text-sm">
                      Todas las paredes tienen gotelé
                    </Label>
                  </div>
                  <Switch
                    id="allWallsHaveGotele"
                    checked={config.allWallsHaveGotele || false}
                    onCheckedChange={(checked) => {
                      handleConfigUpdate({ allWallsHaveGotele: checked as boolean })
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isReform && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
              <Card className="border-2 border-emerald-100 hover:border-emerald-300 transition-colors duration-200 bg-gradient-to-br from-emerald-50/30 to-transparent">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Brick className="h-4 w-4 text-emerald-600" />
                      </div>
                      <Label htmlFor="tileAllFloors" className="font-medium cursor-pointer text-sm">
                        Embaldosar todo (suelo cerámico en todas las habitaciones)
                      </Label>
                    </div>
                    <Switch
                      id="tileAllFloors"
                      checked={config.tileAllFloors || false}
                      onCheckedChange={(checked) => {
                        handleConfigUpdate({ tileAllFloors: checked as boolean })
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-cyan-100 hover:border-cyan-300 transition-colors duration-200 bg-gradient-to-br from-cyan-50/30 to-transparent">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center">
                        <Palette className="h-4 w-4 text-cyan-600" />
                      </div>
                      <Label htmlFor="paintAndPlasterAll" className="font-medium cursor-pointer text-sm">
                        Pintar y enlucir todo
                      </Label>
                    </div>
                    <Switch
                      id="paintAndPlasterAll"
                      checked={config.paintAndPlasterAll || false}
                      onCheckedChange={(checked) => {
                        handleConfigUpdate({ paintAndPlasterAll: checked as boolean })
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-indigo-100 hover:border-indigo-300 transition-colors duration-200 bg-gradient-to-br from-indigo-50/30 to-transparent">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Square className="h-4 w-4 text-indigo-600" />
                      </div>
                      <Label htmlFor="lowerAllCeilings" className="font-medium cursor-pointer text-sm">
                        Bajar todos los techos
                      </Label>
                    </div>
                    <Switch
                      id="lowerAllCeilings"
                      checked={config.lowerAllCeilings || false}
                      onCheckedChange={(checked) => {
                        handleConfigUpdate({ lowerAllCeilings: checked as boolean })
                        if (checked && onUpdateAllRoomsLowerCeiling) {
                          onUpdateAllRoomsLowerCeiling(true)
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-pink-100 hover:border-pink-300 transition-colors duration-200 bg-gradient-to-br from-pink-50/30 to-transparent">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center">
                        <Paintbrush className="h-4 w-4 text-pink-600" />
                      </div>
                      <Label htmlFor="paintCeilings" className="font-medium cursor-pointer text-sm">
                        Pintar techos
                      </Label>
                    </div>
                    <Switch
                      id="paintCeilings"
                      checked={config.paintCeilings || false}
                      onCheckedChange={(checked) => {
                        handleConfigUpdate({ paintCeilings: checked as boolean })
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-teal-100 hover:border-teal-300 transition-colors duration-200 bg-gradient-to-br from-teal-50/30 to-transparent">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
                        <DoorOpen className="h-4 w-4 text-teal-600" />
                      </div>
                      <Label htmlFor="entranceDoorType" className="font-medium cursor-pointer text-sm">
                        ¿Cambiar puerta de entrada?
                      </Label>
                    </div>
                    <Switch
                      id="entranceDoorType"
                      checked={config.entranceDoorType || false}
                      onCheckedChange={(checked) => {
                        handleConfigUpdate({ entranceDoorType: checked as boolean })
                      }}
                    />
                  </div>
                </CardContent>
              </Card>


            </div>
          </>
        )}

        {!isReform && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Derribos de Tabiques</h3>
              <Button onClick={addWallDemolition} size="sm" variant="outline" className="h-8 bg-transparent">
                <Plus className="h-4 w-4 mr-1" />
                Añadir
              </Button>
            </div>

            {/* Cambiar inputs de number a text con formato decimal español */}
            {wallDemolitions.map((demolition, index) => (
              <Card key={demolition.id} className="p-4 bg-card/50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium">Tabique {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeWallDemolition(demolition.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <WallDemolitionInput
                    value={demolition.length}
                    onChange={(numValue) => updateWallDemolition(demolition.id, { length: numValue })}
                    placeholder="0,00"
                    label="Metros lineales"
                  />
                  <WallDemolitionInput
                    value={demolition.thickness}
                    onChange={(numValue) => updateWallDemolition(demolition.id, { thickness: numValue })}
                    placeholder="10,00"
                    label="Grosor (cm)"
                  />
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  <Switch
                    id={`has-tiles-${demolition.id}`}
                    checked={Boolean(demolition.hasTiles)}
                    onCheckedChange={(checked) => {
                      updateWallDemolition(demolition.id, { hasTiles: checked })
                    }}
                  />
                  <Label htmlFor={`has-tiles-${demolition.id}`} className="text-sm">
                    Tiene azulejos
                  </Label>
                </div>

                {demolition.hasTiles && (
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/50">
                    <div>
                      <Label className="text-xs text-muted-foreground">Lados con azulejos</Label>
                      <Select
                        value={demolition.tilesSides || "one"}
                        onValueChange={(value) =>
                          updateWallDemolition(demolition.id, {
                            tilesSides: value as "one" | "both",
                          })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one">Un lado</SelectItem>
                          <SelectItem value="both">Ambos lados</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <WallDemolitionInput
                      value={demolition.tileThickness || DEFAULT_TILE_THICKNESS}
                      onChange={(numValue) => updateWallDemolition(demolition.id, { tileThickness: numValue })}
                      placeholder="1,50"
                      label="Grosor azulejo (cm)"
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
