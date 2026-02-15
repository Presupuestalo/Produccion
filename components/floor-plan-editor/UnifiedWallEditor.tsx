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
            className="fixed inset-0 z-[9999] flex flex-col justify-end pb-safe safe-area-inset-bottom"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}
            onPointerDown={(e) => {
                if (e.target === e.currentTarget) onCancel()
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />

            {/* Keypad at bottom as a floating card to avoid system UI issues */}
            <div className="relative z-10 w-full px-4 pb-8 mb-safe">
                <div className="bg-white shadow-[0_0_30px_rgba(0,0,0,0.15)] rounded-2xl overflow-hidden p-1">
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
