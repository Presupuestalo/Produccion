"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap, BadgeCheck, FileText } from "lucide-react"

export function HeroV2() {
    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/hero-man.jpg')" }}
                />
                <div className="absolute inset-0 bg-black/70" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            </div>

            <div className="container relative z-10 mx-auto px-4 py-20 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Sparkles className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-semibold tracking-wide text-orange-400 uppercase">
                        Acceso Completo • 100% Gratis
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 text-white animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    Presupuesta tu Reforma <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-600 to-orange-800">
                        Con Precisión Profesional
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-400 mb-12 text-pretty animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                    Genera presupuestos precisos en <span className="text-white font-semibold">minutos</span>, no días. Ahorra cientos de horas de trabajo con la herramienta más rápida del mercado.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
                    <Button asChild size="lg" className="h-14 px-8 text-lg font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(234,88,12,0.4)]">
                        <Link href="/auth/login" className="flex items-center gap-2">
                            Comenzar Ahora Gratis
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </Button>
                </div>

                {/* Social Proofish info */}
                <div className="mt-20 flex flex-wrap justify-center gap-8 md:gap-16 animate-in fade-in duration-1000 delay-700 bg-black/40 backdrop-blur-md py-4 px-8 rounded-full border border-white/10">
                    <div className="flex items-center gap-2 text-white">
                        <BadgeCheck className="h-5 w-5 text-orange-500" />
                        <span className="font-medium">Precios de Mercado Reales</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                        <Zap className="h-5 w-5 text-orange-500" />
                        <span className="font-medium">Cálculo Inmediato</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                        <FileText className="h-5 w-5 text-orange-500" />
                        <span className="font-medium">Informes Profesionales</span>
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
