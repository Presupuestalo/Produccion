import type { Room } from "./room" // Assuming Room is defined in a separate file
import type { GlobalConfig } from "./globalConfig" // Assuming GlobalConfig is defined in a separate file

export interface CalculatorData {
  demolition?: {
    rooms?: Room[]
    partitions?: number
    wallTiling?: number
    floorTiling?: number
    falseCeiling?: number
    moldings?: number
    woodFlooring?: number
    woodBaseboard?: number
    ceramicBaseboard?: number
    electricalPlumbing?: boolean
    doors?: number
    wallPreparation?: number
    kitchenFurniture?: boolean
    wardrobes?: number
  }
  reform?: {
    rooms?: Room[]
    screed?: number
    selfLeveling?: number
    drywall?: number
    brickPartitions?: number
    plasterboardPartitions?: number
    plastering?: number
    moldings?: number
    ceilingLowering?: number
    insulation?: number
    floorLeveling?: number
    laminateFlooring?: number
    vinylFlooring?: number
    floorSanding?: number
    doorTrimming?: number
    swingDoors?: number
    slidingDoors?: number
    entryDoor?: boolean
    drainPipe?: boolean
    radiantFloor?: boolean
    radiantFloorArea?: number
    heatingType?: string
    newBoiler?: boolean
    relocateBoiler?: boolean
    radiators?: number
    gasConnection?: boolean
    electricWaterHeater?: boolean
    simpleLights?: number
    switchedLights?: number
    outlets?: number
    tvOutlets?: number
    recessedLights?: number
    doorbell?: boolean
    tvCabling?: boolean
    intercom?: boolean
  }
  globalConfig?: GlobalConfig
}
