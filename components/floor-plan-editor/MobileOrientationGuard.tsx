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

    const enterFullscreen = async () => {
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen()
            }
            // @ts-ignore
            if (screen.orientation && screen.orientation.lock) {
                // @ts-ignore
                await screen.orientation.lock("landscape")
            }
        } catch (err) {
            console.error("Error attempting to enable fullscreen:", err)
        }
    }

    if (!isWrongOrientation) return null

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
            <div className="mb-8 animate-bounce">
                <RotateCcw className="h-16 w-16 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Modo Edición</h2>
            <p className="text-slate-300 max-w-xs mx-auto mb-8">
                Para la mejor experiencia, necesitamos pantalla completa en horizontal.
            </p>
            <button
                onClick={enterFullscreen}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all active:scale-95 text-lg"
            >
                Comenzar a Editar
            </button>
        </div>
    )
}
