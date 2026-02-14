"use client"
import React, { useState, useEffect } from "react"
import { Delete, Check, X, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from "lucide-react"

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

    // Compact Command Buttons (Icons Only)
    const renderCommandButtons = () => {
        const btnClass = "h-10 w-12 flex items-center justify-center rounded-lg bg-sky-100 text-sky-700 border border-sky-200 active:bg-sky-200 transition-all"

        if (orientation === 'horizontal') {
            return (
                <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleConfirm('left') }} className={btnClass} title="Extender izquierda" aria-label="Extender izquierda"><ArrowLeft className="w-5 h-5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleConfirm('right') }} className={btnClass} title="Extender derecha" aria-label="Extender derecha"><ArrowRight className="w-5 h-5" /></button>
                </div>
            )
        }
        if (orientation === 'vertical') {
            return (
                <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleConfirm('up') }} className={btnClass} title="Extender arriba" aria-label="Extender arriba"><ArrowUp className="w-5 h-5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleConfirm('down') }} className={btnClass} title="Extender abajo" aria-label="Extender abajo"><ArrowDown className="w-5 h-5" /></button>
                </div>
            )
        }
        return (
            <button onClick={(e) => { e.stopPropagation(); handleConfirm() }} className="h-10 w-14 flex items-center justify-center rounded-lg bg-sky-500 text-white font-bold text-sm shadow-sm active:bg-sky-600 transition-all">OK</button>
        )
    }

    return (
        <div className="w-full bg-slate-50 border-t border-slate-200 shadow-2xl pb-safe">
            {/* Row 1: Display & Actions */}
            <div className="flex items-center gap-2 px-2 py-2 border-b border-slate-200 bg-white">
                {/* Title (Small) & Close */}
                <div className="flex flex-col justify-center mr-1">
                    <button onClick={onCancel} className="p-1 -ml-1 text-slate-400 hover:text-slate-600" title="Cerrar" aria-label="Cerrar"><X className="w-4 h-4" /></button>
                </div>

                {/* Simulated Input */}
                <div className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center px-3 overflow-hidden">
                    <span className="text-xl font-bold text-slate-800 tracking-tight tabular-nums w-full text-right">
                        {tempValue || <span className="text-slate-300">0</span>}
                    </span>
                </div>

                {/* Backspace */}
                <button onClick={(e) => { e.stopPropagation(); handleDelete() }} className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200 active:bg-slate-200" title="Borrar" aria-label="Borrar">
                    <Delete className="w-5 h-5" />
                </button>

                {/* OK / Direction Buttons */}
                {renderCommandButtons()}
            </div>

            {/* Row 2: Scrollable Numbers */}
            <div className="flex w-full overflow-x-auto bg-slate-100 no-scrollbar py-2">
                <div className="flex w-full min-w-max px-2 gap-2 justify-center">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "."].map((digit) => (
                        <KeypadButton
                            key={digit}
                            onClick={() => handleDigit(digit)}
                            label={digit === '.' ? ',' : digit}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

const KeypadButton = ({ label, onClick }: { label: string, onClick: () => void }) => (
    <button
        onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); onClick() }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick() }}
        className="h-10 w-10 flex-shrink-0 flex items-center justify-center text-lg font-bold bg-white text-slate-700 rounded-md shadow-sm border border-slate-200 active:bg-sky-50 active:text-sky-600 active:border-sky-300 transition-all"
    >
        {label}
    </button>
)
