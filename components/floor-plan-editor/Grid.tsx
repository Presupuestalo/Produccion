"use client"
import React from "react"
import { Line, Group, Rect } from "react-konva"

interface GridProps {
    width: number
    height: number
    cellSize: number
    zoom: number
    offsetX: number
    offsetY: number
}

export const Grid: React.FC<GridProps> = ({ width, height, cellSize, zoom, offsetX, offsetY }) => {
    const scaledCellSize = cellSize * zoom

    // Calcular el número de líneas necesarias para cubrir el área visible
    const numLinesX = Math.ceil(width / scaledCellSize) + 2
    const numLinesY = Math.ceil(height / scaledCellSize) + 2

    // Calcular el desfase inicial para que la rejilla se mueva con el pan
    const startX = (offsetX % scaledCellSize) - scaledCellSize
    const startY = (offsetY % scaledCellSize) - scaledCellSize

    const lines = []
    const showSubdivisions = zoom > 1.5
    const majorCellSize = cellSize // 100
    const minorCellSize = cellSize / 10 // 10

    // 1. Minor Lines (10cm) - Only if zoomed in
    if (showSubdivisions) {
        const scaledMinorSize = minorCellSize * zoom
        const numMinorX = Math.ceil(width / scaledMinorSize) + 2
        const numMinorY = Math.ceil(height / scaledMinorSize) + 2
        const minorStartX = (offsetX % scaledMinorSize) - scaledMinorSize
        const minorStartY = (offsetY % scaledMinorSize) - scaledMinorSize

        for (let i = 0; i <= numMinorX; i++) {
            const x = minorStartX + i * scaledMinorSize
            // Skip if it coincides with a major line to avoid double rendering
            if (Math.round((i * minorCellSize) % majorCellSize) === 0) continue

            lines.push(
                <Line
                    key={`v-minor-${i}`}
                    points={[x, 0, x, height]}
                    stroke="#e2e8f0"
                    strokeWidth={0.5}
                    opacity={0.4}
                    listening={false}
                />
            )
        }
        for (let i = 0; i <= numMinorY; i++) {
            const y = minorStartY + i * scaledMinorSize
            if (Math.round((i * minorCellSize) % majorCellSize) === 0) continue

            lines.push(
                <Line
                    key={`h-minor-${i}`}
                    points={[0, y, width, y]}
                    stroke="#e2e8f0"
                    strokeWidth={0.5}
                    opacity={0.4}
                    listening={false}
                />
            )
        }
    }

    // 2. Major Lines (1m)
    for (let i = 0; i <= numLinesX; i++) {
        const x = startX + i * scaledCellSize
        lines.push(
            <Line
                key={`v-major-${i}`}
                points={[x, 0, x, height]}
                stroke="#cbd5e1"
                strokeWidth={1}
                opacity={0.6}
                listening={false}
            />
        )
    }

    for (let i = 0; i <= numLinesY; i++) {
        const y = startY + i * scaledCellSize
        lines.push(
            <Line
                key={`h-major-${i}`}
                points={[0, y, width, y]}
                stroke="#cbd5e1"
                strokeWidth={1}
                opacity={0.6}
                listening={false}
            />
        )
    }

    return (
        <Group>
            {lines}
        </Group>
    )
}
