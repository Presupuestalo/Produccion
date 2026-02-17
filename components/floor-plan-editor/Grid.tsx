"use client"
import React from "react"
import { Line, Group } from "react-konva"

interface GridProps {
    width: number
    height: number
    cellSize?: number
    zoom: number
    offset: { x: number; y: number }
    rotation?: number
}

export const Grid: React.FC<GridProps> = ({ width, height, cellSize = 100, zoom, offset, rotation = 0 }) => {
    // Calcular área extendida para evitar bordes blancos
    const extendedArea = 10000 // Área muy grande para simular infinito
    const extendedWidth = width + extendedArea * 2
    const extendedHeight = height + extendedArea * 2

    const lines = []

    // Niveles de subdivisión basados en el zoom
    const showCm = zoom >= 8       // Mostrar 1cm cuando zoom >= 8
    const show10cm = zoom >= 1.5    // Mostrar 10cm cuando zoom >= 1.5
    const show1m = true             // Siempre mostrar 1m

    // Tamaños de celda en unidades del modelo (cm)
    const size1m = 100
    const size10cm = 10
    const size1cm = 1

    // Función helper para crear líneas de grid
    const createGridLines = (cellSize: number, color: string, strokeWidth: number, opacity: number, key: string) => {
        const numLinesX = Math.ceil(extendedWidth / cellSize) + 4
        const numLinesY = Math.ceil(extendedHeight / cellSize) + 4
        const startX = -extendedArea + ((-extendedArea) % cellSize)
        const startY = -extendedArea + ((-extendedArea) % cellSize)

        // Líneas verticales
        for (let i = 0; i <= numLinesX; i++) {
            const x = startX + i * cellSize
            lines.push(
                <Line
                    key={`v-${key}-${i}`}
                    points={[x, -extendedArea, x, height + extendedArea]}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    listening={false}
                />
            )
        }

        // Líneas horizontales
        for (let i = 0; i <= numLinesY; i++) {
            const y = startY + i * cellSize
            lines.push(
                <Line
                    key={`h-${key}-${i}`}
                    points={[-extendedArea, y, width + extendedArea, y]}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    listening={false}
                />
            )
        }
    }

    // 1. Líneas de 1cm (las más finas, solo con mucho zoom)
    if (showCm) {
        createGridLines(size1cm, "#e8edf2", 0.3, 0.35, "1cm")
    }

    // 2. Líneas de 10cm (medianas, aparecen con zoom medio)
    if (show10cm) {
        createGridLines(size10cm, "#d1dae3", 0.5, 0.5, "10cm")
    }

    // 3. Líneas de 1m (principales, siempre visibles)
    if (show1m) {
        createGridLines(size1m, "#94a3b8", 1.2, 0.7, "1m")
    }

    return (
        <Group>
            {lines}
        </Group>
    )
}
