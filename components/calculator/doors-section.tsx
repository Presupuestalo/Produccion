"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DoorOpen, Minus, Plus } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface GlobalDoors {
  abatibles: number
  dobleAbatibles: number
  correderasEmpotradas: number
  correderasExteriores: number
}

interface DoorsSectionProps {
  globalDoors: GlobalDoors
  onUpdate: (doors: GlobalDoors) => void
  isReadOnly?: boolean
  entranceDoorType?: boolean | "No" | "Lacada" | "Acorazada"
  onEntranceDoorChange?: (val: boolean | "No") => void
}

const DOOR_TYPES: Array<{
  key: keyof GlobalDoors
  label: string
  description: string
}> = [
  {
    key: "abatibles",
    label: "Puerta abatible",
    description: "Puerta interior con bisagras, apertura estándar",
  },
  {
    key: "dobleAbatibles",
    label: "Puerta abatible doble",
    description: "Puerta de dos hojas con bisagras",
  },
  {
    key: "correderasEmpotradas",
    label: "Puerta corredera empotrada",
    description: "Corredera con cajón empotrado en el tabique",
  },
  {
    key: "correderasExteriores",
    label: "Puerta corredera exterior",
    description: "Corredera con carril exterior visible",
  },
]

export function DoorsSection({ globalDoors, onUpdate, isReadOnly = false, entranceDoorType, onEntranceDoorChange }: DoorsSectionProps) {
  const handleChange = (key: keyof GlobalDoors, delta: number) => {
    const newValue = Math.max(0, (globalDoors[key] || 0) + delta)
    onUpdate({ ...globalDoors, [key]: newValue })
  }

  const totalDoors =
    (globalDoors.abatibles || 0) +
    (globalDoors.dobleAbatibles || 0) +
    (globalDoors.correderasEmpotradas || 0) +
    (globalDoors.correderasExteriores || 0)

  const totalPremarcos = totalDoors
  const totalCajones = globalDoors.correderasEmpotradas || 0

  return (
    <div className="lg:grid lg:grid-cols-[1.5fr_1fr] lg:gap-6 lg:max-w-none lg:mx-0 mt-6">
      {/* COLUMNA PRINCIPAL: Contadores */}
      <div className="space-y-6">

        {/* === NUEVO: Puerta de Entrada === */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <DoorOpen className="h-5 w-5 text-teal-600" />
            <h2 className="text-base font-semibold text-slate-700">Puerta principal</h2>
          </div>
          
          <Card className="border-2 border-teal-100 hover:border-teal-300 transition-colors duration-200 bg-gradient-to-br from-teal-50/30 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <DoorOpen className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <Label htmlFor="entranceDoorType" className="font-semibold text-slate-800 cursor-pointer text-sm">
                      ¿Cambiar puerta de entrada?
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Sustituir la puerta principal de acceso a la vivienda</p>
                  </div>
                </div>
                <Switch
                  id="entranceDoorType"
                  checked={entranceDoorType !== undefined && entranceDoorType !== false && entranceDoorType !== "No"}
                  onCheckedChange={(checked) => {
                    if (onEntranceDoorChange) onEntranceDoorChange(checked ? true : "No")
                  }}
                  disabled={isReadOnly}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* === Puertas Interiores === */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <DoorOpen className="h-5 w-5 text-orange-500" />
            <h2 className="text-base font-semibold text-slate-700">Puertas interiores</h2>
          </div>

        <p className="text-sm text-muted-foreground -mt-2 mb-4">
          Indica el número total de cada tipo de puerta para todo el proyecto. Los totales aparecerán automáticamente en el resumen de reforma.
        </p>

        {DOOR_TYPES.map(({ key, label, description }) => (
          <Card key={key} className="border-slate-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-slate-800">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full border-slate-300 hover:border-orange-400 hover:bg-orange-50 transition-all"
                    onClick={() => handleChange(key, -1)}
                    disabled={isReadOnly || (globalDoors[key] || 0) === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <span className="text-2xl font-bold text-slate-800 w-8 text-center tabular-nums">
                    {globalDoors[key] || 0}
                  </span>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full border-slate-300 hover:border-orange-400 hover:bg-orange-50 transition-all"
                    onClick={() => handleChange(key, 1)}
                    disabled={isReadOnly}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      </div>

      {/* COLUMNA DERECHA: Resumen (desktop) */}
      <div className="hidden lg:block lg:sticky lg:top-4 lg:self-start">
        <Card className="border-orange-100 bg-orange-50/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-orange-700 flex items-center gap-2">
              <DoorOpen className="h-5 w-5" />
              Resumen de puertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {DOOR_TYPES.map(({ key, label }) =>
                (globalDoors[key] || 0) > 0 ? (
                  <div key={key} className="grid grid-cols-[1fr_40px] gap-2 items-center py-1 border-b border-orange-100 last:border-0">
                    <div className="text-slate-700">{label}</div>
                    <div className="text-right font-semibold text-slate-800">{globalDoors[key]}</div>
                  </div>
                ) : null
              )}

              {totalDoors === 0 && (
                <p className="text-muted-foreground text-xs py-2">No hay puertas configuradas aún.</p>
              )}

              {totalDoors > 0 && (
                <div className="pt-3 mt-2 border-t border-orange-200 space-y-1">
                  <div className="grid grid-cols-[1fr_40px] gap-2 items-center">
                    <div className="text-slate-600 font-medium">Total puertas</div>
                    <div className="text-right font-bold text-orange-700">{totalDoors}</div>
                  </div>
                  <div className="grid grid-cols-[1fr_40px] gap-2 items-center">
                    <div className="text-slate-500 text-xs">Premarcos</div>
                    <div className="text-right font-medium text-slate-700 text-xs">{totalPremarcos}</div>
                  </div>
                  {totalCajones > 0 && (
                    <div className="grid grid-cols-[1fr_40px] gap-2 items-center">
                      <div className="text-slate-500 text-xs">Cajones correderas</div>
                      <div className="text-right font-medium text-slate-700 text-xs">{totalCajones}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resumen móvil: siempre visible debajo en pantallas pequeñas */}
      </div>

      {/* RESUMEN MÓVIL */}
      {totalDoors > 0 && (
        <div className="lg:hidden mt-4">
          <Card className="border-orange-100 bg-orange-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                <DoorOpen className="h-4 w-4" />
                Resumen: {totalDoors} puertas · {totalPremarcos} premarcos
                {totalCajones > 0 && ` · ${totalCajones} cajones`}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  )
}
