// Types for Budget Generator to replace 'any' types

export interface Room {
    type: string
    number: number
    area?: number
    perimeter?: number
    removeFloor?: boolean
    floorMaterial?: string
    removeWallTiles?: boolean
    wallMaterial?: string
    removeGotele?: boolean
    currentCeilingStatus?: string
    currentCeilingHeight?: number
    newCeilingHeight?: number
    removeFalseCeiling?: boolean
    moldings?: boolean
    hasDoors?: boolean
    doorList?: Door[]
    hasRadiator?: boolean
    removeBathroomElements?: boolean
    removeKitchenFurniture?: boolean
    removeBedroomFurniture?: boolean
    removeLivingRoomFurniture?: boolean
    removeSewagePipes?: boolean
    customRoomType?: string
    name?: string
    windows?: Window[]
    electricalElements?: ElectricalElement[]
    outlets?: number
    switches?: number
    lightPoints?: number
    tvPoints?: number
    recessedLights?: number
    ledStrips?: number
}

export interface Door {
    id?: string
    type: string
    width: number
    height: number
}

export interface Window {
    id?: string
    type: string
    width: number
    height: number
    material?: string
    opening?: string
    hasBlind?: boolean
    color?: string
    glassType?: string
    hasMosquitera?: boolean
}

export interface ElectricalElement {
    type: string
    quantity: number
}

export interface WallDemolition {
    thickness: number
    area: number
}

export interface DemolitionConfig {
    removeAllCeramic?: boolean
    removeWoodenFloor?: boolean
    standardHeight?: number
    wallDemolitions?: WallDemolition[]
    changeBoiler?: boolean
    removeWaterHeater?: boolean
}

export interface DemolitionSettings {
    containerSize?: number
}

export interface DemolitionData {
    rooms: Room[]
    config?: DemolitionConfig
    settings?: DemolitionSettings
}

export interface ReformConfig {
    tileAllFloors?: boolean
}

export interface ReformData {
    rooms: Room[]
    config?: ReformConfig
    partitions?: Partition[]
    wallLinings?: WallLining[]
}

export interface Partition {
    area: number
    type?: string
}

export interface WallLining {
    area: number
    type?: string
}

export interface ElectricalConfig {
    // Add electrical config properties as needed
    [key: string]: unknown
}

export interface PriceItem {
    id: string
    code: string
    category: string
    subcategory: string
    description: string
    unit: string
    final_price: number
    notes?: string
    color?: string
    brand?: string
    model?: string
}

export interface CategoryInfo {
    category: string
    section: string
}
