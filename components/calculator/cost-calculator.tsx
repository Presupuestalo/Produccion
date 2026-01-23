"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calculator, Printer } from "lucide-react"
import { formatNumber, formatCurrency } from "@/lib/utils/format"

interface Room {
  id: string
  type: string
  area: number
  perimeter: number
  floorMaterial: string
  wallMaterial?: string
  hasFalseCeiling: boolean
}

interface CostCalculatorProps {
  rooms: Room[]
}

// Precios por defecto (€/m²)
const defaultPrices = {
  demolition: 35,
  floorCeramic: 45,
  floorWood: 65,
  floorVinyl: 40,
  floorMarble: 120,
  floorOther: 50,
  wallPaint: 12,
  wallCeramic: 45,
  wallWood: 70,
  wallOther: 30,
  falseCeiling: 35,
}

export function CostCalculator({ rooms }: CostCalculatorProps) {
  const [prices, setPrices] = useState({ ...defaultPrices })
  const [showPriceEditor, setShowPriceEditor] = useState(false)

  // Función para actualizar precios
  const updatePrice = (key: keyof typeof defaultPrices, value: string) => {
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setPrices((prev) => ({ ...prev, [key]: numValue }))
    }
  }

  // Función para calcular el costo de una habitación
  const calculateRoomCost = (room: Room) => {
    let cost = 0

    // Costo del suelo según material
    switch (room.floorMaterial) {
      case "Cerámico":
        cost += room.area * prices.floorCeramic
        break
      case "Madera":
        cost += room.area * prices.floorWood
        break
      case "Vinílico":
        cost += room.area * prices.floorVinyl
        break
      case "Mármol":
        cost += room.area * prices.floorMarble
        break
      default:
        cost += room.area * prices.floorOther
    }

    // Costo de las paredes según material
    const wallArea = room.perimeter * 2.5 // Altura estándar de 2.5m
    if (room.wallMaterial && room.wallMaterial !== "No se modifica") {
      switch (room.wallMaterial) {
        case "Pintura":
          cost += wallArea * prices.wallPaint
          break
        case "Cerámica":
          cost += wallArea * prices.wallCeramic
          break
        case "Madera":
          cost += wallArea * prices.wallWood
          break
        default:
          cost += wallArea * prices.wallOther
      }
    }

    // Costo de demolición (estimado)
    cost += room.area * prices.demolition

    // Costo del falso techo si aplica
    if (room.hasFalseCeiling) {
      cost += room.area * prices.falseCeiling
    }

    return Math.round(cost)
  }

  // Calcular costo total
  const totalCost = rooms.reduce((sum, room) => sum + calculateRoomCost(room), 0)

  // Función para imprimir el presupuesto
  const printBudget = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    // Crear contenido HTML para imprimir
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Presupuesto - Presupuéstalo</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #f97316; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; font-size: 1.2em; margin-top: 20px; }
          .footer { margin-top: 50px; font-size: 0.8em; color: #666; }
        </style>
      </head>
      <body>
        <h1>Presupuesto de Reforma</h1>
        <p>Fecha: ${new Date().toLocaleDateString()}</p>
        
        <h2>Desglose por Habitaciones</h2>
        <table>
          <thead>
            <tr>
              <th>Habitación</th>
              <th>Área (m²)</th>
              <th>Material Suelo</th>
              <th>Material Paredes</th>
              <th>Falso Techo</th>
              <th>Costo (€)</th>
            </tr>
          </thead>
          <tbody>
            ${rooms
        .map(
          (room) => `
              <tr>
                <td>${room.type}</td>
                <td>${formatNumber(room.area)}</td>
                <td>${room.floorMaterial}</td>
                <td>${room.wallMaterial || "Pintura"}</td>
                <td>${room.hasFalseCeiling ? "Sí" : "No"}</td>
                <td>${formatCurrency(calculateRoomCost(room))}</td>
              </tr>
            `,
        )
        .join("")}
          </tbody>
        </table>
        
        <div class="total">
          <p>Costo Total: ${formatCurrency(totalCost)}</p>
        </div>
        
        <div class="footer">
          <p>Este presupuesto es una estimación basada en los precios estándar y puede variar.</p>
          <p>Generado con Presupuéstalo - www.presupuestalo.com</p>
        </div>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(content)
    printWindow.document.close()

    // Esperar a que se cargue el contenido y luego imprimir
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Cálculo de Costos</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPriceEditor(!showPriceEditor)}
            className="h-8 gap-1"
          >
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Ajustar precios</span>
          </Button>
          <Button variant="outline" size="sm" onClick={printBudget} className="h-8 gap-1 bg-transparent">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showPriceEditor && (
          <div className="mb-6 p-4 border rounded-md bg-gray-50">
            <h3 className="font-medium mb-3">Ajustar Precios (€/m²)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label htmlFor="demolition" className="text-xs">
                  Demolición
                </Label>
                <Input
                  id="demolition"
                  type="number"
                  value={prices.demolition}
                  onChange={(e) => updatePrice("demolition", e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="floorCeramic" className="text-xs">
                  Suelo Cerámico
                </Label>
                <Input
                  id="floorCeramic"
                  type="number"
                  value={prices.floorCeramic}
                  onChange={(e) => updatePrice("floorCeramic", e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="floorWood" className="text-xs">
                  Suelo Madera
                </Label>
                <Input
                  id="floorWood"
                  type="number"
                  value={prices.floorWood}
                  onChange={(e) => updatePrice("floorWood", e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wallPaint" className="text-xs">
                  Pintura Paredes
                </Label>
                <Input
                  id="wallPaint"
                  type="number"
                  value={prices.wallPaint}
                  onChange={(e) => updatePrice("wallPaint", e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wallCeramic" className="text-xs">
                  Cerámica Paredes
                </Label>
                <Input
                  id="wallCeramic"
                  type="number"
                  value={prices.wallCeramic}
                  onChange={(e) => updatePrice("wallCeramic", e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="falseCeiling" className="text-xs">
                  Falso Techo
                </Label>
                <Input
                  id="falseCeiling"
                  type="number"
                  value={prices.falseCeiling}
                  onChange={(e) => updatePrice("falseCeiling", e.target.value)}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        )}

        {rooms.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">Añade habitaciones para calcular el presupuesto</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Habitación</TableHead>
                  <TableHead>Área (m²)</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Costo (€)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.type}</TableCell>
                    <TableCell>{formatNumber(room.area)}</TableCell>
                    <TableCell>{room.floorMaterial}</TableCell>
                    <TableCell className="text-right">{formatCurrency(calculateRoomCost(room))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 text-right">
              <p className="text-lg font-bold">Total: {formatCurrency(totalCost)}</p>
              <p className="text-xs text-muted-foreground">
                *Este presupuesto es una estimación basada en los precios estándar
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
