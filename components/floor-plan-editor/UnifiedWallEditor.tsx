"use client"
import React from "react"
import { NumericKeypad } from "./NumericKeypad"

interface UnifiedWallEditorProps {
    initialValue: string
    orientation: 'horizontal' | 'vertical' | 'inclined' | 'none'
    onConfirm: (val: string, direction?: "left" | "right" | "up" | "down" | null) => void
    onCancel: () => void
}


export const UnifiedWallEditor = ({ initialValue, orientation, onConfirm, onCancel }: UnifiedWallEditorProps) => {
    const [position, setPosition] = React.useState({ x: 0, y: 0 })
    const isDraggingRef = React.useRef(false)
    const dragStartRef = React.useRef({ x: 0, y: 0 })
    const initialPosRef = React.useRef({ x: 0, y: 0 })

    const handlePointerDown = (e: React.PointerEvent) => {
        isDraggingRef.current = true
        dragStartRef.current = { x: e.clientX, y: e.clientY }
        initialPosRef.current = { ...position }
        e.currentTarget.setPointerCapture(e.pointerId)
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDraggingRef.current) return
        const dx = e.clientX - dragStartRef.current.x
        const dy = e.clientY - dragStartRef.current.y
        setPosition({
            x: initialPosRef.current.x + dx,
            y: initialPosRef.current.y + dy
        })
    }

    const handlePointerUp = (e: React.PointerEvent) => {
        isDraggingRef.current = false
        e.currentTarget.releasePointerCapture(e.pointerId)
    }

    return (
        <div
            className="fixed inset-0 z-[9999] bg-transparent"
            style={{ zIndex: 9999 }}
            onPointerDown={(e) => {
                if (e.target === e.currentTarget) onCancel()
            }}
        >
            {/* Draggable Container - Floating & Compact */}
            <div
                className="fixed bottom-12 left-1/2 flex justify-center pointer-events-none"
                style={{
                    transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)`,
                    transition: isDraggingRef.current ? 'none' : 'transform 0.1s ease-out'
                }}
            >
                <div
                    className="w-auto min-w-[180px] max-w-[95vw] pointer-events-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl overflow-hidden ring-1 ring-black/5 flex flex-col"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    style={{ touchAction: 'none' }}
                >
                    {/* Drag Handle */}
                    <div className="w-full flex justify-center pt-2 pb-1 bg-transparent cursor-grab active:cursor-grabbing border-b border-white/10">
                        <div className="w-12 h-1.5 rounded-full bg-black/20" />
                    </div>

                    <NumericKeypad
                        title="Editar Medida"
                        value={initialValue}
                        orientation={orientation}
                        onChange={() => { }}
                        onConfirm={onConfirm}
                        onCancel={onCancel}
                    />
                </div>
            </div>
        </div>
    )
}
