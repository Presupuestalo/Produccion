"use client"

import { useState, useEffect } from "react"
import { Settings, Save, Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"

// Definir la interfaz para los ajustes eléctricos
interface ElectricalRoomSettings {
  name: string
  lightPoints: number
  outlets: number
  simple: number
  switches: number
  crossover: number
  outdoor: number
  tvOutlet: number
  recessedLights: number
}

// Valores predeterminados para los ajustes eléctricos (actualizados según la tabla proporcionada)
const defaultElectricalSettings: ElectricalRoomSettings[] = [
  {
    name: "Cocina",
    lightPoints: 1,
    outlets: 12,
    simple: 1,
    switches: 0,
    crossover: 0,
    outdoor: 0,
    tvOutlet: 1,
    recessedLights: 3,
  },
  {
    name: "Cocina Abierta",
    lightPoints: 2,
    outlets: 15,
    simple: 0,
    switches: 2,
    crossover: 0,
    outdoor: 0,
    tvOutlet: 1,
    recessedLights: 4,
  },
  {
    name: "Cocina Americana",
    lightPoints: 2,
    outlets: 22,
    simple: 0,
    switches: 3,
    crossover: 1,
    outdoor: 0,
    tvOutlet: 1,
    recessedLights: 5,
  },
  {
    name: "Baño",
    lightPoints: 1,
    outlets: 2,
    simple: 1,
    switches: 0,
    crossover: 0,
    outdoor: 0,
    tvOutlet: 0,
    recessedLights: 2,
  },
  {
    name: "Dormitorio",
    lightPoints: 1,
    outlets: 5,
    simple: 0,
    switches: 3,
    crossover: 1,
    outdoor: 0,
    tvOutlet: 1,
    recessedLights: 2,
  },
  {
    name: "Salón",
    lightPoints: 2,
    outlets: 10,
    simple: 1,
    switches: 2,
    crossover: 1,
    outdoor: 0,
    tvOutlet: 1,
    recessedLights: 4,
  },
  {
    name: "Pasillo",
    lightPoints: 2,
    outlets: 2,
    simple: 1,
    switches: 2,
    crossover: 1,
    outdoor: 0,
    tvOutlet: 0,
    recessedLights: 2,
  },
  {
    name: "Hall",
    lightPoints: 1,
    outlets: 1,
    simple: 1,
    switches: 0,
    crossover: 0,
    outdoor: 0,
    tvOutlet: 0,
    recessedLights: 1,
  },
  {
    name: "Terraza",
    lightPoints: 1,
    outlets: 0,
    simple: 1,
    switches: 0,
    crossover: 0,
    outdoor: 1,
    tvOutlet: 0,
    recessedLights: 0,
  },
  {
    name: "Trastero",
    lightPoints: 1,
    outlets: 1,
    simple: 1,
    switches: 0,
    crossover: 0,
    outdoor: 0,
    tvOutlet: 0,
    recessedLights: 1,
  },
  {
    name: "Vestidor",
    lightPoints: 1,
    outlets: 1,
    simple: 1,
    switches: 0,
    crossover: 0,
    outdoor: 0,
    tvOutlet: 0,
    recessedLights: 2,
  },
]

export function ElectricalSettingsButton() {
  const [roomSettings, setRoomSettings] = useState<ElectricalRoomSettings[]>(defaultElectricalSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  // Cargar configuración guardada al iniciar
  useEffect(() => {
    loadSavedSettings()
  }, [])

  // Cargar configuración guardada cuando se abre el diálogo
  useEffect(() => {
    if (isOpen) {
      loadSavedSettings()
    }
  }, [isOpen])

  // Función para cargar configuración guardada
  const loadSavedSettings = () => {
    try {
      // Intentar cargar desde localStorage
      const savedSettings = localStorage.getItem("presupuestalo_electrical_settings")
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        if (Array.isArray(parsedSettings) && parsedSettings.length > 0) {
          console.log("Cargando configuración guardada:", parsedSettings)
          setRoomSettings(parsedSettings)
          return
        }
      }
    } catch (error) {
      console.error("Error al cargar configuración guardada:", error)
    }
  }

  // Función para manejar los cambios en los campos de entrada
  const handleSettingChange = (index: number, field: string, value: number) => {
    const newSettings = [...roomSettings]
    newSettings[index] = {
      ...newSettings[index],
      [field]: value,
    }
    setRoomSettings(newSettings)
    // Resetear el estado de éxito cuando se hacen cambios
    if (saveSuccess) {
      setSaveSuccess(false)
    }
  }

  // Función para guardar los valores predeterminados
  const handleSaveDefaults = async () => {
    setIsSaving(true)
    setSaveSuccess(false)

    try {
      // Guardar en localStorage
      localStorage.setItem("presupuestalo_electrical_settings", JSON.stringify(roomSettings))
      console.log("Configuración guardada en localStorage:", roomSettings)

      // Intentar guardar en Supabase si está disponible
      try {
        const user = await supabase.auth.getUser()
        if (user && user.data && user.data.user) {
          const userId = user.data.user.id

          // Verificar si ya existe una configuración para este usuario
          const { data: existingData } = await supabase
            .from("user_settings")
            .select("id")
            .eq("user_id", userId)
            .eq("setting_type", "electrical_settings")
            .single()

          if (existingData) {
            // Actualizar configuración existente
            await supabase
              .from("user_settings")
              .update({
                settings_data: roomSettings,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingData.id)
          } else {
            // Crear nueva configuración
            await supabase.from("user_settings").insert({
              user_id: userId,
              setting_type: "electrical_settings",
              settings_data: roomSettings,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
          }

          console.log("Configuración guardada en Supabase")
        }
      } catch (supabaseError) {
        console.warn("No se pudo guardar en Supabase (esto no es crítico):", supabaseError)
        // No mostrar error al usuario, ya que localStorage es suficiente
      }

      // Mostrar notificación de éxito
      toast({
        title: "Configuración guardada",
        description: "Los ajustes eléctricos se han guardado correctamente",
        variant: "default",
      })

      // Actualizar estado de éxito
      setSaveSuccess(true)

      // Resetear el estado después de 2 segundos
      setTimeout(() => {
        setSaveSuccess(false)
      }, 2000)
    } catch (error) {
      console.error("Error al guardar configuración:", error)
      // Mostrar notificación de error
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los ajustes eléctricos",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Función para restaurar los valores predeterminados
  const handleRestoreDefaults = async () => {
    setIsResetting(true)

    try {
      console.log("[v0] RESTORE DEFAULTS - Starting restore process")
      console.log("[v0] RESTORE DEFAULTS - Default settings:", defaultElectricalSettings)

      // Restaurar los valores predeterminados
      setRoomSettings([...defaultElectricalSettings])

      // Eliminar cualquier configuración guardada previamente de ambos sistemas
      localStorage.removeItem("presupuestalo_electrical_settings")
      localStorage.removeItem("electrical_room_settings")
      console.log("[v0] RESTORE DEFAULTS - Cleared both localStorage keys")

      console.log("[v0] RESTORE DEFAULTS - Dispatching event and reloading page")
      window.dispatchEvent(new CustomEvent("electrical-settings-changed"))

      // Dar tiempo para que se procese el evento antes de recargar
      setTimeout(() => {
        window.location.reload()
      }, 100)

      // Intentar eliminar de Supabase si está disponible
      try {
        const user = await supabase.auth.getUser()
        if (user && user.data && user.data.user) {
          const userId = user.data.user.id

          await supabase.from("user_settings").delete().eq("user_id", userId).eq("setting_type", "electrical_settings")

          console.log("Configuración eliminada de Supabase")
        }
      } catch (supabaseError) {
        console.warn("No se pudo eliminar de Supabase (esto no es crítico):", supabaseError)
      }

      // Mostrar notificación de éxito
      toast({
        title: "Valores restaurados",
        description: "Se han restaurado los valores predeterminados",
        variant: "success",
      })
    } catch (error) {
      console.error("Error al restaurar valores predeterminados:", error)
      // Mostrar notificación de error
      toast({
        title: "Error al restaurar",
        description: "No se pudieron restaurar los valores predeterminados",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="ml-2 bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:text-orange-800"
        >
          <Settings className="h-4 w-4 mr-1" />
          Ajustes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-orange-700">Ajustes de Electricidad Predeterminados</DialogTitle>
          <DialogDescription>
            Configura los elementos eléctricos predeterminados por tipo de habitación
          </DialogDescription>
        </DialogHeader>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
          <h3 className="text-lg font-medium mb-4 text-orange-700">
            Elementos Eléctricos Predeterminados por Habitación
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-orange-100">
                  <th className="border border-orange-200 px-4 py-2 text-left">Tipo de Habitación</th>
                  <th className="border border-orange-200 px-4 py-2 text-left">Puntos de luz techo</th>
                  <th className="border border-orange-200 px-4 py-2 text-left">Enchufes</th>
                  <th className="border border-orange-200 px-4 py-2 text-left">Sencillo</th>
                  <th className="border border-orange-200 px-4 py-2 text-left">Conmutados</th>
                  <th className="border border-orange-200 px-4 py-2 text-left">Cruzamiento</th>
                  <th className="border border-orange-200 px-4 py-2 text-left">Intemperie</th>
                  <th className="border border-orange-200 px-4 py-2 text-left">Toma TV</th>
                  <th className="border border-orange-200 px-4 py-2 text-left">Focos empotrados</th>
                </tr>
              </thead>
              <tbody>
                {roomSettings.map((room, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-orange-50" : ""}>
                    <td className="border border-orange-200 px-4 py-2 font-medium">{room.name}</td>
                    <td className="border border-orange-200 px-4 py-2">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          className="px-1 py-0.5 bg-orange-100 rounded-l-md border border-orange-200 hover:bg-orange-200 text-xs"
                          onClick={() => {
                            if (room.lightPoints > 0) {
                              handleSettingChange(index, "lightPoints", room.lightPoints - 1)
                            }
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={room.lightPoints}
                          onChange={(e) => handleSettingChange(index, "lightPoints", Number(e.target.value))}
                          className="w-8 text-center border-y border-orange-200 py-0.5 focus:outline-none text-xs"
                          min={0}
                        />
                        <button
                          type="button"
                          className="px-1 py-0.5 bg-orange-100 rounded-r-md border border-orange-200 hover:bg-orange-200 text-xs"
                          onClick={() => handleSettingChange(index, "lightPoints", room.lightPoints + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="border border-orange-200 px-4 py-2">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          className="px-1 py-0.5 bg-orange-100 rounded-l-md border border-orange-200 hover:bg-orange-200 text-xs"
                          onClick={() => {
                            if (room.outlets > 0) {
                              handleSettingChange(index, "outlets", room.outlets - 1)
                            }
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={room.outlets}
                          onChange={(e) => handleSettingChange(index, "outlets", Number(e.target.value))}
                          className="w-8 text-center border-y border-orange-200 py-0.5 focus:outline-none text-xs"
                          min={0}
                        />
                        <button
                          type="button"
                          className="px-1 py-0.5 bg-orange-100 rounded-r-md border border-orange-200 hover:bg-orange-200 text-xs"
                          onClick={() => handleSettingChange(index, "outlets", room.outlets + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="border border-orange-200 px-4 py-2">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          className="px-1 py-0.5 bg-orange-100 rounded-l-md border border-orange-200 hover:bg-orange-200 text-xs"
                          onClick={() => {
                            if (room.simple > 0) {
                              handleSettingChange(index, "simple", room.simple - 1)
                            }
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={room.simple}
                          onChange={(e) => handleSettingChange(index, "simple", Number(e.target.value))}
                          className="w-8 text-center border-y border-orange-200 py-0.5 focus:outline-none text-xs"
                          min={0}
                        />
                        <button
                          type="button"
                          className="px-1 py-0.5 bg-orange-100 rounded-r-md border border-orange-200 hover:bg-orange-200 text-xs"
                          onClick={() => handleSettingChange(index, "simple", room.simple + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="border border-orange-200 px-4 py-2">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          className="px-1 py-0.5 bg-orange-100 rounded-l-md border border-orange-200 hover:bg-orange-200 text-xs"
                          onClick={() => {
                            if (room.switches > 0) {
                              handleSettingChange(index, "switches", room.switches - 1)
                            }
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={room.switches}
                          onChange={(e) => handleSettingChange(index, "switches", Number(e.target.value))}
                          className="w-8 text-center border-y border-orange-200 py-0.5 focus:outline-none text-xs"
                          min={0}
                        />
                        <button
                          type="button"
                          className="px-1 py-0.5 bg-orange-100 rounded-r-md border border-orange-200 hover:bg-orange-200 text-xs"
                          onClick={() => handleSettingChange(index, "switches", room.switches + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="border border-orange-200 px-4 py-2">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          className="px-1 py-0.5 bg-orange-100 rounded-l-md border border-orange-200 hover:bg-orange-200 text-xs"
                          onClick={() => {
                            if (room.crossover > 0) {
                              handleSettingChange(index, "crossover", room.crossover - 1)
                            }
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={room.crossover}
                          onChange={(e) => handleSettingChange(index, "crossover", Number(e.target.value))}
                          className="w-8 text-center border-y border-orange-200 py-0.5 focus:outline-none text-xs"
                          min={0}
                        />
                        <button
                          type="button"
                          className="px-1 py-0.5 bg-orange-100 rounded-r-md border border-orange-200 hover:bg-orange-200 text-xs"
                          onClick={() => handleSettingChange(index, "crossover", room.crossover + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="border border-orange-200 px-4 py-2">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          className="px-1 py-0.5 bg-orange-100 rounded-l-md border border-orange-200 hover:bg-orange-200 text-xs"
                          onClick={() => {
                            if (room.outdoor > 0) {
                              handleSettingChange(index, "outdoor", room.outdoor - 1)
                            }
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={room.outdoor}
                          onChange={(e) => handleSettingChange(index, "outdoor", Number(e.target.value))}
                          className="w-8 text-center border-y border-orange-200 py-0.5 focus:outline-none text-xs"
                          min={0}
                        />
                        <button
                          type="button"
                          className="px-1 py-0.5 bg-orange-100 rounded-r-md border border-orange-200 hover:bg-orange-200 text-xs"
                          onClick={() => handleSettingChange(index, "outdoor", room.outdoor + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="border border-orange-200 px-4 py-2">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          className="px-1 py-0.5 bg-orange-100 rounded-l-md border border-orange-200 hover:bg-orange-200 text-xs"
                          onClick={() => {
                            if (room.tvOutlet > 0) {
                              handleSettingChange(index, "tvOutlet", room.tvOutlet - 1)
                            }
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={room.tvOutlet}
                          onChange={(e) => handleSettingChange(index, "tvOutlet", Number(e.target.value))}
                          className="w-8 text-center border-y border-orange-200 py-0.5 focus:outline-none text-xs"
                          min={0}
                        />
                        <button
                          type="button"
                          className="px-1 py-0.5 bg-orange-100 rounded-r-md border border-orange-200 hover:bg-orange-200 text-xs"
                          onClick={() => handleSettingChange(index, "tvOutlet", room.tvOutlet + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="border border-orange-200 px-4 py-2">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          className="px-1 py-0.5 bg-orange-100 rounded-l-md border border-orange-200 hover:bg-orange-200 text-xs"
                          onClick={() => {
                            if (room.recessedLights > 0) {
                              handleSettingChange(index, "recessedLights", room.recessedLights - 1)
                            }
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={room.recessedLights}
                          onChange={(e) => handleSettingChange(index, "recessedLights", Number(e.target.value))}
                          className="w-8 text-center border-y border-orange-200 py-0.5 focus:outline-none text-xs"
                          min={0}
                        />
                        <button
                          type="button"
                          className="px-1 py-0.5 bg-orange-100 rounded-r-md border border-orange-200 hover:bg-orange-200 text-xs"
                          onClick={() => handleSettingChange(index, "recessedLights", room.recessedLights + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={handleSaveDefaults}
              disabled={isSaving}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Guardando...</span>
                </div>
              ) : saveSuccess ? (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>¡Guardado!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  <span>Guardar Valores</span>
                </div>
              )}
            </Button>

            <Button
              onClick={handleRestoreDefaults}
              disabled={isResetting}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-100 flex items-center gap-2 bg-transparent"
            >
              {isResetting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-700 border-t-transparent"></div>
                  <span>Restaurando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Restaurar Valores Predeterminados</span>
                </div>
              )}
            </Button>
          </div>

          <div className="mt-6 text-sm text-orange-700">
            <p>
              Estos valores son predeterminados y pueden ajustarse según las necesidades específicas de cada proyecto.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
