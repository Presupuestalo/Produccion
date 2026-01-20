export interface RoomMeasurements {
  width: number
  length: number
  area: number
}

export interface Coordinates {
  x: number
  y: number
}

export interface Room {
  id: string
  type: string
  measurements: RoomMeasurements
  coordinates: [number, number][]
  adjacentRooms: string[]
  confidence: number
}

export interface Wall {
  id: string
  coordinates: [number, number][]
  length: number
  type: string // "load_bearing" o "partition"
  status: string // "existing", "demolition" o "new"
}

export interface Opening {
  id: string
  type: string // "door" o "window"
  width: number
  coordinates: [number, number][]
  connects: string[]
}

export interface FloorPlanAnalysis {
  scale: string
  units: string
  confidence: number
  rooms: Room[]
  walls: Wall[]
  openings: Opening[]
  errorMessages: string[]
}
