// Cambiar "Solo acometida" por "Acometida de Gas" en el tipo CalefaccionType
export type CalefaccionType = "No Tiene" | "Acometida de Gas" | "Caldera + Radiadores" | "Central" | "Eléctrica" | "No"

// Nuevo tipo para radiadores
export type RadiatorType =
  | "Radiador de Aluminio"
  | "Radiador de diseño"
  | "Toallero de aluminio"
  | "Radiador eléctrico"
  | "Radiador toallero eléctrico"
  | "No"
  | "Convectivo"
  | "Radiante"
  | "Otro"

// Nuevo tipo para estructura
export type StructureType = "Hormigón" | "Madera" | "Mixto" | "No" | "Planta Baja" | "Planta Alta" | "Edificio Complejo"

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
  | "Lavadero"
  | "Tendedero"
  | "Estudio"
  | "Despensa"
  | "Bodega"
  | "Garaje"
  | "Escaleras"
  | "Otras ventanas"
  | "Habitación"
  | "Otro"

export type FloorMaterialType =
  | "No se modifica"
  | "Cerámico"
  | "Parquet flotante"
  | "Suelo laminado"
  | "Suelo vinílico"
  | "Otro"
  | "Cerámica"
  | "Madera"

export type WallMaterialType = "No se modifica" | "Cerámica" | "Gotelé" | "Lucida" | "Otra" | "Pintura" | "Papel" | "Lucir y pintar"

export type CeilingMaterial = "Pintura" | "Gotelé" | "Papel" | "Placa de yeso laminado" | "Ladrillo" | "Madera" | "Otro" | "No se modifica"

// Añadir el tipo MeasurementMode
export type MeasurementMode = "rectangular" | "area-perimeter"

// Añadir los nuevos tipos para la configuración de reforma
export type EntranceDoorType = boolean | "No" | "Lacada" | "Acorazada"
export type ReformHeatingType = "No" | "Caldera + Radiadores" | "Eléctrica" | "Suelo Radiante" | "Aerotermia" | "Otra" | "Central"

// Nuevo tipo para los tipos de puertas (Corredera doble cambiada a Corredera doble empotrada)
export type DoorType =
  | "Abatible"
  | "Corredera empotrada"
  | "Corredera exterior con carril"
  | "Corredera doble empotrada"

// Tipos para ventanas
export type WindowType = "Doble" | "Puerta Balcón" | "Sencillo" | "Ventana simple" | "Fijo sin apertura" | "Velux" | "Oscilo-Batiente"
export type WindowMaterial = "PVC" | "Aluminio" | "Madera"
export type WindowOpening =
  | "Fija"
  | "Oscilante"
  | "Batiente"
  | "Oscilo-Batiente"
  | "Pivotante"
  | "Corredera"
  | "Oscilo-Paralela"
  | "Plegable"
  | "Osciloparalela"
  | "Paralela"
  | "Sin apertura"
export type WindowColor = "Blanco" | "Dos colores" | "Otro" | "Negro" | "Gris Antracita" | "Imitación Madera"
export type GlassType = "Doble" | "Puerta Balcón" | "Sencillo"

// Interfaz para ventanas
export interface Window {
  id: string
  type: WindowType
  material: WindowMaterial
  opening: WindowOpening
  width: number // en metros
  height: number // en metros
  hasBlind: boolean // con o sin persiana
  color: WindowColor
  glassType: GlassType
  hasMosquitera: boolean
  innerColor?: string
  outerColor?: string
  hasCatFlap?: boolean
  description?: string
  price?: number
  hasFixedPanel?: boolean
  hasMotor?: boolean
}

// Interfaz para puertas
export interface Door {
  id: string
  type: DoorType
  width: number
  height: number
}

// Nueva interfaz para radiadores
export interface Radiator {
  id: string
  type: RadiatorType
  modules?: number // Número de módulos (solo para radiadores, no para toalleros)
  power?: number
}

// Añadir el tipo BathroomElement a los tipos existentes
export type BathroomElement =
  | "Inodoro"
  | "Ducheta Inodoro"
  | "Bañera"
  | "Plato de ducha"
  | "Mampara"
  | "Bidé"
  | "Mueble lavabo"

// Nuevos tipos para elementos eléctricos
export type ElectricalElementType =
  | "Punto de luz techo"
  | "Punto de luz pared"
  | "Punto conmutado"
  | "Punto de cruzamiento"
  | "Enchufe normal"
  | "Enchufe doble"
  | "Enchufe intemperie"
  | "Enchufe cocina"
  | "Foco empotrado"
  | "Timbre"
  | "Interruptor"
  | "Interruptor doble"
  | "Interruptor triple"
  | "Mover acometida de electricidad"
  | "Reubicación de acometida"
  | "Enchufe TV"
  | "Enchufe Ethernet"
  | "Tira LED"
  | "Sencillo"
  | "Toma TV"

// Interfaz para elementos eléctricos en habitaciones
export interface ElectricalElement {
  id?: string
  type: ElectricalElementType
  quantity?: number
}

export type CurrentCeilingStatus = "lowered_remove" | "lowered_keep" | "no_false_ceiling"

// Interfaz para habitaciones
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
  floorMaterial: FloorMaterialType
  wallMaterial: WallMaterialType
  ceilingMaterial: CeilingMaterial
  windows: Window[] // Array de ventanas para esta habitación
  customHeight?: number // Nueva propiedad para altura personalizada
  doorType?: DoorType // Nueva propiedad para el tipo de puerta
  doorList?: Door[] // Nueva propiedad para lista de puertas
  newDoors?: boolean // Si se instalan nuevas puertas en reforma
  newDoorList?: Door[] // Lista de puertas nuevas a instalar
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
  currentCeilingStatus?: CurrentCeilingStatus
  hasExistingFalseCeiling?: boolean
  existingCeilingHeight?: number
  removeExistingCeiling?: boolean
  removeFalseCeiling?: boolean
  electricalElements?: ElectricalElement[]
  outlets?: number
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
  hasBathroomElements?: boolean
  bathroomElementsCount?: number
  hasKitchenFurniture?: boolean
  hasBedroomFurniture?: boolean
  hasRadiator?: boolean
  wallSurface?: number // Superficie de paredes (para cálculos de alicatado)
  tiledWallSurfaceArea?: number // Superficie específica de alicatado
  removeMortarBase?: boolean // Para indicar si se debe retirar solera de mortero
  removeWallTiles?: boolean // Para indicar si se debe retirar alicatado
  removeFloorTiles?: boolean
  removeBathroomElements?: boolean
  removeMoldings?: boolean
  removeKitchenFurniture?: boolean
  removeBedroomFurniture?: boolean
  removeRadiators?: boolean
  removeSewagePipes?: boolean
  hasDoors?: boolean
  wallThickness?: number
  floorThickness?: number
  ceilingThickness?: number
  wallTileThickness?: number
  floorTileThickness?: number
  gotele?: boolean
  skirting?: boolean
  wallpaperRemoval?: boolean
  demolishWalls?: boolean
  demolishCeiling?: boolean
  removeWoodenFloor?: boolean
  demolitionCost?: number
  reformCost?: number
  newBathroomElements?: boolean
  wallCeramicRemoval?: boolean
  material?: string
  notes?: string
  floorType?: string
  demolishWall?: boolean
}

// Añadir la interfaz para los derribos de tabiques
export interface WallDemolition {
  id: string
  length: number
  area?: number
  thickness: number
  hasTiles?: boolean
  tilesSides?: "one" | "both"
  tileThickness?: number
  wallHeight?: number
  material?: string
}

// Actualizar la interfaz GlobalConfig para incluir aire acondicionado y termo eléctrico
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
  wallDebrisVolume?: number
  tileDebrisVolume?: number
  totalWallDebrisVolume?: number
  subtractTiledWallArea?: boolean
  projectId?: string
  wallConstructions?: any[] // Nueva propiedad para construcciones de paredes
  pladurWallArea?: number
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
  entranceDoorType?: EntranceDoorType
  paintCeilings?: boolean
  installWaterHeater?: boolean
  electricalSettings?: any
  tiledWallSurfaceArea?: number
}

// Modificar la interfaz DemolitionSummary para añadir la nueva propiedad
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
  radiatorsRemoval?: number // conteo de radiadores a retirar
  mortarBaseRemoval: number // metros cuadrados de solera de mortero
  hasElevator?: boolean
  buildingHeight?: number
}

// Modificar la interfaz DebrisCalculation para añadir el nuevo cálculo de escombros
export interface DebrisCalculation {
  wallDebris: number // m³ de escombros de tabiques
  floorTileDebris: number // m³ de escombros de cerámica en suelo
  wallTileDebris: number // m³ de escombros de cerámica en paredes
  woodenFloorDebris: number // m³ de escombros de suelo de madera
  mortarBaseDebris: number // m³ de escombros de solera de mortero
  totalDebris: number // m³ totales de escombros
  containersNeeded: number // Número de contenedores necesarios
}

export interface DemolitionSettings {
  wallThickness: number // Grosor tabique en cm
  floorTileThickness: number // Grosor cerámica suelo en m
  wallTileThickness: number // Grosor cerámica paredes en m
  woodExpansionCoef: number // Coef. esponjamiento madera
  ceramicExpansionCoef: number // Coef. esponjamiento cerámica
  containerSize: number // Tamaño del contenedor en m³
  floorTileExpansionCoef: number
  woodenFloorThickness: number
  woodenFloorExpansionCoef: number
  mortarBaseThickness: number
  mortarBaseExpansionCoef: number
  wallExpansionCoef: number
  ceilingThickness: number
  ceilingExpansionCoef: number
}

export interface ElectricalConfig {
  needsNewInstallation: boolean
  installationType: "Básica" | "Media" | "Completa"
  hasCertificate: boolean
  generalPanelElements?: number
  hasConstructionPanel?: boolean
  generalItems?: any[]
  totalGeneral?: number
  moveElectricalConnection?: boolean
  hasElectricalPanel?: boolean // Cuadro eléctrico
  hasHeatingCircuit?: boolean // Circuito de Calefacción (4 mm²)
  hasOvenCircuit?: boolean // Circuito de Horno (6 mm²)
  hasInductionCircuit?: boolean // Circuito de Inducción (6 mm²)
  hasWashingMachineCircuit?: boolean // Circuito de Lavadora (4 mm²)
  hasDishwasherCircuit?: boolean // Circuito de Lavavajillas (4 mm²)
  hasDryerCircuit?: boolean // Circuito de Secadora (4 mm²)
  hasWaterHeaterCircuit?: boolean // Circuito de Termo Eléctrico (4 mm²)
  hasGroundConnection?: boolean
  relocateElectricalConnection?: boolean
  numPoints?: number
  numSockets?: number
  numTVPoints?: number
  numACPoints?: number
  hasNewPanel?: boolean
}

export interface CalculatorState {
  globalConfig: GlobalConfig
  rooms: Room[]
  reformRooms: Room[] // Nueva propiedad para las habitaciones de reforma
  demolitionSummary: DemolitionSummary
  demolitionSettings: DemolitionSettings
  debrisCalculation: DebrisCalculation
  electricalConfig?: ElectricalConfig // Nueva propiedad para la configuración eléctrica
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

export interface WallConstruction {
  id: string
  length: number
  area?: number
  material: "placa_yeso" | "ladrillo"
  wallHeight?: number
}

export interface Cladding {
  id: string
  length: number
  area?: number
  material: "placa_yeso" | "ladrillo" | "madera" | "otros"
  wallHeight?: number
}

// Tipos para tabiques y trasdosados
export interface Partition {
  id: string
  type: "ladrillo" | "placa_yeso"
  linearMeters: number
  height: number
}

export interface WallLining {
  id: string
  linearMeters: number
  height: number
}
