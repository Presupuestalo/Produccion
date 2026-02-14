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
    // We can render the Keypad directly as a fixed overlay since this component is invoked
    // specifically when editing a wall length on mobile.
    return (
        <div
            className="fixed inset-0 z-[3000] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
            onTouchEnd={(e) => {
                if (e.target === e.currentTarget) onCancel()
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onCancel()
            }}
        >
            <div className="fixed bottom-0 left-0 right-0 safe-area-inset-bottom" onTouchEnd={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                <NumericKeypad
                    title="Editar Medida"
                    value={initialValue}
                    orientation={orientation}
                    onChange={() => { }} // Internal state handled by keypad, but we could sync if needed
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                />
            </div>
        </div>
    )
}
