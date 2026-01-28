
import { FloorPlanData, Wall, Point } from "@/lib/types/floor-plan"

interface DiffResult {
    demolition: {
        walls: Wall[]
        areaSqMeters: number // m² of wall surface to demolish
    }
    construction: {
        walls: Wall[]
        areaSqMeters: number // m² of wall surface to build
    }
    unchanged: Wall[]
}

const DEFAULT_WALL_HEIGHT_METERS = 2.5
const PIXELS_TO_CM_DEFAULT = 5 // Fallback if no calibration (5px = 1cm is arbitrary, usually calibrated)

export function calculateScale(data: FloorPlanData): number {
    if (!data.calibration || !data.calibration.distance) return 0

    const p1 = data.calibration.p1
    const p2 = data.calibration.p2
    const pixelDist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))

    if (pixelDist === 0) return 0

    // pixels per cm
    return pixelDist / data.calibration.distance
}

export function calculateWallLengthInMeters(wall: Wall, pixelsPerCm: number): number {
    if (pixelsPerCm === 0) return 0

    const pixelLen = Math.sqrt(Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.y - wall.start.y, 2))
    const cmLen = pixelLen / pixelsPerCm
    return cmLen / 100 // convert to meters
}

export function calculateWallArea(wall: Wall, pixelsPerCm: number, heightMeters = DEFAULT_WALL_HEIGHT_METERS): number {
    const length = calculateWallLengthInMeters(wall, pixelsPerCm)
    return length * heightMeters
}

function isSamePoint(p1: Point, p2: Point, tolerancePixels: number): boolean {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < tolerancePixels
}

function isSameWall(w1: Wall, w2: Wall, tolerancePixels: number): boolean {
    // Check both directions
    const sameDir = isSamePoint(w1.start, w2.start, tolerancePixels) && isSamePoint(w1.end, w2.end, tolerancePixels)
    const oppDir = isSamePoint(w1.start, w2.end, tolerancePixels) && isSamePoint(w1.end, w2.start, tolerancePixels)

    return sameDir || oppDir
}

export function compareFloorPlans(before: FloorPlanData, after: FloorPlanData): DiffResult {
    const result: DiffResult = {
        demolition: { walls: [], areaSqMeters: 0 },
        construction: { walls: [], areaSqMeters: 0 },
        unchanged: []
    }

    // Calculate scales
    const scaleBefore = calculateScale(before) || calculateScale(after) || 0 // Fallback to other scale if one missing
    const scaleAfter = calculateScale(after) || calculateScale(before) || 0

    // If no scale, we can't calculate m2 accurately, but we can detect walls. 
    // We'll use a fallback for matching tolerance (e.g. 20cm worth of pixels)
    // If undefined scale, assume 1px = 1cm for matching purposes ONLY to avoid breaking.
    const pixelsPerCmMatch = scaleBefore || 1
    const matchingToleranceCm = 15 // 15 cm tolerance for "same wall"
    const tolerancePixels = matchingToleranceCm * pixelsPerCmMatch

    // 1. Detect Demolition (Walls in BEFORE that are NOT in AFTER)
    before.walls.forEach(oldWall => {
        // Ignore invisible walls if needed, or keeping them if they represent theoretical lines
        // For construction, usually we care about real walls.
        if (oldWall.isInvisible) return

        const existsInAfter = after.walls.some(newWall => isSameWall(oldWall, newWall, tolerancePixels))

        if (!existsInAfter) {
            result.demolition.walls.push(oldWall)
            if (scaleBefore) {
                result.demolition.areaSqMeters += calculateWallArea(oldWall, scaleBefore)
            }
        } else {
            result.unchanged.push(oldWall)
        }
    })

    // 2. Detect Construction (Walls in AFTER that are NOT in BEFORE)
    after.walls.forEach(newWall => {
        if (newWall.isInvisible) return

        const existsInBefore = before.walls.some(oldWall => isSameWall(newWall, oldWall, tolerancePixels))

        if (!existsInBefore) {
            result.construction.walls.push(newWall)
            if (scaleAfter) {
                result.construction.areaSqMeters += calculateWallArea(newWall, scaleAfter)
            }
        }
    })

    // Round to 2 decimals
    result.demolition.areaSqMeters = Math.round(result.demolition.areaSqMeters * 100) / 100
    result.construction.areaSqMeters = Math.round(result.construction.areaSqMeters * 100) / 100

    return result
}
