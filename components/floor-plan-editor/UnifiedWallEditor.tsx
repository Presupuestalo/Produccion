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
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onPointerDown={(e) => {
                    if (e.target === e.currentTarget) onCancel()
                }}
            />

            {/* Keypad Bottom Sheet - Strict Full Width */}
            <div className="absolute bottom-0 left-0 right-0 w-full bg-white border-t border-slate-200 shadow-2xl rounded-t-xl overflow-hidden flex flex-col pb-safe">
                <NumericKeypad
                    title="Editar Medida"
                    value={initialValue}
                    orientation={orientation}
                    onChange={() => { }}
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                />
                <div className="h-8 w-full bg-white" /> {/* Extra safe area spacer */}
            </div>
        </div>
    )
}
