
export interface Point {
    x: number
    y: number
}

export interface Wall {
    id: string
    start: Point
    end: Point
    thickness: number
    isInvisible?: boolean
    type?: "interior" | "exterior" | "partition"
}

export interface Room {
    id: string
    name: string
    polygon: Point[]
    area: number
    color: string
    visualCenter?: Point
    roomId?: string // For linked backend data
}

export interface Door {
    id: string
    wallId: string
    t: number // position along wall (0-1)
    width: number
    flipX?: boolean
    flipY?: boolean
}

export interface Window {
    id: string
    wallId: string
    t: number
    width: number
    height: number
    flipY?: boolean
}

export interface FloorPlanData {
    walls: Wall[]
    rooms: Room[]
    doors: Door[]
    windows: Window[]
    dimensions?: { width: number; height: number }
    bgConfig?: {
        opacity: number
        scale: number
        x: number
        y: number
        rotation: number
        url?: string
    }
    calibration?: {
        p1: Point
        p2: Point
        distance: number // in cm
    }
}

export type FloorPlanVariant = "current" | "proposal"

export interface FloorPlanVersion {
    id: string
    project_id: string
    variant: FloorPlanVariant
    name: string | null
    description: string | null
    data: FloorPlanData
    image_url: string | null
    created_at: string
}
