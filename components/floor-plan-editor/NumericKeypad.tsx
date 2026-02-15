"use client"
import React, { useState, useEffect } from "react"
import { Delete, X, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from "lucide-react"

interface NumericKeypadProps {
    value: string
    onChange: (v: string) => void
    onConfirm: (val: string, direction?: "left" | "right" | "up" | "down" | null) => void
    onCancel: () => void
    title: string
    orientation?: 'horizontal' | 'vertical' | 'inclined' | 'none'
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({ value, onChange, onConfirm, onCancel, title, orientation = 'none' }) => {
    // ... logic remains same ...
    const [tempValue, setTempValue] = useState(value)
    const [isFirstInput, setIsFirstInput] = useState(true)

    useEffect(() => {
        setTempValue(value?.replace('.', ',') || "")
        setIsFirstInput(true)
    }, [value])

    const handleDigit = (digit: string) => {
        if (isFirstInput) {
            if (digit === '.') setTempValue('0,')
            else setTempValue(digit)
            setIsFirstInput(false)
        } else {
            if (digit === '.') {
                if (tempValue.includes(',')) return
                setTempValue((tempValue === "" ? "0" : tempValue) + ',')
                return
            }

            // Allow replacing "0" if it's the only character
            if (tempValue === "0") {
                setTempValue(digit)
                return
            }

            if (tempValue.length < 10) setTempValue(tempValue + digit)
        }
    }

    const handleDelete = () => {
        setTempValue(prev => {
            if (prev.length <= 1) return ""
            return prev.slice(0, -1)
        })
        if (isFirstInput) setIsFirstInput(false)
    }

    const handleConfirm = (direction?: "left" | "right" | "up" | "down" | null) => {
        let finalVal = tempValue
        if (finalVal.endsWith(',')) finalVal = finalVal.slice(0, -1)
        if (finalVal === '') finalVal = '0'
        const normalized = finalVal.replace(',', '.')
        onChange(normalized)
        onConfirm(normalized, direction)
    }

    const renderActionButtons = () => {
        if (orientation === 'horizontal') {
            return (
                <>
                    <button onClick={(e) => { e.stopPropagation(); handleConfirm('left') }} className="h-10 px-4 flex items-center justify-center rounded-lg bg-sky-500 text-white font-semibold active:bg-sky-600 shadow-sm" title="Izquierda"><ArrowLeft className="w-5 h-5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleConfirm('right') }} className="h-10 px-4 flex items-center justify-center rounded-lg bg-sky-500 text-white font-semibold active:bg-sky-600 shadow-sm" title="Derecha"><ArrowRight className="w-5 h-5" /></button>
                </>
            )
        }
        if (orientation === 'vertical') {
            return (
                <>
                    <button onClick={(e) => { e.stopPropagation(); handleConfirm('up') }} className="h-10 px-4 flex items-center justify-center rounded-lg bg-sky-500 text-white font-semibold active:bg-sky-600 shadow-sm" title="Arriba"><ArrowUp className="w-5 h-5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleConfirm('down') }} className="h-10 px-4 flex items-center justify-center rounded-lg bg-sky-500 text-white font-semibold active:bg-sky-600 shadow-sm" title="Abajo"><ArrowDown className="w-5 h-5" /></button>
                </>
            )
        }
        return <button onClick={(e) => { e.stopPropagation(); handleConfirm() }} className="h-10 px-8 flex items-center justify-center rounded-lg bg-sky-500 text-white font-semibold active:bg-sky-600 shadow-sm">OK</button>
    }

    return (
        <div className="w-full bg-transparent flex flex-col">
            {/* Header: Close, Value, Actions */}
            <div className="flex items-center justify-between p-1 border-b border-black/5">
                <button onClick={onCancel} className="p-1 text-slate-500 hover:text-slate-700 active:bg-black/5 rounded-full" aria-label="Cerrar"><X className="w-3.5 h-3.5" /></button>

                <div className="flex-1 mx-1.5 bg-white/10 px-2 py-1 rounded-lg border border-white/20 flex justify-center items-center shadow-sm backdrop-blur-sm">
                    <span className="text-base font-black text-slate-800 tabular-nums tracking-wide">
                        {tempValue || "0"}
                    </span>
                </div>

                <button onClick={(e) => { e.stopPropagation(); handleDelete() }} className="p-2 text-slate-600 active:bg-black/10 rounded-lg mr-1 hover:text-red-500 transition-colors" aria-label="Borrar">
                    <Delete className="w-5 h-5" />
                </button>

                <div className="flex gap-1 scale-90 origin-right">
                    {renderActionButtons()}
                </div>
            </div>

            {/* Keys: Horizontal Scrollable List (Single Row "Enfilados") - Ultra Compact */}
            <div className="w-full overflow-x-auto py-1 px-1 bg-transparent no-scrollbar">
                <div className="flex gap-1 min-w-full px-0.5">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "."].map((digit) => (
                        <button
                            key={digit}
                            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDigit(digit) }}
                            className="flex-none w-8 h-8 flex items-center justify-center text-sm font-bold bg-white/30 text-slate-800 rounded-lg border border-white/20 shadow-sm active:scale-95 transition-all hover:bg-white/50 backdrop-blur-sm"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            {digit === '.' ? ',' : digit}
                        </button>
                    ))}
                </div>
                <style jsx>{`
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .no-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
            </div>
        </div>
    )
}
