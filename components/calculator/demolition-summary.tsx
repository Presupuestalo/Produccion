"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DemolitionSummary as DemolitionSummaryType, DebrisCalculation } from "@/types/calculator"
import { useRouter } from "next/navigation"
import type { GlobalConfig, Room } from "@/types"
import type { DemolitionSettings as DemolitionSettingsType } from "@/types/calculator"
import { getProjectDemolitionSettings } from "@/lib/services/demolition-service"
import { formatNumber } from "@/lib/utils/format"

// Interfaz para los derribos de tabiques
interface WallDemolition {
  id: string
  area: number
  thickness: number
}

// Interfaz para los derribos agrupados por grosor
interface GroupedWallDemolition {
  thickness: number
  totalArea: number
}

interface DemolitionSummaryProps {
  summary: DemolitionSummaryType
  debrisCalculation: DebrisCalculation
  projectId?: string
  globalConfig: GlobalConfig
  demolitionSettings: DemolitionSettingsType
  rooms: Room[] // Valor por defecto: array vacío
}

export function DemolitionSummary({
  summary,
  debrisCalculation,
  projectId,
  globalConfig,
  demolitionSettings,
  rooms = [], // Valor por defecto: array vacío
}: DemolitionSummaryProps) {
  const router = useRouter()
  const [verifiedContainerSize, setVerifiedContainerSize] = useState<number>(5) // Valor por defecto
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [wallDemolitions, setWallDemolitions] = useState<WallDemolition[]>([])
  const [groupedWallDemolitions, setGroupedWallDemolitions] = useState<GroupedWallDemolition[]>([])
  const [wallDebrisVolume, setWallDebrisVolume] = useState<number>(0)
  const [ceilingDebrisVolume, setCeilingDebrisVolume] = useState<number>(0)
  const [ceilingArea, setCeilingArea] = useState<number>(0)
  const [ceilingThickness, setCeilingThickness] = useState<number>(0.015)
  const [ceilingExpansionCoef, setCeilingExpansionCoef] = useState<number>(1.4)
  const [totalDebris, setTotalDebris] = useState<number>(0)
  const [containersNeeded, setContainersNeeded] = useState<number>(0)
  const [falseCeilingArea, setFalseCeilingArea] = useState<number>(0)
  const [woodenFloorArea, setWoodenFloorArea] = useState<number>(0)
  const [skirtingWoodenFloor, setSkirtingWoodenFloor] = useState<number>(0)
  const [totalSlidingBoxes, setTotalSlidingBoxes] = useState<number>(0)
  const [approximateBags, setApproximateBags] = useState<number>(0)
  const [radiatorsDebrisVolume, setRadiatorsDebrisVolume] = useState<number>(0) // Added radiator debris volume calculation

  const radiatorsToRemove = rooms.reduce((total, room) => {
    if (room.hasRadiator) {
      return total + 1
    }
    return total
  }, 0)

  // Cargar directamente los ajustes de demolición desde la base de datos si hay un projectId
  useEffect(() => {
    if (projectId) {
      setIsLoading(true)
      getProjectDemolitionSettings(projectId)
        .then((settings) => {
          console.log("[v0] Loaded demolition settings:", settings)

          if (settings && settings.containerSize) {
            const size =
              typeof settings.containerSize === "string" ? Number(settings.containerSize) : settings.containerSize

            console.log("[v0] Setting container size to:", size)
            setVerifiedContainerSize(size)
          } else {
            console.log("[v0] No container size found in settings, using default 5")
            setVerifiedContainerSize(5)
          }

          if (settings && settings.ceilingThickness) {
            const thickness =
              typeof settings.ceilingThickness === "string"
                ? Number.parseFloat(settings.ceilingThickness.replace(",", "."))
                : settings.ceilingThickness
            setCeilingThickness(thickness)
          }

          if (settings && settings.ceilingExpansionCoef) {
            const coef =
              typeof settings.ceilingExpansionCoef === "string"
                ? Number.parseFloat(settings.ceilingExpansionCoef.replace(",", "."))
                : settings.ceilingExpansionCoef
            setCeilingExpansionCoef(coef)
          }
        })
        .catch((error) => {
          console.error("Error al cargar ajustes de demolición:", error)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [projectId])

  // Calcular el área total de falsos techos a retirar con currentCeilingStatus
  useEffect(() => {
    if (rooms && rooms.length > 0 && summary) {
      const totalFalseCeilingArea = rooms.reduce((total, room) => {
        if (room.removeFalseCeiling === true || room.currentCeilingStatus === "lowered_remove") {
          return total + (room.area || 0)
        }
        return total
      }, 0)

      setFalseCeilingArea(totalFalseCeilingArea)
      summary.ceilingDemolition = totalFalseCeilingArea
    }
  }, [rooms, summary])

  // Actualizar los derribos de tabiques cuando cambia globalConfig
  useEffect(() => {
    if (globalConfig?.wallDemolitions && globalConfig.wallDemolitions.length > 0) {
      setWallDemolitions(globalConfig.wallDemolitions)
    } else if (globalConfig?.wallDemolitionArea !== undefined) {
      setWallDemolitions([
        {
          id: "default",
          area: globalConfig.wallDemolitionArea,
          thickness: globalConfig.wallThickness || 10,
        },
      ])
    }

    setCeilingArea(falseCeilingArea)
  }, [globalConfig?.wallDemolitions, globalConfig?.wallDemolitionArea, globalConfig?.wallThickness, falseCeilingArea])

  // Calcular área de suelo de madera a levantar - USAR DIRECTAMENTE EL VALOR DEL SUMMARY
  useEffect(() => {
    setWoodenFloorArea(summary?.woodenFloorRemoval || 0)
  }, [summary?.woodenFloorRemoval])

  // Calcular rodapié de suelo de madera (perímetro de habitaciones con suelo de madera que se levanta)
  useEffect(() => {
    const totalSkirtingWoodenFloor = rooms.reduce((total, room) => {
      if (room.floorMaterial === "Madera" && room.removeFloor === true) {
        return total + (room.perimeter || 0)
      }
      return total
    }, 0)

    setSkirtingWoodenFloor(totalSkirtingWoodenFloor)
  }, [rooms])

  // Agrupar los derribos de tabiques por grosor
  useEffect(() => {
    const thicknessMap = new Map<number, number>()

    wallDemolitions.forEach((demolition) => {
      const currentArea = thicknessMap.get(demolition.thickness) || 0
      thicknessMap.set(demolition.thickness, currentArea + demolition.area)
    })

    const grouped: GroupedWallDemolition[] = Array.from(thicknessMap.entries()).map(([thickness, totalArea]) => ({
      thickness,
      totalArea,
    }))

    setGroupedWallDemolitions(grouped)
  }, [wallDemolitions])

  const livingRoomFurnitureCount = rooms.reduce((total, room) => {
    if (room.removeLivingRoomFurniture) {
      return total + 1
    }
    return total
  }, 0)

  // Calcular volumen de escombros y contenedores cuando cambian los datos relevantes
  useEffect(() => {
    const newWallDebrisVolume = wallDemolitions.reduce((total, demolition) => {
      const thicknessInMeters = demolition.thickness / 100
      const expansionCoef = demolitionSettings.wallExpansionCoef || 1.3
      return total + demolition.area * thicknessInMeters * expansionCoef
    }, 0)

    setWallDebrisVolume(newWallDebrisVolume)

    const ceilingThicknessValue = demolitionSettings.ceilingThickness || 0.015
    const ceilingExpansionCoefValue = demolitionSettings.ceilingExpansionCoef || 1.4
    const newCeilingDebrisVolume = falseCeilingArea * ceilingThicknessValue * ceilingExpansionCoefValue

    setCeilingDebrisVolume(newCeilingDebrisVolume)
    setCeilingArea(falseCeilingArea)
    setCeilingThickness(ceilingThicknessValue)
    setCeilingExpansionCoef(ceilingExpansionCoefValue)

    const doorsVolume = rooms.reduce((total, room) => {
      if (room.hasDoors && room.doorList && room.doorList.length > 0) {
        room.doorList.forEach((door) => {
          total += 1 * 0.06
        })
      }
      return total
    }, 0)

    const kitchenFurnitureVolume = (summary?.kitchenFurnitureRemoval || 0) * 3.5
    const bedroomFurnitureVolume = (summary?.bedroomFurnitureRemoval || 0) * 2.0
    const bathroomElementsVolume = (summary?.bathroomElementsRemoval || 0) * 1.5
    const livingRoomFurnitureVolume = livingRoomFurnitureCount * 2.0

    const newRadiatorsDebrisVolume = radiatorsToRemove * 0.08 // 0.08 m³ per radiator (6-10 elements)
    setRadiatorsDebrisVolume(newRadiatorsDebrisVolume)

    const debrisVolume =
      newWallDebrisVolume +
      (debrisCalculation.floorTileDebris || 0) +
      (debrisCalculation.wallTileDebris || 0) +
      (debrisCalculation.mortarBaseDebris || 0) +
      newCeilingDebrisVolume +
      bathroomElementsVolume +
      newRadiatorsDebrisVolume

    const woodDebrisVolume =
      (debrisCalculation.woodenFloorDebris || 0) +
      doorsVolume +
      kitchenFurnitureVolume +
      bedroomFurnitureVolume +
      livingRoomFurnitureVolume

    const newTotalDebris = debrisVolume + woodDebrisVolume

    setTotalDebris(newTotalDebris)

    const containerSizeValue = demolitionSettings.containerSize || verifiedContainerSize || 5
    const newContainersNeeded = Math.ceil(newTotalDebris / containerSizeValue)

    console.log(
      "[v0] Container calculation - Total debris:",
      newTotalDebris,
      "Container size:",
      containerSizeValue,
      "Containers needed:",
      newContainersNeeded,
      "Using setting from props:", demolitionSettings.containerSize !== undefined
    )

    setContainersNeeded(newContainersNeeded)

    const bagVolume = 0.05
    const newApproximateBags = Math.ceil(debrisVolume / bagVolume)

    setApproximateBags(newApproximateBags)
  }, [
    wallDemolitions,
    demolitionSettings.wallExpansionCoef,
    demolitionSettings.ceilingThickness,
    demolitionSettings.ceilingExpansionCoef,
    debrisCalculation.floorTileDebris,
    debrisCalculation.wallTileDebris,
    debrisCalculation.woodenFloorDebris,
    debrisCalculation.mortarBaseDebris,
    demolitionSettings.containerSize,
    falseCeilingArea,
    rooms,
    summary?.kitchenFurnitureRemoval,
    summary?.bedroomFurnitureRemoval,
    summary?.bathroomElementsRemoval,
    livingRoomFurnitureCount,
    radiatorsToRemove,
  ])

  if (!summary) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Resumen Derribos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">No hay datos de resumen disponibles</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const adjustedWallTileRemoval = (summary?.wallTileRemoval || 0) + (globalConfig?.tiledWallSurfaceArea || 0)

  const doorCalculation = rooms.reduce(
    (totals, room) => {
      if (room.hasDoors && room.doorList && room.doorList.length > 0) {
        room.doorList.forEach((door) => {
          if (door.type === "Corredera empotrada") {
            totals.totalDoors += 1
            totals.slidingBoxes += 1
          } else {
            totals.totalDoors += 1
          }
        })
      }
      return totals
    },
    { totalDoors: 0, slidingBoxes: 0 },
  )

  const totalDoorsFromRooms = doorCalculation.totalDoors
  const totalSlidingBoxesFromRooms = doorCalculation.slidingBoxes

  const getHeatingRemovalItem = () => {
    // This allows the item to show when the checkbox is checked regardless of heating type
    if (globalConfig?.changeBoiler === true) {
      return { type: "caldera", label: "Retirar caldera", quantity: 1, unit: "ud" }
    }

    if (globalConfig?.removeWaterHeater === true) {
      return { type: "termo", label: "Retirar termo", quantity: 1, unit: "ud" }
    }

    return null
  }

  const heatingRemovalItem = getHeatingRemovalItem()

  const goToProjectDemolitionSettings = () => {
    if (projectId) {
      router.push(`/dashboard/projects/${projectId}/edit?tab=demolition&highlight=containerSize`)
    }
  }

  const manualDebrisHours = totalDebris * 0.5

  const totalSkirting = rooms.reduce((total, room) => {
    return total + (room.perimeter || 0)
  }, 0)

  const totalMoldings = rooms.reduce((total, room) => {
    if (room.moldings) {
      return total + (room.perimeter || 0)
    }
    return total
  }, 0)

  const totalSewagePipes = rooms.reduce((total, room) => {
    if (room.removeSewagePipes) {
      return total + 1
    }
    return total
  }, 0)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 flex flex-row justify-between items-center">
          <CardTitle className="text-md">Resumen Derribos</CardTitle>
          {projectId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-orange-50 transition-colors"
              onClick={goToProjectDemolitionSettings}
              title="Ajustes de cálculo de escombros"
            >
              <Settings2 className="h-4 w-4 text-orange-500 hover:text-orange-600 hover:scale-110 hover:rotate-90 transition-all duration-300" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            {groupedWallDemolitions.length > 0
              ? groupedWallDemolitions
                .filter((group) => group.totalArea > 0)
                .map((group, index) => (
                  <div
                    key={`group-${group.thickness}-${index}`}
                    className="grid grid-cols-[1fr_auto_auto] gap-2 items-start py-1 border-b border-orange-100 last:border-0"
                  >
                    <div className="min-w-0 break-words leading-tight">Demolición tabiquería ({group.thickness} cm)</div>
                    <div className="text-muted-foreground text-right shrink-0">m²</div>
                    <div className="font-medium text-right w-16 shrink-0">{formatNumber(group.totalArea)}</div>
                  </div>
                ))
              : (summary?.wallDemolition || 0) > 0 && (
                <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                  <div>Demolición tabiquería:</div>
                  <div className="text-muted-foreground text-right">m²</div>
                  <div className="font-medium text-right w-20">{formatNumber(summary?.wallDemolition || 0)}</div>
                </div>
              )}

            {(summary?.floorTileRemoval || 0) > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-start py-1 border-b border-orange-100 last:border-0">
                <div className="min-w-0 break-words leading-tight">Picado de pavimento cerámico</div>
                <div className="text-muted-foreground text-right shrink-0">m²</div>
                <div className="font-medium text-right w-16 shrink-0">{formatNumber(summary?.floorTileRemoval || 0)}</div>
              </div>
            )}

            {(summary?.mortarBaseRemoval || 0) > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div>Picado de solera base mortero:</div>
                <div className="text-muted-foreground text-right">m²</div>
                <div className="font-medium text-right w-20">{formatNumber(summary?.mortarBaseRemoval || 0)}</div>
              </div>
            )}

            {adjustedWallTileRemoval > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div>Picado de cerámica vertical (paredes):</div>
                <div className="text-muted-foreground text-right">m²</div>
                <div className="font-medium text-right w-20">{formatNumber(adjustedWallTileRemoval)}</div>
              </div>
            )}

            {falseCeilingArea > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div>Retirada de falso techo:</div>
                <div className="text-muted-foreground text-right">m²</div>
                <div className="font-medium text-right w-20">{formatNumber(falseCeilingArea)}</div>
              </div>
            )}

            {totalDoorsFromRooms > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div>Retirada de puertas y marcos:</div>
                <div className="text-muted-foreground text-right">ud</div>
                <div className="font-medium text-right w-20">{totalDoorsFromRooms}</div>
              </div>
            )}

            {totalSlidingBoxesFromRooms > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div>Armazón/Casoneto puerta corredera:</div>
                <div className="text-muted-foreground text-right">ud</div>
                <div className="font-medium text-right w-20">{totalSlidingBoxesFromRooms}</div>
              </div>
            )}

            {(summary?.woodenFloorRemoval || 0) > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div>Levantado de suelo de madera:</div>
                <div className="text-muted-foreground text-right">m²</div>
                <div className="font-medium text-right w-20">{formatNumber(summary?.woodenFloorRemoval || 0)}</div>
              </div>
            )}

            {skirtingWoodenFloor > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-start py-1 border-b border-orange-100 last:border-0">
                <div className="min-w-0 break-words leading-tight">Retirada de rodapié suelo madera</div>
                <div className="text-muted-foreground text-right shrink-0">ml</div>
                <div className="font-medium text-right w-16 shrink-0">{formatNumber(skirtingWoodenFloor)}</div>
              </div>
            )}

            {(summary?.bathroomElementsRemoval || 0) > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div>Retirada de sanitarios:</div>
                <div className="text-muted-foreground text-right">ud</div>
                <div className="font-medium text-right w-20">{summary?.bathroomElementsRemoval || 0}</div>
              </div>
            )}

            {(summary?.goteleRemoval || 0) > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div>Retirada de gotelé:</div>
                <div className="text-muted-foreground text-right">m²</div>
                <div className="font-medium text-right w-20">{formatNumber(summary?.goteleRemoval || 0)}</div>
              </div>
            )}

            {(summary?.wallpaperRemoval || 0) > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div>Retirada de papel:</div>
                <div className="text-muted-foreground text-right">m²</div>
                <div className="font-medium text-right w-20">{formatNumber(summary?.wallpaperRemoval || 0)}</div>
              </div>
            )}

            {radiatorsToRemove > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div>Retirada de radiadores:</div>
                <div className="text-muted-foreground text-right">ud</div>
                <div className="font-medium text-right w-20">{radiatorsToRemove}</div>
              </div>
            )}

            {heatingRemovalItem && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div>{heatingRemovalItem.label}:</div>
                <div className="text-muted-foreground text-right">{heatingRemovalItem.unit}</div>
                <div className="font-medium text-right w-20">{heatingRemovalItem.quantity}</div>
              </div>
            )}

            {totalMoldings > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div>Retirada de molduras:</div>
                <div className="text-muted-foreground text-right">ml</div>
                <div className="font-medium text-right w-20">{formatNumber(totalMoldings)}</div>
              </div>
            )}

            {totalSewagePipes > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div>Retirada de bajantes fecales:</div>
                <div className="text-muted-foreground text-right">ud</div>
                <div className="font-medium text-right w-20">{totalSewagePipes}</div>
              </div>
            )}

            {manualDebrisHours > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div>Bajada manual de escombros:</div>
                <div className="text-muted-foreground text-right">h</div>
                <div className="font-medium text-right w-20">{formatNumber(manualDebrisHours)}</div>
              </div>
            )}

            {(summary?.kitchenFurnitureRemoval || 0) > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div>Retirada mobiliario cocina:</div>
                <div className="text-muted-foreground text-right">ud</div>
                <div className="font-medium text-right w-20">{summary?.kitchenFurnitureRemoval || 0}</div>
              </div>
            )}

            {(summary?.bedroomFurnitureRemoval || 0) > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div>Retirada mobiliario dormitorio:</div>
                <div className="text-muted-foreground text-right">ud</div>
                <div className="font-medium text-right w-20">{summary?.bedroomFurnitureRemoval || 0}</div>
              </div>
            )}

            {livingRoomFurnitureCount > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <div>Retirada mobiliario salón:</div>
                <div className="text-muted-foreground text-right">ud</div>
                <div className="font-medium text-right w-20">{livingRoomFurnitureCount}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Cálculo de Escombros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            {groupedWallDemolitions.map((group, index) => {
              const volume = group.totalArea * (group.thickness / 100) * (demolitionSettings.wallExpansionCoef || 1.3)
              return (
                volume > 0 && (
                  <div key={`vol-${group.thickness}-${index}`} className="flex items-center justify-between gap-2">
                    <div className="flex-1">Escombros tabiques ({group.thickness} cm):</div>
                    <div className="text-right font-medium">{formatNumber(volume)} m³</div>
                  </div>
                )
              )
            })}

            {(debrisCalculation.floorTileDebris || 0) + (debrisCalculation.wallTileDebris || 0) > 0 && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">Escombros cerámica:</div>
                <div className="text-right font-medium">
                  {formatNumber((debrisCalculation.floorTileDebris || 0) + (debrisCalculation.wallTileDebris || 0))} m³
                </div>
              </div>
            )}

            {(debrisCalculation.mortarBaseDebris || 0) > 0 && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">Escombros solera mortero:</div>
                <div className="text-right font-medium">{formatNumber(debrisCalculation.mortarBaseDebris || 0)} m³</div>
              </div>
            )}

            {(summary?.bathroomElementsRemoval || 0) > 0 && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">Escombros elementos baño:</div>
                <div className="text-right font-medium">
                  {formatNumber((summary?.bathroomElementsRemoval || 0) * 1.5)} m³
                </div>
              </div>
            )}

            {ceilingDebrisVolume > 0 && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">Escombros falso techo:</div>
                <div className="text-right font-medium">{formatNumber(ceilingDebrisVolume)} m³</div>
              </div>
            )}

            {radiatorsToRemove > 0 && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">Escombros radiadores:</div>
                <div className="text-right font-medium">{formatNumber(radiatorsDebrisVolume)} m³</div>
              </div>
            )}

            <div className="font-semibold pt-2">Total escombros:</div>
            <div className="text-right font-semibold pt-2">{formatNumber(totalDebris)} m³</div>
            <div className="text-sm text-muted-foreground">Sacos aproximados (25kg):</div>
            <div className="text-right text-sm text-muted-foreground">{Math.ceil(totalDebris / 0.05)} sacos</div>
          </div>
        </CardContent>
      </Card>

      {((debrisCalculation.woodenFloorDebris || 0) > 0 ||
        skirtingWoodenFloor > 0 ||
        totalDoorsFromRooms > 0 ||
        (summary?.kitchenFurnitureRemoval || 0) > 0 ||
        (summary?.bedroomFurnitureRemoval || 0) > 0 ||
        livingRoomFurnitureCount > 0) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Deshechos de Madera</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {(debrisCalculation.woodenFloorDebris || 0) > 0 && (
                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                    <div>Residuos suelo madera:</div>
                    <div className="text-right font-medium">
                      {formatNumber(debrisCalculation.woodenFloorDebris || 0)} m³
                    </div>
                  </div>
                )}

                {skirtingWoodenFloor > 0 && (
                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                    <div>Residuos rodapié madera:</div>
                    <div className="text-right font-medium">
                      {(
                        skirtingWoodenFloor *
                        (demolitionSettings.woodenFloorThickness || 0.02) *
                        0.1 *
                        (demolitionSettings.woodenFloorExpansionCoef || 1.4)
                      ).toFixed(2)}{" "}
                      m³
                    </div>
                  </div>
                )}

                {totalDoorsFromRooms > 0 && (
                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                    <div>Residuos puertas:</div>
                    <div className="text-right font-medium">{formatNumber(totalDoorsFromRooms * 0.06)} m³</div>
                  </div>
                )}

                {(summary?.kitchenFurnitureRemoval || 0) > 0 && (
                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                    <div>Residuos muebles cocina:</div>
                    <div className="text-right font-medium">
                      {formatNumber((summary?.kitchenFurnitureRemoval || 0) * 3.5)} m³
                    </div>
                  </div>
                )}

                {(summary?.bedroomFurnitureRemoval || 0) > 0 && (
                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                    <div>Residuos muebles dormitorio:</div>
                    <div className="text-right font-medium">
                      {formatNumber((summary?.bedroomFurnitureRemoval || 0) * 2.0)} m³
                    </div>
                  </div>
                )}

                {livingRoomFurnitureCount > 0 && (
                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                    <div>Residuos muebles salón:</div>
                    <div className="text-right font-medium">{formatNumber(livingRoomFurnitureCount * 2.0)} m³</div>
                  </div>
                )}

                <div className="font-semibold pt-2">Total deshechos madera:</div>
                <div className="text-right font-semibold pt-2">
                  {formatNumber(
                    (debrisCalculation.woodenFloorDebris || 0) +
                    skirtingWoodenFloor *
                    (demolitionSettings.woodenFloorThickness || 0.02) *
                    0.1 *
                    (demolitionSettings.woodenFloorExpansionCoef || 1.4) +
                    totalDoorsFromRooms * 0.06 +
                    (summary?.kitchenFurnitureRemoval || 0) * 3.5 +
                    (summary?.bedroomFurnitureRemoval || 0) * 2.0 +
                    livingRoomFurnitureCount * 2.0
                  )}{" "}
                  m³
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Totales Combinados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <div className="font-semibold">Total escombros:</div>
            <div className="text-right font-semibold">
              {formatNumber(
                wallDebrisVolume +
                (debrisCalculation.floorTileDebris || 0) +
                (debrisCalculation.wallTileDebris || 0) +
                (debrisCalculation.mortarBaseDebris || 0) +
                ceilingDebrisVolume +
                (summary?.bathroomElementsRemoval || 0) * 1.5
              )}{" "}
              m³
            </div>

            <div className="font-semibold">Total deshechos madera:</div>
            <div className="text-right font-semibold">
              {formatNumber(
                (debrisCalculation.woodenFloorDebris || 0) +
                skirtingWoodenFloor *
                (demolitionSettings.woodenFloorThickness || 0.02) *
                0.1 *
                (demolitionSettings.woodenFloorExpansionCoef || 1.4) +
                totalDoorsFromRooms * 0.06 +
                (summary?.kitchenFurnitureRemoval || 0) * 3.5 +
                (summary?.bedroomFurnitureRemoval || 0) * 2.0 +
                livingRoomFurnitureCount * 2.0
              )}{" "}
              m³
            </div>

            <div className="font-bold text-lg pt-2">Total mixto:</div>
            <div className="text-right font-bold text-lg pt-2">{formatNumber(totalDebris)} m³</div>

            <div className="font-bold text-lg">Contenedores necesarios:</div>
            <div className="text-right font-bold text-lg">
              {containersNeeded} ({demolitionSettings.containerSize || verifiedContainerSize || 5} m³)
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-6 w-6 p-0 hover:bg-orange-50 transition-colors"
                onClick={goToProjectDemolitionSettings}
                title="Modificar tamaño de contenedor"
              >
                <Settings2 className="h-3 w-3 text-orange-500 hover:text-orange-600 hover:scale-110 hover:rotate-90 transition-all duration-300" />
              </Button>
            </div>

            <div className="font-semibold pt-2 text-blue-600">Tiempo estimado bajada:</div>
            <div className="text-right font-semibold pt-2 text-blue-600">
              {(() => {
                // Base: 1 m³ = 1 hour per worker (using total mixed debris)
                let baseHours = totalDebris * 1.0

                // Add 0.20h per floor if no elevator (using project data, not global config)
                if (summary?.hasElevator === false && summary?.buildingHeight) {
                  const floors = Math.max(0, summary.buildingHeight - 1) // Ground floor = 0 additional
                  const additionalHours = totalDebris * floors * 0.2
                  baseHours += additionalHours
                }

                return formatNumber(baseHours, 1)
              })()} h
            </div>

            {summary?.hasElevator === false && summary?.buildingHeight && summary.buildingHeight > 1 && (
              <div className="col-span-2 text-xs text-amber-600 mt-1">
                * Se añaden 0,20h por piso adicional sin ascensor
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {(heatingRemovalItem || radiatorsToRemove > 0 || livingRoomFurnitureCount > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Resto de elementos</CardTitle>
            <p className="text-xs text-muted-foreground">Elementos que requieren retirada a punto limpio</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {heatingRemovalItem?.type === "termo" && (
                <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                  <div>Termo eléctrico:</div>
                  <div className="text-right font-medium">0.10 m³</div>
                </div>
              )}

              {heatingRemovalItem?.type === "caldera" && (
                <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                  <div>Caldera:</div>
                  <div className="text-right font-medium">0.10 m³</div>
                </div>
              )}

              {radiatorsToRemove > 0 && (
                <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                  <div>Radiadores ({radiatorsToRemove} ud):</div>
                  <div className="text-right font-medium">{(radiatorsToRemove * 0.05).toFixed(2)} m³</div>
                </div>
              )}

              {livingRoomFurnitureCount > 0 && (
                <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                  <div>Mobiliario salón ({livingRoomFurnitureCount} ud):</div>
                  <div className="text-right font-medium">{(livingRoomFurnitureCount * 2.0).toFixed(2)} m³</div>
                </div>
              )}

              <div className="font-semibold pt-2">Total elementos especiales:</div>
              <div className="text-right font-semibold pt-2">
                {(
                  (heatingRemovalItem?.type === "termo" ? 0.1 : 0) +
                  (heatingRemovalItem?.type === "caldera" ? 0.1 : 0) +
                  radiatorsToRemove * 0.05 +
                  livingRoomFurnitureCount * 2.0 +
                  (heatingRemovalItem ? 0.15 : 0)
                ) // Added heating removal to total
                  .toFixed(2)}{" "}
                m³
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
