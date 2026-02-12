"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ElectricalGeneralPanel } from "./electrical-general-panel"
import { AddElectricalColumnButton } from "./add-electrical-column-button"
import { AlertCircle } from "lucide-react"
import type { Room, ElectricalConfig, ElectricalElement, GlobalConfig } from "@/types/calculator"
import { ElectricalSettingsButton } from "./electrical-settings-button"
import { ElectricalRoomsCompact } from "./electrical-rooms-compact"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

interface ElectricalSectionProps {
  projectId?: string
  rooms: Room[]
  electricalConfig?: ElectricalConfig
  onUpdateConfig: (config: ElectricalConfig) => void
  onUpdateRoom: (roomId: string, updates: Partial<Room>) => void
  globalConfig?: GlobalConfig
}

export function ElectricalSection({
  projectId,
  rooms,
  electricalConfig,
  onUpdateConfig,
  onUpdateRoom,
  globalConfig,
}: ElectricalSectionProps) {
  // Estado local para manejar la configuración eléctrica
  const [config, setConfig] = useState<ElectricalConfig | undefined>(electricalConfig)
  const [hasColumnError, setHasColumnError] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isColumnMissing, setIsColumnMissing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Estado local para mantener los elementos eléctricos de cada habitación
  const [roomElectricalElements, setRoomElectricalElements] = useState<{ [roomId: string]: ElectricalElement[] }>({})

  // Verificar si la columna existe al cargar el componente
  useEffect(() => {
    const checkColumn = async () => {
      try {
        if (!electricalConfig) {
          // Si no hay configuración eléctrica, puede ser porque la columna no existe
          // Intentar añadir la columna
          const response = await fetch("/api/add-electrical-column", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          })

          if (!response.ok) {
            setIsColumnMissing(true)
          }
        }
      } catch (err) {
        console.error("Error al verificar la columna electrical_config:", err)
        setError("Error al cargar la configuración eléctrica")
      } finally {
        setIsLoading(false)
      }
    }

    checkColumn()
  }, [electricalConfig])

  // Actualizar el estado local cuando cambian las props
  useEffect(() => {
    if (electricalConfig) {
      setConfig(electricalConfig)
      setHasColumnError(false)
    }
  }, [electricalConfig])

  const safeRooms = rooms || []

  // Inicializar los elementos eléctricos de las habitaciones
  useEffect(() => {
    const initialElements: { [roomId: string]: ElectricalElement[] } = {}
    let needsUpdate = false

    // Cargar configuración guardada de localStorage
    const savedSettings = localStorage.getItem("electrical_room_settings")
    const parsedSettings = savedSettings ? JSON.parse(savedSettings) : null

    safeRooms.forEach((room) => {
      if (room.electricalElements && room.electricalElements.length > 0) {
        // Si la habitación ya tiene elementos, usarlos
        initialElements[room.id] = room.electricalElements
      } else if (parsedSettings && config?.needsNewInstallation) {
        // Si no tiene elementos pero necesita nueva instalación, cargar predefinidos
        const roomType = room.type
        const defaultElements = parsedSettings[roomType] ||
          parsedSettings["Otro"] || {
          puntosLuzTecho: 1,
          enchufes: 2,
          sencillo: 1,
          conmutados: 0,
          cruzamiento: 0,
          intemperie: 0,
        }

        // Convertir a formato de elementos eléctricos
        const formattedElements: ElectricalElement[] = [
          {
            id: "puntosLuzTecho",
            type: "Punto de luz techo" as any,
            quantity: defaultElements.puntosLuzTecho,
          },
          { id: "enchufes", type: "Enchufe normal" as any, quantity: defaultElements.enchufes },
          { id: "sencillo", type: "Interruptor" as any, quantity: defaultElements.sencillo },
          { id: "conmutados", type: "Punto conmutado" as any, quantity: defaultElements.conmutados },
          { id: "cruzamiento", type: "Punto de cruzamiento" as any, quantity: defaultElements.cruzamiento },
          { id: "intemperie", type: "Enchufe intemperie" as any, quantity: defaultElements.intemperie },
        ]

        initialElements[room.id] = formattedElements
        needsUpdate = true

        // Actualizar la habitación con los elementos predefinidos
        onUpdateRoom(room.id, { electricalElements: formattedElements })
      }
    })

    setRoomElectricalElements(initialElements)
  }, [safeRooms, config?.needsNewInstallation, onUpdateRoom])

  // Manejar actualizaciones de la configuración
  const handleConfigUpdate = (updatedConfig: ElectricalConfig) => {
    setConfig(updatedConfig)
    onUpdateConfig(updatedConfig)
  }

  // Manejar actualizaciones de elementos eléctricos por habitación
  const handleUpdateRoomElements = useCallback(
    (roomId: string, elements: ElectricalElement[]) => {
      // Actualizar el estado local primero
      setRoomElectricalElements((prev) => ({
        ...prev,
        [roomId]: elements,
      }))

      // Luego actualizar en el componente padre
      onUpdateRoom(roomId, { electricalElements: elements })
    },
    [onUpdateRoom],
  )

  const calculateElectricalSummary = () => {
    const summary: { [key: string]: number } = {}

    let electricHeaterOutlets = 0
    const reformHeatingType = globalConfig?.reformHeatingType || "No"

    if (reformHeatingType === "Eléctrica") {
      safeRooms.forEach((room) => {
        if (room.radiators && Array.isArray(room.radiators) && room.radiators.length > 0) {
          electricHeaterOutlets += room.radiators.length
        } else if (room.hasRadiator) {
          electricHeaterOutlets += 1
        }
      })
    }

    safeRooms.forEach((room) => {
      if (room.electricalElements && room.electricalElements.length > 0) {
        room.electricalElements.forEach((element) => {
          const displayName = element.type === "Interruptor" ? "Interruptor sencillo" : element.type
          summary[displayName] = (summary[displayName] || 0) + (element.quantity || 0)
        })
      }
    })

    if (electricHeaterOutlets > 0) {
      summary["Enchufe para emisor térmico"] = electricHeaterOutlets
    }

    console.log("[v0] ELECTRICAL SUMMARY - Habitaciones procesadas:", safeRooms.length)
    console.log("[v0] ELECTRICAL SUMMARY - Enchufes para emisores térmicos:", electricHeaterOutlets)
    console.log("[v0] ELECTRICAL SUMMARY - Resumen calculado:", summary)

    return summary
  }

  const electricalSummary = calculateElectricalSummary()

  // Renderizado condicional basado en el estado
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle id="electrical-title">Instalación Eléctrica</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Cargando...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || isColumnMissing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle id="electrical-title">Instalación Eléctrica</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error ||
                "No se pudo cargar la configuración eléctrica. Es posible que la columna electrical_config no exista en la base de datos."}
            </AlertDescription>
          </Alert>

          <AddElectricalColumnButton />
        </CardContent>
      </Card>
    )
  }

  if (hasColumnError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle id="electricity-title">Electricidad</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error en la estructura de la base de datos</AlertTitle>
              <AlertDescription>
                La columna de configuración eléctrica no existe en la tabla. Haz clic en el botón para añadirla.
              </AlertDescription>
            </Alert>

            <AddElectricalColumnButton />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Si no hay configuración eléctrica, crear una por defecto
  const defaultConfig: ElectricalConfig = config || {
    needsNewInstallation: false,
    installationType: "Básica",
    hasCertificate: false,
    generalPanelElements: 10,
    hasConstructionPanel: false,
    hasElectricalPanel: true,
    hasGroundConnection: true,
    hasHeatingCircuit: false,
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle id="electrical-title" className="text-xl text-blue-700">
            Configuración Eléctrica
          </CardTitle>
          <ElectricalSettingsButton />
        </CardHeader>
        <CardContent>
          {/* Panel general de electricidad */}
          <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="text-lg font-medium mb-4 text-blue-700">Configuración General de Electricidad</h3>
            <ElectricalGeneralPanel config={defaultConfig} onUpdate={handleConfigUpdate} globalConfig={globalConfig} />
          </div>

          {/* Lista de habitaciones (solo si necesita nueva instalación) */}
          {defaultConfig.needsNewInstallation && (
            <>
              <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-blue-700">Elementos Eléctricos por Habitación</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Recargar elementos predefinidos
                        const savedSettings = localStorage.getItem("electrical_room_settings")
                        if (savedSettings) {
                          const parsedSettings = JSON.parse(savedSettings)
                          safeRooms.forEach((room) => {
                            const roomType = room.type
                            const defaultElements = parsedSettings[roomType] ||
                              parsedSettings["Otro"] || {
                              puntosLuzTecho: 1,
                              enchufes: 2,
                              sencillo: 1,
                              conmutados: 0,
                              cruzamiento: 0,
                              intemperie: 0,
                            }

                            // Convertir a formato de elementos eléctricos
                            const formattedElements: ElectricalElement[] = [
                              {
                                id: "puntosLuzTecho",
                                type: "Punto de luz techo" as any,
                                quantity: defaultElements.puntosLuzTecho,
                              },
                              { id: "enchufes", type: "Enchufe normal" as any, quantity: defaultElements.enchufes },
                              { id: "sencillo", type: "Interruptor" as any, quantity: defaultElements.sencillo },
                              { id: "conmutados", type: "Punto conmutado" as any, quantity: defaultElements.conmutados },
                              {
                                id: "cruzamiento",
                                type: "Punto de cruzamiento" as any,
                                quantity: defaultElements.cruzamiento,
                              },
                              { id: "intemperie", type: "Enchufe intemperie" as any, quantity: defaultElements.intemperie },
                            ]

                            // Actualizar el estado local primero
                            setRoomElectricalElements((prev) => ({
                              ...prev,
                              [room.id]: formattedElements,
                            }))

                            // Luego actualizar en el componente padre
                            onUpdateRoom(room.id, { electricalElements: formattedElements })
                          })

                          // Mostrar notificación
                          toast({
                            title: "Elementos recargados",
                            description: "Se han aplicado los elementos predefinidos a todas las habitaciones",
                            duration: 2000,
                          })
                        }
                      }}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Recargar Predefinidos
                    </Button>
                  </div>
                </div>
                <ElectricalRoomsCompact rooms={safeRooms} onUpdateRoom={handleUpdateRoomElements} />
              </div>

              {Object.keys(electricalSummary).length > 0 && (
                <div className="mt-6 bg-white p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold mb-4 text-blue-700">Resumen de Elementos Eléctricos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(electricalSummary)
                      .filter(([_, quantity]) => quantity > 0)
                      .map(([type, quantity]) => (
                        <div key={type} className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <div className="text-sm text-gray-600 mb-1">{type}</div>
                          <div className="text-2xl font-bold text-blue-700">{quantity}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
