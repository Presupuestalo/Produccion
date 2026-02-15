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
            if (prev.length <= 1) return "0"
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
        <div className="w-full bg-white flex flex-col">
            {/* Header: Close, Value, Actions */}
            <div className="flex items-center justify-between p-2 border-b border-slate-100">
                <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 active:bg-slate-100 rounded-full" aria-label="Cerrar"><X className="w-5 h-5" /></button>

                <div className="flex-1 mx-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex justify-center items-center">
                    <span className="text-xl font-bold text-slate-900 tabular-nums">
                        {tempValue || "0"}
                    </span>
                </div>

                <button onClick={(e) => { e.stopPropagation(); handleDelete() }} className="p-2 text-slate-500 active:bg-slate-100 rounded-lg mr-1" aria-label="Borrar">
                    <Delete className="w-5 h-5" />
                </button>

                <div className="flex gap-1">
                    {renderActionButtons()}
                </div>
            </div>

            {/* Keys: Grid layout for better visibility on small screens */}
            <div className="w-full py-2 px-2 bg-slate-50">
                <div className="grid grid-cols-6 gap-2 px-1">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "."].map((digit) => (
                        <button
                            key={digit}
                            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDigit(digit) }}
                            className="h-12 flex items-center justify-center text-xl font-bold bg-white text-slate-800 rounded-lg border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 active:bg-slate-50 transition-all shadow-sm"
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
