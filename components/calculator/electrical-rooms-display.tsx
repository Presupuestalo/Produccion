"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Room } from "@/types/calculator"

interface ElectricalRoomsDisplayProps {
  rooms: Room[]
}

// Interfaz para los ajustes eléctricos por tipo de habitación
interface ElectricalRoomSettings {
  puntosLuzTecho: number
  enchufes: number
  sencillo: number
  conmutados: number
  cruzamiento: number
  intemperie: number
}

// Interfaz para todos los ajustes
interface ElectricalSettings {
  [key: string]: ElectricalRoomSettings
}

export function ElectricalRoomsDisplay({ rooms }: ElectricalRoomsDisplayProps) {
  const [settings, setSettings] = useState<ElectricalSettings | null>(null)
  const [loading, setLoading] = useState(true)

  // Cargar los ajustes guardados
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("electrical_room_settings")
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      } else {
        // Si no hay ajustes guardados, usar los predeterminados
        const defaultSettings: ElectricalSettings = {
          Cocina: {
            puntosLuzTecho: 1,
            enchufes: 12,
            sencillo: 1,
            conmutados: 0,
            cruzamiento: 0,
            intemperie: 0,
          },
          "Cocina Abierta": {
            puntosLuzTecho: 2,
            enchufes: 15,
            sencillo: 0,
            conmutados: 2,
            cruzamiento: 0,
            intemperie: 0,
          },
          "Cocina Americana": {
            puntosLuzTecho: 2,
            enchufes: 22,
            sencillo: 0,
            conmutados: 3,
            cruzamiento: 1,
            intemperie: 0,
          },
          Baño: {
            puntosLuzTecho: 1,
            enchufes: 2,
            sencillo: 1,
            conmutados: 0,
            cruzamiento: 0,
            intemperie: 0,
          },
          Dormitorio: {
            puntosLuzTecho: 1,
            enchufes: 5,
            sencillo: 0,
            conmutados: 3,
            cruzamiento: 1,
            intemperie: 0,
          },
          Salón: {
            puntosLuzTecho: 2,
            enchufes: 10,
            sencillo: 1,
            conmutados: 2,
            cruzamiento: 1,
            intemperie: 0,
          },
          Pasillo: {
            puntosLuzTecho: 2,
            enchufes: 2,
            sencillo: 1,
            conmutados: 2,
            cruzamiento: 1,
            intemperie: 0,
          },
          Hall: {
            puntosLuzTecho: 1,
            enchufes: 1,
            sencillo: 1,
            conmutados: 0,
            cruzamiento: 0,
            intemperie: 0,
          },
          Terraza: {
            puntosLuzTecho: 1,
            enchufes: 0,
            sencillo: 1,
            conmutados: 0,
            cruzamiento: 0,
            intemperie: 1,
          },
          Trastero: {
            puntosLuzTecho: 1,
            enchufes: 1,
            sencillo: 1,
            conmutados: 0,
            cruzamiento: 0,
            intemperie: 0,
          },
          Vestidor: {
            puntosLuzTecho: 1,
            enchufes: 1,
            sencillo: 1,
            conmutados: 0,
            cruzamiento: 0,
            intemperie: 0,
          },
          Otro: {
            puntosLuzTecho: 1,
            enchufes: 2,
            sencillo: 1,
            conmutados: 0,
            cruzamiento: 0,
            intemperie: 0,
          },
        }
        setSettings(defaultSettings)
        localStorage.setItem("electrical_room_settings", JSON.stringify(defaultSettings))
      }
    } catch (error) {
      console.error("Error al cargar los ajustes eléctricos:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener los ajustes para un tipo de habitación específico
  const getRoomSettings = (roomType: string): ElectricalRoomSettings => {
    if (!settings) {
      return {
        puntosLuzTecho: 0,
        enchufes: 0,
        sencillo: 0,
        conmutados: 0,
        cruzamiento: 0,
        intemperie: 0,
      }
    }

    return (
      settings[roomType] ||
      settings["Otro"] || {
        puntosLuzTecho: 1,
        enchufes: 2,
        sencillo: 1,
        conmutados: 0,
        cruzamiento: 0,
        intemperie: 0,
      }
    )
  }

  if (loading) {
    return <div>Cargando elementos eléctricos...</div>
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-blue-700">Elementos Eléctricos por Habitación</h3>

      {rooms.length === 0 ? (
        <p className="text-gray-500">No hay habitaciones definidas. Añade habitaciones en la sección de reforma.</p>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {rooms.map((room) => {
            const roomSettings = getRoomSettings(room.type)
            return (
              <AccordionItem key={room.id} value={room.id}>
                <AccordionTrigger className="hover:bg-gray-50 px-4">
                  <span className="text-left font-medium">
                    {room.type} {room.number > 1 ? room.number : ""} ({room.area.toFixed(2)} m²)
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2 pb-4">
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-1/3">Elemento</TableHead>
                            <TableHead className="text-center">Cantidad</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Puntos de luz techo</TableCell>
                            <TableCell className="text-center">{roomSettings.puntosLuzTecho}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Enchufes</TableCell>
                            <TableCell className="text-center">{roomSettings.enchufes}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Sencillo</TableCell>
                            <TableCell className="text-center">{roomSettings.sencillo}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Conmutados</TableCell>
                            <TableCell className="text-center">{roomSettings.conmutados}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Cruzamiento</TableCell>
                            <TableCell className="text-center">{roomSettings.cruzamiento}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Intemperie</TableCell>
                            <TableCell className="text-center">{roomSettings.intemperie}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}
    </div>
  )
}
