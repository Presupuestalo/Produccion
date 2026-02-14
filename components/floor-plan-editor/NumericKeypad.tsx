"use client"
import React, { useState, useEffect } from "react"
import { Check } from "lucide-react"

interface NumericKeypadProps {
    value: string
    onChange: (v: string) => void
    onConfirm: (val: string) => void
    onCancel: () => void
    title: string
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({ value, onChange, onConfirm, onCancel, title }) => {
    // Use local state for editing - only send to parent on OK
    const [tempValue, setTempValue] = useState(value)
    const [isFirstInput, setIsFirstInput] = useState(true)

    // Reset when keypad opens (value changes from parent)
    useEffect(() => {
        // Ensure initial value uses comma for display/editing
        setTempValue(value?.replace('.', ',') || "")
        setIsFirstInput(true)
    }, [value])

    const handleDigit = (digit: string) => {
        if (isFirstInput) {
            // First input replaces the entire value
            if (digit === '.') {
                setTempValue('0,')
            } else {
                setTempValue(digit)
            }
            setIsFirstInput(false)
        } else {
            // Subsequent inputs append
            if (digit === '.' && tempValue.includes(',')) return // Prevent multiple commas
            if (digit === '.' && !tempValue.includes(',')) {
                setTempValue(tempValue + ',')
                return
            }
            if (tempValue.length < 10) setTempValue(tempValue + digit)
        }
    }

    const handleDelete = () => {
        // Always delete one character (standard backspace)
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

        // Convert comma to dot for internal consistency
        const normalized = finalVal.replace(',', '.')

        onChange(normalized)
        onConfirm(normalized)
    }

    return (
        <div className="w-full bg-white border-t-2 border-sky-100 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pb-safe animate-in slide-in-from-bottom-5 duration-200">
            {/* Value Display & Actions Row */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50/80 backdrop-blur-sm border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate max-w-[80px]">{title}</span>

                <div className="flex items-center gap-3 flex-1 justify-end">
                    {/* Value */}
                    <span className="text-2xl font-black text-slate-800 tabular-nums tracking-tight">{tempValue || "0"}</span>

                    {/* Divider */}
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>

                    {/* Delete Button (Small Icon) */}
                    <button
                        onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete() }}
                        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation() }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete() }}
                        className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>

                    {/* Confirm Button (Small, next to value) */}
                    <button
                        onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handleConfirm() }}
                        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation() }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleConfirm() }}
                        className="h-9 px-4 flex items-center justify-center rounded-lg bg-sky-500 text-white text-xs font-bold uppercase tracking-wider hover:bg-sky-600 active:bg-sky-700 active:scale-95 transition-all shadow-md shadow-sky-200 ml-1"
                    >
                        OK
                    </button>
                </div>
            </div>

            {/* Linear Keypad Row */}
            <div className="flex w-full overflow-hidden bg-white pb-safe min-h-[64px]">
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
        className={`flex-1 h-14 flex items-center justify-center text-xl font-bold bg-white text-slate-800 active:bg-sky-50 active:text-sky-600 transition-all border-r border-slate-100 ${isLast ? 'border-r-0' : ''}`}
    >
        {label}
    </button>
)
