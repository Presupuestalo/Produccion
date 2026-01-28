"use client"

import { useRef, useState } from "react"
import { EditorContainer } from "@/components/floor-plan-editor/EditorContainer"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"

export default function PublicEditorPage() {
    const [showLoginDialog, setShowLoginDialog] = useState(false)
    const [pendingSaveData, setPendingSaveData] = useState<any>(null)
    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClientComponentClient()

    const handleSave = async (data: any, image: string) => {
        // 1. Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            // Guest mode: Store data temporarily and prompt login
            const pendingState = { data, image, timestamp: Date.now() }
            localStorage.setItem('pending_guest_plan', JSON.stringify(pendingState))
            setPendingSaveData({ data, image })
            setShowLoginDialog(true)
            return
        }

        // 2. User is logged in, proceed with save
        try {
            const response = await fetch("/api/editor-planos/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "Nuevo Plano (Web)",
                    ...data
                }),
            })

            if (response.ok) {
                const result = await response.json()
                toast({ title: "Plano guardado", description: "Tu plano se ha guardado correctamente." })
                // Redirect to dashboard editor to continue editing properly connected
                router.push(`/dashboard/editor-planos/editar/${result.id}`)
            } else {
                toast({ title: "Error", description: "No se pudo guardar el plano.", variant: "destructive" })
            }
        } catch (e) {
            toast({ title: "Error", description: "Ocurrió un error inesperado.", variant: "destructive" })
        }
    }

    return (
        <div className="h-screen w-full bg-slate-50 overflow-hidden flex flex-col">
            {/* Minimal Header for Public Editor */}
            <header className="h-14 border-b bg-white flex items-center justify-between px-4 z-10 shrink-0">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <span className="text-orange-600">PRESUPUESTALO</span> <span className="text-slate-400">|</span> <span>Editor 2D</span>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" asChild>
                        <Link href="/">Volver al Inicio</Link>
                    </Button>
                    <Button variant="default" asChild>
                        <Link href="/auth/login">Iniciar Sesión</Link>
                    </Button>
                </div>
            </header>

            <div className="flex-1 overflow-hidden relative">
                <EditorContainer onSave={handleSave} />
            </div>

            <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Guarda tu trabajo</DialogTitle>
                        <DialogDescription>
                            Para guardar tu plano y generar un presupuesto, necesitas una cuenta. Es gratis y rápido.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Future improvement: Save state to localStorage here so it survives the redirect */}
                        <p className="text-sm text-muted-foreground">
                            Por favor, inicia sesión para continuar.
                        </p>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setShowLoginDialog(false)}>Cancelar</Button>
                        <Button asChild className="bg-orange-600 hover:bg-orange-700">
                            <Link href={`/auth/login?next=/editor`}>Iniciar Sesión / Registrarse</Link>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
