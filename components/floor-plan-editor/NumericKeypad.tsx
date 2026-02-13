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
        setTempValue(value)
        setIsFirstInput(true)
    }, [value])

    const handleDigit = (digit: string) => {
        if (isFirstInput) {
            // First input replaces the entire value
            // If user types '.', treat as '0.'
            if (digit === '.') {
                setTempValue('0.')
            } else {
                setTempValue(digit)
            }
            setIsFirstInput(false)
        } else {
            // Subsequent inputs append
            if (digit === '.' && tempValue.includes('.')) return // Prevent multiple dots
            if (tempValue.length < 10) setTempValue(tempValue + digit)
        }
    }

    const handleDelete = () => {
        if (isFirstInput) {
            // Delete all on first click
            setTempValue("")
            setIsFirstInput(false)
        } else {
            // Normal backspace
            setTempValue(tempValue.slice(0, -1))
        }
    }

    const handleConfirm = () => {
        // Send final value to parent
        // Ensure we don't return partial decimal like "1." -> "1"
        let finalVal = tempValue
        if (finalVal.endsWith('.')) finalVal = finalVal.slice(0, -1)
        if (finalVal === '') finalVal = '0'

        onChange(finalVal)
        onConfirm(finalVal)
    }

    return (
        <div className="w-full bg-white border-t-2 border-slate-200 shadow-2xl animate-in slide-in-from-bottom-full duration-300 pb-safe">
            {/* Value Display */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-slate-800">{tempValue || "0"}</span>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-3 gap-2 p-4 pb-8">
                {/* Row 1 */}
                {["1", "2", "3"].map(digit => (
                    <KeypadButton key={digit} onClick={() => handleDigit(digit)} label={digit} />
                ))}

                {/* Row 2 */}
                {["4", "5", "6"].map(digit => (
                    <KeypadButton key={digit} onClick={() => handleDigit(digit)} label={digit} />
                ))}

                {/* Row 3 */}
                {["7", "8", "9"].map(digit => (
                    <KeypadButton key={digit} onClick={() => handleDigit(digit)} label={digit} />
                ))}

                {/* Row 4 */}
                <KeypadButton key="." onClick={() => handleDigit(".")} label="." />
                <KeypadButton key="0" onClick={() => handleDigit("0")} label="0" />

                {/* Delete Button */}
                <button
                    onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete() }}
                    onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete() }}
                    className="flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-300 transition-all border border-red-200 h-14"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>

                {/* OK Button - Spans full width */}
                <button
                    onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handleConfirm() }}
                    onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleConfirm() }}
                    className="col-span-3 flex items-center justify-center rounded-xl bg-sky-500 text-white font-bold text-xl hover:bg-sky-600 active:bg-sky-700 transition-all active:scale-95 shadow-lg shadow-sky-200 h-14 mt-2"
                >
                    CONFIRMAR
                </button>
            </div>
        </div>
    )
}

const KeypadButton = ({ label, onClick }: { label: string, onClick: () => void }) => (
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
        className="w-full h-14 flex items-center justify-center rounded-xl text-2xl font-bold bg-slate-50 text-slate-800 hover:bg-slate-100 active:bg-sky-200 transition-all border border-slate-200"
    >
        {label}
    </button>
)
