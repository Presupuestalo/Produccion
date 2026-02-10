"use client"

import React, { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Undo, Check } from "lucide-react"

interface SignaturePadProps {
    onSave: (signatureDataUrl: string) => void
    onClear?: () => void
    placeholder?: string
    defaultValue?: string
}

export function SignaturePad({ onSave, onClear, placeholder, defaultValue }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [isEmpty, setIsEmpty] = useState(!defaultValue)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const context = canvas.getContext("2d")
        if (!context) return

        // Set initial canvas size
        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect()
            canvas.width = rect.width
            canvas.height = rect.height

            // If we have a default value, draw it
            if (defaultValue) {
                const img = new Image()
                img.onload = () => {
                    context.drawImage(img, 0, 0, canvas.width, canvas.height)
                }
                img.src = defaultValue
            }

            context.lineWidth = 2
            context.lineCap = "round"
            context.strokeStyle = "#000"
        }

        resizeCanvas()
        window.addEventListener("resize", resizeCanvas)

        return () => window.removeEventListener("resize", resizeCanvas)
    }, [defaultValue])

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true)
        const canvas = canvasRef.current
        if (!canvas) return
        const context = canvas.getContext("2d")
        if (!context) return

        const rect = canvas.getBoundingClientRect()
        const x = ("touches" in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left
        const y = ("touches" in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top

        context.beginPath()
        context.moveTo(x, y)
        setIsEmpty(false)
    }

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return
        const context = canvas.getContext("2d")
        if (!context) return

        const rect = canvas.getBoundingClientRect()
        const x = ("touches" in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left
        const y = ("touches" in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top

        context.lineTo(x, y)
        context.stroke()

        // Prevent scrolling on touch
        if ("touches" in e) {
            // @ts-ignore
            if (e.cancelable) e.preventDefault()
        }
    }

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false)
            const canvas = canvasRef.current
            if (canvas) {
                onSave(canvas.toDataURL("image/png"))
            }
        }
    }

    const clear = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const context = canvas.getContext("2d")
        if (!context) return

        context.clearRect(0, 0, canvas.width, canvas.height)
        setIsEmpty(true)
        onClear?.()
        onSave("")
    }

    return (
        <div className="relative w-full h-full border-2 border-dashed rounded-lg bg-background group overflow-hidden">
            {isEmpty && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground opacity-50 select-none">
                    {placeholder || "Firma aquí"}
                </div>
            )}
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full cursor-crosshair touch-none"
            />
            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-md"
                    onClick={clear}
                    title="Borrar"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
