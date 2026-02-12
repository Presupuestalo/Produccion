"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Room, ElectricalElement, ElectricalElementType } from "@/types/calculator"

// Valores predeterminados actualizados según la imagen proporcionada
const defaultElectricalElements: Record<string, ElectricalElement[]> = {
  Cocina: [
    { id: crypto.randomUUID(), type: "Punto de luz techo", quantity: 1 },
    { id: crypto.randomUUID(), type: "Enchufe normal", quantity: 12 },
    { id: crypto.randomUUID(), type: "Sencillo", quantity: 1 },
    { id: crypto.randomUUID(), type: "Punto conmutado", quantity: 0 },
    { id: crypto.randomUUID(), type: "Punto de cruzamiento", quantity: 0 },
    { id: crypto.randomUUID(), type: "Enchufe intemperie", quantity: 0 },
  ],
  "Cocina Abierta": [
    { id: crypto.randomUUID(), type: "Punto de luz techo", quantity: 2 },
    { id: crypto.randomUUID(), type: "Enchufe normal", quantity: 15 },
    { id: crypto.randomUUID(), type: "Sencillo", quantity: 0 },
    { id: crypto.randomUUID(), type: "Punto conmutado", quantity: 2 },
    { id: crypto.randomUUID(), type: "Punto de cruzamiento", quantity: 0 },
    { id: crypto.randomUUID(), type: "Enchufe intemperie", quantity: 0 },
  ],
  "Cocina Americana": [
    { id: crypto.randomUUID(), type: "Punto de luz techo", quantity: 2 },
    { id: crypto.randomUUID(), type: "Enchufe normal", quantity: 22 },
    { id: crypto.randomUUID(), type: "Sencillo", quantity: 0 },
    { id: crypto.randomUUID(), type: "Punto conmutado", quantity: 3 },
    { id: crypto.randomUUID(), type: "Punto de cruzamiento", quantity: 1 },
    { id: crypto.randomUUID(), type: "Enchufe intemperie", quantity: 0 },
  ],
  Baño: [
    { id: crypto.randomUUID(), type: "Punto de luz techo", quantity: 1 },
    { id: crypto.randomUUID(), type: "Enchufe normal", quantity: 2 },
    { id: crypto.randomUUID(), type: "Sencillo", quantity: 1 },
    { id: crypto.randomUUID(), type: "Punto conmutado", quantity: 0 },
    { id: crypto.randomUUID(), type: "Punto de cruzamiento", quantity: 0 },
    { id: crypto.randomUUID(), type: "Enchufe intemperie", quantity: 0 },
  ],
  Dormitorio: [
    { id: crypto.randomUUID(), type: "Punto de luz techo", quantity: 1 },
    { id: crypto.randomUUID(), type: "Enchufe normal", quantity: 5 },
    { id: crypto.randomUUID(), type: "Sencillo", quantity: 0 },
    { id: crypto.randomUUID(), type: "Punto conmutado", quantity: 3 },
    { id: crypto.randomUUID(), type: "Punto de cruzamiento", quantity: 1 },
    { id: crypto.randomUUID(), type: "Enchufe intemperie", quantity: 0 },
  ],
  Salón: [
    { id: crypto.randomUUID(), type: "Punto de luz techo", quantity: 2 },
    { id: crypto.randomUUID(), type: "Enchufe normal", quantity: 10 },
    { id: crypto.randomUUID(), type: "Sencillo", quantity: 1 },
    { id: crypto.randomUUID(), type: "Punto conmutado", quantity: 2 },
    { id: crypto.randomUUID(), type: "Punto de cruzamiento", quantity: 1 },
    { id: crypto.randomUUID(), type: "Enchufe intemperie", quantity: 0 },
  ],
  Pasillo: [
    { id: crypto.randomUUID(), type: "Punto de luz techo", quantity: 2 },
    { id: crypto.randomUUID(), type: "Enchufe normal", quantity: 2 },
    { id: crypto.randomUUID(), type: "Sencillo", quantity: 1 },
    { id: crypto.randomUUID(), type: "Punto conmutado", quantity: 2 },
    { id: crypto.randomUUID(), type: "Punto de cruzamiento", quantity: 1 },
    { id: crypto.randomUUID(), type: "Enchufe intemperie", quantity: 0 },
  ],
  Hall: [
    { id: crypto.randomUUID(), type: "Punto de luz techo", quantity: 1 },
    { id: crypto.randomUUID(), type: "Enchufe normal", quantity: 1 },
    { id: crypto.randomUUID(), type: "Sencillo", quantity: 1 },
    { id: crypto.randomUUID(), type: "Punto conmutado", quantity: 0 },
    { id: crypto.randomUUID(), type: "Punto de cruzamiento", quantity: 0 },
    { id: crypto.randomUUID(), type: "Enchufe intemperie", quantity: 0 },
  ],
  Terraza: [
    { id: crypto.randomUUID(), type: "Punto de luz techo", quantity: 1 },
    { id: crypto.randomUUID(), type: "Enchufe normal", quantity: 0 },
    { id: crypto.randomUUID(), type: "Sencillo", quantity: 1 },
    { id: crypto.randomUUID(), type: "Punto conmutado", quantity: 0 },
    { id: crypto.randomUUID(), type: "Punto de cruzamiento", quantity: 0 },
    { id: crypto.randomUUID(), type: "Enchufe intemperie", quantity: 1 },
  ],
  Trastero: [
    { id: crypto.randomUUID(), type: "Punto de luz techo", quantity: 1 },
    { id: crypto.randomUUID(), type: "Enchufe normal", quantity: 1 },
    { id: crypto.randomUUID(), type: "Sencillo", quantity: 1 },
    { id: crypto.randomUUID(), type: "Punto conmutado", quantity: 0 },
    { id: crypto.randomUUID(), type: "Punto de cruzamiento", quantity: 0 },
    { id: crypto.randomUUID(), type: "Enchufe intemperie", quantity: 0 },
  ],
  Vestidor: [
    { id: crypto.randomUUID(), type: "Punto de luz techo", quantity: 1 },
    { id: crypto.randomUUID(), type: "Enchufe normal", quantity: 1 },
    { id: crypto.randomUUID(), type: "Sencillo", quantity: 1 },
    { id: crypto.randomUUID(), type: "Punto conmutado", quantity: 0 },
    { id: crypto.randomUUID(), type: "Punto de cruzamiento", quantity: 0 },
    { id: crypto.randomUUID(), type: "Enchufe intemperie", quantity: 0 },
  ],
  Otro: [
    { id: crypto.randomUUID(), type: "Punto de luz techo", quantity: 1 },
    { id: crypto.randomUUID(), type: "Enchufe normal", quantity: 2 },
    { id: crypto.randomUUID(), type: "Sencillo", quantity: 1 },
    { id: crypto.randomUUID(), type: "Punto conmutado", quantity: 0 },
    { id: crypto.randomUUID(), type: "Punto de cruzamiento", quantity: 0 },
    { id: crypto.randomUUID(), type: "Enchufe intemperie", quantity: 0 },
  ],
}

// Lista de tipos de elementos eléctricos disponibles
const electricalElementTypes: ElectricalElementType[] = [
  "Punto de luz techo",
  "Punto de luz pared",
  "Sencillo",
  "Punto conmutado",
  "Punto de cruzamiento",
  "Enchufe normal",
  "Enchufe doble",
  "Enchufe intemperie",
  "Enchufe cocina",
  "Foco empotrado",
  "Timbre",
  "Interruptor",
  "Interruptor doble",
  "Interruptor triple",
  "Mover acometida de electricidad",
  "Reubicación de acometida",
]

interface ElectricalRoomsListProps {
  rooms: Room[]
  onUpdateRoom: (roomId: string, updates: Partial<Room>) => void
  useSavedDefaults?: boolean
}

export function ElectricalRoomsList({ rooms, onUpdateRoom, useSavedDefaults = true }: ElectricalRoomsListProps) {
  // Estado para el acordeón
  const [openItems, setOpenItems] = useState<string[]>([])
  // Estado para almacenar los valores guardados
  const [savedSettings, setSavedSettings] = useState<Record<string, ElectricalElement[]> | null>(null)

  // Cargar valores guardados al iniciar
  useEffect(() => {
    try {
      const settings = localStorage.getItem("electrical_room_settings")
      if (settings) {
        const parsedSettings = JSON.parse(settings)
        setSavedSettings(parsedSettings)
        console.log("Ajustes eléctricos cargados:", parsedSettings)
      } else {
        // Si no hay ajustes guardados, guardar los predeterminados
        localStorage.setItem("electrical_room_settings", JSON.stringify(defaultElectricalElements))
        setSavedSettings(defaultElectricalElements)
        console.log("Ajustes eléctricos predeterminados guardados")
      }
    } catch (error) {
      console.error("Error al cargar ajustes eléctricos:", error)
    }
  }, [])

  // Manejar cambios en el acordeón
  const handleAccordionChange = (value: string) => {
    setOpenItems((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value)
      } else {
        return [...prev, value]
      }
    })
  }

  // Función para añadir un elemento eléctrico a una habitación
  const addElectricalElement = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId)
    if (!room) return

    const newElement: ElectricalElement = {
      id: crypto.randomUUID(),
      type: "Punto de luz techo",
      quantity: 1,
    }

    const updatedElements = [...(room.electricalElements || []), newElement]
    onUpdateRoom(roomId, { electricalElements: updatedElements })
  }

  // Función para eliminar un elemento eléctrico de una habitación
  const removeElectricalElement = (roomId: string, elementId: string) => {
    const room = rooms.find((r) => r.id === roomId)
    if (!room || !room.electricalElements) return

    const updatedElements = room.electricalElements.filter((el) => el.id !== elementId)
    onUpdateRoom(roomId, { electricalElements: updatedElements })
  }

  // Función para actualizar un elemento eléctrico
  const updateElectricalElement = (roomId: string, elementId: string, updates: Partial<ElectricalElement>) => {
    const room = rooms.find((r) => r.id === roomId)
    if (!room || !room.electricalElements) return

    const updatedElements = room.electricalElements.map((el) => {
      if (el.id === elementId) {
        return { ...el, ...updates }
      }
      return el
    })

    onUpdateRoom(roomId, { electricalElements: updatedElements })
  }

  // Función para inicializar elementos eléctricos por defecto según el tipo de habitación
  const initializeDefaultElements = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId)
    if (!room) return

    // Si ya tiene elementos eléctricos, no hacer nada
    if (room.electricalElements && room.electricalElements.length > 0) return

    // Determinar qué valores usar
    let elementsToUse: ElectricalElement[] = []

    if (savedSettings && savedSettings[room.type]) {
      // Usar valores guardados si existen
      elementsToUse = savedSettings[room.type]
      console.log(`Usando ajustes guardados para ${room.type}:`, elementsToUse)
    } else {
      // Usar valores predeterminados si no hay guardados
      elementsToUse = defaultElectricalElements[room.type] || defaultElectricalElements["Otro"]
      console.log(`Usando ajustes predeterminados para ${room.type}:`, elementsToUse)
    }

    // Crear nuevos elementos con IDs únicos
    const newElements = elementsToUse.map((el) => ({
      ...el,
      id: crypto.randomUUID(),
    }))

    onUpdateRoom(roomId, { electricalElements: newElements })
  }

  // Efecto para inicializar elementos eléctricos en todas las habitaciones cuando se cargan los ajustes
  useEffect(() => {
    if (savedSettings) {
      // Inicializar elementos eléctricos para todas las habitaciones que no los tengan
      rooms.forEach((room) => {
        if (!room.electricalElements || room.electricalElements.length === 0) {
          initializeDefaultElements(room.id)
        }
      })
    }
  }, [savedSettings, rooms]) // eslint-disable-line react-hooks/exhaustive-deps

  if (rooms.length === 0) {
    return (
      <Alert>
        <AlertDescription className="text-center py-4">
          No hay habitaciones disponibles. Añade habitaciones en la sección de reforma.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {rooms.map((room) => (
        <Card key={room.id} className="overflow-hidden">
          <CardHeader className="p-3 bg-gray-50">
            <CardTitle className="text-sm font-medium">
              {room.type} {room.number} ({room.area.toFixed(2)} m²)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <Accordion
              type="multiple"
              value={openItems}
              onValueChange={(value) => {
                handleAccordionChange(value[0])
                // Inicializar elementos por defecto al abrir una habitación
                if (value.includes(`room-${room.id}`)) {
                  initializeDefaultElements(room.id)
                }
              }}
              className="w-full"
            >
              <AccordionItem value={`room-${room.id}`}>
                <AccordionTrigger className="py-2">Elementos eléctricos</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 py-2">
                    {!room.electricalElements || room.electricalElements.length === 0 ? (
                      <div className="text-sm text-gray-500 mb-2">
                        No hay elementos eléctricos. Añade uno o inicializa con valores por defecto.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {room.electricalElements.map((element) => (
                          <div key={element.id} className="flex items-center gap-2">
                            <Select
                              value={element.type}
                              onValueChange={(value) =>
                                element.id &&
                                updateElectricalElement(room.id, element.id, { type: value as ElectricalElementType })
                              }
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Tipo de elemento" />
                              </SelectTrigger>
                              <SelectContent>
                                {electricalElementTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="w-20">
                              <Input
                                type="number"
                                min="0"
                                value={element.quantity}
                                onChange={(e) =>
                                  element.id &&
                                  updateElectricalElement(room.id, element.id, {
                                    quantity: Number.parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-full"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => removeElectricalElement(room.id, element.id)}
                              className="h-8 w-8"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addElectricalElement(room.id)}
                      className="w-full mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir elemento
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
