"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Trash2 } from "lucide-react"
import { formatDecimalInput, parseDecimalInput, sanitizeDecimalInput } from "@/lib/utils/format"
import React, { useState, useEffect } from "react"

import { type Partition, type WallLining, type Room } from "@/types/calculator"
export { type Partition, type WallLining }

interface PartitionsSectionProps {
  partitions: Partition[]
  wallLinings: WallLining[]
  standardHeight: number
  onUpdatePartitions: (partitions: Partition[]) => void
  onUpdateWallLinings: (wallLinings: WallLining[]) => void
  reformRooms?: Room[]
}

export function PartitionsSection({
  partitions,
  wallLinings,
  standardHeight,
  onUpdatePartitions,
  onUpdateWallLinings,
  reformRooms = [],
}: PartitionsSectionProps) {
  const [linearMetersInputs, setLinearMetersInputs] = useState<Record<string, string>>({})
  const [heightInputs, setHeightInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    const newLinearMetersInputs: Record<string, string> = {}
    const newHeightInputs: Record<string, string> = {}

    partitions.forEach((partition) => {
      newLinearMetersInputs[partition.id] = formatDecimalInput(partition.linearMeters || 0)
      newHeightInputs[partition.id] = formatDecimalInput(partition.height || 0)
    })

    wallLinings.forEach((lining) => {
      newLinearMetersInputs[lining.id] = formatDecimalInput(lining.linearMeters || 0)
      newHeightInputs[lining.id] = formatDecimalInput(lining.height || 0)
    })

    setLinearMetersInputs(newLinearMetersInputs)
    setHeightInputs(newHeightInputs)
  }, [partitions, wallLinings])

  // Funciones para manejar tabiques
  const addPartition = () => {
    const newPartition: Partition = {
      id: `partition-${Date.now()}`,
      type: "ladrillo",
      linearMeters: 0,
      height: standardHeight || 2.6,
    }
    onUpdatePartitions([...partitions, newPartition])
  }

  const updatePartition = (id: string, updates: Partial<Partition>) => {
    const updatedPartitions = partitions.map((partition) =>
      partition.id === id ? { ...partition, ...updates } : partition,
    )
    onUpdatePartitions(updatedPartitions)
  }

  const removePartition = (id: string) => {
    const updatedPartitions = partitions.filter((partition) => partition.id !== id)
    onUpdatePartitions(updatedPartitions)
  }

  // Funciones para manejar trasdosados
  const addWallLining = () => {
    const newWallLining: WallLining = {
      id: `lining-${Date.now()}`,
      linearMeters: 0,
      height: standardHeight || 2.6,
    }
    onUpdateWallLinings([...wallLinings, newWallLining])
  }

  const updateWallLining = (id: string, updates: Partial<WallLining>) => {
    const updatedWallLinings = wallLinings.map((lining) => (lining.id === id ? { ...lining, ...updates } : lining))
    onUpdateWallLinings(updatedWallLinings)
  }

  const removeWallLining = (id: string) => {
    const updatedWallLinings = wallLinings.filter((lining) => lining.id !== id)
    onUpdateWallLinings(updatedWallLinings)
  }

  // Validación para completar el tabique anterior
  const isPartitionComplete = (partition: Partition) => {
    return partition.linearMeters > 0 && partition.height > 0
  }

  const canAddPartition = partitions.length === 0 || partitions.every(isPartitionComplete)

  // Validación para completar el trasdosado anterior
  const isWallLiningComplete = (lining: WallLining) => {
    return lining.linearMeters > 0 && lining.height > 0
  }

  const canAddWallLining = wallLinings.length === 0 || wallLinings.every(isWallLiningComplete)

  // Calcular totales
  const totalPartitionArea = partitions.reduce((total, partition) => {
    return total + partition.linearMeters * partition.height
  }, 0)

  const totalWallLiningArea = wallLinings.reduce((total, lining) => {
    return total + lining.linearMeters * lining.height
  }, 0)

  const brickPartitionsArea = partitions
    .filter((p) => p.type === "ladrillo")
    .reduce((total, p) => total + p.linearMeters * p.height, 0)

  const plasterboardPartitionsArea = partitions
    .filter((p) => p.type === "placa_yeso")
    .reduce((total, p) => total + p.linearMeters * p.height, 0)

  // Placas para trasdosados (solo una cara)
  const liningPlasterboardsNeeded = Math.ceil(totalWallLiningArea / 2.88)

  const falseCeilingArea = reformRooms.reduce((total, room) => {
    if (room.lowerCeiling && room.newCeilingHeight) {
      return total + (room.area || 0)
    }
    return 0
  }, 0)

  const bathroomFalseCeilingArea = reformRooms.reduce((total, room) => {
    if (room.lowerCeiling && room.newCeilingHeight && room.type === "Baño") {
      return total + (room.area || 0)
    }
    return 0
  }, 0)

  const falseCeilingPlasterboardsNeeded = Math.ceil(falseCeilingArea / 2.88)

  // Cálculos de materiales
  // Ladrillos: 31 unidades por m² (actualizado a 24x12cm + 1cm de masa mortero) + 5% excedente
  const bricksNeeded = Math.ceil(brickPartitionsArea * 31 * 1.05)

  // Placas de yeso: 1.20m × 2.40m = 2.88 m² por placa
  // Se multiplica por 2 porque se necesitan placas en ambas caras del tabique
  const plasterboardsNeeded = Math.ceil((plasterboardPartitionsArea * 2) / 2.88)

  const totalPlasterboards = plasterboardsNeeded + liningPlasterboardsNeeded + falseCeilingPlasterboardsNeeded
  const totalPlasterboardsWithSurplus = Math.ceil(totalPlasterboards * 1.05)
  const bathroomFalseCeilingPlasterboards = Math.ceil(bathroomFalseCeilingArea / 2.88)

  const handleLinearMetersChange = (id: string, value: string, isPartition: boolean) => {
    const sanitized = sanitizeDecimalInput(value)
    setLinearMetersInputs((prev) => ({ ...prev, [id]: sanitized }))
  }

  const handleLinearMetersBlur = (id: string, isPartition: boolean) => {
    const value = linearMetersInputs[id] || "0"
    const parsed = parseDecimalInput(value)
    const formatted = formatDecimalInput(parsed)

    setLinearMetersInputs((prev) => ({ ...prev, [id]: formatted }))

    if (isPartition) {
      updatePartition(id, { linearMeters: parsed })
    } else {
      updateWallLining(id, { linearMeters: parsed })
    }
  }

  const handleHeightChange = (id: string, value: string, isPartition: boolean) => {
    const sanitized = sanitizeDecimalInput(value)
    setHeightInputs((prev) => ({ ...prev, [id]: sanitized }))
  }

  const handleHeightBlur = (id: string, isPartition: boolean) => {
    const value = heightInputs[id] || "0"
    const parsed = parseDecimalInput(value)
    const formatted = formatDecimalInput(parsed)

    setHeightInputs((prev) => ({ ...prev, [id]: formatted }))

    if (isPartition) {
      updatePartition(id, { height: parsed })
    } else {
      updateWallLining(id, { height: parsed })
    }
  }

  return (
    <div className="space-y-6">
      {/* Sección de Tabiques */}
      <div className="space-y-3">
        <div className="flex flex-col items-center gap-3">
          <h3 className="text-base font-semibold self-start">Tabiques a Formar</h3>

          {partitions.length === 0 ? (
            <div className="w-full rounded-lg border border-dashed border-muted-foreground/25 p-8 flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-muted-foreground">No hay tabiques añadidos</p>
              <Button variant="outline" size="sm" onClick={addPartition} className="gap-2 bg-transparent">
                <PlusCircle className="h-4 w-4" />
                Añadir
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2 w-full">
                {partitions.map((partition) => (
                  <div key={partition.id} className="rounded-lg border bg-card p-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-3">
                        <Label className="text-xs text-muted-foreground">Tipo</Label>
                        <Select
                          value={partition.type}
                          onValueChange={(value: "ladrillo" | "placa_yeso") =>
                            updatePartition(partition.id, { type: value })
                          }
                        >
                          <SelectTrigger className="h-9 mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ladrillo">Ladrillo</SelectItem>
                            <SelectItem value="placa_yeso">Placa de yeso laminado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-3">
                        <Label className="text-xs text-muted-foreground">Metros lineales</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={linearMetersInputs[partition.id] || ""}
                          onChange={(e) => handleLinearMetersChange(partition.id, e.target.value, true)}
                          onBlur={() => handleLinearMetersBlur(partition.id, true)}
                          placeholder="0,00"
                          className="h-9 mt-1"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <Label className="text-xs text-muted-foreground">Altura (m)</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={heightInputs[partition.id] || ""}
                          onChange={(e) => handleHeightChange(partition.id, e.target.value, true)}
                          onBlur={() => handleHeightBlur(partition.id, true)}
                          placeholder="0,00"
                          className="h-9 mt-1"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">Área</Label>
                        <div className="h-9 mt-1 flex items-center text-sm font-semibold">
                          {formatDecimalInput(partition.linearMeters * partition.height)} m²
                        </div>
                      </div>
                      <div className="sm:col-span-1 flex items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePartition(partition.id)}
                          className="h-9 w-full sm:w-9 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {partitions.length > 0 && (
                  <div className="flex justify-between items-center pt-2 px-1 text-sm">
                    <span className="font-medium">Total:</span>
                    <span className="font-semibold">{formatDecimalInput(totalPartitionArea)} m²</span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={addPartition}
                disabled={!canAddPartition}
                className="gap-2 bg-transparent"
                title={!canAddPartition ? "Completa el tabique anterior antes de añadir uno nuevo" : ""}
              >
                <PlusCircle className="h-4 w-4" />
                Añadir otro
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Sección de Trasdosados */}
      <div className="space-y-3">
        <div className="flex flex-col items-center gap-3">
          <h3 className="text-base font-semibold self-start">Trasdosados</h3>

          {wallLinings.length === 0 ? (
            <div className="w-full rounded-lg border border-dashed border-muted-foreground/25 p-8 flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-muted-foreground">No hay trasdosados añadidos</p>
              <Button variant="outline" size="sm" onClick={addWallLining} className="gap-2 bg-transparent">
                <PlusCircle className="h-4 w-4" />
                Añadir
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2 w-full">
                {wallLinings.map((lining) => (
                  <div key={lining.id} className="rounded-lg border bg-card p-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-4">
                        <Label className="text-xs text-muted-foreground">Metros lineales</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={linearMetersInputs[lining.id] || ""}
                          onChange={(e) => handleLinearMetersChange(lining.id, e.target.value, false)}
                          onBlur={() => handleLinearMetersBlur(lining.id, false)}
                          placeholder="0,00"
                          className="h-9 mt-1"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <Label className="text-xs text-muted-foreground">Altura (m)</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={heightInputs[lining.id] || ""}
                          onChange={(e) => handleHeightChange(lining.id, e.target.value, false)}
                          onBlur={() => handleHeightBlur(lining.id, false)}
                          placeholder="0,00"
                          className="h-9 mt-1"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <Label className="text-xs text-muted-foreground">Área</Label>
                        <div className="h-9 mt-1 flex items-center text-sm font-semibold">
                          {formatDecimalInput(lining.linearMeters * lining.height)} m²
                        </div>
                      </div>
                      <div className="sm:col-span-1 flex items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWallLining(lining.id)}
                          className="h-9 w-full sm:w-9 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {wallLinings.length > 0 && (
                  <div className="flex justify-between items-center pt-2 px-1 text-sm">
                    <span className="font-medium">Total:</span>
                    <span className="font-semibold">{formatDecimalInput(totalWallLiningArea)} m²</span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={addWallLining}
                disabled={!canAddWallLining}
                className="gap-2 bg-transparent"
                title={!canAddWallLining ? "Completa el trasdosado anterior antes de añadir uno nuevo" : ""}
              >
                <PlusCircle className="h-4 w-4" />
                Añadir otro
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Resumen de Materiales */}
      {(partitions.length > 0 || wallLinings.length > 0 || falseCeilingArea > 0) && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-900 dark:text-blue-100">Resumen de Materiales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumen de tabiques */}
            {partitions.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-blue-800 dark:text-blue-200">Tabiques</div>

                {brickPartitionsArea > 0 && (
                  <div className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Tabiques de ladrillo:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatDecimalInput(brickPartitionsArea)} m²
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t pt-2">
                      <span className="text-gray-600 dark:text-gray-400">Ladrillos necesarios:</span>
                      <span className="font-bold text-blue-700 dark:text-blue-300">
                        {bricksNeeded.toLocaleString()} uds
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                      * Cálculo basado en 31 ladrillos por m² (24x12cm + 1cm mortero) + 5% excedente
                    </div>
                  </div>
                )}

                {plasterboardPartitionsArea > 0 && (
                  <div className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Tabiques de Placa de yeso laminado:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatDecimalInput(plasterboardPartitionsArea)} m²
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t pt-2">
                      <span className="text-gray-600 dark:text-gray-400">Placas de yeso necesarias:</span>
                      <span className="font-bold text-blue-700 dark:text-blue-300">
                        {plasterboardsNeeded.toLocaleString()} uds
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                      * Placas de 1.20m × 2.40m (ambas caras)
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Resumen de trasdosados */}
            {wallLinings.length > 0 && totalWallLiningArea > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-blue-800 dark:text-blue-200 border-t pt-3">Trasdosados</div>
                <div className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 dark:text-gray-300">Superficie total:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDecimalInput(totalWallLiningArea)} m²
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t pt-2">
                    <span className="text-gray-600 dark:text-gray-400">Placas de yeso necesarias:</span>
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      {liningPlasterboardsNeeded.toLocaleString()} uds
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                    * Placas de 1.20m × 2.40m (una cara)
                  </div>
                </div>
              </div>
            )}

            {/* Resumen de falso techo */}
            {falseCeilingArea > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-blue-800 dark:text-blue-200 border-t pt-3">Falso Techo</div>
                <div className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-700 dark:text-gray-300">Superficie total:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDecimalInput(falseCeilingArea)} m²
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t pt-2">
                    <span className="text-gray-600 dark:text-gray-400">Placas de yeso necesarias:</span>
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      {falseCeilingPlasterboardsNeeded.toLocaleString()} uds
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                    * Placas de 1.20m × 2.40m (una cara)
                  </div>
                  {bathroomFalseCeilingArea > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-700 dark:text-gray-300">Falso techo en baños:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatDecimalInput(bathroomFalseCeilingArea)} m²
                        </span>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-2">
                        <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                          💡 Recomendado: {bathroomFalseCeilingPlasterboards} placas hidrófugas
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                          Para zonas húmedas se recomienda usar placas de yeso hidrófugas (resistentes a la humedad)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(plasterboardsNeeded > 0 || liningPlasterboardsNeeded > 0 || falseCeilingPlasterboardsNeeded > 0) && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-4 mt-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-green-900 dark:text-green-100">Total Placas de Yeso</div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Placas necesarias (sin excedente):</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {totalPlasterboards.toLocaleString()} uds
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-green-200 dark:border-green-800">
                    <span className="text-base font-semibold text-green-900 dark:text-green-100">
                      Total con 5% excedente:
                    </span>
                    <span className="text-lg font-bold text-green-700 dark:text-green-300">
                      {totalPlasterboardsWithSurplus.toLocaleString()} uds
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 italic mt-2">
                    * Incluye tabiques de placa de yeso ({plasterboardsNeeded} uds), trasdosados (
                    {liningPlasterboardsNeeded} uds) y falso techo ({falseCeilingPlasterboardsNeeded} uds)
                  </div>
                  {bathroomFalseCeilingPlasterboards > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                          💧 Recomendación para zonas húmedas
                        </p>
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          Del total de{" "}
                          <span className="font-bold">{totalPlasterboardsWithSurplus.toLocaleString()} placas</span>, se
                          recomienda que{" "}
                          <span className="font-bold">{bathroomFalseCeilingPlasterboards} sean hidrófugas</span> para
                          zonas húmedas como baños.
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 italic">
                          Las placas hidrófugas son resistentes a la humedad y previenen el deterioro en ambientes con
                          alta exposición al agua.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
