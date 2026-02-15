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
import { Loader2 } from "lucide-react"

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
                - anchor to top (top-[12%]) instead of center to avoid keyboard occlusion
                - remove translateY centering on mobile
                - restore desktop defaults with sm: prefix
            */}
            <DialogContent
                container={container}
                className="sm:max-w-[425px] top-[12%] translate-y-0 data-[state=open]:slide-in-from-top-[12%] sm:top-[50%] sm:translate-y-[-50%] sm:data-[state=open]:slide-in-from-top-[48%]"
            >
                <DialogHeader>
                    <DialogTitle>Guardar Plano</DialogTitle>
                    <DialogDescription>
                        Dale un nombre a tu plano para guardarlo.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nombre
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Salón reformado"
                                className="col-span-3"
                            // autoFocus removed to prevent mobile keyboard glitches
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={!name.trim() || isLoading} className="bg-orange-600 hover:bg-orange-700">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
