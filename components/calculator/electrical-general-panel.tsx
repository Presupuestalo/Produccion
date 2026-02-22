"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { ElectricalConfig, GlobalConfig } from "@/types/calculator"
import { Zap, FileCheck, Wrench, Cable, Plug2, Flame } from 'lucide-react'

interface ElectricalGeneralPanelProps {
  config?: ElectricalConfig
  onUpdate: (config: ElectricalConfig) => void
  globalConfig?: GlobalConfig
}

export function ElectricalGeneralPanel({ config, onUpdate, globalConfig }: ElectricalGeneralPanelProps) {
  // Usar una configuración por defecto si no se proporciona
  const defaultConfig: ElectricalConfig = {
    needsNewInstallation: false,
    installationType: "Básica",
    hasCertificate: false,
    generalPanelElements: 10,
    hasConstructionPanel: false,
    moveElectricalConnection: false,
    relocateElectricalConnection: false,
    hasElectricalPanel: false,
    hasGroundConnection: false,
    hasHeatingCircuit: false,
  }

  // Estado local para la configuración
  const [localConfig, setLocalConfig] = useState<ElectricalConfig>(config || defaultConfig)

  // Actualizar el estado local cuando cambian las props
  useEffect(() => {
    if (config) {
      setLocalConfig({
        ...defaultConfig,
        ...config,
      })
    }
  }, [config])

  // Manejar cambios en la configuración
  const handleConfigChange = (updates: Partial<ElectricalConfig>) => {
    let updatedConfig = { ...localConfig, ...updates }

    // Force Reset: If needsNewInstallation is turned OFF, turn off all general sub-items
    if (updates.needsNewInstallation === false) {
      console.log("[v0] Turning off needsNewInstallation - forcing all general electrical items to false")
      updatedConfig = {
        ...updatedConfig,
        hasConstructionPanel: false,
        hasCertificate: false,
        hasElectricalPanel: false,
        hasGroundConnection: false,
        relocateElectricalConnection: false,
        hasHeatingCircuit: false,
        hasOvenCircuit: false,
        hasInductionCircuit: false,
        hasWashingMachineCircuit: false,
        hasDishwasherCircuit: false,
        hasDryerCircuit: false,
        hasWaterHeaterCircuit: false
      }
    }

    setLocalConfig(updatedConfig)
    onUpdate(updatedConfig)
  }

  const isElectricHeating = globalConfig?.reformHeatingType === "Eléctrica"

  useEffect(() => {
    if (isElectricHeating && !localConfig.hasHeatingCircuit) {
      console.log("[v0] Electric heating detected - enabling heating circuit (line 4)")
      handleConfigChange({ hasHeatingCircuit: true })
    }
  }, [isElectricHeating, localConfig.hasHeatingCircuit])

  return (
    <Card className="border-none shadow-none">
      <CardContent className="p-0">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Card className="border-2 border-blue-100 hover:border-blue-300 transition-colors duration-200 bg-gradient-to-br from-blue-50/30 to-transparent">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-blue-600" />
                  </div>
                  <Label htmlFor="needsNewInstallation" className="font-medium text-sm cursor-pointer flex-1">
                    ¿Necesita nueva instalación eléctrica?
                  </Label>
                  <Switch
                    id="needsNewInstallation"
                    checked={localConfig.needsNewInstallation}
                    onCheckedChange={(checked) => handleConfigChange({ needsNewInstallation: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {localConfig.needsNewInstallation && (
            <div className="pl-4 border-l-4 border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card className="border-2 border-orange-100 hover:border-orange-300 transition-colors duration-200 bg-gradient-to-br from-orange-50/30 to-transparent">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
                          <Wrench className="h-4 w-4 text-orange-600" />
                        </div>
                        <Label htmlFor="hasConstructionPanel" className="font-medium cursor-pointer text-sm">
                          Cuadro de obra
                        </Label>
                      </div>
                      <Switch
                        id="hasConstructionPanel"
                        checked={localConfig.hasConstructionPanel}
                        onCheckedChange={(checked) => handleConfigChange({ hasConstructionPanel: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-100 hover:border-green-300 transition-colors duration-200 bg-gradient-to-br from-green-50/30 to-transparent">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                          <FileCheck className="h-4 w-4 text-green-600" />
                        </div>
                        <Label htmlFor="hasCertificate" className="font-medium cursor-pointer text-sm">
                          Certificado eléctrico
                        </Label>
                      </div>
                      <Switch
                        id="hasCertificate"
                        checked={localConfig.hasCertificate}
                        onCheckedChange={(checked) => handleConfigChange({ hasCertificate: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-purple-100 hover:border-purple-300 transition-colors duration-200 bg-gradient-to-br from-purple-50/30 to-transparent">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                          <Cable className="h-4 w-4 text-purple-600" />
                        </div>
                        <Label htmlFor="relocateElectricalConnection" className="font-medium cursor-pointer text-sm">
                          Reubicación de acometida
                        </Label>
                      </div>
                      <Switch
                        id="relocateElectricalConnection"
                        checked={localConfig.relocateElectricalConnection || false}
                        onCheckedChange={(checked) => handleConfigChange({ relocateElectricalConnection: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-indigo-100 hover:border-indigo-300 transition-colors duration-200 bg-gradient-to-br from-indigo-50/30 to-transparent">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Plug2 className="h-4 w-4 text-indigo-600" />
                        </div>
                        <Label htmlFor="hasElectricalPanel" className="font-medium cursor-pointer text-sm">
                          Cuadro eléctrico
                        </Label>
                      </div>
                      <Switch
                        id="hasElectricalPanel"
                        checked={localConfig.hasElectricalPanel || false}
                        onCheckedChange={(checked) => handleConfigChange({ hasElectricalPanel: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-amber-100 hover:border-amber-300 transition-colors duration-200 bg-gradient-to-br from-amber-50/30 to-transparent">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                          <Zap className="h-4 w-4 text-amber-600" />
                        </div>
                        <Label htmlFor="hasGroundConnection" className="font-medium cursor-pointer text-sm">
                          Toma de tierra
                        </Label>
                      </div>
                      <Switch
                        id="hasGroundConnection"
                        checked={localConfig.hasGroundConnection || false}
                        onCheckedChange={(checked) => handleConfigChange({ hasGroundConnection: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                {isElectricHeating && (
                  <Card className="border-2 border-red-100 hover:border-red-300 transition-colors duration-200 bg-gradient-to-br from-red-50/30 to-transparent">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                            <Flame className="h-4 w-4 text-red-600" />
                          </div>
                          <Label htmlFor="hasHeatingCircuit" className="font-medium cursor-pointer text-sm">
                            Circuito de Calefacción (4 mm²)
                          </Label>
                        </div>
                        <Switch
                          id="hasHeatingCircuit"
                          checked={localConfig.hasHeatingCircuit || false}
                          onCheckedChange={(checked) => handleConfigChange({ hasHeatingCircuit: checked })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
