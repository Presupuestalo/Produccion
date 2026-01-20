"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { InfoIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"

interface DemolitionSectionProps {
  wallDemolitionArea: number
  wallThickness: number
  onWallDemolitionAreaChange: (area: number) => void
  onWallThicknessChange: (thickness: number) => void
}

export function DemolitionSection({
  wallDemolitionArea,
  wallThickness,
  onWallDemolitionAreaChange,
  onWallThicknessChange,
}: DemolitionSectionProps) {
  const [areaInput, setAreaInput] = useState(wallDemolitionArea.toString())
  const [thicknessInput, setThicknessInput] = useState(wallThickness.toString())
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    setAreaInput(wallDemolitionArea.toString())
  }, [wallDemolitionArea])

  useEffect(() => {
    setThicknessInput(wallThickness.toString())
  }, [wallThickness])

  const handleAreaChange = (value: string) => {
    setAreaInput(value)

    // Validar que sea un número
    if (!/^\d*\.?\d*$/.test(value) && value !== "") {
      return
    }

    const numValue = Number.parseFloat(value)

    // Mostrar advertencia si es mayor a 200, pero permitir el valor
    setShowWarning(!isNaN(numValue) && numValue > 200)

    // Actualizar el valor aunque sea mayor a 200
    if (!isNaN(numValue)) {
      onWallDemolitionAreaChange(numValue)
    } else if (value === "") {
      onWallDemolitionAreaChange(0)
    }
  }

  const handleThicknessChange = (value: string) => {
    setThicknessInput(value)

    // Validar que sea un número
    if (!/^\d*\.?\d*$/.test(value) && value !== "") {
      return
    }

    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue)) {
      onWallThicknessChange(numValue)
    } else if (value === "") {
      onWallThicknessChange(0)
    }
  }

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="wallDemolitionArea">m² Demolición de tabiques</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Área total de tabiques a demoler en metros cuadrados</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="wallDemolitionArea"
              type="text"
              value={areaInput}
              onChange={(e) => handleAreaChange(e.target.value)}
              placeholder="0"
            />
            {showWarning && (
              <Alert variant="warning" className="py-2 text-sm">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertDescription>Seleccione un valor que no sea mayor de 200.</AlertDescription>
              </Alert>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="wallThickness">Grosor tabique (cm)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Grosor promedio de los tabiques en centímetros</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="wallThickness"
              type="text"
              value={thicknessInput}
              onChange={(e) => handleThicknessChange(e.target.value)}
              placeholder="10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
