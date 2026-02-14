"use client"
import React, { useState } from "react"
import { NumericInput } from "./NumericInput"
import { X } from "lucide-react"

interface UnifiedWallEditorProps {
    initialValue: string
    isVertical: boolean
    onConfirm: (val: string, direction: "left" | "right" | "up" | "down" | null) => void
    onCancel: () => void
}

export const UnifiedWallEditor = ({ initialValue, isVertical, onConfirm, onCancel }: UnifiedWallEditorProps) => {
    const [val, setVal] = useState(initialValue)

    // Directional arrows helper
    const ArrowBtn = ({ dir, icon }: { dir: "left" | "right" | "up" | "down", icon: string }) => (
        <button
            onClick={() => onConfirm(val, dir)}
            className="p-3 bg-slate-100 active:bg-sky-100 active:text-sky-600 rounded-xl flex items-center justify-center transition-colors border-2 border-slate-200"
        >
            <span className="text-xl font-bold">{icon}</span>
        </button>
    )

    return (
        <div className="flex flex-col gap-3 p-3 bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-white/20 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Editar Medida</span>
                <button onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <NumericInput
                        isMobile={true}
                        value={val}
                        setter={setVal}
                        onEnter={(v) => onConfirm(v || val, null)}
                        label="Medida"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1">
                {isVertical ? (
                    <>
                        <ArrowBtn dir="up" icon="↑" />
                        <ArrowBtn dir="down" icon="↓" />
                    </>
                ) : (
                    <>
                        <ArrowBtn dir="left" icon="←" />
                        <ArrowBtn dir="right" icon="→" />
                    </>
                )}
            </div>
            <div className="text-[10px] text-center text-slate-400 font-medium">
                Toca una flecha para extender hacia ese lado
            </div>
        </div>
    )
}
