"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber } from "@/lib/utils/format"
import type { ElectricalConfig, BathroomElement } from "@/types/calculator"

interface ReformSummaryProps {
  rooms: any[]
  globalConfig: any
  partitions: any[]
  wallLinings: any[]
  country?: string
  electricalConfig?: ElectricalConfig
}

interface SummaryData {
  // ALBAÑILERÍA (incluye mano de obra)
  solera: number
  arlita: number // Arlita para baños/cocinas en estructura madera/mixta
  rastrelado: number // Rastrelado para otras habitaciones en estructura madera/mixta
  lucidoParedes: number
  bajadoTechos: number
  cajonPuertaCorredera: number
  embaldosado: number
  raseo: number
  raseoParedes: number
  alicatadoParedes: number
  fijacionEmisores: number
  falsotecho: number // Nuevo campo para falsotecho

  // FONTANERÍA
  redesAguaBanos: number
  redesAguaCocina: number
  conductoExtraccionBano: number
  conductoExtraccionCocina: number
  instalacionInodoro: number
  instalacionMampara: number
  instalacionPlatoDucha: number
  instalacionBanera: number
  instalacionMuebleLavabo: number
  instalacionBide: number
  instalacionDuchaInodoro: number
  instalacionGrifoDucha: number
  instalacionGrifoLavabo: number
  instalacionFregadero: number
  instalacionLavadora: number
  instalacionLavavajillas: number
  instalacionTermo: number // Añadido para termo eléctrico

  // PINTURA
  pinturaParedes: number
  pinturaTechos: number
  lacarPuertaEntrada: number

  // CARPINTERÍA
  floatingParquet: number
  laminateFloor: number
  vinylFloor: number
  baseAislante: number
  interiorDoors: number
  windows: number
  nivelarTablon: number
  puertasAbatibles: number
  puertasDobleAbatibles: number
  puertasCorrederas: number
  puertasCorrederasExteriores: number
  premarcos: number
  puertaAcorazada: number
  rodapie: number // Añadir rodapié

  // CALEFACCIÓN
  instalacionCaldera: number
  redAlimentacionRadiador: number
  instalacionRadiadores: number
  movimientoRadiadores: number
  sueloRadiante: number

  // TABIQUERÍA
  partitionsArea: number
  wallLiningsArea: number

  // ELECTRICIDAD
  puntoLuz: number
  puntoEnchufe: number
  puntoTelefonoTV: number
  puntoAireAcondicionado: number
  cuadroElectrico: number
  enchufesEmisores: number

  // MATERIALES
  emisoresTermicos: number
}

export function ReformSummary({ rooms, globalConfig, partitions = [], wallLinings = [], electricalConfig }: ReformSummaryProps) {
  const [summary, setSummary] = useState<SummaryData>({
    solera: 0,
    arlita: 0,
    rastrelado: 0,
    lucidoParedes: 0,
    bajadoTechos: 0,
    cajonPuertaCorredera: 0,
    embaldosado: 0,
    raseo: 0,
    raseoParedes: 0,
    alicatadoParedes: 0,
    fijacionEmisores: 0,
    falsotecho: 0,
    redesAguaBanos: 0,
    redesAguaCocina: 0,
    conductoExtraccionBano: 0,
    conductoExtraccionCocina: 0,
    instalacionInodoro: 0,
    instalacionMampara: 0,
    instalacionPlatoDucha: 0,
    instalacionBanera: 0,
    instalacionMuebleLavabo: 0,
    instalacionBide: 0,
    instalacionDuchaInodoro: 0,
    instalacionGrifoDucha: 0,
    instalacionGrifoLavabo: 0,
    instalacionFregadero: 0,
    instalacionLavadora: 0,
    instalacionLavavajillas: 0,
    instalacionTermo: 0, // Añadido para termo eléctrico
    pinturaParedes: 0,
    pinturaTechos: 0,
    lacarPuertaEntrada: 0,
    floatingParquet: 0,
    laminateFloor: 0,
    vinylFloor: 0,
    baseAislante: 0,
    interiorDoors: 0,
    windows: 0,
    nivelarTablon: 0,
    puertasAbatibles: 0,
    puertasDobleAbatibles: 0,
    puertasCorrederas: 0,
    puertasCorrederasExteriores: 0,
    premarcos: 0,
    puertaAcorazada: 0,
    rodapie: 0, // Añadir rodapié
    instalacionCaldera: 0,
    redAlimentacionRadiador: 0,
    instalacionRadiadores: 0,
    movimientoRadiadores: 0,
    sueloRadiante: 0,
    partitionsArea: 0,
    wallLiningsArea: 0,
    puntoLuz: 0,
    puntoEnchufe: 0,
    puntoTelefonoTV: 0,
    puntoAireAcondicionado: 0,
    cuadroElectrico: 0,
    enchufesEmisores: 0,
    emisoresTermicos: 0,
  })

  useEffect(() => {
    if (!rooms || !Array.isArray(rooms)) {
      return
    }

    const normalizeType = (type: string) => {
      if (!type) return ""
      return type
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .trim()
    }

    const isBathroom = (type: string) => {
      const normalized = normalizeType(type)
      return normalized === "bano" || normalized === "aseo" || normalized.includes("bano")
    }

    const isKitchen = (type: string) => {
      const normalized = normalizeType(type)
      return (
        normalized === "cocina" ||
        normalized.includes("cocina") ||
        normalized === "cocina abierta" ||
        normalized === "cocina americana"
      )
    }

    const newSummary: SummaryData = {
      solera: 0,
      arlita: 0,
      rastrelado: 0,
      lucidoParedes: 0,
      bajadoTechos: 0,
      cajonPuertaCorredera: 0,
      embaldosado: 0,
      raseo: 0,
      raseoParedes: 0,
      alicatadoParedes: 0,
      fijacionEmisores: 0,
      falsotecho: 0,
      redesAguaBanos: 0,
      redesAguaCocina: 0,
      conductoExtraccionBano: 0,
      conductoExtraccionCocina: 0,
      instalacionInodoro: 0,
      instalacionMampara: 0,
      instalacionPlatoDucha: 0,
      instalacionBanera: 0,
      instalacionMuebleLavabo: 0,
      instalacionBide: 0,
      instalacionDuchaInodoro: 0,
      instalacionGrifoDucha: 0,
      instalacionGrifoLavabo: 0,
      instalacionFregadero: 0,
      instalacionLavadora: 0,
      instalacionLavavajillas: 0,
      instalacionTermo: 0, // Añadido para termo eléctrico
      pinturaParedes: 0,
      pinturaTechos: 0,
      lacarPuertaEntrada: 0,
      floatingParquet: 0,
      laminateFloor: 0,
      vinylFloor: 0,
      baseAislante: 0,
      interiorDoors: 0,
      windows: 0,
      nivelarTablon: 0,
      puertasAbatibles: 0,
      puertasDobleAbatibles: 0,
      puertasCorrederas: 0,
      puertasCorrederasExteriores: 0,
      premarcos: 0,
      puertaAcorazada: 0,
      rodapie: 0, // Añadir rodapié
      instalacionCaldera: 0,
      redAlimentacionRadiador: 0,
      instalacionRadiadores: 0,
      movimientoRadiadores: 0,
      sueloRadiante: 0,
      partitionsArea: 0,
      wallLiningsArea: 0,
      puntoLuz: 0,
      puntoEnchufe: 0,
      puntoTelefonoTV: 0,
      puntoAireAcondicionado: 0,
      cuadroElectrico: 0,
      enchufesEmisores: 0,
      emisoresTermicos: 0,
    }

    const structureType = globalConfig?.structureType || "Hormigón"
    const standardHeight = globalConfig?.standardHeight || 2.6
    const reformHeatingType = globalConfig?.reformHeatingType || globalConfig?.heatingType || "No"
    const hasBoiler = globalConfig?.hasBoiler || globalConfig?.installGasBoiler || false
    const wallMaterial = globalConfig?.wallMaterial || "Lucir y pintar"
    const paintCeilings = globalConfig?.paintCeilings ?? true
    const lowerAllCeilings = globalConfig?.lowerAllCeilings ?? false
    const projectHeight = globalConfig?.projectHeight || standardHeight

    const isWoodenOrMixedStructure = structureType === "Madera" || structureType === "Mixta"

    if (hasBoiler) {
      newSummary.instalacionCaldera = 1
    }

    if (globalConfig?.entranceDoorType) {
      newSummary.puertaAcorazada = 1
    }

    rooms.forEach((room) => {
      const area = room.width * room.length
      const perimeter = room.perimeter || 2 * (room.width + room.length)

      const effectiveHeight = (() => {
        // Si se baja el techo, usar la nueva altura
        if (room.lowerCeiling && room.newCeilingHeight) {
          return room.newCeilingHeight
        }
        // Si tiene techos bajados que se quedan, usar altura actual
        if (room.currentCeilingStatus === "lowered_keep" && room.currentCeilingHeight) {
          return room.currentCeilingHeight
        }
        // Si usa altura personalizada o altura estándar
        return room.customHeight || room.height || standardHeight
      })()

      const wallArea = perimeter * effectiveHeight

      const roomFloorMaterial = (room.floorMaterial || "").toLowerCase()
      if (roomFloorMaterial === "cerámico" || roomFloorMaterial === "cerámica") {
        newSummary.embaldosado += area
      }

      if (roomFloorMaterial === "parquet flotante") {
        newSummary.floatingParquet += area
      }

      // Rodapié: sumar perímetro si el suelo NO es cerámico ni "No se modifica"
      if (roomFloorMaterial !== "cerámico" && roomFloorMaterial !== "no se modifica" && room.type !== "Terraza") {
        newSummary.rodapie += perimeter
      }

      if (
        isWoodenOrMixedStructure &&
        (room.currentFloor === "flooring_ceramic" ||
          room.currentFloor === "flooring_wood" ||
          room.currentFloor === "other")
      ) {
        if (
          room.type === "Baño" ||
          room.type === "Cocina" ||
          room.type === "Cocina Abierta" ||
          room.type === "Cocina Americana"
        ) {
          newSummary.arlita += area
        } else if (room.type !== "Terraza") {
          newSummary.rastrelado += area
        }
      }

      const roomWallMaterial = (room.wallMaterial || wallMaterial || "").toLowerCase()

      console.log(
        "[v0] Room:",
        room.type,
        "wallMaterial:",
        room.wallMaterial,
        "normalized:",
        roomWallMaterial,
        "wallArea:",
        wallArea,
      )

      if (roomWallMaterial === "cerámica" || roomWallMaterial === "ceramica") {
        newSummary.alicatadoParedes += wallArea
        console.log("[v0] Sumando alicatado:", wallArea)
      }

      if (roomWallMaterial === "lucir y pintar" || roomWallMaterial === "solo lucir") {
        newSummary.lucidoParedes += wallArea
        console.log("[v0] Sumando lucido:", wallArea)
      }

      if (roomWallMaterial === "lucir y pintar" || roomWallMaterial === "solo pintar") {
        newSummary.pinturaParedes += wallArea
        console.log("[v0] Sumando pintura:", wallArea)
      }

      // Calcular metros cuadrados y lineales
      const wallSurface = perimeter * projectHeight

      if (paintCeilings && room.type !== "Terraza") {
        newSummary.pinturaTechos += area
      }

      if (room.lowerCeiling || lowerAllCeilings) {
        newSummary.bajadoTechos += area
      }

      const newDoorList = room.newDoorList || []
      if (newDoorList.length > 0) {
        newDoorList.forEach((door: { type: string }) => {
          if (door.type === "Abatible") {
            newSummary.puertasAbatibles += 1
            newSummary.premarcos += 1
          } else if (door.type === "Doble abatible") {
            newSummary.puertasDobleAbatibles += 1
            newSummary.premarcos += 1
          } else if (door.type === "Corredera empotrada") {
            newSummary.puertasCorrederas += 1
            newSummary.cajonPuertaCorredera += 1
            newSummary.premarcos += 1
          } else if (door.type === "Corredera exterior" || door.type === "Corredera exterior con carril") {
            newSummary.puertasCorrederasExteriores += 1
            newSummary.premarcos += 1
          }
        })
      } else if (room.newDoors && room.newDoors > 0) {
        // Fallback si solo hay contador sin lista
        newSummary.puertasAbatibles += room.newDoors
        newSummary.premarcos += room.newDoors
      }

      newSummary.windows += room.windows?.length || 0

      if (isBathroom(room.type)) {
        newSummary.redesAguaBanos += 1
        newSummary.conductoExtraccionBano += 1
      }
      if (isKitchen(room.type)) {
        newSummary.redesAguaCocina += 1
        newSummary.conductoExtraccionCocina += 1
      }

      if (isBathroom(room.type) && room.bathroomElements && room.bathroomElements.length > 0) {
        room.bathroomElements.forEach((element: BathroomElement) => {
          switch (element) {
            case "Inodoro":
              newSummary.instalacionInodoro += 1
              break
            case "Bidé":
              newSummary.instalacionBide += 1
              break
            case "Ducheta Inodoro":
              newSummary.instalacionDuchaInodoro += 1
              break
            case "Plato de ducha":
              newSummary.instalacionPlatoDucha += 1
              newSummary.instalacionGrifoDucha += 1
              break
            case "Bañera":
              newSummary.instalacionBanera += 1
              newSummary.instalacionGrifoDucha += 1
              break
            case "Mampara":
              newSummary.instalacionMampara += 1
              break
            case "Mueble lavabo":
              newSummary.instalacionMuebleLavabo += 1
              newSummary.instalacionGrifoLavabo += 1
              break
          }
        })
      }

      if (isKitchen(room.type)) {
        newSummary.instalacionFregadero += 1
        newSummary.instalacionLavadora += 1
        newSummary.instalacionLavavajillas += 1
      }

      const shouldHaveRadiators = reformHeatingType !== "ninguna" && reformHeatingType !== "Suelo Radiante"

      if (reformHeatingType === "Eléctrica") {
        if (room.radiators && Array.isArray(room.radiators) && room.radiators.length > 0) {
          room.radiators.forEach(() => {
            newSummary.fijacionEmisores += 1
            newSummary.emisoresTermicos += 1
          })
        } else if (room.hasRadiator) {
          newSummary.fijacionEmisores += 1
          newSummary.emisoresTermicos += 1
        }
      } else {
        if (shouldHaveRadiators) {
          if (room.radiators && Array.isArray(room.radiators) && room.radiators.length > 0) {
            room.radiators.forEach(() => {
              newSummary.redAlimentacionRadiador += 1
              newSummary.instalacionRadiadores += 1
            })
          } else if (room.hasRadiator) {
            newSummary.redAlimentacionRadiador += 1
            newSummary.instalacionRadiadores += 1
          }
        }
      }

      if (room.heatingElements && room.heatingElements.includes("Termo eléctrico")) {
        newSummary.instalacionTermo += 1
      }
    })

    if (partitions && Array.isArray(partitions)) {
      newSummary.partitionsArea = partitions.reduce((sum, partition) => {
        return sum + partition.length * partition.height
      }, 0)
    }

    if (wallLinings && Array.isArray(wallLinings)) {
      newSummary.wallLiningsArea = wallLinings.reduce((sum, lining) => {
        return sum + lining.length * lining.height
      }, 0)
    }

    if (electricalConfig) {
      newSummary.puntoLuz = electricalConfig.numPoints || 0
      newSummary.puntoEnchufe = electricalConfig.numSockets || 0
      newSummary.puntoTelefonoTV = electricalConfig.numTVPoints || 0
      newSummary.puntoAireAcondicionado = electricalConfig.numACPoints || 0
      newSummary.cuadroElectrico = electricalConfig.hasNewPanel ? 1 : 0
    }

    setSummary(newSummary)
  }, [rooms, globalConfig, partitions, wallLinings, electricalConfig])

  if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Reforma</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No hay habitaciones de reforma agregadas aún.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* ALBAÑILERÍA */}
      {(summary.solera > 0 ||
        summary.arlita > 0 ||
        summary.rastrelado > 0 ||
        summary.lucidoParedes > 0 ||
        summary.bajadoTechos > 0 ||
        summary.cajonPuertaCorredera > 0 ||
        summary.embaldosado > 0 ||
        summary.raseo > 0 ||
        summary.raseoParedes > 0 ||
        summary.alicatadoParedes > 0 ||
        summary.fijacionEmisores > 0 ||
        summary.falsotecho > 0) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Albañilería</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {summary.arlita > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div className="min-w-0 break-words leading-tight">Capa mortero aligerado arcilla expandida (ARLITA)</div>
                    <div className="text-muted-foreground text-right shrink-0">m²</div>
                    <div className="text-right font-medium shrink-0">{formatNumber(summary.arlita)}</div>
                  </div>
                )}
                {summary.rastrelado > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div className="min-w-0 break-words leading-tight">Base nivelación mediante rastrelado en madera</div>
                    <div className="text-muted-foreground text-right shrink-0">m²</div>
                    <div className="text-right font-medium shrink-0">{formatNumber(summary.rastrelado)}</div>
                  </div>
                )}
                {summary.solera > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Formación de solera de mortero y arlita</div>
                    <div className="text-muted-foreground text-right shrink-0">m²</div>
                    <div className="text-right font-medium shrink-0">{formatNumber(summary.solera)}</div>
                  </div>
                )}
                {summary.lucidoParedes > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Lucido de paredes</div>
                    <div className="text-muted-foreground text-right shrink-0">m²</div>
                    <div className="text-right font-medium shrink-0">{formatNumber(summary.lucidoParedes)}</div>
                  </div>
                )}
                {summary.bajadoTechos > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Bajado de techos</div>
                    <div className="text-muted-foreground text-right shrink-0">m²</div>
                    <div className="text-right font-medium shrink-0">{formatNumber(summary.bajadoTechos)}</div>
                  </div>
                )}
                {summary.raseo > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Raseo de suelo</div>
                    <div className="text-muted-foreground text-right shrink-0">m²</div>
                    <div className="text-right font-medium shrink-0">{formatNumber(summary.raseo)}</div>
                  </div>
                )}
                {summary.embaldosado > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Embaldosado cerámico</div>
                    <div className="text-muted-foreground text-right shrink-0">m²</div>
                    <div className="text-right font-medium shrink-0">{formatNumber(summary.embaldosado)}</div>
                  </div>
                )}
                {summary.raseoParedes > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Raseo de paredes</div>
                    <div className="text-muted-foreground text-right shrink-0">m²</div>
                    <div className="text-right font-medium shrink-0">{formatNumber(summary.raseoParedes)}</div>
                  </div>
                )}
                {summary.alicatadoParedes > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Alicatado de paredes</div>
                    <div className="text-muted-foreground text-right shrink-0">m²</div>
                    <div className="text-right font-medium shrink-0">{formatNumber(summary.alicatadoParedes)}</div>
                  </div>
                )}
                {summary.cajonPuertaCorredera > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Colocación de Cajón puerta corredera</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.cajonPuertaCorredera}</div>
                  </div>
                )}
                {summary.fijacionEmisores > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Fijación de emisores térmicos</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.fijacionEmisores}</div>
                  </div>
                )}
                {summary.falsotecho > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación de falsotecho</div>
                    <div className="text-muted-foreground text-right shrink-0">m²</div>
                    <div className="text-right font-medium shrink-0">{formatNumber(summary.falsotecho)}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* FONTANERÍA */}
      {(summary.redesAguaBanos > 0 ||
        summary.redesAguaCocina > 0 ||
        summary.conductoExtraccionBano > 0 ||
        summary.conductoExtraccionCocina > 0 ||
        summary.instalacionInodoro > 0 ||
        summary.instalacionMampara > 0 ||
        summary.instalacionPlatoDucha > 0 ||
        summary.instalacionBanera > 0 ||
        summary.instalacionMuebleLavabo > 0 ||
        summary.instalacionBide > 0 ||
        summary.instalacionDuchaInodoro > 0 ||
        summary.instalacionGrifoDucha > 0 ||
        summary.instalacionGrifoLavabo > 0 ||
        summary.instalacionFregadero > 0 ||
        summary.instalacionLavadora > 0 ||
        summary.instalacionLavavajillas > 0) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Fontanería</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {summary.redesAguaBanos > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div className="min-w-0 break-words leading-tight">Red de instalación de agua fría y caliente para baños</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.redesAguaBanos}</div>
                  </div>
                )}
                {summary.redesAguaCocina > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Red de instalación de agua fría y caliente para cocina</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.redesAguaCocina}</div>
                  </div>
                )}
                {summary.conductoExtraccionBano > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Colocación conducto extracción de baño</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.conductoExtraccionBano}</div>
                  </div>
                )}
                {summary.conductoExtraccionCocina > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación conducto campana extractora</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.conductoExtraccionCocina}</div>
                  </div>
                )}
                {summary.instalacionInodoro > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación de inodoro</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.instalacionInodoro}</div>
                  </div>
                )}
                {summary.instalacionMampara > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación de mampara</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.instalacionMampara}</div>
                  </div>
                )}
                {summary.instalacionPlatoDucha > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación de plato de ducha</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.instalacionPlatoDucha}</div>
                  </div>
                )}
                {summary.instalacionBanera > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación de bañera</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.instalacionBanera}</div>
                  </div>
                )}
                {summary.instalacionMuebleLavabo > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación de mueble de lavabo</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.instalacionMuebleLavabo}</div>
                  </div>
                )}
                {summary.instalacionBide > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación de bidé</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.instalacionBide}</div>
                  </div>
                )}
                {summary.instalacionDuchaInodoro > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación de ducha de inodoro</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.instalacionDuchaInodoro}</div>
                  </div>
                )}
                {summary.instalacionGrifoDucha > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación de grifo de ducha</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.instalacionGrifoDucha}</div>
                  </div>
                )}
                {summary.instalacionGrifoLavabo > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación de grifo de lavabo</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.instalacionGrifoLavabo}</div>
                  </div>
                )}
                {summary.instalacionFregadero > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación y montaje de fregadero</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.instalacionFregadero}</div>
                  </div>
                )}
                {summary.instalacionLavadora > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación de lavadora</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.instalacionLavadora}</div>
                  </div>
                )}
                {summary.instalacionLavavajillas > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación de lavavajillas</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.instalacionLavavajillas}</div>
                  </div>
                )}
                {summary.instalacionTermo > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación de termo eléctrico</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.instalacionTermo}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* PINTURA */}
      {(summary.pinturaParedes > 0 || summary.pinturaTechos > 0 || summary.lacarPuertaEntrada > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Pintura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {summary.pinturaParedes > 0 && (
                <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                  <div>Pintura de paredes</div>
                  <div className="text-muted-foreground text-right shrink-0">m²</div>
                  <div className="text-right font-medium shrink-0">{formatNumber(summary.pinturaParedes)}</div>
                </div>
              )}
              {summary.pinturaTechos > 0 && (
                <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                  <div>Pintura de techos</div>
                  <div className="text-muted-foreground text-right shrink-0">m²</div>
                  <div className="text-right font-medium shrink-0">{formatNumber(summary.pinturaTechos)}</div>
                </div>
              )}
              {summary.lacarPuertaEntrada > 0 && (
                <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                  <div>Lacar puerta de entrada</div>
                  <div className="text-muted-foreground text-right shrink-0">ud</div>
                  <div className="text-right font-medium shrink-0">{summary.lacarPuertaEntrada}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CARPINTERÍA */}
      {(summary.floatingParquet > 0 ||
        summary.laminateFloor > 0 ||
        summary.vinylFloor > 0 ||
        summary.baseAislante > 0 ||
        summary.nivelarTablon > 0 ||
        summary.puertasAbatibles > 0 ||
        summary.puertasCorrederas > 0 ||
        summary.premarcos > 0 ||
        summary.puertaAcorazada > 0 ||
        summary.windows > 0 ||
        summary.rodapie > 0) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Carpintería</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {summary.floatingParquet > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación de parquet flotante</div>
                    <div className="text-muted-foreground text-right shrink-0">m²</div>
                    <div className="text-right font-medium shrink-0">{formatNumber(summary.floatingParquet)}</div>
                  </div>
                )}
                {summary.rodapie > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Colocación de rodapié</div>
                    <div className="text-muted-foreground text-right shrink-0">ml</div>
                    <div className="text-right font-medium shrink-0">{formatNumber(summary.rodapie)}</div>
                  </div>
                )}
                {summary.laminateFloor > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación de suelo laminado</div>
                    <div className="text-muted-foreground text-right shrink-0">m²</div>
                    <div className="text-right font-medium shrink-0">{formatNumber(summary.laminateFloor)}</div>
                  </div>
                )}
                {summary.vinylFloor > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación de suelo vinílico</div>
                    <div className="text-muted-foreground text-right shrink-0">m²</div>
                    <div className="text-right font-medium shrink-0">{formatNumber(summary.vinylFloor)}</div>
                  </div>
                )}
                {summary.baseAislante > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Base aislante</div>
                    <div className="text-muted-foreground text-right shrink-0">m²</div>
                    <div className="text-right font-medium shrink-0">{formatNumber(summary.baseAislante)}</div>
                  </div>
                )}
                {summary.nivelarTablon > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Nivelar con tablón</div>
                    <div className="text-muted-foreground text-right shrink-0">m²</div>
                    <div className="text-right font-medium shrink-0">{formatNumber(summary.nivelarTablon)}</div>
                  </div>
                )}
                {summary.puertasAbatibles > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Puertas abatibles</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.puertasAbatibles}</div>
                  </div>
                )}
                {summary.puertasDobleAbatibles > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Puertas dobles abatibles</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.puertasDobleAbatibles}</div>
                  </div>
                )}
                {summary.puertasCorrederas > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Puertas correderas</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.puertasCorrederas}</div>
                  </div>
                )}
                {summary.puertasCorrederasExteriores > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Puertas correderas exteriores</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.puertasCorrederasExteriores}</div>
                  </div>
                )}
                {summary.premarcos > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Suministro y colocación de premarcos</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.premarcos}</div>
                  </div>
                )}
                {summary.puertaAcorazada > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Colocación puerta de seguridad entrada</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.puertaAcorazada}</div>
                  </div>
                )}
                {summary.windows > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Ventanas</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.windows}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* TABIQUERÍA */}
      {(summary.partitionsArea > 0 || summary.wallLiningsArea > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tabiquería</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {summary.partitionsArea > 0 && (
                <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                  <div>Tabiques de Placa de yeso laminado</div>
                  <div className="text-muted-foreground text-right shrink-0">m²</div>
                  <div className="text-right font-medium shrink-0">{formatNumber(summary.partitionsArea)}</div>
                </div>
              )}
              {summary.wallLiningsArea > 0 && (
                <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                  <div>Trasdosados de Placa de yeso laminado</div>
                  <div className="text-muted-foreground text-right shrink-0">m²</div>
                  <div className="text-right font-medium shrink-0">{formatNumber(summary.wallLiningsArea)}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CALEFACCIÓN */}
      {(summary.instalacionCaldera > 0 ||
        summary.redAlimentacionRadiador > 0 ||
        summary.instalacionRadiadores > 0 ||
        summary.movimientoRadiadores > 0 ||
        summary.sueloRadiante > 0 ||
        summary.emisoresTermicos > 0) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Calefacción</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {summary.instalacionCaldera > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Instalación de caldera de gas</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.instalacionCaldera}</div>
                  </div>
                )}
                {summary.redAlimentacionRadiador > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Red de alimentación por radiador</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.redAlimentacionRadiador}</div>
                  </div>
                )}
                {summary.instalacionRadiadores > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Colocación y movimiento de radiadores</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.instalacionRadiadores}</div>
                  </div>
                )}
                {summary.emisoresTermicos > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Radiador eléctrico</div>
                    <div className="text-muted-foreground text-right shrink-0">ud</div>
                    <div className="text-right font-medium shrink-0">{summary.emisoresTermicos}</div>
                  </div>
                )}
                {summary.sueloRadiante > 0 && (
                  <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                    <div>Suelo radiante</div>
                    <div className="text-muted-foreground text-right shrink-0">m²</div>
                    <div className="text-right font-medium shrink-0">{formatNumber(summary.sueloRadiante)}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* MATERIALES */}
      {summary.emisoresTermicos > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Materiales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {summary.emisoresTermicos > 0 && (
                <div className="grid grid-cols-[1fr_40px_70px] gap-2 items-center py-1 border-b border-green-100 last:border-0">
                  <div>Radiador Eléctrico</div>
                  <div className="text-muted-foreground text-right shrink-0">ud</div>
                  <div className="text-right font-medium shrink-0">{summary.emisoresTermicos}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
