export interface Point {
    x: number
    y: number
}

export interface Wall {
    id: string
    start: Point
    end: Point
    thickness: number
}

export interface Room {
    id: string
    name: string
    polygon: Point[]
    area: number
    color: string
    visualCenter?: Point
}

/**
 * Utilidades geométricas para intersecciones
 */
function getLineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
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

function isPointOnSegment(p: Point, a: Point, b: Point, tolerance = 1.0): boolean {
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

/**
 * Divide un conjunto de muros en segmentos más pequeños allí donde se intersectan o tocan.
 */
function splitWalls(walls: Wall[]): { start: Point, end: Point }[] {
    const segments: { start: Point, end: Point }[] = walls.map(w => ({ start: w.start, end: w.end }))
    const TOLERANCE = 1.0

    const result: { start: Point, end: Point }[] = []

    segments.forEach((seg, i) => {
        const splitPoints: Point[] = [seg.start, seg.end]

        segments.forEach((other, j) => {
            if (i === j) return

            const intersect = getLineIntersection(seg.start, seg.end, other.start, other.end)
            if (intersect) splitPoints.push(intersect)

            if (isPointOnSegment(other.start, seg.start, seg.end, TOLERANCE)) splitPoints.push(other.start)
            if (isPointOnSegment(other.end, seg.start, seg.end, TOLERANCE)) splitPoints.push(other.end)
        })

        const uniquePoints: Point[] = []
        splitPoints.forEach(p => {
            if (!uniquePoints.some(up => Math.sqrt(Math.pow(up.x - p.x, 2) + Math.pow(up.y - p.y, 2)) < TOLERANCE)) {
                uniquePoints.push(p)
            }
        })

        const dx = seg.end.x - seg.start.x
        const dy = seg.end.y - seg.start.y
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
                result.push({ start: p1, end: p2 })
            }
        }
    })

    return result
}

/**
 * Detecta ciclos cerrados (habitaciones) en un conjunto de muros usando un algoritmo de caras de grafo planar.
 */
export function detectRoomsGeometrically(walls: Wall[], previousRooms: Room[] = []): Room[] {
    if (walls.length < 3) return []

    const processedEdges = splitWalls(walls)
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
    processedEdges.forEach((e) => {
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
        let minDist = 50

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
            usedPrevIds.add(bestMatch.id)
            finalRooms.push({
                ...room,
                id: bestMatch.id,
                name: bestMatch.name,
                color: bestMatch.color,
                visualCenter: room.visualCenter
            })
        } else {
            finalRooms.push({ ...room, id: "", name: "" })
        }
    })

    // Pass 2: Assign unique names and IDs to new/unmatched rooms
    const usedNames = new Set(finalRooms.map(r => r.name).filter(n => n !== ""))

    finalRooms.forEach((room, idx) => {
        if (room.id === "") {
            room.id = `room-${Date.now()}-${idx}`

            let n = 1
            while (usedNames.has(`Habitación ${n}`)) {
                n++
            }
            room.name = `Habitación ${n}`
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

export function polylabel(polygon: Point[], precision = 1.0): Point {
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

    let cx = 0, cy = 0
    polygon.forEach(p => { cx += p.x; cy += p.y })
    cx /= polygon.length; cy /= polygon.length

    let bestPoint = { x: cx, y: cy }
    let maxDist = pointToPolygonDist(cx, cy, polygon)

    const search = (cellX: number, cellY: number, size: number) => {
        const steps = 8
        const step = size / steps
        for (let x = cellX; x <= cellX + size; x += step) {
            for (let y = cellY; y <= cellY + size; y += step) {
                const dist = pointToPolygonDist(x, y, polygon)
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
            const dist = pointToPolygonDist(x + step / 2, y + step / 2, polygon)
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
