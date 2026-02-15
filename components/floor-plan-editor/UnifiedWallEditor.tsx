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
            className="fixed inset-0 z-[9999]"
            style={{ zIndex: 9999 }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                onPointerDown={(e) => {
                    if (e.target === e.currentTarget) onCancel()
                }}
            />

            {/* Keypad Bottom Sheet */}
            <div className="absolute bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] rounded-t-2xl overflow-hidden flex flex-col pb-safe">
                <div className="w-full max-w-md mx-auto">
                    <NumericKeypad
                        title="Editar Medida"
                        value={initialValue}
                        orientation={orientation}
                        onChange={() => { }}
                        onConfirm={onConfirm}
                        onCancel={onCancel}
                    />
                </div>
                {/* Safe area spacer */}
                <div className="h-6 w-full bg-white" />
            </div>
        </div>
    )
}
