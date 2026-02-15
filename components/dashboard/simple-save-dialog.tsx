"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"

interface SimpleSaveDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (name: string) => void
    isLoading: boolean
    container?: HTMLElement | null
}

export function SimpleSaveDialog({ open, onOpenChange, onSave, isLoading, container }: SimpleSaveDialogProps) {
    const [name, setName] = useState(() => {
        const now = new Date()
        return `Plano ${now.toLocaleDateString()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim()) {
            onSave(name)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* 
                Mobile optimizations: 
                - FORCE anchor to top with !important (!top-0 !translate-y-0)
                - Full width (!w-full)
                - No rounded corners on mobile
            */}
            <DialogContent
                container={container}
                className="!fixed !top-0 !left-0 !translate-x-0 !translate-y-0 !w-full sm:!w-full sm:!max-w-[425px] sm:!left-[50%] sm:!top-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%] p-3 gap-2 rounded-none sm:rounded-lg border-x-0 border-t-0 bg-white shadow-lg"
            >
                <div className="hidden sm:block">
                    <DialogHeader>
                        <DialogTitle>Guardar Plano</DialogTitle>
                        <DialogDescription>
                            Dale un nombre a tu plano para guardarlo.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="mt-0 w-full">
                    <div className="flex flex-col gap-1 w-full">
                        {/* Mobile Label */}
                        <label className="block sm:hidden text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Nombre del Plano
                        </label>
                        <div className="flex gap-2 w-full">
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nombre..."
                                className="flex-1 h-10 text-base border-slate-300 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-orange-500"
                            // autoFocus removed to prevent mobile keyboard glitches
                            />
                            {/* Mobile Save Button in-line to save vertical space */}
                            <Button type="submit" size="icon" disabled={!name.trim() || isLoading} className="sm:hidden h-10 w-10 shrink-0 bg-orange-600 hover:bg-orange-700">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>

                    {/* Desktop Footer */}
                    <DialogFooter className="hidden sm:flex mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={!name.trim() || isLoading} className="bg-orange-600 hover:bg-orange-700">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>

                    {/* Mobile Cancel (Text only) */}
                    <div className="sm:hidden mt-2 flex justify-center">
                        <button type="button" onClick={() => onOpenChange(false)} className="text-xs text-slate-400 p-2 font-medium">
                            Cancelar
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
