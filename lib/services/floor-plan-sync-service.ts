import { getSupabase } from "@/lib/supabase/client"
import type { Room } from "@/types/calculator"

interface EditorRoom {
    id: string
    name: string
    type: string
    area: number
    perimeterArea: number
    walls: string[]
    points?: { x: number; y: number }[]
    polygon?: { x: number; y: number }[]
    ceilingHeight?: number
    hasCeramicFloor?: boolean
    hasCeramicWalls?: boolean
}

interface EditorData {
    rooms: EditorRoom[]
    walls: any[]
    doors: any[]
    windows: any[]
    shunts: any[]
}

const TIPOS_SIN_NUMERAR = [
    "cocina", "cocina_americana", "cocina_abierta", "salon", "salón", "comedor",
    "pasillo", "terraza", "balcon", "balcón", "cocina americana", "cocina ampliada", "salón comedor",
]

const CORRECCIONES_ORTOGRAFICAS: { [key: string]: string } = {
    bano: "Baño", banos: "Baños", salon: "Salón", balcon: "Balcón", rincon: "Rincón",
    sotano: "Sótano", desvan: "Desván", jardin: "Jardín", cocina_americana: "Cocina Americana",
    cocina_abierta: "Cocina Abierta", hall: "Hall", hll: "Hall", entrada: "Hall",
    dormitorio: "Dormitorio", trastero: "Trastero", vestidor: "Vestidor", pasillo: "Pasillo", otro: "Otro",
}

function normalizeRoomType(type: string): any {
    if (!type) return "Otro"
    const lowerType = type.toLowerCase().trim()
    if (lowerType.includes("bano")) return "Baño"
    if (lowerType.includes("cocina")) return "Cocina"
    if (lowerType.includes("salon")) return "Salón"
    if (lowerType.includes("dormitorio")) return "Dormitorio"
    if (lowerType.includes("pasillo") || lowerType.includes("distribuidor")) return "Pasillo"
    if (lowerType === "hall" || lowerType === "hll" || lowerType.includes("entrada") || lowerType.includes("recibidor")) return "Hall"
    if (lowerType.includes("terraza") || lowerType.includes("balcon")) return "Terraza"
    if (lowerType.includes("trastero")) return "Trastero"
    if (lowerType.includes("vestidor")) return "Vestidor"

    for (const [key, value] of Object.entries(CORRECCIONES_ORTOGRAFICAS)) {
        if (lowerType.includes(key)) return value
    }

    return "Otro"
}

function capitalizeWords(str: string): string {
    if (!str) return ""
    const withSpaces = str.replace(/_/g, " ")
    return withSpaces.split(" ").map((word) => {
        const lowerWord = word.toLowerCase()
        if (CORRECCIONES_ORTOGRAFICAS[lowerWord]) return CORRECCIONES_ORTOGRAFICAS[lowerWord]
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    }).join(" ")
}

function formatRoomName(room: any, index: number, allRooms: any[]): string {
    const type = (room.type || "").toLowerCase().trim()
    const name = (room.name || "").toLowerCase().trim()

    if (/\d/.test(room.name || "")) return capitalizeWords(room.name)
    if (TIPOS_SIN_NUMERAR.some((t) => type.includes(t) || name.includes(t))) return capitalizeWords(room.name || room.type)

    const sameTypeRooms = allRooms.filter((r) => (r.type || "").toLowerCase().trim() === type)
    if (sameTypeRooms.length <= 1) return capitalizeWords(room.name || room.type)

    const indexInType = sameTypeRooms.findIndex((r) => r === room) + 1
    const baseName = capitalizeWords(room.type)
    return `${baseName} ${indexInType}`
}

export async function getProjectFloorPlanData(projectId: string, planType: 'before' | 'after') {
    try {
        const supabase = await getSupabase()
        if (!supabase) throw new Error("No se pudo conectar a la base de datos")

        const { data: planData, error } = await supabase
            .from("project_floor_plans")
            .select("id, name, data")
            .eq("project_id", projectId)
            .eq("plan_type", planType)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                // No plan found for this type
                return null
            }
            throw error
        }

        return planData
    } catch (error) {
        console.error(`Error fetching ${planType} plan data:`, error)
        throw error
    }
}

import { calculateRoomStats } from "@/lib/utils/geometry"

export function mapEditorRoomsToCalculator(editorData: EditorData, isBefore: boolean): Room[] {
    if (!editorData || !editorData.rooms || editorData.rooms.length === 0) return []

    const roomTypeCounts: { [key: string]: number } = {}

    return editorData.rooms.map((editorRoom, i) => {
        roomTypeCounts[editorRoom.type] = (roomTypeCounts[editorRoom.type] || 0) + 1

        const normalizedType = normalizeRoomType(editorRoom.type)
        const roomName = formatRoomName(editorRoom, i, editorData.rooms)

        const getDefaultMaterials = (roomType: string | undefined, isBeforeState: boolean): { floor: import("@/types/calculator").FloorMaterialType, wall: import("@/types/calculator").WallMaterialType, removeWallTiles: boolean, removeFloor: boolean } => {
            if (!roomType) {
                return isBeforeState
                    ? { floor: "Madera", wall: "Pintura", removeWallTiles: false, removeFloor: true }
                    : { floor: "Parquet flotante", wall: "Lucir y pintar", removeWallTiles: false, removeFloor: false };
            }

            const typeLower = roomType
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim()

            if (
                typeLower.includes("bano") ||
                typeLower.includes("cocina") ||
                typeLower.includes("aseo") ||
                typeLower.includes("ducha")
            ) {
                return { floor: isBeforeState ? "Cerámica" : "Cerámico", wall: "Cerámica", removeWallTiles: isBeforeState, removeFloor: isBeforeState }
            }

            if (typeLower.includes("terraza") || typeLower.includes("balcon")) {
                return { floor: isBeforeState ? "Cerámica" : "Cerámico", wall: "No se modifica", removeWallTiles: false, removeFloor: isBeforeState }
            }

            if (isBeforeState) {
                return { floor: "Madera", wall: "Pintura", removeWallTiles: false, removeFloor: true }
            } else {
                return { floor: "Parquet flotante", wall: "Lucir y pintar", removeWallTiles: false, removeFloor: false }
            }
        }

        const defaultMaterials = getDefaultMaterials(editorRoom.type, isBefore)

        // IMPORTANTE: Sobrescribir materiales si vienen marcados desde el editor (Ej: H2 con paredes cerámicas)
        if (editorRoom.hasCeramicFloor === true) {
            defaultMaterials.floor = isBefore ? "Cerámica" : "Cerámico"
            if (isBefore) defaultMaterials.removeFloor = true
        } else if (editorRoom.hasCeramicFloor === false) {
            defaultMaterials.floor = isBefore ? "Madera" : "Parquet flotante"
        }

        if (editorRoom.hasCeramicWalls === true) {
            defaultMaterials.wall = "Cerámica"
            if (isBefore) defaultMaterials.removeWallTiles = true
        } else if (editorRoom.hasCeramicWalls === false) {
            defaultMaterials.wall = isBefore ? "Pintura" : "Lucir y pintar"
            if (isBefore) defaultMaterials.removeWallTiles = false
        }

        // Calculate windows and doors for this specific room based on the walls it shares
        let doorsCount = 0
        let windowsCount = 0

        if (editorRoom.walls && editorRoom.walls.length > 0) {
            if (editorData.doors) {
                doorsCount = editorData.doors.filter(d => editorRoom.walls.includes(d.wallId)).length
            }
            if (editorData.windows) {
                windowsCount = editorData.windows.filter(w => editorRoom.walls.includes(w.wallId)).length
            }
        }

        // Default to at least 1 door if not detected but it's not a terrace
        if (doorsCount === 0 && normalizedType !== "Terraza" && normalizedType !== "Balcón") {
            doorsCount = 1
        }

        // Calculate precise perimeter using geometry utils (wall subtraction, column additions, etc.)
        let calculatedPerimeter = editorRoom.perimeterArea || 0
        const roomPolygon = editorRoom.polygon || editorRoom.points
        if (roomPolygon && roomPolygon.length > 0 && editorData.walls) {
            try {
                const geoRoom = {
                    id: editorRoom.id,
                    name: editorRoom.name,
                    polygon: roomPolygon,
                    area: editorRoom.area,
                    color: ""
                }
                const stats = calculateRoomStats(geoRoom, editorData.walls || [], editorData.shunts || [])
                if (stats && stats.totalPerimeter && !isNaN(stats.totalPerimeter)) {
                    calculatedPerimeter = stats.totalPerimeter
                }
            } catch (e) {
                console.error("Error calculating precise perimeter for room", editorRoom.name, e)
            }
        }

        return {
            id: crypto.randomUUID(),
            type: normalizedType as any,
            number: roomTypeCounts[editorRoom.type],
            width: 0, // Not perfectly accurate from 2D points alone
            length: 0,
            area: editorRoom.area || 0,
            perimeter: calculatedPerimeter,
            wallSurface: 0, // Calculator will compute this
            wallArea: 0,
            ceilingArea: 0,
            ceilingMaterial: "Pintura",
            removeWallMaterial: defaultMaterials.removeWallTiles,
            removeCeilingMaterial: false,
            floorMaterial: defaultMaterials.floor,
            wallMaterial: defaultMaterials.wall,
            hasDoors: doorsCount > 0,
            doors: doorsCount,
            windows: [], // Calculator expects an array of Window objects, not a number
            falseCeiling: false,
            moldings: false,
            demolishWall: false,
            demolishCeiling: false,
            removeFloor: defaultMaterials.removeFloor,
            removeWallTiles: defaultMaterials.removeWallTiles,
            removeBathroomElements: isBefore && normalizedType === "Baño",
            removeKitchenFurniture: isBefore && normalizedType === "Cocina",
            removeBedroomFurniture: false,
            removeSewagePipes: isBefore && normalizedType === "Baño",
            hasRadiator: false,
            measurementMode: "area-perimeter",
            name: roomName,
            customRoomType: normalizedType === "Otro" ? editorRoom.name : undefined,
        }
    })
}
