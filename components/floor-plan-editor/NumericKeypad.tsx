"use client"
import React, { useState, useEffect } from "react"
import { Delete, Check, X } from "lucide-react"

interface NumericKeypadProps {
    value: string
    onChange: (v: string) => void
    onConfirm: (val: string) => void
    onCancel: () => void
    title: string
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({ value, onChange, onConfirm, onCancel, title }) => {
    // Use local state for editing
    const [tempValue, setTempValue] = useState(value)
    const [isFirstInput, setIsFirstInput] = useState(true)

    useEffect(() => {
        // Ensure initial value uses comma for display/editing
        setTempValue(value?.replace('.', ',') || "")
        setIsFirstInput(true)
    }, [value])

    const handleDigit = (digit: string) => {
        if (isFirstInput) {
            if (digit === '.') {
                setTempValue('0,')
            } else {
                setTempValue(digit)
            }
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

    const handleConfirm = () => {
        let finalVal = tempValue
        if (finalVal.endsWith(',')) finalVal = finalVal.slice(0, -1)
        if (finalVal === '') finalVal = '0'

        // Return dot format for internal logic, but display is comma
        const normalized = finalVal.replace(',', '.')

        onChange(normalized)
        onConfirm(normalized)
    }

    return (
        <div className="w-full bg-slate-100 border-t border-slate-300 shadow-2xl pb-safe animate-in slide-in-from-bottom-5 duration-200">
            {/* Header: Title and Value Display */}
            <div className="flex flex-col gap-2 px-4 py-3 bg-white border-b border-slate-200">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-600" title="Cerrar" aria-label="Cerrar">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Simulated Input Box */}
                    <div className="flex-1 h-12 bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center px-4 relative overflow-hidden focus-within:border-sky-500 transition-colors">
                        <span className="text-3xl font-black text-slate-800 tracking-tight tabular-nums w-full text-right">
                            {tempValue || <span className="text-slate-300">0</span>}
                        </span>
                    </div>

                    {/* Backspace Button - Large and Clear */}
                    <button
                        onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete() }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete() }}
                        className="h-12 w-14 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 border-2 border-slate-200 active:bg-slate-200 active:scale-95 transition-all"
                    >
                        <Delete className="w-6 h-6" />
                    </button>

                    {/* OK Button */}
                    <button
                        onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handleConfirm() }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleConfirm() }}
                        className="h-12 w-20 flex items-center justify-center rounded-xl bg-sky-500 text-white font-bold text-lg shadow-sm active:bg-sky-600 active:scale-95 transition-all"
                    >
                        OK
                    </button>
                </div>
            </div>

            {/* Keypad Grid - Single Row is preferred by user, but let's make buttons tall enough */}
            <div className="flex w-full overflow-hidden bg-slate-50 pb-safe">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "."].map((digit, i) => (
                    <KeypadButton
                        key={digit}
                        onClick={() => handleDigit(digit)}
                        label={digit === '.' ? ',' : digit}
                        isLast={i === 10}
                    />
                ))}
            </div>
        </div>
    )
}

const KeypadButton = ({ label, onClick, isLast }: { label: string, onClick: () => void, isLast?: boolean }) => (
    <button
        onTouchStart={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClick()
        }}
        onTouchEnd={(e) => {
            e.preventDefault()
            e.stopPropagation()
        }}
        onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClick()
        }}
        className={`flex-1 h-14 flex items-center justify-center text-2xl font-bold bg-white text-slate-700 active:bg-sky-50 active:text-sky-600 transition-all border-r border-slate-200 border-b border-slate-200 ${isLast ? 'border-r-0' : ''}`}
    >
        {label}
    </button>
)
