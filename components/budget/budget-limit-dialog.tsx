"use client"

import React from "react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, ShieldAlert, Trash2 } from "lucide-react"

interface BudgetLimitDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentBudgets: number
    maxBudgets: number
    canUpgrade: boolean
}

export function BudgetLimitDialog({
    open,
    onOpenChange,
    currentBudgets,
    maxBudgets,
    canUpgrade,
}: BudgetLimitDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-gradient-to-br from-primary/10 via-background to-background p-6">
                    <DialogHeader className="space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <ShieldAlert className="h-8 w-8 text-primary" />
                        </div>
                        <DialogTitle className="text-2xl text-center font-serif">Limite de Presupuestos</DialogTitle>
                        <DialogDescription className="text-center text-base">
                            Has alcanzado el limite de <strong>{maxBudgets}</strong> presupuesto{maxBudgets > 1 ? "s" : ""} por proyecto
                            definido en tu plan actual.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-8 space-y-4">
                        {canUpgrade ? (
                            <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-3">
                                <div className="flex items-center gap-2 text-primary font-semibold">
                                    <Sparkles className="h-4 w-4" />
                                    <span>Sube de plan para desbloquear mas</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    El plan <strong>Basic</strong> te permite hasta 3 presupuestos, y el <strong>Pro</strong> hasta 5 por
                                    proyecto.
                                </p>
                                <Button
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group"
                                    onClick={() => (window.location.href = "/dashboard/suscripcion")}
                                >
                                    Ver Planes
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl border border-muted bg-muted/30 space-y-3">
                                <div className="flex items-center gap-2 text-muted-foreground font-semibold">
                                    <Trash2 className="h-4 w-4" />
                                    <span>Gestiona tus presupuestos</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Has alcanzado el maximo permitido (5). Si necesitas crear uno nuevo, por favor elimina alguno de los
                                    presupuestos anteriores de este proyecto.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-6">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
                            Entendido
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
