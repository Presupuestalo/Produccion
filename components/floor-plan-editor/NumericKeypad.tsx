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
            if (digit === '.' && tempValue.includes(',')) return
            if (digit === '.' && !tempValue.includes(',')) {
                setTempValue(tempValue + ',')
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
                    <button onClick={(e) => { e.stopPropagation(); handleConfirm('left') }} className="h-9 px-3 flex items-center justify-center rounded-lg bg-sky-500 text-white font-semibold active:bg-sky-600" title="Izquierda" aria-label="Extender izquierda"><ArrowLeft className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleConfirm('right') }} className="h-9 px-3 flex items-center justify-center rounded-lg bg-sky-500 text-white font-semibold active:bg-sky-600" title="Derecha" aria-label="Extender derecha"><ArrowRight className="w-4 h-4" /></button>
                </>
            )
        }
        if (orientation === 'vertical') {
            return (
                <>
                    <button onClick={(e) => { e.stopPropagation(); handleConfirm('up') }} className="h-9 px-3 flex items-center justify-center rounded-lg bg-sky-500 text-white font-semibold active:bg-sky-600" title="Arriba" aria-label="Extender arriba"><ArrowUp className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleConfirm('down') }} className="h-9 px-3 flex items-center justify-center rounded-lg bg-sky-500 text-white font-semibold active:bg-sky-600" title="Abajo" aria-label="Extender abajo"><ArrowDown className="w-4 h-4" /></button>
                </>
            )
        }
        return <button onClick={(e) => { e.stopPropagation(); handleConfirm() }} className="h-9 px-4 flex items-center justify-center rounded-lg bg-sky-500 text-white font-semibold active:bg-sky-600">OK</button>
    }

    return (
        <div className="w-full bg-white border-t-2 border-slate-300 shadow-2xl">
            {/* Row 1: Value + Actions - Compact */}
            <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-slate-200 bg-white">
                <button onClick={onCancel} className="p-1.5 text-slate-500 hover:text-slate-700 active:text-slate-900" title="Cerrar" aria-label="Cerrar"><X className="w-4 h-4" /></button>

                <div className="flex-1 min-w-[80px] px-2 py-1.5 bg-white border border-slate-300 rounded">
                    <span className="text-xl font-bold text-slate-900 tabular-nums">
                        {tempValue || <span className="text-slate-400">0</span>}
                    </span>
                </div>

                <button onClick={(e) => { e.stopPropagation(); handleDelete() }} className="h-9 px-2 flex items-center justify-center rounded-lg bg-slate-200 text-slate-700 active:bg-slate-300" title="Borrar" aria-label="Borrar">
                    <Delete className="w-4 h-4" />
                </button>

                {renderActionButtons()}
            </div>

            {/* Row 2: Number Keys - Fit to screen */}
            <div className="bg-white py-2 px-2">
                <div className="flex flex-wrap gap-1 justify-center">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "."].map((digit) => (
                        <button
                            key={digit}
                            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDigit(digit) }}
                            className="h-10 w-8 flex items-center justify-center text-lg font-bold bg-white text-slate-700 rounded-md border border-slate-300 shadow-sm active:bg-slate-100 active:scale-95 transition-all"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            {digit === '.' ? ',' : digit}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
