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
                - anchor to top (top-0) to maximize space above keyboard
                - remove unnecessary header space
            */}
            <DialogContent
                container={container}
                className="w-full sm:max-w-[425px] top-0 translate-y-0 data-[state=open]:slide-in-from-top-0 sm:top-[50%] sm:translate-y-[-50%] sm:data-[state=open]:slide-in-from-top-[48%] p-3 gap-1 max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg"
            >
                <DialogHeader className="p-0 space-y-0 items-start">
                    <DialogTitle className="text-sm font-medium">Guardar Plano</DialogTitle>
                    <DialogDescription className="hidden sm:block text-xs">
                        Dale un nombre a tu plano para guardarlo.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="mt-1">
                    <div className="grid gap-2 py-0">
                        <div className="grid grid-cols-1 gap-1">
                            <Label htmlFor="name" className="text-left text-xs sr-only">
                                Nombre
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nombre del plano..."
                                className="col-span-1 h-10 text-base"
                            // autoFocus removed to prevent mobile keyboard glitches
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-4 flex-row gap-2 justify-end sm:justify-end">
                        <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">
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
