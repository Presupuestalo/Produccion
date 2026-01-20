"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy, Save, Trash2, BarChart2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Room {
  id: string
  type: string
  area: number
  floorMaterial: string
  wallMaterial?: string
}

interface Scenario {
  id: string
  name: string
  description: string
  priceMultiplier: number
  rooms: Room[]
  totalCost: number
}

interface ComparisonToolProps {
  rooms: Room[]
  baseCost: number
}

export function ComparisonTool({ rooms, baseCost }: ComparisonToolProps) {
  const { toast } = useToast()
  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: "basic",
      name: "Básico",
      description: "Materiales estándar, acabados básicos",
      priceMultiplier: 0.8,
      rooms: [...rooms],
      totalCost: baseCost * 0.8,
    },
    {
      id: "standard",
      name: "Estándar",
      description: "Calidad media, buen equilibrio calidad-precio",
      priceMultiplier: 1.0,
      rooms: [...rooms],
      totalCost: baseCost,
    },
    {
      id: "premium",
      name: "Premium",
      description: "Materiales de alta calidad, acabados premium",
      priceMultiplier: 1.5,
      rooms: [...rooms],
      totalCost: baseCost * 1.5,
    },
  ])
  const [activeScenario, setActiveScenario] = useState("standard")
  const [newScenarioName, setNewScenarioName] = useState("")
  const [newScenarioMultiplier, setNewScenarioMultiplier] = useState("1.0")

  // Función para añadir un nuevo escenario
  const addScenario = () => {
    if (!newScenarioName.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Por favor, introduce un nombre para el escenario",
        variant: "destructive",
      })
      return
    }

    const multiplier = Number.parseFloat(newScenarioMultiplier)
    if (isNaN(multiplier) || multiplier <= 0) {
      toast({
        title: "Multiplicador inválido",
        description: "El multiplicador debe ser un número positivo",
        variant: "destructive",
      })
      return
    }

    const newScenario: Scenario = {
      id: `scenario-${Date.now()}`,
      name: newScenarioName,
      description: `Escenario personalizado (${multiplier}x)`,
      priceMultiplier: multiplier,
      rooms: [...rooms],
      totalCost: baseCost * multiplier,
    }

    setScenarios([...scenarios, newScenario])
    setActiveScenario(newScenario.id)
    setNewScenarioName("")
    setNewScenarioMultiplier("1.0")

    toast({
      title: "Escenario añadido",
      description: `Se ha creado el escenario "${newScenarioName}"`,
    })
  }

  // Función para duplicar un escenario
  const duplicateScenario = (scenarioId: string) => {
    const scenarioToDuplicate = scenarios.find((s) => s.id === scenarioId)
    if (!scenarioToDuplicate) return

    const newScenario: Scenario = {
      ...scenarioToDuplicate,
      id: `scenario-${Date.now()}`,
      name: `${scenarioToDuplicate.name} (copia)`,
    }

    setScenarios([...scenarios, newScenario])
    setActiveScenario(newScenario.id)

    toast({
      title: "Escenario duplicado",
      description: `Se ha duplicado el escenario "${scenarioToDuplicate.name}"`,
    })
  }

  // Función para eliminar un escenario
  const deleteScenario = (scenarioId: string) => {
    // No permitir eliminar si solo queda un escenario
    if (scenarios.length <= 1) {
      toast({
        title: "No se puede eliminar",
        description: "Debe haber al menos un escenario",
        variant: "destructive",
      })
      return
    }

    const updatedScenarios = scenarios.filter((s) => s.id !== scenarioId)
    setScenarios(updatedScenarios)

    // Si el escenario activo es el que se está eliminando, cambiar a otro
    if (activeScenario === scenarioId) {
      setActiveScenario(updatedScenarios[0].id)
    }

    toast({
      title: "Escenario eliminado",
      description: "El escenario ha sido eliminado",
    })
  }

  // Función para actualizar un escenario
  const updateScenario = (scenarioId: string, updates: Partial<Scenario>) => {
    setScenarios(
      scenarios.map((scenario) => {
        if (scenario.id === scenarioId) {
          return { ...scenario, ...updates }
        }
        return scenario
      }),
    )
  }

  // Encontrar el escenario activo
  const currentScenario = scenarios.find((s) => s.id === activeScenario) || scenarios[0]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5" />
          Comparación de Escenarios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeScenario} onValueChange={setActiveScenario}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              {scenarios.map((scenario) => (
                <TabsTrigger key={scenario.id} value={scenario.id} className="text-xs">
                  {scenario.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => duplicateScenario(activeScenario)}
                className="h-8 gap-1"
              >
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Duplicar</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => deleteScenario(activeScenario)} className="h-8 gap-1">
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Eliminar</span>
              </Button>
            </div>
          </div>

          {scenarios.map((scenario) => (
            <TabsContent key={scenario.id} value={scenario.id}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{scenario.name}</h3>
                    <p className="text-sm text-muted-foreground">{scenario.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Multiplicador: {scenario.priceMultiplier}x</p>
                    <p className="text-xl font-bold">{Math.round(scenario.totalCost).toLocaleString("es-ES")} €</p>
                  </div>
                </div>

                <div className="border rounded-md">
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
                      {scenario.rooms.map((room) => (
                        <TableRow key={room.id}>
                          <TableCell className="font-medium">{room.type}</TableCell>
                          <TableCell>{room.area.toFixed(2)}</TableCell>
                          <TableCell>{room.floorMaterial}</TableCell>
                          <TableCell className="text-right">
                            {Math.round(
                              baseCost *
                                (room.area / rooms.reduce((sum, r) => sum + r.area, 0)) *
                                scenario.priceMultiplier,
                            ).toLocaleString("es-ES")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="text-sm text-muted-foreground">
                    * Los precios son estimaciones basadas en el presupuesto base
                  </div>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Save className="h-4 w-4" />
                    Guardar escenario
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 pt-4 border-t">
          <h3 className="font-medium mb-2">Crear nuevo escenario</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="scenario-name">Nombre</Label>
              <Input
                id="scenario-name"
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                placeholder="Ej: Económico"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="scenario-multiplier">Multiplicador de precio</Label>
              <Input
                id="scenario-multiplier"
                type="number"
                value={newScenarioMultiplier}
                onChange={(e) => setNewScenarioMultiplier(e.target.value)}
                step="0.1"
                min="0.1"
                placeholder="1.0"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addScenario} className="w-full">
                Añadir escenario
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
