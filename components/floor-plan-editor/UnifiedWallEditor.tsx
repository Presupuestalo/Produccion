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
    // Render Keypad in a Portal to escape parent stacking contexts (Canvas/Zoom)
    // This ensures it is always fixed to the viewport.
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    if (!mounted) return null

    // Portal to document.body
    return React.createPortal(
        <div
            className="fixed inset-0 z-[99999] isolate"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} // Force full viewport
            onTouchEnd={(e) => {
                if (e.target === e.currentTarget) onCancel()
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onCancel()
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-200" />

            {/* Keypad Container - Fixed Bottom */}
            <div
                className="absolute bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-10 duration-200"
                onTouchEnd={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
            >
                <NumericKeypad
                    title="Editar Medida"
                    value={initialValue}
                    orientation={orientation}
                    onChange={() => { }}
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                />
                {/* Safe Area Spacer */}
                <div className="h-safe-bottom bg-slate-100 w-full" />
            </div>
        </div>,
        document.body
    )
}
