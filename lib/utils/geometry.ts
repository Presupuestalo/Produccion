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
    offsetMode?: 'center' | 'outward' | 'inward'
}

export interface Room {
    id: string
    name: string
    polygon: Point[]
    area: number
    color: string
    visualCenter?: Point
    hasCeramicFloor?: boolean
    hasCeramicWalls?: boolean
    disabledCeramicWalls?: string[]
}

export function rotatePoint(point: Point, center: Point, angleDegrees: number): Point {
    const radians = (angleDegrees * Math.PI) / 180
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)
    const dx = point.x - center.x
    const dy = point.y - center.y
    return {
        x: center.x + (dx * cos - dy * sin),
        y: center.y + (dx * sin + dy * cos)
    }
}

export function calculateBoundingBox(walls: Wall[], rooms: Room[]): { min: Point, max: Point, center: Point } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    if (walls.length === 0 && rooms.length === 0) {
        return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 }, center: { x: 0, y: 0 } }
    }

    walls.forEach(w => {
        minX = Math.min(minX, w.start.x, w.end.x)
        minY = Math.min(minY, w.start.y, w.end.y)
        maxX = Math.max(maxX, w.start.x, w.end.x)
        maxY = Math.max(maxY, w.start.y, w.end.y)
    })

    rooms.forEach(r => {
        r.polygon.forEach(p => {
            minX = Math.min(minX, p.x)
            minY = Math.min(minY, p.y)
            maxX = Math.max(maxX, p.x)
            maxY = Math.max(maxY, p.y)
        })
    })

    return {
        min: { x: minX, y: minY },
        max: { x: maxX, y: maxY },
        center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
    }
}

export function isSamePoint(p1: Point, p2: Point, tolerance = 1.0): boolean {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < tolerance
}

/**
 * Utilidades geométricas para intersecciones
 */
export function getLineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
    const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y)
    if (denominator === 0) return null

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator

    const EPS = 0.001
    if (ua >= -EPS && ua <= 1 + EPS && ub >= -EPS && ub <= 1 + EPS) {
        return {
            x: p1.x + ua * (p2.x - p1.x),
            y: p1.y + ua * (p2.y - p1.y)
        }
    }
    return null
}

// Helper for point in polygon
export function isPointInPolygon(p: Point, polygon: Point[]) {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y
        const xj = polygon[j].x, yj = polygon[j].y
        const intersect = ((yi > p.y) !== (yj > p.y)) &&
            (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi)
        if (intersect) inside = !inside
    }
    return inside
}

export function calculateRoomStats(room: Room, walls: Wall[], shunts: { x: number, y: number, width: number, height: number }[]) {
    // 1. Identify wall properties for each segment of the polygon
    const segments = room.polygon.map((p1, i) => {
        const p2 = room.polygon[(i + 1) % room.polygon.length]
        const midP = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }

        // Find the wall that contains this segment (using a small tolerance)
        const wall = walls.find(w => isPointOnSegment(midP, w.start, w.end, 3.0))

        return {
            p1, p2,
            len: Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)),
            thickness: wall?.thickness || 10,
            isInvisible: !!wall?.isInvisible
        }
    })

    // 2. Calculate Internal Wall Perimeter
    let wallPerimeter = 0
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]

        // Skip invisible walls entirely as per user request ("restar si no tiene pared")
        if (seg.isInvisible) continue

        const prev = segments[(i - 1 + segments.length) % segments.length]
        const next = segments[(i + 1) % segments.length]

        // Helper to check if two segments form a corner and calculate length reduction
        const getReduction = (sA: any, sB: any, commonP: Point) => {
            // Invisible neighbors don't cause internal face reduction
            if (sB.isInvisible) return 0

            const pA = (isSamePoint(sA.p1, commonP)) ? sA.p2 : sA.p1
            const pB = (isSamePoint(sB.p1, commonP)) ? sB.p2 : sB.p1

            const va = { x: pA.x - commonP.x, y: pA.y - commonP.y }
            const vb = { x: pB.x - commonP.x, y: pB.y - commonP.y }
            const magA = Math.sqrt(va.x ** 2 + va.y ** 2)
            const magB = Math.sqrt(vb.x ** 2 + vb.y ** 2)
            if (magA < 0.1 || magB < 0.1) return 0

            const dot = (va.x * vb.x + va.y * vb.y) / (magA * magB)

            // If dot < -0.99, segments are almost collinear (180 deg), no reduction
            if (dot < -0.99) return 0

            // For now, use 90-degree simplification: internal face is shifted by half thickness
            // A more complex triangulation could be used for arbitrary angles, 
            // but for floor plans this covers the vast majority of cases.
            return sB.thickness / 2
        }

        const red1 = getReduction(seg, prev, seg.p1)
        const red2 = getReduction(seg, next, seg.p2)

        wallPerimeter += Math.max(0, seg.len - red1 - red2)
    }

    // 3. Column (Shunt) Perimeter
    const roomShunts = shunts.filter(s => isPointInPolygon({ x: s.x, y: s.y }, room.polygon))

    let columnPerimeterDisplay = 0
    let columnPerimeterContribution = 0

    roomShunts.forEach(s => {
        // Define faces of the column
        const faces = [
            { p1: { x: s.x - s.width / 2, y: s.y - s.height / 2 }, p2: { x: s.x + s.width / 2, y: s.y - s.height / 2 }, len: s.width }, // Top
            { p1: { x: s.x - s.width / 2, y: s.y + s.height / 2 }, p2: { x: s.x + s.width / 2, y: s.y + s.height / 2 }, len: s.width },  // Bottom
            { p1: { x: s.x - s.width / 2, y: s.y - s.height / 2 }, p2: { x: s.x - s.width / 2, y: s.y + s.height / 2 }, len: s.height }, // Left
            { p1: { x: s.x + s.width / 2, y: s.y - s.height / 2 }, p2: { x: s.x + s.width / 2, y: s.y + s.height / 2 }, len: s.height }  // Right
        ]

        let sumExposed = 0
        let supportedCount = 0

        faces.forEach(face => {
            const midF = { x: (face.p1.x + face.p2.x) / 2, y: (face.p1.y + face.p2.y) / 2 }

            // A face is supported if it touches a wall or another shunt
            // 1. Check contact with walls (account for thickness)
            const isSupportedByWall = walls.some(w => {
                if (w.isInvisible) return false
                const { point: proj } = getClosestPointOnSegment(midF, w.start, w.end)
                const dist = Math.sqrt((midF.x - proj.x) ** 2 + (midF.y - proj.y) ** 2)
                return dist < (w.thickness / 2) + 2.0
            })

            // 2. Check contact with other shunts
            const isSupportedByShunt = shunts.some(os => {
                if (os === s) return false
                const osHalfW = os.width / 2
                const osHalfH = os.height / 2
                const inX = midF.x >= os.x - osHalfW - 1 && midF.x <= os.x + osHalfW + 1
                const inY = midF.y >= os.y - osHalfH - 1 && midF.y <= os.y + osHalfH + 1
                if (!inX || !inY) return false
                const distL = Math.abs(midF.x - (os.x - osHalfW))
                const distR = Math.abs(midF.x - (os.x + osHalfW))
                const distT = Math.abs(midF.y - (os.y - osHalfH))
                const distB = Math.abs(midF.y - (os.y + osHalfH))
                return Math.min(distL, distR, distT, distB) < 2.0
            })

            if (isSupportedByWall || isSupportedByShunt) {
                supportedCount++
            } else {
                sumExposed += face.len
            }
        })

        // DISPLAY (Orange Col): Sum of exposed faces (NOT touching walls/shunts)
        columnPerimeterDisplay += sumExposed

        // CONTRIBUTION (to Total): 
        // Case H2 (Corner): If 2 or more faces are supported, contribution is 0.
        // H1/H3 cases: If fewer than 2 faces supported, add the exposed perimeter.
        if (supportedCount < 2) {
            columnPerimeterContribution += sumExposed
        }
    })

    const wallPerimM = wallPerimeter / 100
    const colPerimM = columnPerimeterContribution / 100
    const colPerimDisplayM = columnPerimeterDisplay / 100

    // 4. Ceramic Wall Length
    let ceramicWallLength = 0
    if (room.hasCeramicWalls) {
        room.polygon.forEach((p1, i) => {
            const p2 = room.polygon[(i + 1) % room.polygon.length]
            const midP = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
            const wall = walls.find(w => isPointOnSegment(midP, w.start, w.end, 4.0))

            // Skip if wall is invisible or segment is disabled
            if (wall?.isInvisible) return
            const segmentId = wall?.id || `seg-${i}`
            if (room.disabledCeramicWalls?.includes(segmentId)) return

            const len = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
            ceramicWallLength += len
        })
    }

    return {
        wallPerimeter: wallPerimM,
        columnPerimeter: colPerimDisplayM, // Orange display
        totalPerimeter: wallPerimM + colPerimM, // Net perimeter
        area: room.area,
        ceramicWallLength: ceramicWallLength / 100,
        hasCeramicFloor: !!room.hasCeramicFloor
    }
}

export function isPointOnSegment(p: Point, a: Point, b: Point, tolerance = 1.0): boolean {
    const dist = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
    if (dist < 0.1) return false

    const area = Math.abs((b.y - a.y) * p.x - (b.x - a.x) * p.y + b.x * a.y - b.y * a.x)
    const height = area / dist

    if (height > tolerance) return false

    const dot = (p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)
    if (dot < -tolerance) return false
    if (dot > dist * dist + tolerance) return false

    return true
}

export function getClosestPointOnSegment(p: Point, a: Point, b: Point): { point: Point, t: number } {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const lenSq = dx * dx + dy * dy
    if (lenSq === 0) return { point: a, t: 0 }

    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq
    t = Math.max(0, Math.min(1, t))

    return {
        point: {
            x: a.x + t * dx,
            y: a.y + t * dy
        },
        t
    }
}

export function getWallAngle(start: Point, end: Point): number {
    return (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI
}

export function getPointOnWall(t: number, start: Point, end: Point): Point {
    return {
        x: start.x + t * (end.x - start.x),
        y: start.y + t * (end.y - start.y)
    }
}
/**
 * Fragmenta un conjunto de muros en segmentos independientes en cada punto de intersección o unión.
 */
export function fragmentWalls(walls: Wall[]): Wall[] {
    const TOLERANCE = 1.0
    const result: Wall[] = []

    walls.forEach((wall, i) => {
        const splitPoints: Point[] = [wall.start, wall.end]

        walls.forEach((other, j) => {
            if (i === j) return

            const intersect = getLineIntersection(wall.start, wall.end, other.start, other.end)
            if (intersect) splitPoints.push(intersect)

            if (isPointOnSegment(other.start, wall.start, wall.end, TOLERANCE)) splitPoints.push(other.start)
            if (isPointOnSegment(other.end, wall.start, wall.end, TOLERANCE)) splitPoints.push(other.end)
        })

        const uniquePoints: Point[] = []
        splitPoints.forEach(p => {
            if (!uniquePoints.some(up => Math.sqrt(Math.pow(up.x - p.x, 2) + Math.pow(up.y - p.y, 2)) < TOLERANCE)) {
                uniquePoints.push(p)
            }
        })

        const dx = wall.end.x - wall.start.x
        const dy = wall.end.y - wall.start.y
        if (Math.abs(dx) > Math.abs(dy)) {
            uniquePoints.sort((a, b) => a.x - b.x)
            if (dx < 0) uniquePoints.reverse()
        } else {
            uniquePoints.sort((a, b) => a.y - b.y)
            if (dy < 0) uniquePoints.reverse()
        }

        for (let k = 0; k < uniquePoints.length - 1; k++) {
            const p1 = uniquePoints[k]
            const p2 = uniquePoints[k + 1]
            if (Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) > TOLERANCE) {
                // Stable ID: if only one segment, keep original ID. If multiple, append index.
                const newId = uniquePoints.length === 2 ? wall.id : `${wall.id}-s${k}`
                result.push({
                    ...wall,
                    id: newId,
                    start: p1,
                    end: p2
                })
            }
        }
    })

    const fragmented = result
    return cleanupAndMergeWalls(fragmented)
}

/**
 * Removes zero-length walls and merges collinear adjacent walls that share 
 * a vertex with no other connections.
 */
export function cleanupAndMergeWalls(walls: Wall[]): Wall[] {
    const TOLERANCE = 0.1 // Reduced from 1.0 to allow finer movements/inversions without deletion

    // 1. Remove zero-length walls
    let processed = walls.filter(w => {
        const len = Math.sqrt(Math.pow(w.end.x - w.start.x, 2) + Math.pow(w.end.y - w.start.y, 2))
        return len > TOLERANCE
    })

    // 2. Pre-cleanup: Remove exact duplicates (overlapping walls)
    // This prevents "annihilation" where two identical walls try to merge into an invalid state
    for (let i = 0; i < processed.length; i++) {
        for (let j = i + 1; j < processed.length; j++) {
            const w1 = processed[i]
            const w2 = processed[j]

            // Check if they are identical (same start/end or swapped start/end)
            const matchDirect = isSamePoint(w1.start, w2.start) && isSamePoint(w1.end, w2.end)
            const matchReverse = isSamePoint(w1.start, w2.end) && isSamePoint(w1.end, w2.start)

            if (matchDirect || matchReverse) {
                // Duplicate found! Remove w2
                processed.splice(j, 1)
                j-- // Adjust index
            }
        }
    }

    let merged = true
    while (merged) {
        merged = false
        for (let i = 0; i < processed.length; i++) {
            for (let j = i + 1; j < processed.length; j++) {
                const w1 = processed[i]
                const w2 = processed[j]

                // Must have same thickness and invisible state
                if (w1.thickness !== w2.thickness || !!w1.isInvisible !== !!w2.isInvisible) continue

                // Check for colinearity
                // Vector 1
                const dx1 = w1.end.x - w1.start.x
                const dy1 = w1.end.y - w1.start.y
                const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)

                // Vector 2
                const dx2 = w2.end.x - w2.start.x
                const dy2 = w2.end.y - w2.start.y
                const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)

                if (len1 < TOLERANCE || len2 < TOLERANCE) continue

                const ux1 = dx1 / len1, uy1 = dy1 / len1
                const ux2 = dx2 / len2, uy2 = dy2 / len2

                // Check dot product (approx 1 or -1 for collinearity)
                const dot = Math.abs(ux1 * ux2 + uy1 * uy2)
                if (dot < 0.999) continue

                // Must share exactly one vertex to be candidates for sequential merge
                let shared: Point | null = null
                let p1: Point | null = null
                let p2: Point | null = null

                if (isSamePoint(w1.end, w2.start)) { shared = w1.end; p1 = w1.start; p2 = w2.end }
                else if (isSamePoint(w1.start, w2.end)) { shared = w1.start; p1 = w1.end; p2 = w2.start }
                else if (isSamePoint(w1.end, w2.end)) { shared = w1.end; p1 = w1.start; p2 = w2.start }
                else if (isSamePoint(w1.start, w2.start)) { shared = w1.start; p1 = w1.end; p2 = w2.end }

                if (shared && p1 && p2) {
                    // Check if they are actually overlapping (one inside the other)
                    // If shared vertex is one end, they extend each other OR overlap.
                    // Since we removed exact duplicates, we just need to check if they "fold back"
                    // If dot product is -1 (opposing directions) and they share start-start, they overlap.
                    // But here dot is abs(), so we need real dot.
                    const realDot = ux1 * ux2 + uy1 * uy2

                    // Case 1: Sequential Merge (Extension)
                    // They proceed in same direction (approx) and share end->start
                    // OR they oppose and share end->end (1->2, 3->2)

                    // We need to ensure the shared vertex has NO OTHER CONNECTIONS to be safe to merge.
                    // If 3 walls meet at a T-junction (one collinear, one perpendicular), we should NOT merge the collinear ones
                    // because it would destroy the T-junction vertex.
                    const otherConnections = processed.filter(w =>
                        w.id !== w1.id && w.id !== w2.id &&
                        (isSamePoint(w.start, shared!) || isSamePoint(w.end, shared!))
                    )

                    if (otherConnections.length === 0) {
                        // Merge them!
                        const newWall: Wall = {
                            ...w1,
                            id: w1.id.includes("-s") ? w1.id : w2.id, // Prefer original or first segment ID
                            start: p1,
                            end: p2
                        }
                        processed.splice(j, 1)
                        processed.splice(i, 1, newWall)
                        merged = true
                        break
                    }
                }

                // Case 2: Overlapping but not identical (one contains the other, or partial overlap)
                // If they are collinear and overlapping, fragmentWalls should have theoretically split them.
                // But if they weren't split correctly, we might have issues.
                // Assuming fragmentWalls ran before this, we only deal with sequential segments.
            }
            if (merged) break
        }
    }

    return processed
}

/**
 * Detecta ciclos cerrados (habitaciones) en un conjunto de muros usando un algoritmo de caras de grafo planar.
 */
export function detectRoomsGeometrically(walls: Wall[], previousRooms: Room[] = []): Room[] {
    if (walls.length < 3) return []

    const processedWalls = fragmentWalls(walls)
    const nodes: Point[] = []
    const TOLERANCE = 1.0

    const getPointId = (p: Point) => {
        const rx = Math.round(p.x * 10) / 10
        const ry = Math.round(p.y * 10) / 10

        for (let i = 0; i < nodes.length; i++) {
            const dx = nodes[i].x - rx
            const dy = nodes[i].y - ry
            if (Math.sqrt(dx * dx + dy * dy) < TOLERANCE) return i
        }

        const id = nodes.length
        nodes.push({ x: rx, y: ry })
        return id
    }

    const edges: { u: number; v: number }[] = []
    processedWalls.forEach((e: Wall) => {
        const u = getPointId(e.start)
        const v = getPointId(e.end)
        if (u === v) return
        edges.push({ u, v })
    })

    const adj: number[][] = nodes.map(() => [])
    edges.forEach(({ u, v }) => {
        if (!adj[u].includes(v)) adj[u].push(v)
        if (!adj[v].includes(u)) adj[v].push(u)
    })

    const directedEdges: { from: number; to: number; used: boolean; angle: number }[] = []
    nodes.forEach((_, u) => {
        (adj[u] || []).forEach(v => {
            const angle = Math.atan2(nodes[v].y - nodes[u].y, nodes[v].x - nodes[u].x)
            directedEdges.push({ from: u, to: v, used: false, angle })
        })
    })

    const nodeOutgoing = nodes.map((_, u) => {
        return directedEdges
            .filter(e => e.from === u)
            .sort((a, b) => a.angle - b.angle)
    })

    const edgeMap = new Map<string, number>()
    directedEdges.forEach((e, idx) => {
        edgeMap.set(`${e.from}->${e.to}`, idx)
    })

    const foundRooms: Room[] = []

    for (let i = 0; i < directedEdges.length; i++) {
        if (directedEdges[i].used) continue

        const cycle: number[] = []
        let currIdx = i
        let stepCount = 0
        const MAX_STEPS = 100

        while (!directedEdges[currIdx].used && stepCount < MAX_STEPS) {
            directedEdges[currIdx].used = true
            const { from, to } = directedEdges[currIdx]
            cycle.push(from)

            const neighbors = nodeOutgoing[to]
            let revIdx = neighbors.findIndex(e => e.to === from)
            const nextEdgeInNode = neighbors[(revIdx - 1 + neighbors.length) % neighbors.length]

            const nextKey = `${to}->${nextEdgeInNode.to}`
            const nextIdx = edgeMap.get(nextKey)

            if (nextIdx === undefined) break
            currIdx = nextIdx
            stepCount++
        }

        if (cycle.length >= 3) {
            const polygon = cycle.map(idx => nodes[idx])
            const area = calculatePolygonSignedArea(polygon)

            if (area > 0.01) {
                foundRooms.push({
                    id: "", // Temporary
                    name: "", // Temporary
                    polygon,
                    area: Math.abs(area),
                    color: "", // Temporary
                    visualCenter: polylabel(polygon)
                })
            }
        }
    }

    const finalRooms: Room[] = []
    const usedPrevIds = new Set<string>()

    // Pass 1: Strict matching with previous rooms for stability
    foundRooms.forEach(room => {
        const centroid = calculatePolygonCentroid(room.polygon)
        let bestMatch: Room | null = null

        let minDist = 150 // Increased from 50 to allow for larger movements without losing ID

        previousRooms.forEach(prev => {
            if (usedPrevIds.has(prev.id)) return
            const prevCentroid = calculatePolygonCentroid(prev.polygon)
            const d = Math.sqrt(Math.pow(centroid.x - prevCentroid.x, 2) + Math.pow(centroid.y - prevCentroid.y, 2))
            if (d < minDist) {
                minDist = d
                bestMatch = prev
            }
        })

        if (bestMatch) {
            const bm = bestMatch as Room
            usedPrevIds.add(bm.id)
            finalRooms.push({
                ...bm,         // Preserve previous metadata (ceramics, etc.)
                ...room,       // Update with new geometry
                id: bm.id,     // Ensure ID stability
                name: bm.name, // Ensure Name stability
                color: bm.color, // Ensure Color stability
                visualCenter: room.visualCenter // Important to use the NEW visual center
            })
        } else {
            finalRooms.push({ ...room, id: `room-${Date.now()}-${Math.random()}`, name: "" })
        }
    })

    // CONTAINMENT DETECTION for Label Placement
    // We want to find if any room is INSIDE another room.
    // If Room B is inside Room A, we pass B's polygon as a hole to A's polylabel calculation.

    // Helper to check if a polygon is inside another (approx by centroid)
    // Detailed check: All points of B inside A.
    // Optimization: Just check centroid or one point if we assume non-overlapping boundaries for distinct rooms.
    // We already know boundaries don't cross (from planar graph extraction), so one point is enough.

    const isPointInPoly = (p: Point, poly: Point[]) => {
        let inside = false
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i].x, yi = poly[i].y
            const xj = poly[j].x, yj = poly[j].y
            const intersect = ((yi > p.y) !== (yj > p.y)) &&
                (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi)
            if (intersect) inside = !inside
        }
        return inside
    }

    // We need to use valid containment logic. 
    // We can reuse `polylabel`'s internal distance function if we exported it, but simple point-in-poly is fine.

    // We need to build a dependency graph or just iterate since N is small (< 50 usually).
    // Identify holes for each room.
    const roomHoles: Map<string, Point[][]> = new Map()

    finalRooms.forEach(outer => {
        const holes: Point[][] = []
        finalRooms.forEach(inner => {
            if (outer.id === inner.id) return
            // Check if inner is inside outer.
            // Heuristic: Check if inner's visualCenter (or centroid) is inside outer.
            // And Outer area > Inner area.
            if (outer.area > inner.area) {
                // Use a point from the inner polygon to test.
                // Ideally use VisualCenter which is guaranteed to be inside.
                const pTest = inner.visualCenter || inner.polygon[0]

                // Reuse point-in-poly logic.
                // Copied from above (detectRoomsGeometrically internal or polylabel)
                let inside = false
                const poly = outer.polygon
                for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                    const pi = poly[i], pj = poly[j]
                    if (((pi.y > pTest.y) !== (pj.y > pTest.y)) && (pTest.x < (pj.x - pi.x) * (pTest.y - pi.y) / (pj.y - pi.y) + pi.x)) inside = !inside
                }

                if (inside) {
                    holes.push(inner.polygon)
                }
            }
        })
        roomHoles.set(outer.id, holes)
    })

    // Recalculate visual centers with holes
    finalRooms.forEach(room => {
        const holes = roomHoles.get(room.id) || []
        if (holes.length > 0) {
            room.visualCenter = polylabel(room.polygon, holes)
        }
        // If no holes, the initial polylabel was correct (or we could re-run to be safe, but unnecessary optimization)
    })

    // Pass 2: Assign unique names and IDs to new/unmatched rooms
    const usedNames = new Set(finalRooms.map(r => r.name).filter(n => n !== ""))

    finalRooms.forEach((room, idx) => {
        if (room.name === "") {
            room.id = room.id || `room-${Date.now()}-${idx}-${Math.random()}`

            let n = 1
            while (usedNames.has(`H${n}`)) {
                n++
            }
            room.name = `H${n}`
            usedNames.add(room.name)
            room.color = getRandomColor()
        }
    })

    return finalRooms
}

function calculatePolygonCentroid(points: Point[]): Point {
    let x = 0, y = 0
    points.forEach(p => { x += p.x; y += p.y })
    return { x: x / points.length, y: y / points.length }
}

function calculatePolygonSignedArea(points: Point[]): number {
    let area = 0
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length
        area += points[i].x * points[j].y
        area -= points[j].x * points[i].y
    }
    return (area / 2) / 10000
}

export function polylabel(polygon: Point[], holes: Point[][] = [], precision = 1.0): Point {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    polygon.forEach(p => {
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x)
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
    })

    const width = maxX - minX
    const height = maxY - minY
    const maxDim = Math.max(width, height)
    if (maxDim === 0) return { x: minX, y: minY }

    const pointToPolygonDist = (x: number, y: number, poly: Point[]) => {
        let inside = false
        let minDistSq = Infinity
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const pi = poly[i], pj = poly[j]
            if (((pi.y > y) !== (pj.y > y)) && (x < (pj.x - pi.x) * (y - pi.y) / (pj.y - pi.y) + pi.x)) inside = !inside
            const dx = pj.x - pi.x, dy = pj.y - pi.y
            let t = ((x - pi.x) * dx + (y - pi.y) * dy) / (dx * dx + dy * dy)
            t = Math.max(0, Math.min(1, t))
            const distSq = Math.pow(x - (pi.x + t * dx), 2) + Math.pow(y - (pi.y + t * dy), 2)
            minDistSq = Math.min(minDistSq, distSq)
        }
        return (inside ? 1 : -1) * Math.sqrt(minDistSq)
    }

    // Function to get distance from point to shape (taking holes into account)
    const getDist = (x: number, y: number) => {
        let d = pointToPolygonDist(x, y, polygon)
        if (d <= 0) return d // Outside of main polygon

        // If inside main polygon, check holes
        for (const hole of holes) {
            const dHole = pointToPolygonDist(x, y, hole)
            if (dHole > 0) {
                // Point is INSIDE a hole, so it is OUTSIDE the valid area.
                // Distance to hole boundary is dHole.
                // Since it's invalid, we treat it as negative distance to the "boundary" (hole edge)
                // But logically, if we are inside a hole, we want to maximize distance to its edge?
                // No, Polylabel maximizes distance to NEAREST boundary.
                // If inside hole, distance is negative?
                // Standard: dist is positive inside, negative outside.
                // Hole is "outside" space. So if inside hole, dist should be negative?
                // Yes. But pointToPolygonDist(hole) returns positive if inside hole.
                // So we subtract it? Or return -dHole?
                // If deep inside hole, -dHole is negative. Boundary is 0.
                d = Math.min(d, -dHole)
            } else {
                // Outside hole. dHole is negative (distance to hole center-ish or boundary).
                // Distance to hole boundary is -dHole (positive).
                // Example: 5m away from hole edge. dHole = -5. Dist to barrier = 5.
                // We want min(d_outer, dist_to_hole_barrier)
                d = Math.min(d, -dHole)
            }
        }
        return d
    }

    let cx = 0, cy = 0
    polygon.forEach(p => { cx += p.x; cy += p.y })
    cx /= polygon.length; cy /= polygon.length

    let bestPoint = { x: cx, y: cy }
    let maxDist = getDist(cx, cy)

    const search = (cellX: number, cellY: number, size: number) => {
        const steps = 8
        const step = size / steps
        for (let x = cellX; x <= cellX + size; x += step) {
            for (let y = cellY; y <= cellY + size; y += step) {
                const dist = getDist(x, y)
                if (dist > maxDist) {
                    maxDist = dist
                    bestPoint = { x, y }
                }
            }
        }
        if (size > precision) {
            search(bestPoint.x - size / steps, bestPoint.y - size / steps, (size / steps) * 2)
        }
    }

    let currentSize = maxDim
    const divisions = 4
    const step = currentSize / divisions
    for (let x = minX; x < maxX; x += step) {
        for (let y = minY; y < maxY; y += step) {
            const dist = getDist(x + step / 2, y + step / 2)
            if (dist + (step * 1.4) > maxDist) {
                search(x, y, step)
            }
        }
    }

    return bestPoint
}

function getRandomColor() {
    const colors = ["#f97316", "#0ea5e9", "#10b981", "#8b5cf6", "#f43f5e", "#eab308"]
    return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Genera puntos para aproximar un arco mediante segmentos
 * @param start Punto inicial
 * @param end Punto final
 * @param depth Profundidad del arco (sagitta). Positivo = hacia la "derecha" del vector start->end
 * @param resolution Longitud máxima aproximada de cada segmento
 */
export function generateArcPoints(start: Point, end: Point, depth: number, resolution: number = 20): Point[] {
    // 1. Calcular punto medio de la cuerda
    const midX = (start.x + end.x) / 2
    const midY = (start.y + end.y) / 2

    // 2. Vector dirección de la cuerda
    const dx = end.x - start.x
    const dy = end.y - start.y
    const chordLen = Math.sqrt(dx * dx + dy * dy)

    if (chordLen < 1 || Math.abs(depth) < 1) return [start, end]

    // 3. Normal a la cuerda (para aplicar el depth)
    // Rota 90 grados (-dy, dx)
    const perpX = -dy / chordLen
    const perpY = dx / chordLen

    // 4. Calcular el radio y centro del círculo
    // s = depth (sagitta), c = chordLen / 2
    // R = (s^2 + c^2) / (2s)
    const s = depth
    const c = chordLen / 2
    const R = (s * s + c * c) / (2 * s)

    // El centro está en la mediatriz, a distancia (R - s) del punto medio, en dirección OPUESTA al depth si s<R, etc.
    // Vector desde Mid hacia Centro.
    // Si depth > 0, el arco va hacia la normal. El centro está "atrás" del arco si R > s.
    // Vector Mid -> Peak = depth * Normal
    // Vector Mid -> Center = (R - s) * Normal (ojo con el signo)

    // Simplificación geométrica:
    // El centro C está a una distancia (R-s) del punto medio, en la dirección NEGATIVA del vector sagitta (si s>0)
    // O más fácil: Averiguar coordenadas del centro.
    const centerX = midX + (R - s) * perpX
    const centerY = midY + (R - s) * perpY

    // 5. Ángulos
    const startAngle = Math.atan2(start.y - centerY, start.x - centerX)
    const endAngle = Math.atan2(end.y - centerY, end.x - centerX)

    // Ajustar ángulos para barrido correcto
    let sweep = endAngle - startAngle
    // Queremos que el barrido corresponda al sentido del arco determinado por 'depth'
    // Si depth > 0, el "pico" está en dirección normal.

    // Comprobación de sentido:
    // Punto medio del arco real
    const peakX = midX + depth * perpX
    const peakY = midY + depth * perpY
    const peakAngle = Math.atan2(peakY - centerY, peakX - centerX)

    // Normalizar ángulos a [0, 2PI) o manejar la diferencia
    // Simplemente iteramos por pasos
    // Calcular longitud de arco aproximada
    const circleLen = 2 * Math.PI * Math.abs(R)
    // Pero solo queremos el segmento... 
    // Opción B: Interpolación cuadrática/Bezier para simplificar si no necesitamos círculo perfecto perfecto, 
    // pero para paredes mejor círculo.

    // Re-calculo robusto de Sweep:
    // Usamos el producto cruz para saber si vamos CW o CCW
    // Pero R puede ser negativo si depth era negativo? No, R es radio geométrico.
    // Manejemos depth positivo/negativo definiendo el centro correctamente.

    // Si R es muuuy grande (depth pequeño), el centro está lejos.

    let totalAngle = endAngle - startAngle
    while (totalAngle <= -Math.PI) totalAngle += 2 * Math.PI
    while (totalAngle > Math.PI) totalAngle -= 2 * Math.PI

    // Verificar si este ángulo "pasa" por el lado del depth
    // Un punto de prueba (peak)
    // Angulo del peak
    let midAngleRel = peakAngle - startAngle
    while (midAngleRel <= -Math.PI) midAngleRel += 2 * Math.PI
    while (midAngleRel > Math.PI) midAngleRel -= 2 * Math.PI

    // Si el sweep directo no incluye el peak, hay que ir por el otro lado
    if (Math.abs(midAngleRel) > Math.abs(totalAngle) && Math.sign(midAngleRel) === Math.sign(totalAngle)) {
        // Estamos bien? No necesariamente.
    }

    // FORMA MÁS SIMPLE:
    // Interpolar paramétricamente sobre el arco.
    // Número de segmentos basado en la longitud aproximada del arco
    // Longitud arco ~ cuerda (si plano) o pi*R
    // Estimación: L = sqrt(c^2 + 16/3 s^2) aprox parabólica
    const approxArcLen = Math.sqrt(dx * dx + dy * dy) * (1 + 0.3 * Math.abs(depth) / (Math.sqrt(dx * dx + dy * dy))) // Muy aprox
    // Mejor usar resolución fija o dinámica
    const segments = Math.max(2, Math.ceil(approxArcLen / resolution))

    // Interpolación angular corregida
    // Sabemos Start, End y un punto intermedio (Peak)
    // El orden angular debe ser Start -> Peak -> End (o viceversa)

    function normalize(a: number) { return a - Math.floor(a / (2 * Math.PI)) * 2 * Math.PI }

    // Decidir dirección de giro
    // Determinada por el signo del producto cruz (Start-Center) x (End-Center) vs el lado de Depth?

    const points: Point[] = [start]

    // Implementación iterativa simple usando Bezier Cuadrática racional o simplemente subdivisión del ángulo
    // Usaremos subdivisión angular asumiendo que calculamos bien el centro.

    // Recalculamos Centro y Radio "con signo" para facilitar
    // R_signed = (c^2 + s^2) / (2s). Si s es negativo, R_signed es negativo.
    // Center = Mid + (R_signed - s) * Perp  <-- Esto no cambia, R_signed - s = (c^2-s^2)/(2s)

    // Vamos a usar una aproximación de Bezier cuadrática para no liarnos con ATAN2 y discontinuidades
    // Bezier pasa por Start, Control, End.
    // Pero Bezier NO es un arco circular perfecto.
    // Para arquitectura, mejor circular. 

    // Volvemos a Círculos:
    // Forzamos el paso por el "Peak"
    const p1 = start
    const p2 = { x: midX + depth * perpX, y: midY + depth * perpY } // Peak
    const p3 = end

    // 3 puntos definen un círculo. Interpolamos de p1 a p3 pasando por p2.
    // Calculo de centro de 3 puntos:
    // https://en.wikipedia.org/wiki/Circumcircle#Cartesian_coordinates
    const D = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y))
    const centerX_ = (1 / D) * ((p1.x * p1.x + p1.y * p1.y) * (p2.y - p3.y) + (p2.x * p2.x + p2.y * p2.y) * (p3.y - p1.y) + (p3.x * p3.x + p3.y * p3.y) * (p1.y - p2.y))
    const centerY_ = (1 / D) * ((p1.x * p1.x + p1.y * p1.y) * (p3.x - p2.x) + (p2.x * p2.x + p2.y * p2.y) * (p1.x - p3.x) + (p3.x * p3.x + p3.y * p3.y) * (p2.x - p1.x))

    const R_ = Math.sqrt(Math.pow(p1.x - centerX_, 2) + Math.pow(p1.y - centerY_, 2))

    const a1 = Math.atan2(p1.y - centerY_, p1.x - centerX_)
    const a2 = Math.atan2(p2.y - centerY_, p2.x - centerX_)
    const a3 = Math.atan2(p3.y - centerY_, p3.x - centerX_)

    // Determinar dirección: a1 -> a2 -> a3
    let da1 = a2 - a1
    while (da1 <= -Math.PI) da1 += 2 * Math.PI
    while (da1 > Math.PI) da1 -= 2 * Math.PI

    let da2 = a3 - a2
    while (da2 <= -Math.PI) da2 += 2 * Math.PI
    while (da2 > Math.PI) da2 -= 2 * Math.PI

    // Total sweep
    const totalSweep = da1 + da2

    // Generar puntos
    const count = Math.ceil((Math.abs(totalSweep) * R_) / resolution)
    const steps = Math.max(count, 2)

    for (let i = 1; i <= steps; i++) {
        const t = i / steps
        const angle = a1 + totalSweep * t
        points.push({
            x: centerX_ + R_ * Math.cos(angle),
            y: centerY_ + R_ * Math.sin(angle)
        })
    }

    return points
}
