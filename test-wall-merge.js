
// Local test script


// Mock Point and Wall interfaces for the test (since we are running in node for testing)
// But wait, the file imports "lucide-react" or has types. I need to make sure the file is runnable in node.
// geometry.ts exports interfaces and functions. It doesn't seem to have external react dependencies.
// However, I need to bundle it or copy it to a standalone JS file for testing if I want to run it with node.
// Or I can just inspect the code logic as I did.

// Let's create a standalone test file that copies the necessary logic from geometry.ts to verify.
// I'll copy the relevant functions and run a test case.


// Mock Point and Wall interfaces for the test
function isSamePoint(p1, p2, tolerance = 1.0) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < tolerance
}

function cleanupAndMergeWalls(walls) {
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
                console.log(`Duplicate found: Removing ${w2.id} (same as ${w1.id})`)
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

                // Must have same thickness
                if (w1.thickness !== w2.thickness) continue

                // Check for colinearity
                const dx1 = w1.end.x - w1.start.x
                const dy1 = w1.end.y - w1.start.y
                const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)

                const dx2 = w2.end.x - w2.start.x
                const dy2 = w2.end.y - w2.start.y
                const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)

                if (len1 < TOLERANCE || len2 < TOLERANCE) continue

                const ux1 = dx1 / len1, uy1 = dy1 / len1
                const ux2 = dx2 / len2, uy2 = dy2 / len2

                // Check dot product (approx 1 or -1 for collinearity)
                const dot = Math.abs(ux1 * ux2 + uy1 * uy2)
                if (dot < 0.999) continue

                // Must share exactly one vertex
                let shared = null
                let p1 = null
                let p2 = null

                if (isSamePoint(w1.end, w2.start)) { shared = w1.end; p1 = w1.start; p2 = w2.end }
                else if (isSamePoint(w1.start, w2.end)) { shared = w1.start; p1 = w1.end; p2 = w2.start }
                else if (isSamePoint(w1.end, w2.end)) { shared = w1.end; p1 = w1.start; p2 = w2.start }
                else if (isSamePoint(w1.start, w2.start)) { shared = w1.start; p1 = w1.end; p2 = w2.end }

                if (shared && p1 && p2) {
                    // CRITICAL: The shared vertex must NOT have other wall connections
                    const otherConnections = processed.filter(w =>
                        w.id !== w1.id && w.id !== w2.id &&
                        (isSamePoint(w.start, shared) || isSamePoint(w.end, shared))
                    )

                    if (otherConnections.length === 0) {
                        // Merge them!
                        console.log(`Merging ${w1.id} and ${w2.id}`)
                        const newWall = {
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
            }
            if (merged) break
        }
    }

    return processed
}

// Test case: Duplicate overlapping walls
const walls = [
    { id: 'w1', start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, thickness: 10 },
    { id: 'w2', start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, thickness: 10 }
];

console.log('Running deduplication test...')
const result = cleanupAndMergeWalls(walls);
console.log('Result count:', result.length);
console.log('Result IDs:', result.map(w => `${w.id}: (${w.start.x},${w.start.y}) -> (${w.end.x},${w.end.y})`));

if (result.length === 1 && Math.abs(result[0].start.x - result[0].end.x) > 1) {
    console.log('SUCCESS: Walls merged/deduplicated correctly');
} else {
    console.log('FAILURE: Walls not merged correctly');
}
