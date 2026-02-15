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
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const isDraggingRef = React.useRef(false)
    const dragStartRef = React.useRef({ x: 0, y: 0 })
    const initialPosRef = React.useRef({ x: 0, y: 0 })

    const handlePointerDown = (e: React.PointerEvent) => {
        isDraggingRef.current = true
        dragStartRef.current = { x: e.clientX, y: e.clientY }
        initialPosRef.current = { ...position }
        e.currentTarget.setPointerCapture(e.pointerId)
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDraggingRef.current) return
        const dx = e.clientX - dragStartRef.current.x
        const dy = e.clientY - dragStartRef.current.y
        setPosition({
            x: initialPosRef.current.x + dx,
            y: initialPosRef.current.y + dy
        })
    }

    const handlePointerUp = (e: React.PointerEvent) => {
        isDraggingRef.current = false
        e.currentTarget.releasePointerCapture(e.pointerId)
    }

    if (isMobile) {
        return (
            <div className="flex items-center gap-1">
                <button
                    onPointerDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (e.pointerType === 'touch' || e.pointerType === 'pen') {
                            setShowKeypad(true)
                            // Reset position on open or keep visual center? 
                            // Let's reset to center bottom initially if we want, or keeping 0,0 (handled by CSS transform) is fine.
                            setPosition({ x: 0, y: 0 })
                        }
                    }}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowKeypad(true)
                        setPosition({ x: 0, y: 0 })
                    }}
                    className="min-w-[80px] h-9 px-2 bg-white border-2 border-sky-400 rounded-lg text-center text-base font-black text-slate-800 hover:bg-sky-50 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1"
                >
                    {value || placeholder || "0"}
                </button>
                {showKeypad && (
                    <div
                        className="fixed inset-0 z-[3000] bg-transparent" // Invisible overlay for click-outside
                        onTouchEnd={(e) => {
                            if (e.target === e.currentTarget) setShowKeypad(false)
                        }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setShowKeypad(false)
                        }}
                    >
                        {/* Draggable Container */}
                        <div
                            className="fixed bottom-12 left-1/2 z-[3001] flex justify-center pointer-events-none"
                            style={{
                                transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)`,
                                transition: isDraggingRef.current ? 'none' : 'transform 0.1s ease-out'
                            }}
                        >
                            <div
                                className="w-auto min-w-[180px] max-w-[95vw] pointer-events-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl overflow-visible ring-1 ring-black/5 flex flex-col"
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                style={{ touchAction: 'none' }}
                            >
                                {/* Drag Handle */}
                                <div className="w-full flex justify-center pt-2 pb-1 bg-transparent cursor-grab active:cursor-grabbing border-b border-white/10">
                                    <div className="w-12 h-1.5 rounded-full bg-black/20" />
                                </div>
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
