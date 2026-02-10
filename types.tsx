export * from "./types/calculator"
export type CalefaccionType = "No" | "Solo Acometida de gas" | "Caldera y Radiadores" | "Eléctrica" | "Central"

export type RoomType =
  | "Salón"
  | "Cocina"
  | "Cocina Abierta"
  | "Cocina Americana"
  | "Baño"
  | "Dormitorio"
  | "Pasillo"
  | "Hall"
  | "Terraza"
  | "Trastero"
  | "Vestidor"
  | "Otro"

export type FloorMaterialType = "No se modifica" | "Cerámico" | "Madera" | "Otro"

export type WallMaterialType = "No se modifica" | "Cerámico" | "Papel" | "Gotelé" | "Lucida" | "Otra"

export type CeilingMaterial = "No se modifica" | "Placa de yeso laminado" | "Ladrillo" | "Madera" | "Otro"

export type Window = {
  id: string
  type: string
  dimensions: {
    width: number
    height: number
  }
}

export type Radiator = {
  id: string
  type: string
  power: number
}

export type RadiatorType = "No" | "Convectivo" | "Radiante" | "Otro"

export type BathroomElement = {
  id: string
  type: string
}

export type ElectricalElement = {
  id: string
  type: string
}

export type WallDemolition = {
  id: string
  area: number
  material: string
}

export type StructureType = "No" | "Planta Baja" | "Planta Alta" | "Edificio Complejo"

// Añadir el tipo MeasurementMode
export type MeasurementMode = "rectangular" | "area-perimeter"

// Añadir los nuevos tipos para la configuración de reforma
export type EntranceDoorType = "No" | "Lacada" | "Acorazada"
// Modificado: Eliminada la opción "Instalación de Gas"
export type ReformHeatingType = "No" | "Eléctrica" | "Suelo Radiante" | "Otra"

// Nuevo tipo para los tipos de puertas (Corredera doble cambiada a Corredera doble empotrada)
export type DoorType =
  | "Abatible"
  | "Corredera empotrada"
  | "Corredera exterior con carril"
  | "Corredera doble empotrada"

// Interfaz para puertas
export interface Door {
  id: string
  type: DoorType
}

export interface Room {
  id: string
  name: string
  type: RoomType
  number: number // Para enumerar habitaciones del mismo tipo
  doors: number
  falseCeiling: boolean
  moldings: boolean
  measurementMode: MeasurementMode // Nuevo campo para el modo de medición
  width: number
  length: number
  area: number
  perimeter: number
  wallArea: number
  ceilingArea: number
  floorMaterial: FloorMaterialType | "Cerámica" | "Madera" | "Otro"
  wallMaterial: WallMaterialType | "Pintura" | "Gotelé" | "Cerámica"
  ceilingMaterial: CeilingMaterial
  windows: Window[] // Array de ventanas para esta habitación
  customHeight?: number // Nueva propiedad para altura personalizada
  doorType?: DoorType // Nueva propiedad para el tipo de puerta
  doorList?: Door[] // Nueva propiedad para lista de puertas
  customRoomType?: string // Nueva propiedad para tipo de habitación personalizado
  radiators?: Radiator[] // Nueva propiedad para lista de radiadores
  radiatorType?: RadiatorType
  radiatorModules?: number
  bathroomElements?: BathroomElement[]
  hasNiche?: boolean
  removeLivingRoomFurniture?: boolean // Nueva propiedad para retirar muebles de salón
  lowerCeiling?: boolean // Nueva propiedad para bajar techo
  newCeilingHeight?: number // Nueva propiedad para la nueva altura del techo
  currentCeilingHeight?: number // Altura actual del techo para falsos techos
  electricalElements?: ElectricalElement[]
  outlets?: number // Temporary backward compatibility properties - to be removed after refactoring
  switches?: number
  lightPoints?: number
  tvPoints?: number
  recessedLights?: number
  ledStrips?: number
  removeGotele?: boolean // Nueva propiedad para retirar gotelé
  newElectrical?: boolean // Nueva propiedad para nueva instalación eléctrica
  removeFloor: boolean
  removeWallMaterial: boolean
  removeCeilingMaterial: boolean
  removeFalseCeiling?: boolean
  hasBathroomElements?: boolean
  bathroomElementsCount?: number
  hasKitchenFurniture?: boolean
  hasBedroomFurniture?: boolean
  hasRadiator?: boolean
}

export interface GlobalConfig {
  standardHeight: number
  structureType?: StructureType // Nuevo campo para tipo de estructura
  heatingType?: CalefaccionType
  reformHeatingType?: ReformHeatingType // Añadido campo para calefacción de reforma
  removeWoodenFloor: boolean
  wallDemolitions?: WallDemolition[] // Nueva propiedad para múltiples derribos
  wallDemolitionArea?: number
  wallThickness?: number // Para compatibilidad con código existente
  tiledWallDemolitionArea?: number
  tiledWallSurfaceArea?: number
  wallDebrisVolume?: number
  tileDebrisVolume?: number
  totalWallDebrisVolume?: number
  subtractTiledWallArea?: boolean
  projectId?: string
  wallConstructions?: any[] // Nueva propiedad para construcciones de paredes
  pladurWallArea?: number // M² Tabiques de placa de yeso laminado
  brickWallArea?: number
  totalWallConstructionArea?: number
  claddings?: any[] // Nueva propiedad para revestimientos
  totalCladdingArea?: number
  hasWaterHeater?: boolean // Nueva propiedad para termo eléctrico
  removeWaterHeater?: boolean // Nueva propiedad para retirar termo
  changeBoiler?: boolean // Nueva propiedad para cambiar caldera
  installGasBoiler?: boolean // Nueva propiedad para instalar caldera de gas en reforma
  installGasConnection?: boolean // Nueva propiedad para instalar acometida de gas
  paintAndPlasterAll?: boolean // Añadir esta línea
  lowerAllCeilings?: boolean // Nueva propiedad para bajar todos los techos
  allWallsHaveGotele?: boolean // Nueva propiedad para indicar si todas las paredes tienen gotelé
  removeAllCeramic?: boolean // Nueva propiedad para picar toda la cerámica
  tileAllFloors?: boolean // Nueva propiedad para embaldosar todo el suelo
  entranceDoorType?: EntranceDoorType // Corrected type for entranceDoorType
  paintCeilings?: boolean
}

export interface DemolitionSettings {
  wallThickness: number // Grosor tabique en cm
  floorTileThickness: number // Grosor cerámica suelo en m
  wallTileThickness: number // Grosor cerámica paredes en m
  woodExpansionCoef: number // Coef. esponjamiento madera
  ceramicExpansionCoef: number // Coef. esponjamiento cerámica
  containerSize: number // Tamaño del contenedor en m³
}

export interface DemolitionSummary {
  skirting: number // metros lineales
  wallpaperRemoval: number // metros cuadrados (papel)
  goteleRemoval: number // metros cuadrados (gotelé)
  wallDemolition: number // metros cuadrados
  ceilingDemolition: number // metros cuadrados
  floorTileRemoval: number // metros cuadrados
  woodenFloorRemoval: number // metros cuadrados
  wallTileRemoval: number // metros cuadrados
  bathroomElementsRemoval: number // conteo
  moldingsRemoval: number // metros lineales
  kitchenFurnitureRemoval: number // conteo
  bedroomFurnitureRemoval: number // conteo
  sewagePipesRemoval: number // conteo de bajantes fecales
  totalDoors: number // conteo total de puertas
  totalArea: number // metros cuadrados totales
}

export interface DebrisCalculation {
  wallDebris: number // m³ de escombros de tabiques
  floorTileDebris: number // m³ de escombros de cerámica en suelo
  wallTileDebris: number // m³ de escombros de cerámica en paredes
  woodenFloorDebris: number // m³ de escombros de suelo de madera
  totalDebris: number // m³ totales de escombros
  containersNeeded: number // Número de contenedores necesarios
}

export interface CalculatorState {
  globalConfig: GlobalConfig
  rooms: Room[]
  reformRooms: Room[] // Nueva propiedad para las habitaciones de reforma
  demolitionSummary: DemolitionSummary
  demolitionSettings: DemolitionSettings
  debrisCalculation: DebrisCalculation
}

export interface FloorPlanAnalysis {
  scale: string
  units: string
  confidence: number
  rooms: Room[]
  walls: any[]
  openings: any[]
  errorMessages: any[]
}
