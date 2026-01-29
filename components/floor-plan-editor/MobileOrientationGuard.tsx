"use client"

import React, { useEffect, useState } from "react"
import { RotateCcw } from "lucide-react"

export function MobileOrientationGuard() {
    const [isWrongOrientation, setIsWrongOrientation] = useState(false)

    useEffect(() => {
        const checkOrientation = () => {
            const isMobile = window.innerWidth <= 768
            const isPortrait = window.innerHeight > window.innerWidth

            // Only block if on mobile size AND in portrait mode
            setIsWrongOrientation(isMobile && isPortrait)
        }

        // Check initially
        checkOrientation()

        // Listen for resize/orientation changes
        window.addEventListener("resize", checkOrientation)
        window.addEventListener("orientationchange", checkOrientation)

        return () => {
            window.removeEventListener("resize", checkOrientation)
            window.removeEventListener("orientationchange", checkOrientation)
        }
    }, [])

    if (!isWrongOrientation) return null

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
            <div className="mb-8 animate-bounce">
                <RotateCcw className="h-16 w-16 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Gira tu dispositivo</h2>
            <p className="text-slate-300 max-w-xs mx-auto">
                La experiencia de edición requiere una pantalla más ancha. Por favor, coloca tu teléfono en posición horizontal.
            </p>
        </div>
    )
}
