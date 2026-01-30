"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Heart, X } from "lucide-react"
import Link from "next/link"

export function DonationPopup() {
    const [isOpen, setIsOpen] = useState(false)
    const [isDonor, setIsDonor] = useState(false)

    useEffect(() => {
        // 1. Verificar si ya se mostró en esta sesión (a menos que estemos forzando por URL)
        const searchParams = new URLSearchParams(window.location.search)
        const forcePopup = searchParams.get("forceDonationPopup") === "true"

        const hasSeenPopup = localStorage.getItem("donation-popup-seen")
        if (hasSeenPopup && !forcePopup) return

        // 2. Verificar si el usuario ya es donante
        const checkDonorStatus = async () => {
            try {
                const res = await fetch("/api/subscription/status")
                if (res.status === 401) {
                    // No autenticado, simplemente no hacemos nada (será tratado como no donante)
                    return
                }
                const data = await res.json()
                if (data.is_donor) {
                    setIsDonor(true)
                    if (!forcePopup) {
                        localStorage.setItem("donation-popup-seen", "true")
                    }
                }
            } catch (error) {
                console.error("Error checking donor status for popup:", error)
            }
        }

        checkDonorStatus()

        // 3. Configurar el temporizador
        const delay = forcePopup ? 1000 : 10000 // 1s si forzamos, 10s normal
        const timer = setTimeout(() => {
            console.log("[DonationPopup] Showing popup now")
            setIsOpen(true)
        }, delay)

        return () => clearTimeout(timer)
    }, [])

    const handleClose = (permanent = false) => {
        setIsOpen(false)
        if (permanent) {
            localStorage.setItem("donation-popup-seen", "true")
        }
    }

    // No mostrar si el usuario ya es donante, a menos que estemos forzando el popup
    useEffect(() => {
        if (isDonor && isOpen) {
            const searchParams = new URLSearchParams(window.location.search)
            if (searchParams.get("forceDonationPopup") !== "true") {
                setIsOpen(false)
            }
        }
    }, [isDonor, isOpen])

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose(false)}>
            <DialogContent className="sm:max-w-[425px] border-orange-200 bg-gradient-to-b from-white to-orange-50">
                <DialogHeader>
                    <div className="mx-auto bg-orange-100 p-3 rounded-full mb-4">
                        <Heart className="h-8 w-8 text-orange-600 fill-current animate-pulse" />
                    </div>
                    <DialogTitle className="text-center text-2xl font-bold text-orange-900">
                        ¿Te gusta Presupuéstalo?
                    </DialogTitle>
                    <DialogDescription className="text-center text-orange-800 text-lg">
                        Este proyecto crece gracias al apoyo de profesionales como tú.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <p className="text-sm text-center text-gray-600 leading-relaxed">
                        Presupuéstalo es una herramienta independiente. Por solo <strong>2€ al mes</strong>, nos ayudas a mantener los servidores y seguir desarrollando nuevas funciones con IA.
                    </p>

                    <div className="bg-white/50 p-4 rounded-xl border border-orange-100 italic text-sm text-center text-orange-700">
                        "Como donante, tendrás acceso exclusivo a nuestro grupo de Telegram y verás el plan de ruta antes que nadie."
                    </div>
                </div>

                <DialogFooter className="flex flex-col gap-2 sm:flex-col">
                    <Button asChild className="w-full h-12 text-lg bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all hover:scale-105">
                        <Link href="https://buy.stripe.com/test_9B69ATaZW3se6BJ51rdby00" target="_blank">
                            Apoyar con 2€/mes
                        </Link>
                    </Button>
                    <div className="flex justify-center gap-4 mt-2">
                        <button
                            onClick={() => handleClose(true)}
                            className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
                        >
                            Ya soy donante / No volver a mostrar
                        </button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
