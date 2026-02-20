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

function normalizeRoomType(type: string | undefined): any {
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

        const variant = planType === 'before' ? 'current' : 'proposal'

        // Intentar primero con la columna moderna 'variant'
        let { data: planData, error } = await supabase
            .from("project_floor_plans")
            .select("id, name, data")
            .eq("project_id", projectId)
            .eq("variant", variant)
            .single()

        // Si falla por columna inexistente o no encuentra datos, intentar con la columna legacy 'plan_type'
        if (error || !planData) {
            console.log(`[SYNC] No se encontró plano con variant='${variant}', intentando con plan_type='${planType}'...`)
            const { data: legacyData, error: legacyError } = await supabase
                .from("project_floor_plans")
                .select("id, name, data")
                .eq("project_id", projectId)
                .eq("plan_type", planType)
                .single()

            if (legacyError) {
                if (legacyError.code === 'PGRST116') return null
                throw legacyError
            }
            planData = legacyData
        }

        return planData
    } catch (error) {
        console.error(`Error fetching ${planType} plan data:`, error)
        throw error
    }
}

import { calculateRoomStats, isPointOnSegment } from "@/lib/utils/geometry"

export function mapEditorRoomsToCalculator(editorData: EditorData, isBefore: boolean): Room[] {
    if (!editorData || !editorData.rooms || editorData.rooms.length === 0) return []

    const roomTypeCounts: { [key: string]: number } = {}

    // 1. Mapear qué muros pertenecen a qué habitaciones (Pre-calculado para asignar puertas correctamente)
    const wallToRoomsMap = new Map<string, string[]>()
    editorData.rooms.forEach(r => {
        r.walls?.forEach(wId => {
            const roomIds = wallToRoomsMap.get(wId) || []
            roomIds.push(r.id)
            wallToRoomsMap.set(wId, roomIds)
        })
    })

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

        const doorList: any[] = []
        const windowList: any[] = []

        const roomWalls = [...(editorRoom.walls || [])]

        // Fallback: Si no hay muros registrados, intentar identificarlos geométricamente usando el polígono
        if (roomWalls.length === 0 && (editorRoom.polygon || editorRoom.points) && editorData.walls) {
            const polygon = editorRoom.polygon || editorRoom.points || []
            polygon.forEach((p, idx) => {
                const p1 = p;
                const p2 = polygon[(idx + 1) % polygon.length];
                const midP = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

                const wall = editorData.walls.find(w => isPointOnSegment(midP, w.start, w.end, 1.0));
                if (wall && !roomWalls.includes(wall.id)) {
                    roomWalls.push(wall.id);
                }
            });
        }

        // Helper para verificar si un punto está en el perímetro de una habitación
        const isPointOnRoomBoundary = (pt: { x: number, y: number }, room: EditorRoom) => {
            const polygon = room.polygon || room.points || [];
            if (polygon.length < 3) return false;
            for (let i = 0; i < polygon.length; i++) {
                const p1 = polygon[i];
                const p2 = polygon[(i + 1) % polygon.length];
                if (isPointOnSegment(pt, p1, p2, 5.0)) return true;
            }
            return false;
        };

        // --- INICIO MAPEO DE PUERTAS REFINADO ---
        // 2. Determinar qué puertas pertenecen a ESTA habitación exclusivamente
        if (editorData.doors) {
            editorData.doors.forEach(d => {
                if (roomWalls.includes(d.wallId)) {
                    const wall = editorData.walls?.find(w => w.id === d.wallId);
                    if (!wall || d.t === undefined) return;

                    const doorCenter = {
                        x: wall.start.x + (wall.end.x - wall.start.x) * d.t,
                        y: wall.start.y + (wall.end.y - wall.start.y) * d.t
                    };

                    // Verificar numéricamente que la puerta está real y físicamente en el perímetro de ESTA habitación
                    if ((editorRoom.polygon || editorRoom.points) && !isPointOnRoomBoundary(doorCenter, editorRoom)) {
                        return; // La puerta comparte un id de muro continuo pero su posición física no toca esta habitación
                    }

                    // Encontrar las habitaciones que comparten este muro y están físicamente tocando la puerta
                    const potentialRoomIds = wallToRoomsMap.get(d.wallId) || [];
                    const trueHostRoomIds = potentialRoomIds.filter(roomId => {
                        const r = editorData.rooms.find(room => room.id === roomId);
                        if (!r) return false;
                        if (!r.polygon && !r.points) return true; // Fallback
                        return isPointOnRoomBoundary(doorCenter, r);
                    });

                    if (trueHostRoomIds.length > 1) {
                        // Muro compartido real. Heurística: asignar a la habitación que NO sea pasillo/hall
                        const otherRoomId = trueHostRoomIds.find(id => id !== editorRoom.id);
                        const otherRoom = editorData.rooms.find(r => r.id === otherRoomId);
                        const otherType = normalizeRoomType(otherRoom?.type);

                        // Si la habitación actual es un pasillo/hall y la otra NO, la puerta suele pertenecer a la otra (abre hacia dentro)
                        if ((normalizedType === "Hall" || normalizedType === "Pasillo") && (otherType !== "Hall" && otherType !== "Pasillo")) {
                            return // No se la asignamos a esta (pasillo), se la asignamos a la otra
                        }

                        // Si ambas son pasillos o ambas son normales, simplemente la asignamos a la habitación con ID menor para evitar duplicados
                        if (editorRoom.id > (otherRoomId || "")) {
                            return // Se la asignará la otra habitación
                        }
                    }

                    // Si llegamos aquí, la puerta se asigna a esta habitación
                    let doorType: string = "Abatible"
                    const openType = d.openType || "single"

                    if (openType === "double" || openType === "double_swing") {
                        doorType = "Doble abatible"
                    } else if (openType === "sliding" || openType === "sliding_pocket") {
                        doorType = "Corredera empotrada"
                    } else if (openType === "sliding_rail") {
                        doorType = "Corredera exterior con carril"
                    } else if (openType === "exterior_sliding") {
                        doorType = "Corredera exterior"
                    }

                    // Detección de puerta de Entrada:
                    // Es puerta principal si físicamente solo da a 1 habitación (muro exterior) y NO es una corredera
                    const isEntrance = trueHostRoomIds.length === 1 && (doorType === "Abatible" || doorType === "Doble abatible")

                    doorList.push({
                        id: crypto.randomUUID(),
                        type: doorType,
                        width: (d.width || 82) / 100, // cm to m
                        height: (d.height || 205) / 100, // cm to m
                        isEntrance: isEntrance
                    })
                }
            })
        }
        // --- FIN MAPEO DE PUERTAS REFINADO ---

        if (editorData.windows) {
            editorData.windows.forEach(w => {
                if (roomWalls.includes(w.wallId)) {
                    const openType = w.openType || "single"
                    const isBalcony = openType === "balcony"
                    const isSingle = openType === "single"
                    const isSliding = w.isOpenSliding || openType === "sliding"

                    windowList.push({
                        id: crypto.randomUUID(),
                        type: w.isFixed ? "Fija" : (isSliding ? "Corredera" : "Oscilo-Batiente"),
                        opening: w.isFixed ? "Fija" : (isSliding ? "Corredera" : "Oscilo-Batiente"),
                        material: "PVC", // Default
                        width: isBalcony ? 0.82 : isSingle && !w.width ? 1.00 : (w.width || 120) / 100,
                        height: isBalcony ? 2.10 : isSingle && !w.height ? 1.00 : (w.height || 120) / 100,
                        hasBlind: true,
                        color: "Blanco",
                        glassType: isBalcony ? "Puerta Balcón" : (isSingle ? "Sencillo" : "Doble"),
                        hasMosquitera: false,
                        description: `Ventana ${isSingle ? 'Sencilla' : (isBalcony ? 'Puerta Balcón' : 'Doble')} importada`
                    })
                }
            })
        }

        let doorsCount = doorList.length
        const windowsCount = windowList.length

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
                    color: "",
                    walls: editorRoom.walls || []
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
            doorList: doorList,
            windows: windowList,
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
            newDoors: !isBefore && doorList.length > 0,
            newDoorList: !isBefore && doorList.length > 0 ? doorList : undefined,
        }
    })
}
