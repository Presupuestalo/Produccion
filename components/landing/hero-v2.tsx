"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    ArrowRight,
    Sparkles,
    FileText,
    Calculator,
    BadgeCheck,
    Clock,
    TrendingUp,
    Database
} from "lucide-react"

export function HeroV2() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a] py-20">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/hero-man.jpg')" }}
                />
                <div className="absolute inset-0 bg-black/80" />
            </div>

            <div className="container relative z-10 mx-auto px-4">
                <div className="grid lg:grid-cols-12 gap-12 items-center">
                    {/* Left Content */}
                    <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-md">
                            <Sparkles className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-semibold tracking-wide text-orange-400 uppercase">
                                Software para Empresas de Reformas
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter text-white leading-tight">
                            Deja de perder el fin de semana haciendo <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-600 to-orange-800 line-through decoration-orange-600/40">
                                Excels
                            </span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-600 to-orange-800 ml-2 sm:ml-4">
                                Presupuestos
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="max-w-xl text-base sm:text-lg md:text-xl text-gray-400 text-pretty">
                            Genera presupuestos súper profesionales en <span className="text-white font-semibold">3 minutos</span>, directamente desde la obra con tu móvil. Calcula márgenes de beneficio, desperdicio y genera un PDF automático que cierra más ventas.
                        </p>

                        {/* Features List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-4">
                            <div className="flex items-center gap-2 text-gray-300">
                                <Clock className="h-5 w-5 text-orange-500" />
                                <span>Ahorra 10 horas a la semana</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <TrendingUp className="h-5 w-5 text-orange-500" />
                                <span>No pierdas dinero en mermas</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <FileText className="h-5 w-5 text-orange-500" />
                                <span>PDF profesional automático</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <Database className="h-5 w-5 text-orange-500" />
                                <span>BBDD de precios actualizada</span>
                            </div>
                        </div>

                        {/* CTAs */}
                        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <Link href="/auth" passHref legacyBehavior>
                                <Button asChild size="lg" className="h-14 px-8 text-lg font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-full transition-all shadow-lg shadow-orange-500/20 w-full sm:w-auto hover:scale-105 active:scale-95">
                                    <a className="flex items-center justify-center">
                                        Probar Gratis Ahora
                                        <ArrowRight className="h-5 w-5 ml-2" />
                                    </a>
                                </Button>
                            </Link>

                            <div className="flex items-center gap-3 mt-2 sm:mt-0 px-2 sm:px-0 opacity-80">
                                <span className="flex -space-x-2">
                                    <span className="w-8 h-8 rounded-full border-2 border-[#1a1c1e] bg-slate-200"></span>
                                    <span className="w-8 h-8 rounded-full border-2 border-[#1a1c1e] bg-slate-300"></span>
                                    <span className="w-8 h-8 rounded-full border-2 border-[#1a1c1e] bg-slate-400"></span>
                                </span>
                                <div className="text-sm">
                                    <span className="text-white font-bold block">+500 empresas</span>
                                    <span className="text-gray-400 text-xs">ya han recuperado su tiempo</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Form */}
                    <div id="estimate-form" className="lg:col-span-5 animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
                        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6 md:p-8 shadow-2xl overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            <div className="relative z-10 w-full h-full min-h-[400px] bg-[#0a0c10] flex flex-col p-6 font-mono text-sm shadow-xl rounded-xl border border-white/5">

                                {/* Top Bar */}
                                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                            <Calculator className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-white font-semibold font-sans">Reforma Integral_v2</div>
                                            <div className="text-xs text-orange-400">Generando partida automática...</div>
                                        </div>
                                    </div>
                                    <BadgeCheck className="text-green-500 h-5 w-5" />
                                </div>

                                {/* Editor lines */}
                                <div className="space-y-4 flex-1">
                                    {/* Line 1 - Finished */}
                                    <div className="group rounded bg-white/5 p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                                        <div>
                                            <div className="text-gray-300 font-sans font-medium text-xs sm:text-sm">1. Suelo Laminado AC5 Roble</div>
                                            <div className="text-[10px] sm:text-xs text-gray-500 mt-1 flex flex-wrap gap-1 sm:gap-2 items-center">
                                                <span>65.00 m²</span>
                                                <span className="hidden sm:inline">•</span>
                                                <span className="text-red-400 bg-red-400/10 px-1 rounded flex items-center gap-1"> +10% merma</span>
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right w-full sm:w-auto flex justify-between sm:block items-center">
                                            <div className="text-white font-bold font-sans text-sm sm:text-base">2.145,00 €</div>
                                            <div className="text-[10px] sm:text-xs text-green-400 sm:mt-1 flex justify-end gap-1">
                                                <span>Rentabilidad: +35%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Line 2 - Typing animation */}
                                    <div className="rounded bg-orange-500/10 border border-orange-500/30 p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-orange-500 animate-pulse"></div>
                                        <div className="pl-2 sm:pl-0">
                                            <div className="text-white font-sans font-medium text-xs sm:text-sm flex items-center gap-1 flex-wrap">
                                                2. Pintura Plástica Lisa
                                                <span className="inline-block w-1.5 h-3 sm:h-4 bg-orange-400 animate-pulse ml-1"></span>
                                            </div>
                                            <div className="text-[10px] sm:text-xs text-orange-300/60 mt-1 flex gap-2">
                                                <span><Clock className="w-3 h-3 inline mr-1 animate-spin" /> Calculando rendimientos...</span>
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right blur-[2px] opacity-50 pl-2 sm:pl-0">
                                            <div className="text-white font-bold font-sans text-sm sm:text-base">--- €</div>
                                        </div>
                                    </div>

                                    {/* Line 3 - Ghost */}
                                    <div className="rounded border border-dashed border-white/10 p-3 flex justify-between items-center opacity-30">
                                        <div className="h-4 sm:h-5 w-24 sm:w-40 bg-white/20 rounded"></div>
                                        <div className="h-4 sm:h-5 w-12 sm:w-20 bg-white/20 rounded"></div>
                                    </div>
                                </div>

                                {/* Total Bottom Bar */}
                                <div className="mt-auto pt-6 border-t border-white/10">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1 font-sans font-bold">Total Presupuesto</div>
                                            <div className="text-3xl text-white font-black font-sans">2.145,00 €</div>
                                        </div>
                                        <div className="bg-green-500/10 text-green-400 text-xs px-3 py-1.5 rounded-full border border-green-500/20 font-sans font-semibold flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            Beneficio: 750,75 €
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <Button className="w-full bg-white text-black hover:bg-gray-200 font-sans font-bold text-xs h-9" variant="secondary">
                                            <FileText className="w-3 h-3 mr-2" /> Generar PDF
                                        </Button>
                                    </div>
                                </div>

                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    )
}

function Users(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}

