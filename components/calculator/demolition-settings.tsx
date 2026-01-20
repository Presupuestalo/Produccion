"use client"

import type React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { InfoIcon, Edit, Save, Check, Loader2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { DemolitionSettings } from "@/types/calculator"
import { saveProjectDemolitionSettings } from "@/lib/services/demolition-service"
import { useToast } from "@/hooks/use-toast"

interface DemolitionSettingsProps {
  settings: DemolitionSettings
  updateSettings: (settings: Partial<DemolitionSettings>) => void
  projectId?: string
}

// Función para formatear un número al formato xx,xx
const formatToXXCXX = (value: number): string => {
  // Limitar a 2 decimales y convertir a string con coma
  return value.toFixed(2).replace(".", ",")
}

// Función para validar y convertir una entrada al formato xx,xx
const parseToXXCXX = (input: string): number | null => {
  // Si está vacío, devolver null
  if (!input) return null

  // Permitir solo el formato xx,xx o xx.xx
  const regex = /^(\d{1,2})(,|\.)(\d{1,2})$/
  const match = input.match(regex)

  if (match) {
    // Convertir a número (reemplazando coma por punto para el cálculo)
    return Number.parseFloat(input.replace(",", "."))
  }

  // Si es solo un número entero sin decimales (hasta 2 dígitos)
  if (/^\d{1,2}$/.test(input)) {
    return Number.parseInt(input, 10)
  }

  return null
}

export function DemolitionSettingsComponent({ settings, updateSettings, projectId }: DemolitionSettingsProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const handleSave = async () => {
    console.log("[v0] Save button clicked, projectId:", projectId)
    if (!projectId) {
      console.log("[v0] No projectId, aborting save")
      return
    }

    try {
      console.log("[v0] Starting save process...")
      setIsSaving(true)
      console.log("[v0] Saving demolition settings:", settings)

      await saveProjectDemolitionSettings(projectId, settings)
      console.log("[v0] Save completed successfully")

      setLastSaved(new Date())
      setSaveSuccess(true)
      setIsEditing(false)

      toast({
        title: "Ajustes guardados",
        description: "Los ajustes de demolición se han guardado correctamente",
      })

      // Reset success state after 2 seconds
      setTimeout(() => setSaveSuccess(false), 2000)

      console.log("[v0] Demolition settings saved successfully")
    } catch (error) {
      console.error("[v0] Error saving demolition settings:", error)
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los ajustes de demolición",
        variant: "destructive",
      })
    } finally {
      console.log("[v0] Save process finished, setting isSaving to false")
      setIsSaving(false)
    }
  }

  // Estados locales para los valores de entrada
  const [ceramicThicknessInput, setCeramicThicknessInput] = useState(
    // Force new default 0,01 instead of old 0,02
    settings.floorTileThickness && settings.floorTileThickness !== 0.02
      ? formatToXXCXX(settings.floorTileThickness)
      : "0,01",
  )
  const [woodExpansionCoefInput, setWoodExpansionCoefInput] = useState(
    settings.woodExpansionCoef ? formatToXXCXX(settings.woodExpansionCoef) : "",
  )
  const [woodenFloorThicknessInput, setWoodenFloorThicknessInput] = useState(
    settings.woodenFloorThickness ? formatToXXCXX(settings.woodenFloorThickness) : "0,02",
  )
  const [woodenFloorExpansionCoefInput, setWoodenFloorExpansionCoefInput] = useState(
    settings.woodenFloorExpansionCoef ? formatToXXCXX(settings.woodenFloorExpansionCoef) : "1,40",
  )
  const [mortarBaseThicknessInput, setMortarBaseThicknessInput] = useState(
    // Force new default 0,08 instead of old 0,04
    settings.mortarBaseThickness && settings.mortarBaseThickness !== 0.04
      ? formatToXXCXX(settings.mortarBaseThickness)
      : "0,08",
  )
  const [mortarBaseExpansionCoefInput, setMortarBaseExpansionCoefInput] = useState(
    settings.mortarBaseExpansionCoef ? formatToXXCXX(settings.mortarBaseExpansionCoef) : "",
  )
  const [wallExpansionCoefInput, setWallExpansionCoefInput] = useState(
    settings.wallExpansionCoef ? formatToXXCXX(settings.wallExpansionCoef) : "",
  )
  const [ceilingThicknessInput, setCeilingThicknessInput] = useState(
    settings.ceilingThickness ? formatToXXCXX(settings.ceilingThickness) : "",
  )
  const [ceilingExpansionCoefInput, setCeilingExpansionCoefInput] = useState(
    settings.ceilingExpansionCoef ? formatToXXCXX(settings.ceilingExpansionCoef) : "",
  )
  const [ceramicExpansionCoefInput, setCeramicExpansionCoefInput] = useState(
    settings.ceramicExpansionCoef ? formatToXXCXX(settings.ceramicExpansionCoef) : "",
  )

  // Manejador para los inputs de grosor de tabique y tamaño de contenedor (enteros)
  const handleIntegerChange = (
    field: keyof DemolitionSettings,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    setter(value)

    // Permitir solo dígitos
    if (!/^\d+$/.test(value) && value !== "") {
      return
    }

    const numValue = Number.parseInt(value, 10)
    if (!isNaN(numValue)) {
      updateSettings({ [field]: numValue })
    }
  }

  // Manejador para los inputs con formato xx,xx
  const handleDecimalChange = (
    field: keyof DemolitionSettings,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    setter(value)

    // Solo actualizar el valor en settings si es válido
    const parsedValue = parseToXXCXX(value)
    if (parsedValue !== null) {
      updateSettings({ [field]: parsedValue })
    }
  }

  useEffect(() => {
    if (!settings.containerSize || settings.containerSize === 4) {
      updateSettings({ containerSize: 5 })
    }
  }, [settings.containerSize, updateSettings])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex items-center justify-between">
          Ajustes de Derribos
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground font-normal">
              {lastSaved ? `Última actualización: ${lastSaved.toLocaleTimeString()}` : ""}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? "Cancelar" : "Editar"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Sección: Grosores */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Grosores</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="ceramicThickness">Grosor cerámica (m)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Grosor promedio de la cerámica (suelo y paredes)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {isEditing ? (
                  <Input
                    id="ceramicThickness"
                    type="text"
                    value={ceramicThicknessInput}
                    onChange={(e) => {
                      setCeramicThicknessInput(e.target.value)
                      const parsedValue = parseToXXCXX(e.target.value)
                      if (parsedValue !== null) {
                        updateSettings({
                          floorTileThickness: parsedValue,
                          wallTileThickness: parsedValue,
                        })
                      }
                    }}
                    placeholder="0,01"
                    maxLength={5}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {settings.floorTileThickness ? `${formatToXXCXX(settings.floorTileThickness)}m` : "Sin valor"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="woodExpansionCoef">Coef. esponjamiento madera</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Coeficiente de esponjamiento para escombros de madera</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {isEditing ? (
                  <Input
                    id="woodExpansionCoef"
                    type="text"
                    value={woodExpansionCoefInput}
                    onChange={(e) =>
                      handleDecimalChange("woodExpansionCoef", e.target.value, setWoodExpansionCoefInput)
                    }
                    placeholder="1,40"
                    maxLength={5}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {settings.woodExpansionCoef ? `${formatToXXCXX(settings.woodExpansionCoef)}` : "Sin valor"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="woodenFloorThickness">Grosor suelo madera (m)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Grosor promedio del suelo de madera</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {isEditing ? (
                  <Input
                    id="woodenFloorThickness"
                    type="text"
                    value={woodenFloorThicknessInput}
                    onChange={(e) =>
                      handleDecimalChange("woodenFloorThickness", e.target.value, setWoodenFloorThicknessInput)
                    }
                    placeholder="0,02"
                    maxLength={5}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {settings.woodenFloorThickness ? `${formatToXXCXX(settings.woodenFloorThickness)}m` : "Sin valor"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="mortarBaseThickness">Grosor base mortero (m)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Grosor de la base de mortero bajo el pavimento</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {isEditing ? (
                  <Input
                    id="mortarBaseThickness"
                    type="text"
                    value={mortarBaseThicknessInput}
                    onChange={(e) =>
                      handleDecimalChange("mortarBaseThickness", e.target.value, setMortarBaseThicknessInput)
                    }
                    placeholder="0,08"
                    maxLength={5}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {settings.mortarBaseThickness ? `${formatToXXCXX(settings.mortarBaseThickness)}m` : "Sin valor"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="ceilingThickness">Grosor falso techo (m)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Grosor del falso techo a demoler</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {isEditing ? (
                  <Input
                    id="ceilingThickness"
                    type="text"
                    value={ceilingThicknessInput}
                    onChange={(e) => handleDecimalChange("ceilingThickness", e.target.value, setCeilingThicknessInput)}
                    placeholder="0,02"
                    maxLength={5}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {settings.ceilingThickness ? `${formatToXXCXX(settings.ceilingThickness)}m` : "Sin valor"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sección: Coeficientes de Esponjamiento */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Coeficientes de Esponjamiento</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="wallExpansionCoef">Coef. esponjamiento tabiques</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Coeficiente de esponjamiento para escombros de tabiques</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {isEditing ? (
                  <Input
                    id="wallExpansionCoef"
                    type="text"
                    value={wallExpansionCoefInput}
                    onChange={(e) =>
                      handleDecimalChange("wallExpansionCoef", e.target.value, setWallExpansionCoefInput)
                    }
                    placeholder="1,40"
                    maxLength={5}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {settings.wallExpansionCoef ? `${formatToXXCXX(settings.wallExpansionCoef)}` : "Sin valor"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="ceramicExpansionCoef">Coef. esponjamiento cerámica</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Coeficiente de esponjamiento para escombros de cerámica</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {isEditing ? (
                  <Input
                    id="ceramicExpansionCoef"
                    type="text"
                    value={ceramicExpansionCoefInput}
                    onChange={(e) => {
                      setCeramicExpansionCoefInput(e.target.value)
                      const parsedValue = parseToXXCXX(e.target.value)
                      if (parsedValue !== null) {
                        updateSettings({
                          ceramicExpansionCoef: parsedValue,
                          floorTileExpansionCoef: parsedValue,
                        })
                      }
                    }}
                    placeholder="1,40"
                    maxLength={5}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {settings.ceramicExpansionCoef ? `${formatToXXCXX(settings.ceramicExpansionCoef)}` : "Sin valor"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="woodExpansionCoef">Coef. esponjamiento madera</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Coeficiente de esponjamiento para escombros de madera</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {isEditing ? (
                  <Input
                    id="woodExpansionCoef"
                    type="text"
                    value={woodExpansionCoefInput}
                    onChange={(e) =>
                      handleDecimalChange("woodExpansionCoef", e.target.value, setWoodExpansionCoefInput)
                    }
                    placeholder="1,40"
                    maxLength={5}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {settings.woodExpansionCoef ? `${formatToXXCXX(settings.woodExpansionCoef)}` : "Sin valor"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="woodenFloorExpansionCoef">Coef. esponjamiento suelo madera</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Coeficiente de esponjamiento específico para suelo de madera</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {isEditing ? (
                  <Input
                    id="woodenFloorExpansionCoef"
                    type="text"
                    value={woodenFloorExpansionCoefInput}
                    onChange={(e) =>
                      handleDecimalChange("woodenFloorExpansionCoef", e.target.value, setWoodenFloorExpansionCoefInput)
                    }
                    placeholder="1,40"
                    maxLength={5}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {settings.woodenFloorExpansionCoef
                      ? `${formatToXXCXX(settings.woodenFloorExpansionCoef)}`
                      : "Sin valor"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="mortarBaseExpansionCoef">Coef. esponjamiento base mortero</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Coeficiente de esponjamiento para escombros de base de mortero</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {isEditing ? (
                  <Input
                    id="mortarBaseExpansionCoef"
                    type="text"
                    value={mortarBaseExpansionCoefInput}
                    onChange={(e) =>
                      handleDecimalChange("mortarBaseExpansionCoef", e.target.value, setMortarBaseExpansionCoefInput)
                    }
                    placeholder="1,40"
                    maxLength={5}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {settings.mortarBaseExpansionCoef
                      ? `${formatToXXCXX(settings.mortarBaseExpansionCoef)}`
                      : "Sin valor"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="ceilingExpansionCoef">Coef. esponjamiento falso techo</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Coeficiente de esponjamiento para escombros de falso techo</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {isEditing ? (
                  <Input
                    id="ceilingExpansionCoef"
                    type="text"
                    value={ceilingExpansionCoefInput}
                    onChange={(e) =>
                      handleDecimalChange("ceilingExpansionCoef", e.target.value, setCeilingExpansionCoefInput)
                    }
                    placeholder="1,40"
                    maxLength={5}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {settings.ceilingExpansionCoef ? `${formatToXXCXX(settings.ceilingExpansionCoef)}` : "Sin valor"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sección: Contenedores */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Contenedores</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="containerSize">Tamaño contenedor (m³)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Capacidad en metros cúbicos de cada contenedor de escombros</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {isEditing ? (
                  <Select
                    value={settings.containerSize?.toString() || "5"}
                    onValueChange={(value) => {
                      console.log("[v0] Container size changed to:", value)
                      const containerSize = Number.parseInt(value)
                      updateSettings({ containerSize })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tamaño" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 m³</SelectItem>
                      <SelectItem value="5">5 m³</SelectItem>
                      <SelectItem value="7">7 m³</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border">{settings.containerSize || 5} m³</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={() => {
                console.log("[v0] Save button clicked!")
                handleSave()
              }}
              className="flex-1"
              disabled={isSaving || saveSuccess}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Guardado
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { DemolitionSettingsComponent as DemolitionSettings }
