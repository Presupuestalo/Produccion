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

    // Líneas verticales
    for (let i = 0; i <= numLinesX; i++) {
        const x = startX + i * scaledCellSize
        lines.push(
            <Line
                key={`v-${i}`}
                points={[x, 0, x, height]}
                stroke="#e2e8f0"
                strokeWidth={1}
                listening={false}
            />
        )
    }

    // Líneas horizontales
    for (let i = 0; i <= numLinesY; i++) {
        const y = startY + i * scaledCellSize
        lines.push(
            <Line
                key={`h-${i}`}
                points={[0, y, width, y]}
                stroke="#e2e8f0"
                strokeWidth={1}
                listening={false}
            />
        )
    }

    return (
        <Group>
            {lines}
            {/* Tapiz de 10x10m (1000x1000px) */}
            <Group x={offsetX} y={offsetY} scaleX={zoom} scaleY={zoom}>
                <Rect
                    x={0}
                    y={0}
                    width={1000}
                    height={1000}
                    stroke="#cbd5e1"
                    strokeWidth={2 / zoom}
                    dash={[10, 5]}
                    listening={false}
                />
            </Group>
        </Group>
    )
}
