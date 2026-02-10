"use client"

import { useState, useEffect } from "react"
import {
  Lightbulb,
  Power,
  ToggleLeft,
  GitMerge,
  GitFork,
  CloudLightning,
  Monitor,
  Plus,
  Minus,
  Zap,
} from "lucide-react"
import type { Room, ElectricalElement } from "@/types/calculator"

interface ElectricalRoomsCompactProps {
  rooms: Room[]
  onUpdateRoom?: (roomId: string, electricalElements: ElectricalElement[]) => void
}

interface ElectricalRoomSettings {
  puntosLuzTecho: number
  enchufes: number
  sencillo: number
  conmutados: number
  cruzamiento: number
  intemperie: number
  tomaTV: number
  focosEmpotrados: number
}

interface ElectricalSettings {
  [key: string]: ElectricalRoomSettings
}

export function ElectricalRoomsCompact({ rooms, onUpdateRoom }: ElectricalRoomsCompactProps) {
  const [settings, setSettings] = useState<ElectricalSettings | null>(null)
  const [roomElements, setRoomElements] = useState<{ [key: string]: ElectricalRoomSettings }>({})
  const [loading, setLoading] = useState(true)
  const [initialSyncDone, setInitialSyncDone] = useState(false)

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log("[v0] Storage change detected:", e.key, e.newValue)
      if (e.key === "presupuestalo_electrical_settings" || e.key === "electrical_room_settings") {
        console.log("[v0] Reloading electrical settings due to storage change")
        loadElectricalSettings()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    const handleCustomStorageChange = () => {
      console.log("[v0] Custom storage change detected, reloading settings")
      loadElectricalSettings()
    }

    window.addEventListener("electrical-settings-changed", handleCustomStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("electrical-settings-changed", handleCustomStorageChange)
    }
  }, [])

  const loadElectricalSettings = () => {
    try {
      console.log("[v0] LOAD SETTINGS - Starting load process")

      const mainSettings = localStorage.getItem("presupuestalo_electrical_settings")
      let parsedSettings: ElectricalSettings = {}

      if (mainSettings) {
        console.log("[v0] LOAD SETTINGS - Found main electrical settings:", mainSettings)
        const mainSettingsArray = JSON.parse(mainSettings)

        mainSettingsArray.forEach((room: any) => {
          parsedSettings[room.name] = {
            puntosLuzTecho: room.lightPoints,
            enchufes: room.outlets,
            sencillo: room.simple,
            conmutados: room.switches,
            cruzamiento: room.crossover,
            intemperie: room.outdoor,
            tomaTV: room.tvOutlet,
            focosEmpotrados: room.embeddedLights || 0,
          }
          console.log(`[v0] LOAD SETTINGS - Converted ${room.name}:`, parsedSettings[room.name])
        })

        localStorage.setItem("electrical_room_settings", JSON.stringify(parsedSettings))
        console.log("[v0] LOAD SETTINGS - Saved to compact format")
      } else {
        const compactSettings = localStorage.getItem("electrical_room_settings")
        if (compactSettings) {
          console.log("[v0] LOAD SETTINGS - Found compact electrical settings:", compactSettings)
          parsedSettings = JSON.parse(compactSettings)
        } else {
          console.log("[v0] LOAD SETTINGS - No settings found, using defaults")
          parsedSettings = {
            Cocina: {
              puntosLuzTecho: 1,
              enchufes: 12,
              sencillo: 1,
              conmutados: 0,
              cruzamiento: 0,
              intemperie: 0,
              tomaTV: 1,
              focosEmpotrados: 3,
            },
            "Cocina Abierta": {
              puntosLuzTecho: 2,
              enchufes: 15,
              sencillo: 0,
              conmutados: 2,
              cruzamiento: 0,
              intemperie: 0,
              tomaTV: 1,
              focosEmpotrados: 4,
            },
            "Cocina Americana": {
              puntosLuzTecho: 2,
              enchufes: 22,
              sencillo: 0,
              conmutados: 3,
              cruzamiento: 1,
              intemperie: 0,
              tomaTV: 1,
              focosEmpotrados: 5,
            },
            Baño: {
              puntosLuzTecho: 1,
              enchufes: 2,
              sencillo: 1,
              conmutados: 0,
              cruzamiento: 0,
              intemperie: 0,
              tomaTV: 0,
              focosEmpotrados: 2,
            },
            Dormitorio: {
              puntosLuzTecho: 1,
              enchufes: 5,
              sencillo: 0,
              conmutados: 3,
              cruzamiento: 1,
              intemperie: 0,
              tomaTV: 1,
              focosEmpotrados: 2,
            },
            Salón: {
              puntosLuzTecho: 2,
              enchufes: 10,
              sencillo: 1,
              conmutados: 2,
              cruzamiento: 1,
              intemperie: 0,
              tomaTV: 1,
              focosEmpotrados: 4,
            },
            Pasillo: {
              puntosLuzTecho: 2,
              enchufes: 2,
              sencillo: 1,
              conmutados: 2,
              cruzamiento: 1,
              intemperie: 0,
              tomaTV: 0,
              focosEmpotrados: 2,
            },
            Hall: {
              puntosLuzTecho: 1,
              enchufes: 1,
              sencillo: 1,
              conmutados: 0,
              cruzamiento: 0,
              intemperie: 0,
              tomaTV: 0,
              focosEmpotrados: 1,
            },
            Terraza: {
              puntosLuzTecho: 1,
              enchufes: 0,
              sencillo: 1,
              conmutados: 0,
              cruzamiento: 0,
              intemperie: 1,
              tomaTV: 0,
              focosEmpotrados: 0,
            },
            Trastero: {
              puntosLuzTecho: 1,
              enchufes: 1,
              sencillo: 1,
              conmutados: 0,
              cruzamiento: 0,
              intemperie: 0,
              tomaTV: 0,
              focosEmpotrados: 1,
            },
            Vestidor: {
              puntosLuzTecho: 1,
              enchufes: 1,
              sencillo: 1,
              conmutados: 0,
              cruzamiento: 0,
              intemperie: 0,
              tomaTV: 0,
              focosEmpotrados: 2,
            },
            Otro: {
              puntosLuzTecho: 1,
              enchufes: 2,
              sencillo: 1,
              conmutados: 0,
              cruzamiento: 0,
              intemperie: 0,
              tomaTV: 0,
              focosEmpotrados: 1,
            },
          }
          localStorage.setItem("electrical_room_settings", JSON.stringify(parsedSettings))
        }
      }

      console.log("[v0] LOAD SETTINGS - Final parsed settings:", parsedSettings)
      setSettings(parsedSettings)

      const initialElements: { [key: string]: ElectricalRoomSettings } = {}

      rooms.forEach((room) => {
        console.log("[v0] LOAD SETTINGS - Processing room:", room.type, "ID:", room.id)

        if (room.electricalElements && room.electricalElements.length > 0) {
          console.log("[v0] LOAD SETTINGS - Room has existing electrical elements:", room.electricalElements)

          const roomType = room.type
          const defaultSettings = parsedSettings[roomType] ||
            parsedSettings["Otro"] || {
            puntosLuzTecho: 1,
            enchufes: 2,
            sencillo: 1,
            conmutados: 0,
            cruzamiento: 0,
            intemperie: 0,
            tomaTV: 0,
            focosEmpotrados: 1,
          }

          const roomSettings: ElectricalRoomSettings = { ...defaultSettings }

          room.electricalElements.forEach((element) => {
            switch (element.id) {
              case "puntosLuzTecho":
                roomSettings.puntosLuzTecho = element.quantity
                break
              case "enchufes":
                roomSettings.enchufes = element.quantity
                break
              case "sencillo":
                roomSettings.sencillo = element.quantity
                break
              case "conmutados":
                roomSettings.conmutados = element.quantity
                break
              case "cruzamiento":
                roomSettings.cruzamiento = element.quantity
                break
              case "intemperie":
                roomSettings.intemperie = element.quantity
                break
              case "tomaTV":
                roomSettings.tomaTV = element.quantity
                break
              case "focosEmpotrados":
                roomSettings.focosEmpotrados = element.quantity
                break
            }
          })

          console.log("[v0] LOAD SETTINGS - Final room settings with defaults for missing fields:", roomSettings)
          initialElements[room.id] = roomSettings
        } else {
          const roomType = room.type
          const defaultSettings = parsedSettings[roomType] ||
            parsedSettings["Otro"] || {
            puntosLuzTecho: 1,
            enchufes: 2,
            sencillo: 1,
            conmutados: 0,
            cruzamiento: 0,
            intemperie: 0,
            tomaTV: 0,
            focosEmpotrados: 1,
          }

          console.log("[v0] LOAD SETTINGS - Using default settings for room type", roomType, ":", defaultSettings)
          console.log("[v0] LOAD SETTINGS - tomaTV value for", roomType, ":", defaultSettings.tomaTV)
          console.log("[v0] LOAD SETTINGS - focosEmpotrados value for", roomType, ":", defaultSettings.focosEmpotrados)
          initialElements[room.id] = defaultSettings
        }
      })

      console.log("[v0] LOAD SETTINGS - Final initial elements:", initialElements)
      setRoomElements(initialElements)

      // The rooms already have their electricalElements from Supabase
      // We only need to update the local state for the UI
    } catch (error) {
      console.error("Error al cargar los ajustes eléctricos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadElectricalSettings()
  }, [rooms])

  useEffect(() => {
    if (!loading && !initialSyncDone && Object.keys(roomElements).length > 0 && onUpdateRoom) {
      console.log("[v0] INITIAL SYNC - Syncing all rooms with complete electrical elements")

      rooms.forEach((room) => {
        const roomElement = roomElements[room.id]
        if (roomElement) {
          // Check if room already has all 8 elements
          const hasAllElements = room.electricalElements?.length === 8

          if (!hasAllElements) {
            const formattedElements = [
              { id: "puntosLuzTecho", type: "Punto de luz techo", quantity: roomElement.puntosLuzTecho || 0 },
              { id: "enchufes", type: "Enchufe normal", quantity: roomElement.enchufes || 0 },
              { id: "sencillo", type: "Interruptor", quantity: roomElement.sencillo || 0 },
              { id: "conmutados", type: "Punto conmutado", quantity: roomElement.conmutados || 0 },
              { id: "cruzamiento", type: "Punto de cruzamiento", quantity: roomElement.cruzamiento || 0 },
              { id: "intemperie", type: "Enchufe intemperie", quantity: roomElement.intemperie || 0 },
              { id: "tomaTV", type: "Toma TV", quantity: roomElement.tomaTV || 0 },
              { id: "focosEmpotrados", type: "Foco empotrado", quantity: roomElement.focosEmpotrados || 0 },
            ]

            console.log("[v0] INITIAL SYNC - Updating room", room.type, "with all 8 elements:", formattedElements)
            onUpdateRoom(room.id, formattedElements)
          }
        }
      })

      setInitialSyncDone(true)
    }
  }, [loading, initialSyncDone, roomElements, rooms, onUpdateRoom])

  const updateElement = (roomId: string, element: keyof ElectricalRoomSettings, value: number) => {
    const newValue = Math.max(0, value)

    setRoomElements((prev) => {
      const updated = {
        ...prev,
        [roomId]: {
          ...prev[roomId],
          [element]: newValue,
        },
      }

      if (onUpdateRoom) {
        const roomElement = updated[roomId]
        const formattedElements = [
          { id: "puntosLuzTecho", type: "Punto de luz techo", quantity: roomElement.puntosLuzTecho || 0 },
          { id: "enchufes", type: "Enchufe normal", quantity: roomElement.enchufes || 0 },
          { id: "sencillo", type: "Interruptor", quantity: roomElement.sencillo || 0 },
          { id: "conmutados", type: "Punto conmutado", quantity: roomElement.conmutados || 0 },
          { id: "cruzamiento", type: "Punto de cruzamiento", quantity: roomElement.cruzamiento || 0 },
          { id: "intemperie", type: "Enchufe intemperie", quantity: roomElement.intemperie || 0 },
          { id: "tomaTV", type: "Toma TV", quantity: roomElement.tomaTV || 0 },
          { id: "focosEmpotrados", type: "Foco empotrado", quantity: roomElement.focosEmpotrados || 0 },
        ]

        console.log("[v0] Updating room", roomId, "with all 8 elements:", formattedElements)

        setTimeout(() => {
          onUpdateRoom(roomId, formattedElements)
        }, 0)
      }

      return updated
    })
  }

  const incrementValue = (roomId: string, element: keyof ElectricalRoomSettings) => {
    const currentValue = roomElements[roomId]?.[element] || 0
    updateElement(roomId, element, currentValue + 1)
  }

  const decrementValue = (roomId: string, element: keyof ElectricalRoomSettings) => {
    const currentValue = roomElements[roomId]?.[element] || 0
    if (currentValue > 0) {
      updateElement(roomId, element, currentValue - 1)
    }
  }

  if (loading) {
    return <div>Cargando elementos eléctricos...</div>
  }

  return (
    <div className="space-y-4">
      {rooms.length === 0 ? (
        <p className="text-gray-500">No hay habitaciones definidas. Añade habitaciones en la sección de reforma.</p>
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-lg border p-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">
                  {room.type} {room.number > 1 ? room.number : ""} ({room.area.toFixed(2)} m²)
                </h4>
              </div>
              <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                <div className="flex flex-col items-center bg-white rounded-lg p-2 border">
                  <Lightbulb className="h-5 w-5 text-amber-500 mb-1" />
                  <span className="text-xs text-center mb-1">Luz techo</span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => decrementValue(room.id, "puntosLuzTecho")}
                      className="h-6 w-6 rounded-l border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                      title="Disminuir puntos de luz de techo"
                      aria-label="Disminuir puntos de luz de techo"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <div className="relative w-8">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={roomElements[room.id]?.puntosLuzTecho || 0}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "")
                          updateElement(room.id, "puntosLuzTecho", value === "" ? 0 : Number.parseInt(value))
                        }}
                        className="h-6 w-full text-center p-0 border-l-0 border-r-0 rounded-none"
                        aria-label="Puntos de luz de techo"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => incrementValue(room.id, "puntosLuzTecho")}
                      className="h-6 w-6 rounded-r border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                      title="Aumentar puntos de luz de techo"
                      aria-label="Aumentar puntos de luz de techo"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center bg-white rounded-lg p-2 border">
                  <Power className="h-5 w-5 text-blue-500 mb-1" />
                  <span className="text-xs text-center mb-1">Enchufes</span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => decrementValue(room.id, "enchufes")}
                      className="h-6 w-6 rounded-l border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                      title="Disminuir enchufes"
                      aria-label="Disminuir enchufes"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <div className="relative w-8">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={roomElements[room.id]?.enchufes || 0}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "")
                          updateElement(room.id, "enchufes", value === "" ? 0 : Number.parseInt(value))
                        }}
                        className="h-6 w-full text-center p-0 border-l-0 border-r-0 rounded-none"
                        aria-label="Enchufes"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => incrementValue(room.id, "enchufes")}
                      className="h-6 w-6 rounded-r border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                      title="Aumentar enchufes"
                      aria-label="Aumentar enchufes"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center bg-white rounded-lg p-2 border">
                  <ToggleLeft className="h-5 w-5 text-gray-500 mb-1" />
                  <span className="text-xs text-center mb-1">Sencillo</span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => decrementValue(room.id, "sencillo")}
                      className="h-6 w-6 rounded-l border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                      title="Disminuir interruptores sencillos"
                      aria-label="Disminuir interruptores sencillos"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <div className="relative w-8">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={roomElements[room.id]?.sencillo || 0}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "")
                          updateElement(room.id, "sencillo", value === "" ? 0 : Number.parseInt(value))
                        }}
                        className="h-6 w-full text-center p-0 border-l-0 border-r-0 rounded-none"
                        aria-label="Interruptores sencillos"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => incrementValue(room.id, "sencillo")}
                      className="h-6 w-6 rounded-r border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                      title="Aumentar interruptores sencillos"
                      aria-label="Aumentar interruptores sencillos"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center bg-white rounded-lg p-2 border">
                  <GitMerge className="h-5 w-5 text-purple-500 mb-1" />
                  <span className="text-xs text-center mb-1">Conmutados</span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => decrementValue(room.id, "conmutados")}
                      className="h-6 w-6 rounded-l border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                      title="Disminuir puntos conmutados"
                      aria-label="Disminuir puntos conmutados"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <div className="relative w-8">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={roomElements[room.id]?.conmutados || 0}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "")
                          updateElement(room.id, "conmutados", value === "" ? 0 : Number.parseInt(value))
                        }}
                        className="h-6 w-full text-center p-0 border-l-0 border-r-0 rounded-none"
                        aria-label="Puntos conmutados"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => incrementValue(room.id, "conmutados")}
                      className="h-6 w-6 rounded-r border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                      title="Aumentar puntos conmutados"
                      aria-label="Aumentar puntos conmutados"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center bg-white rounded-lg p-2 border">
                  <GitFork className="h-5 w-5 text-green-500 mb-1" />
                  <span className="text-xs text-center mb-1">Cruzamiento</span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => decrementValue(room.id, "cruzamiento")}
                      className="h-6 w-6 rounded-l border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                      title="Disminuir puntos de cruzamiento"
                      aria-label="Disminuir puntos de cruzamiento"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <div className="relative w-8">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={roomElements[room.id]?.cruzamiento || 0}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "")
                          updateElement(room.id, "cruzamiento", value === "" ? 0 : Number.parseInt(value))
                        }}
                        className="h-6 w-full text-center p-0 border-l-0 border-r-0 rounded-none"
                        aria-label="Puntos de cruzamiento"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => incrementValue(room.id, "cruzamiento")}
                      className="h-6 w-6 rounded-r border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                      title="Aumentar puntos de cruzamiento"
                      aria-label="Aumentar puntos de cruzamiento"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center bg-white rounded-lg p-2 border">
                  <CloudLightning className="h-5 w-5 text-orange-500 mb-1" />
                  <span className="text-xs text-center mb-1">Intemperie</span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => decrementValue(room.id, "intemperie")}
                      className="h-6 w-6 rounded-l border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                      title="Disminuir enchufes de intemperie"
                      aria-label="Disminuir enchufes de intemperie"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <div className="relative w-8">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={roomElements[room.id]?.intemperie || 0}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "")
                          updateElement(room.id, "intemperie", value === "" ? 0 : Number.parseInt(value))
                        }}
                        className="h-6 w-full text-center p-0 border-l-0 border-r-0 rounded-none"
                        aria-label="Enchufes de intemperie"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => incrementValue(room.id, "intemperie")}
                      className="h-6 w-6 rounded-r border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                      title="Aumentar enchufes de intemperie"
                      aria-label="Aumentar enchufes de intemperie"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center bg-white rounded-lg p-2 border">
                  <Monitor className="h-5 w-5 text-red-500 mb-1" />
                  <span className="text-xs text-center mb-1">Toma TV</span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => decrementValue(room.id, "tomaTV")}
                      className="h-6 w-6 rounded-l border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                      title="Disminuir tomas de TV"
                      aria-label="Disminuir tomas de TV"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <div className="relative w-8">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={roomElements[room.id]?.tomaTV || 0}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "")
                          updateElement(room.id, "tomaTV", value === "" ? 0 : Number.parseInt(value))
                        }}
                        className="h-6 w-full text-center p-0 border-l-0 border-r-0 rounded-none"
                        aria-label="Tomas de TV"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => incrementValue(room.id, "tomaTV")}
                      className="h-6 w-6 rounded-r border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                      title="Aumentar tomas de TV"
                      aria-label="Aumentar tomas de TV"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center bg-white rounded-lg p-2 border">
                  <Zap className="h-5 w-5 text-yellow-500 mb-1" />
                  <span className="text-xs text-center mb-1">Focos empotrados</span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => decrementValue(room.id, "focosEmpotrados")}
                      className="h-6 w-6 rounded-l border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                      title="Disminuir focos empotrados"
                      aria-label="Disminuir focos empotrados"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <div className="relative w-8">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={roomElements[room.id]?.focosEmpotrados || 0}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "")
                          updateElement(room.id, "focosEmpotrados", value === "" ? 0 : Number.parseInt(value))
                        }}
                        className="h-6 w-full text-center p-0 border-l-0 border-r-0 rounded-none"
                        aria-label="Focos empotrados"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => incrementValue(room.id, "focosEmpotrados")}
                      className="h-6 w-6 rounded-r border flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                      title="Aumentar focos empotrados"
                      aria-label="Aumentar focos empotrados"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
