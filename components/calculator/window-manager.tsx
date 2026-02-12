"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, WindIcon as WindowIcon } from "lucide-react"
import type { Window, WindowType, WindowMaterial, WindowOpening, WindowColor } from "@/types/calculator"

interface WindowManagerProps {
  windows: Window[]
  updateWindows: (windows: Window[]) => void
}

export function WindowManager({ windows, updateWindows }: WindowManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newWindow, setNewWindow] = useState<Window>({
    id: crypto.randomUUID(),
    type: "Ventana simple",
    material: "PVC",
    opening: "Oscilo-Batiente",
    width: 0,
    height: 0,
    hasBlind: false,
    color: "Blanco",
    glassType: "Doble",
    hasMosquitera: false,
  })

  // Función para añadir una nueva ventana
  const addWindow = () => {
    if (newWindow.width <= 0 || newWindow.height <= 0) {
      return // No añadir si las dimensiones no son válidas
    }

    const updatedWindows = [...windows, { ...newWindow, id: crypto.randomUUID() }]
    updateWindows(updatedWindows)

    // Resetear el formulario
    setNewWindow({
      id: crypto.randomUUID(),
      type: "Ventana simple",
      material: "PVC",
      opening: "Oscilo-Batiente",
      width: 0,
      height: 0,
      hasBlind: false,
      color: "Blanco",
      glassType: "Doble",
      hasMosquitera: false,
    })
    setIsAdding(false)
  }

  // Función para eliminar una ventana
  const removeWindow = (id: string) => {
    const updatedWindows = windows.filter((window) => window.id !== id)
    updateWindows(updatedWindows)
  }

  // Función para formatear un número para mostrar
  const formatNumber = (value: number): string => {
    if (value === 0) return "0,00"
    return value.toFixed(2).replace(".", ",")
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Ventanas ({windows.length})</h4>
        {!isAdding && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" /> Añadir ventana
          </Button>
        )}
      </div>

      {/* Lista de ventanas existentes */}
      {windows.length > 0 && (
        <div className="space-y-2">
          {windows.map((window) => (
            <Card key={window.id} className="p-0 overflow-hidden">
              <CardHeader className="p-2 flex flex-row justify-between items-center bg-gray-50">
                <div className="flex items-center gap-1">
                  <WindowIcon className="h-3.5 w-3.5 text-gray-500" />
                  <CardTitle className="text-xs">{window.type}</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeWindow(window.id)} className="h-6 w-6 p-0">
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent className="p-2 text-xs grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <span className="text-gray-500">Material:</span> {window.material}
                </div>
                <div>
                  <span className="text-gray-500">Apertura:</span> {window.opening}
                </div>
                <div>
                  <span className="text-gray-500">Dimensiones:</span> {formatNumber(window.width)}m ×{" "}
                  {formatNumber(window.height)}m
                </div>
                <div>
                  <span className="text-gray-500">Color:</span> {window.color}
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Persiana:</span> {window.hasBlind ? "Sí" : "No"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Formulario para añadir nueva ventana */}
      {isAdding && (
        <Card className="p-3">
          <CardTitle className="text-sm mb-3">Nueva ventana</CardTitle>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="window-type" className="text-xs">
                  Tipo
                </Label>
                <Select
                  value={newWindow.type}
                  onValueChange={(value) => setNewWindow({ ...newWindow, type: value as WindowType })}
                >
                  <SelectTrigger id="window-type" className="h-7 text-xs">
                    <SelectValue placeholder="Tipo de ventana" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ventana simple">Ventana simple</SelectItem>
                    <SelectItem value="Ventana doble">Ventana doble</SelectItem>
                    <SelectItem value="Puerta de balcón">Puerta de balcón</SelectItem>
                    <SelectItem value="Fijo sin apertura">Fijo sin apertura</SelectItem>
                    <SelectItem value="Velux">Velux</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="window-material" className="text-xs">
                  Material
                </Label>
                <Select
                  value={newWindow.material}
                  onValueChange={(value) => setNewWindow({ ...newWindow, material: value as WindowMaterial })}
                >
                  <SelectTrigger id="window-material" className="h-7 text-xs">
                    <SelectValue placeholder="Material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PVC">PVC</SelectItem>
                    <SelectItem value="Aluminio">Aluminio</SelectItem>
                    <SelectItem value="Madera">Madera</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="window-opening" className="text-xs">
                  Apertura
                </Label>
                <Select
                  value={newWindow.opening}
                  onValueChange={(value) => setNewWindow({ ...newWindow, opening: value as WindowOpening })}
                >
                  <SelectTrigger id="window-opening" className="h-7 text-xs">
                    <SelectValue placeholder="Tipo de apertura" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oscilo-Batiente">Oscilo-Batiente</SelectItem>
                    <SelectItem value="Osciloparalela">Osciloparalela</SelectItem>
                    <SelectItem value="Paralela">Paralela</SelectItem>
                    <SelectItem value="Sin apertura">Sin apertura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="window-color" className="text-xs">
                  Color
                </Label>
                <Select
                  value={newWindow.color}
                  onValueChange={(value) => setNewWindow({ ...newWindow, color: value as WindowColor })}
                >
                  <SelectTrigger id="window-color" className="h-7 text-xs">
                    <SelectValue placeholder="Color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Blanco">Blanco</SelectItem>
                    <SelectItem value="Dos colores">Dos colores</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="window-width" className="text-xs">
                  Ancho (m)
                </Label>
                <Input
                  id="window-width"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newWindow.width || ""}
                  onChange={(e) => setNewWindow({ ...newWindow, width: Number.parseFloat(e.target.value) || 0 })}
                  className="h-7 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="window-height" className="text-xs">
                  Alto (m)
                </Label>
                <Input
                  id="window-height"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newWindow.height || ""}
                  onChange={(e) => setNewWindow({ ...newWindow, height: Number.parseFloat(e.target.value) || 0 })}
                  className="h-7 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="window-blind"
                checked={newWindow.hasBlind}
                onCheckedChange={(checked) => setNewWindow({ ...newWindow, hasBlind: checked === true })}
              />
              <Label htmlFor="window-blind" className="text-xs cursor-pointer">
                Incluye persiana
              </Label>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsAdding(false)} className="h-7 text-xs">
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={addWindow}
                className="h-7 text-xs"
                disabled={newWindow.width <= 0 || newWindow.height <= 0}
              >
                Añadir
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!isAdding && windows.length === 0 && (
        <div className="text-center py-3 bg-gray-50 rounded text-xs text-gray-500">No hay ventanas añadidas</div>
      )}
    </div>
  )
}
