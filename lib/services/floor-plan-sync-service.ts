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
    disabledCeramicWalls?: string[]
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

function normalizeRoomType(room: any): string {
    const rawType = room?.type || ""
    const rawName = room?.name || ""

    // Combinamos nombre y tipo, y normalizamos quitando tildes para facilitar la búsqueda
    const searchString = `${rawName} ${rawType}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()

    if (!searchString) return "Otro"

    if (searchString.includes("bano") || searchString.includes("aseo") || searchString.includes("ducha")) return "Baño"
    if (searchString.includes("cocina")) return "Cocina"
    if (searchString.includes("salon") || searchString.includes("estar") || searchString.includes("comedor")) return "Salón"
    if (searchString.includes("dormitorio") || searchString.includes("habitacion") || searchString.includes("cuarto")) return "Dormitorio"
    if (searchString.includes("pasillo") || searchString.includes("distribuidor")) return "Pasillo"
    if (searchString.includes("hall") || searchString.includes("entrada") || searchString.includes("recibidor") || searchString.includes("vestibulo")) return "Hall"
    if (searchString.includes("terraza") || searchString.includes("balcon") || searchString.includes("patio") || searchString.includes("tendedero") || searchString.includes("galeria")) return "Terraza"
    if (searchString.includes("trastero") || searchString.includes("almacen") || searchString.includes("despensa") || searchString.includes("lavadero")) return "Trastero"
    if (searchString.includes("vestidor")) return "Vestidor"

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
    const normalizedType = normalizeRoomType(room)
    const rawName = (room.name || "").trim()

    // Si el nombre ya contiene un número (ej: "Dormitorio 2"), lo respetamos
    if (/\d/.test(rawName)) return capitalizeWords(rawName)

    // Si es un tipo que normalmente es único en una casa, usamos su nombre sin numerar
    if (["Cocina", "Salón", "Hall", "Vestidor", "Trastero", "Terraza"].includes(normalizedType)) {
        return capitalizeWords(rawName || normalizedType)
    }

    // Para el resto (Baños, Dormitorios, Pasillos, etc.), comprobamos si hay varios del mismo tipo normalizado
    const sameTypeRooms = allRooms.filter(r => normalizeRoomType(r) === normalizedType)

    // Si solo hay 1 en toda la casa, no le ponemos número
    if (sameTypeRooms.length <= 1) return capitalizeWords(rawName || normalizedType)

    // Si hay varios, buscamos qué índice ocupa este dentro de los de su tipo
    const indexInType = sameTypeRooms.findIndex(r => r === room) + 1

    // Usamos el nombre base y le añadimos el número
    const baseName = capitalizeWords(normalizedType === "Otro" ? rawName : normalizedType)
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

import { calculateRoomStats, isPointOnSegment, calculatePolygonSignedArea } from "@/lib/utils/geometry"

export function mapEditorRoomsToCalculator(editorData: any, isBefore: boolean, standardHeight: number = 2.8): Room[] {
    if (!editorData || !editorData.rooms || editorData.rooms.length === 0) return []

    // Filtrar habitaciones insignificantes (< 0.05 m²) que suelen ser errores de detección o habitación técnica "Otras ventanas" mal formada
    const validRooms = editorData.rooms.filter((r: any) => (r.area || 0) > 0.05)

    if (validRooms.length === 0) {
        console.warn("[SYNC] No se encontraron habitaciones con área significativa (>0.05 m²)")
        return []
    }

    const roomTypeCounts: { [key: string]: number } = {}

    // 1. Mapear qué muros pertenecen a qué habitaciones (Pre-calculado para asignar puertas correctamente)
    const wallToRoomsMap = new Map<string, string[]>()
    validRooms.forEach((r: any) => {
        r.walls?.forEach((wId: string) => {
            const roomIds = wallToRoomsMap.get(wId) || []
            roomIds.push(r.id)
            wallToRoomsMap.set(wId, roomIds)
        })
    })

    return validRooms.map((editorRoom: any, i: number) => {
        roomTypeCounts[editorRoom.type] = (roomTypeCounts[editorRoom.type] || 0) + 1

        const normalizedType = normalizeRoomType(editorRoom)
        const roomName = formatRoomName(editorRoom, i, editorData.rooms)

        const getDefaultMaterials = (normType: string, isBeforeState: boolean): { floor: import("@/types/calculator").FloorMaterialType, wall: import("@/types/calculator").WallMaterialType, removeWallTiles: boolean, removeFloor: boolean } => {
            if (
                normType === "Baño" ||
                normType === "Cocina"
            ) {
                return { floor: isBeforeState ? "Cerámica" : "Cerámico", wall: "Cerámica", removeWallTiles: isBeforeState, removeFloor: isBeforeState }
            }

            if (normType === "Terraza" || normType === "Balcón") {
                return { floor: isBeforeState ? "Cerámica" : "Cerámico", wall: "No se modifica", removeWallTiles: false, removeFloor: isBeforeState }
            }

            if (isBeforeState) {
                return { floor: "Parquet flotante", wall: "Pintura", removeWallTiles: false, removeFloor: true }
            } else {
                return { floor: "Parquet flotante", wall: "Lucir y pintar", removeWallTiles: false, removeFloor: false }
            }
        }

        const defaultMaterials = getDefaultMaterials(normalizedType, isBefore)

        // IMPORTANTE: Sobrescribir materiales si vienen marcados desde el editor (Ej: H2 con paredes cerámicas)
        if (editorRoom.hasCeramicFloor === true) {
            defaultMaterials.floor = isBefore ? "Cerámica" : "Cerámico"
            if (isBefore) defaultMaterials.removeFloor = true
        } else if (editorRoom.hasCeramicFloor === false) {
            defaultMaterials.floor = "Parquet flotante"
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
            polygon.forEach((p: any, idx: number) => {
                const p1 = p;
                const p2 = polygon[(idx + 1) % polygon.length];
                const midP = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

                const wall = editorData.walls.find((w: any) => isPointOnSegment(midP, w.start, w.end, 1.0));
                if (wall && !roomWalls.includes(wall.id)) {
                    roomWalls.push(wall.id);
                }
            });
        }

        // Helper para verificar si un punto está en el perímetro de una habitación
        const isPointOnRoomBoundary = (pt: { x: number, y: number }, room: any) => {
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
            editorData.doors.forEach((d: any) => {
                if (roomWalls.includes(d.wallId)) {
                    const wall = editorData.walls?.find((w: any) => w.id === d.wallId);
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
                        const r = editorData.rooms.find((room: any) => room.id === roomId);
                        if (!r) return false;
                        if (!r.polygon && !r.points) return true; // Fallback
                        return isPointOnRoomBoundary(doorCenter, r);
                    });

                    if (trueHostRoomIds.length > 1) {
                        // Muro compartido real. Heurística: asignar a la habitación que NO sea pasillo/hall
                        const otherRoomId = trueHostRoomIds.find(id => id !== editorRoom.id);
                        const otherRoom = editorData.rooms.find((r: any) => r.id === otherRoomId);
                        const otherType = normalizeRoomType(otherRoom || {});

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

                    // Detección de puerta de Entrada refinada:
                    // Es puerta principal si físicamente solo da a 1 habitación (muro exterior), 
                    // NO es una corredera y está en un Hall o Pasillo.
                    const isEntrance = trueHostRoomIds.length === 1 &&
                        (doorType === "Abatible" || doorType === "Doble abatible") &&
                        (normalizedType === "Hall" || normalizedType === "Pasillo")

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
            editorData.windows.forEach((w: any) => {
                if (roomWalls.includes(w.wallId)) {
                    const openType = w.openType || "single"
                    const isBalcony = openType === "balcony"
                    const isSingle = openType === "single"
                    const isSliding = w.isOpenSliding || openType === "sliding"

                    const isFixed = w.isFixed || openType === "fixed"
                    windowList.push({
                        id: crypto.randomUUID(),
                        type: isFixed ? "Fija" : (isSliding ? "Corredera" : "Oscilo-Batiente"),
                        opening: isFixed ? "Fija" : (isSliding ? "Corredera" : "Oscilo-Batiente"),
                        material: "PVC", // Default
                        width: isBalcony ? 0.82 : (isSingle || openType === "fixed") && !w.width ? 1.00 : (w.width || 120) / 100,
                        height: isBalcony ? 2.10 : (isSingle || openType === "fixed") && !w.height ? 1.00 : (w.height || 120) / 100,
                        hasBlind: true,
                        color: "Blanco",
                        glassType: isBalcony ? "Puerta Balcón" : (isSingle || openType === "fixed" ? "Sencillo" : "Doble"),
                        hasMosquitera: false,
                        description: `Ventana ${isSingle || openType === "fixed" ? 'Sencilla' : (isBalcony ? 'Puerta Balcón' : 'Doble')} importada`
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
        let ceramicWallPerimeter: number | undefined = undefined
        let nonCeramicWallPerimeter: number | undefined = undefined
        let nonCeramicWallMaterial: string | undefined = undefined
        const roomPolygon = editorRoom.polygon || editorRoom.points
        if (roomPolygon && roomPolygon.length > 0 && editorData.walls) {
            try {
                const geoRoom = {
                    id: editorRoom.id,
                    name: editorRoom.name,
                    polygon: roomPolygon,
                    area: editorRoom.area,
                    color: "",
                    walls: editorRoom.walls || [],
                    hasCeramicWalls: editorRoom.hasCeramicWalls,
                    disabledCeramicWalls: editorRoom.disabledCeramicWalls
                }
                const stats = calculateRoomStats(geoRoom, editorData.walls || [], editorData.shunts || [])
                if (stats && stats.totalPerimeter && !isNaN(stats.totalPerimeter)) {
                    calculatedPerimeter = stats.totalPerimeter
                }
                // Cerámica parcial: si hay paredes desactivadas, calcular perímetros cerámico vs no cerámico
                if (
                    stats &&
                    editorRoom.hasCeramicWalls &&
                    editorRoom.disabledCeramicWalls &&
                    editorRoom.disabledCeramicWalls.length > 0 &&
                    stats.ceramicWallLength > 0
                ) {
                    ceramicWallPerimeter = stats.ceramicWallLength
                    nonCeramicWallPerimeter = Math.max(0, (stats.totalPerimeter || calculatedPerimeter) - stats.ceramicWallLength)
                    // Material por defecto según tipo de estancia y fase
                    nonCeramicWallMaterial = isBefore ? "Pintura" : "Lucir y pintar"
                    console.log(`[SYNC] Cerámica parcial en ${normalizedType}: cerámico=${ceramicWallPerimeter.toFixed(2)}m, no-cerámico=${nonCeramicWallPerimeter.toFixed(2)}m, material resto=${nonCeramicWallMaterial}`)
                }
            } catch (e) {
                console.error("Error calculating precise perimeter for room", editorRoom.name, e)
            }
        }

        // 4. Determinar Area y Perímetro Finales
        // Priorizamos los valores nativos del editor si están disponibles (> 0)
        let finalArea = editorRoom.area || 0
        if (finalArea === 0 && roomPolygon && roomPolygon.length >= 3) {
            // Si el área viene vacía del editor, la calculamos desde el polígono
            finalArea = Math.abs(calculatePolygonSignedArea(roomPolygon))
        }

        let finalPerimeter = editorRoom.perimeterArea || 0
        if (finalPerimeter === 0 || isNaN(finalPerimeter)) {
            // Si no hay perímetro en el editor, usamos el calculado geométricamente
            finalPerimeter = calculatedPerimeter
        } else {
            // Si hay perímetro en el editor, lo mantenemos. 
            // Comprobamos si la diferencia es extrema solo por salud de datos,
            // pero el usuario manda.
            const diff = Math.abs(finalPerimeter - calculatedPerimeter)
            if (diff > finalPerimeter * 0.5 && calculatedPerimeter > 0) {
                console.warn(`[SYNC] Gran discrepancia en perímetro (${roomName}): Editor=${finalPerimeter} vs Calc=${calculatedPerimeter}. Usando calculado.`)
                finalPerimeter = calculatedPerimeter
            }
        }

        return {
            id: crypto.randomUUID(),
            type: normalizedType as any,
            number: roomTypeCounts[editorRoom.type],
            width: 0, // Not perfectly accurate from 2D points alone
            length: 0,
            area: parseFloat(finalArea.toFixed(2)),
            perimeter: parseFloat(finalPerimeter.toFixed(2)),
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
            falseCeiling: editorRoom.falseCeiling || false,
            lowerCeiling: editorRoom.falseCeiling || false,
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
            // Cerámica parcial: perímetros y material complementario (solo cuando hay disabledCeramicWalls)
            ceramicWallPerimeter,
            nonCeramicWallPerimeter,
            nonCeramicWallArea: nonCeramicWallPerimeter !== undefined ? parseFloat((nonCeramicWallPerimeter * standardHeight).toFixed(2)) : undefined,
            nonCeramicWallMaterial: nonCeramicWallMaterial as any,
            // tiledWallSurfaceArea: m² exactos de cerámica (para bloqueAvanzado del UI y budget-generator)
            tiledWallSurfaceArea: ceramicWallPerimeter !== undefined
                ? parseFloat((ceramicWallPerimeter * standardHeight).toFixed(2))
                : undefined,
        }
    })
}

// === LÓGICA DE DETECCIÓN DE TABIQUES (DERRIBO Y NUEVA CONSTRUCCIÓN) ===
// Comparamos muros de Antes vs Después para calcular metros cuadrados de diferencia.

export function calculateWallDifferences(beforeData: EditorData | null, afterData: EditorData | null, defaultHeight: number = 2.50): { demolishedM2: number, newConstructedM2: number } {
    if (!beforeData?.walls || !afterData?.walls) return { demolishedM2: 0, newConstructedM2: 0 }

    const tol = 10.0 // Tolerancia en cm para considerar que dos puntos son el mismo

    const isSameWallPoint = (p1: any, p2: any) => {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < tol
    }

    // Calcula la longitud en metros de un muro
    const wallLengthM = (w: any) => {
        return Math.sqrt(Math.pow(w.end.x - w.start.x, 2) + Math.pow(w.end.y - w.start.y, 2)) / 100 // asumiendo coords en cm
    }

    // Identificar muros del "Antes" geométricamente
    let demolishedLengthM = 0
    let newLengthM = 0

    // Muros "Antes" que NO existen en el "Después" -> Demolidos
    beforeData.walls.forEach(wBefore => {
        // En lugar de comparar solo vértices, que pueden estar cortados,
        // haríamos una comparación de intersección, pero por eficiencia y casuísticas complejas
        // hacemos un chequeo heurístico simplificado:
        // Buscamos si todo el segmento wBefore está cubierto por segmentos en afterData

        // Enfoque robusto simplificado para presupuestos:
        // Comparamos si un muro de antes tiene al menos un muro colineal montado encima en el "después".
        // Si no detecta nada encima, es que se demolió por completo.

        let foundOverlap = false

        // Helper para ver si un punto p está sobre un segmento a-b
        const isPointOnSegment = (p: any, a: any, b: any, tolerance = 5.0) => {
            const dist = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
            if (dist < 0.1) return false
            const crossProduct = Math.abs((p.y - a.y) * (b.x - a.x) - (p.x - a.x) * (b.y - a.y))
            if (crossProduct / dist > tolerance) return false
            const dotProduct = (p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)
            if (dotProduct < -tolerance) return false
            if (dotProduct > dist * dist + tolerance) return false
            return true
        }

        const midPoint = {
            x: (wBefore.start.x + wBefore.end.x) / 2,
            y: (wBefore.start.y + wBefore.end.y) / 2
        }

        const overlapWall = afterData.walls.find(wAfter =>
            isPointOnSegment(midPoint, wAfter.start, wAfter.end, 8.0)
        )

        if (!overlapWall) {
            demolishedLengthM += wallLengthM(wBefore)
        }
    })

    // Muros "Después" que NO existen en el "Antes" -> Construidos
    afterData.walls.forEach(wAfter => {
        const isPointOnSegment = (p: any, a: any, b: any, tolerance = 5.0) => {
            const dist = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
            if (dist < 0.1) return false
            const crossProduct = Math.abs((p.y - a.y) * (b.x - a.x) - (p.x - a.x) * (b.y - a.y))
            if (crossProduct / dist > tolerance) return false
            const dotProduct = (p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)
            if (dotProduct < -tolerance) return false
            if (dotProduct > dist * dist + tolerance) return false
            return true
        }

        const midPoint = {
            x: (wAfter.start.x + wAfter.end.x) / 2,
            y: (wAfter.start.y + wAfter.end.y) / 2
        }

        const overlapWall = beforeData.walls.find(wBefore =>
            isPointOnSegment(midPoint, wBefore.start, wBefore.end, 8.0)
        )

        if (!overlapWall) {
            newLengthM += wallLengthM(wAfter)
        }
    })

    return {
        demolishedM2: parseFloat((demolishedLengthM * defaultHeight).toFixed(2)),
        newConstructedM2: parseFloat((newLengthM * defaultHeight).toFixed(2))
    }
}
