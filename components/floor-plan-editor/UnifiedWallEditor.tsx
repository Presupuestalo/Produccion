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
    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col justify-end"
            onTouchEnd={(e) => {
                if (e.target === e.currentTarget) onCancel()
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onCancel()
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />

            {/* Keypad at bottom */}
            <div className="relative z-10">
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
    )
}
