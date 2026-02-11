"use client"

import { Ruler, Home, PaintBucket, DoorOpen, Calculator, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"

export function TechnicalMeasurements() {
    return (
        <section className="py-24 bg-[#050505] relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    {/* Text Side */}
                    <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-left duration-1000">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                            <Ruler className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-semibold tracking-wide text-blue-400 uppercase">
                                Precisión Profesional
                            </span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                            Control Total sobre <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">
                                cada metro cuadrado
                            </span>
                        </h2>

                        <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
                            No dejes nada al azar. Define cada estancia con detalle técnico: desde el tipo de suelo hasta la retirada de puertas o carpintería. Nuestra calculadora traduce tus medidas en costes reales al instante.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-6 pt-4">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-gray-300">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Home className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <span className="font-medium">Detalle por Habitación</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-300">
                                    <div className="p-2 bg-orange-500/20 rounded-lg">
                                        <PaintBucket className="h-5 w-5 text-orange-400" />
                                    </div>
                                    <span className="font-medium">Acabados Personalizados</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-gray-300">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <Ruler className="h-5 w-5 text-green-400" />
                                    </div>
                                    <span className="font-medium">Cálculo de Perímetros</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-300">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <Calculator className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <span className="font-medium">IA de Precios Reales</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visual Side (Mocking the provided image) */}
                    <div className="flex-1 animate-in fade-in slide-in-from-right duration-1000 delay-200">
                        <Card className="bg-[#1a1c1e] border-white/10 p-1 shadow-2xl overflow-hidden rounded-[2rem]">
                            <div className="bg-[#fcfdfe] p-6 text-slate-800 space-y-6">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-3">
                                        <Home className="h-5 w-5 text-slate-400" />
                                        <span className="font-bold text-lg text-slate-700">Dormitorio 1</span>
                                        <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                            Derribos
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-500 text-sm font-semibold">
                                        <span>8,20 m²</span>
                                        <span>1</span>
                                    </div>
                                </div>

                                {/* Materials Selection Grid */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suelo</label>
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium">Madera</div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paredes</label>
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium">Pintura</div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Techo Actual</label>
                                        <div className="flex bg-slate-50 rounded-xl border border-slate-200 p-1">
                                            <div className="flex-1 text-center py-1 text-[10px] font-bold text-orange-600 bg-white rounded shadow-sm">Ninguno</div>
                                            <div className="flex-1 text-center py-1 text-[10px] font-bold text-slate-400">Retirar</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Measurements Input Mock */}
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-6">
                                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                                        <Ruler className="h-4 w-4" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Dimensiones del espacio</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Área (m²)</label>
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center group-hover:border-blue-400 transition-colors">
                                                <span className="text-2xl font-black text-slate-700">8,20</span>
                                                <span className="text-slate-300 text-xs font-bold">m²</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Perímetro (m)</label>
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                                                <span className="text-2xl font-black text-slate-700">11,40</span>
                                                <span className="text-slate-300 text-xs font-bold">m</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary Badges */}
                                    <div className="flex gap-4 pt-4 border-t border-slate-200">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Área</span>
                                            <span className="text-xs font-black text-slate-700 underline decoration-slate-200 underline-offset-4">8,20 m²</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Perím.</span>
                                            <span className="text-xs font-black text-slate-700 underline decoration-slate-200 underline-offset-4">11,40 m</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-orange-600 uppercase">Pared</span>
                                            <span className="text-xs font-black text-orange-600">29,64 m²</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Options */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-md border-2 border-orange-600 bg-orange-600 flex items-center justify-center">
                                            <CheckCircle2 className="h-3 w-3 text-white" />
                                        </div>
                                        <span className="font-bold text-slate-700 text-sm">Retirar puertas</span>
                                        <span className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-slate-400">+</span>
                                    </div>
                                    <div className="ml-8">
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium w-fit min-w-[150px]">Abatible</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Background decoration */}
            <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-600/10 blur-[100px] -translate-y-1/2 rounded-full" />
        </section>
    )
}
