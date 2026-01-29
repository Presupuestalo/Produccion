"use client"

import React, { useEffect, useState } from "react"
import { RotateCcw, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export function MobileOrientationGuard({ onEnterFullscreen }: { onEnterFullscreen?: () => void }) {
    const [isWrongOrientation, setIsWrongOrientation] = useState(false)
    const router = useRouter()

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

    // Prevent zoom/pinch on mobile
    useEffect(() => {
        if (isWrongOrientation) {
            // Add viewport meta tag to prevent zoom
            let viewportMeta = document.querySelector('meta[name="viewport"]')
            const originalContent = viewportMeta?.getAttribute("content")

            if (viewportMeta) {
                viewportMeta.setAttribute(
                    "content",
                    "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
                )
            }

            // Prevent touch events from zooming
            const preventZoom = (e: TouchEvent) => {
                if (e.touches.length > 1) {
                    e.preventDefault()
                }
            }

            const preventGestureZoom = (e: Event) => {
                e.preventDefault()
            }

            document.addEventListener("touchmove", preventZoom, { passive: false })
            document.addEventListener("gesturestart", preventGestureZoom, { passive: false })
            document.addEventListener("gesturechange", preventGestureZoom, { passive: false })
            document.addEventListener("gestureend", preventGestureZoom, { passive: false })

            return () => {
                // Restore original viewport
                if (viewportMeta && originalContent) {
                    viewportMeta.setAttribute("content", originalContent)
                }
                document.removeEventListener("touchmove", preventZoom)
                document.removeEventListener("gesturestart", preventGestureZoom)
                document.removeEventListener("gesturechange", preventGestureZoom)
                document.removeEventListener("gestureend", preventGestureZoom)
            }
        }
    }, [isWrongOrientation])

    const enterFullscreen = async () => {
        try {
            if (onEnterFullscreen) {
                onEnterFullscreen()
            }

            // Lock orientation if supported after entering fullscreen
            if (screen.orientation && (screen.orientation as any).lock) {
                await (screen.orientation as any).lock("landscape").catch((err: any) => {
                    console.warn("Orientation lock failed (normal on some browsers):", err)
                })
            }
        } catch (err) {
            console.error("Error attempting to handle mobile transition:", err)
        }
    }

    const handleBack = () => {
        router.back()
    }

    if (!isWrongOrientation) return null

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white touch-none">
            {/* Back button */}
            <button
                onClick={handleBack}
                className="absolute top-4 left-4 flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Volver</span>
            </button>

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
