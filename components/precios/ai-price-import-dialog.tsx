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
import { Sparkles, ArrowRight, FileText, Brain, Zap, CheckCircle2 } from "lucide-react"

interface AIPriceImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode?: "import" | "generate" | "contract" | "appointment"
}

export function AIPriceImportDialog({ open, onOpenChange, mode = "import" }: AIPriceImportDialogProps) {
    const isGenerate = mode === "generate"
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl bg-slate-950 text-white">
                <div className="relative">
                    {/* Background Decorations */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl" />

                    <div className="relative p-8">
                        <DialogHeader className="space-y-4">
                            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-2 shadow-lg shadow-purple-500/20 transform -rotate-6">
                                <Brain className="h-10 w-10 text-white" />
                            </div>
                            <DialogTitle className="text-3xl text-center font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                                {isGenerate ? "Generación con IA" : mode === "contract" ? "Contratos Inteligentes" : mode === "appointment" ? "Citas Premium" : "Importación con IA"}
                            </DialogTitle>
                            <DialogDescription className="text-center text-slate-400 text-lg">
                                {isGenerate
                                    ? "Crea conceptos y precios complejos en segundos mediante lenguaje natural."
                                    : mode === "contract"
                                        ? "Saca partido a la IA para redactar cláusulas legales y proteger tu negocio."
                                        : mode === "appointment"
                                            ? "Automatiza tus citas y envía recordatorios profesionales a tus clientes."
                                            : "Sube tus presupuestos en PDF y deja que nuestra IA haga el trabajo sucio por ti."}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-8 space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                    <div className="mt-1 bg-purple-500/20 p-1.5 rounded-lg">
                                        <Zap className="h-4 w-4 text-purple-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">
                                            {isGenerate ? "Precios al instante" : mode === "contract" ? "Cláusulas Especializadas" : mode === "appointment" ? "Invitaciones por Email" : "Extracción en segundos"}
                                        </h4>
                                        <p className="text-xs text-slate-400">
                                            {isGenerate
                                                ? "Define trabajos complejos y obtén estimaciones de mercado al momento."
                                                : mode === "contract"
                                                    ? "Genera textos legales adaptados a cada tipo de reforma o cliente."
                                                    : mode === "appointment"
                                                        ? "Tus clientes recibirán una invitación profesional automáticamente."
                                                        : "Analiza documentos complejos instantáneamente."}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                    <div className="mt-1 bg-blue-500/20 p-1.5 rounded-lg">
                                        <FileText className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">
                                            {isGenerate ? "Descripciones Técnicas" : mode === "contract" ? "Asesoramiento Legal" : mode === "appointment" ? "Citas con un Clic" : "Categorización Automática"}
                                        </h4>
                                        <p className="text-xs text-slate-400">
                                            {isGenerate
                                                ? "La IA redacta descripciones detalladas listas para tus presupuestos."
                                                : mode === "contract"
                                                    ? "Anticípate a imprevistos con cláusulas de seguridad y vicios ocultos."
                                                    : mode === "appointment"
                                                        ? "Los clientes podrán confirmar su asistencia directamente."
                                                        : "Organiza conceptos, unidades y precios por ti."}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                    <div className="mt-1 bg-emerald-500/20 p-1.5 rounded-lg">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">
                                            {isGenerate ? "Optimización de Márgenes" : mode === "contract" ? "Personalización Total" : mode === "appointment" ? "Recordatorios Automáticos" : "Sincronización Total"}
                                        </h4>
                                        <p className="text-xs text-slate-400">
                                            {isGenerate
                                                ? "Calcula costes y márgenes de beneficio automáticamente."
                                                : mode === "contract"
                                                    ? "Modifica, añade o reordena cláusulas según tus necesidades."
                                                    : mode === "appointment"
                                                        ? "Reduce inasistencias con avisos automáticos antes de la cita."
                                                        : "Añade precios a tu base de datos con un clic."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-1 rounded-2xl bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 animate-gradient-x">
                                <Button
                                    className="w-full h-12 bg-slate-950 hover:bg-slate-900 text-white border-none rounded-[14px] group"
                                    onClick={() => (window.location.href = "/dashboard/planes")}
                                >
                                    <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
                                    Desbloquear con Plan Pro
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>

                            <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                Exclusivo para usuarios profesionales
                            </p>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full text-slate-400 hover:text-white hover:bg-white/5">
                                Tal vez más tarde
                            </Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
