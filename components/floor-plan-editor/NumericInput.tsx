"use client"
import React, { useState } from "react"
import { NumericKeypad } from "./NumericKeypad"

interface NumericInputProps {
    label?: string
    value: string
    setter: (v: string) => void
    onEnter: (val?: string) => void
    placeholder?: string
    step?: number
    isMobile: boolean
}

export const NumericInput: React.FC<NumericInputProps> = ({ label, value, setter, onEnter, placeholder, step = 1, isMobile }) => {
    const [showKeypad, setShowKeypad] = useState(false)

    if (isMobile) {
        return (
            <div className="flex items-center gap-1">
                <button
                    onPointerDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (e.pointerType === 'touch' || e.pointerType === 'pen') {
                            setShowKeypad(true)
                        }
                    }}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowKeypad(true)
                    }}
                    className="min-w-[80px] h-9 px-2 bg-white border-2 border-sky-400 rounded-lg text-center text-base font-black text-slate-800 hover:bg-sky-50 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1"
                >
                    {value || placeholder || "0"}
                </button>
                {showKeypad && (
                    <div
                        className="fixed inset-0 z-[3000] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                        onTouchEnd={(e) => {
                            if (e.target === e.currentTarget) setShowKeypad(false)
                        }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setShowKeypad(false)
                        }}
                    >
                        <div className="fixed bottom-0 left-0 right-0 safe-area-inset-bottom" onTouchEnd={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                            <NumericKeypad
                                title={label || "Introducir valor"}
                                value={value}
                                onChange={setter}
                                onConfirm={(val) => {
                                    onEnter(val)
                                    setShowKeypad(false)
                                }}
                                onCancel={() => setShowKeypad(false)}
                            />
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <input
            type="text"
            inputMode="decimal"
            autoFocus
            value={value}
            onChange={(e) => {
                // Normalize comma to dot
                const val = e.target.value.replace(/,/g, '.')
                // Allow only numbers and dots
                if (/^[\d.]*$/.test(val)) {
                    setter(val)
                }
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') onEnter(value)
            }}
            onFocus={(e) => e.currentTarget.select()}
            className="w-20 p-1 border-2 border-slate-200 rounded-lg text-center text-sm font-bold text-slate-800 focus:border-sky-500 focus:outline-none transition-colors"
            placeholder={placeholder}
        />
    )
}
