"use client"

import { Truck, Box, Clock, Trash2, Check, BarChart3, Info } from "lucide-react"
import { Card } from "@/components/ui/card"

export function DebrisOptimization() {
    return (
        <section className="py-24 bg-[#050505] relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    {/* Text Side */}
                    <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-left duration-1000">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                            <Truck className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-semibold tracking-wide text-blue-400 uppercase">
                                Optimización Logística
                            </span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                            Gestión Inteligente de <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
                                Residuos y Escombros
                            </span>
                        </h2>

                        <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
                            No más sorpresas con los contenedores. Nuestra tecnología calcula con precisión quirúrgica el volumen de deshechos, el número de sacos necesarios y el tiempo estimado de bajada, incluso sin ascensor.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-4 pt-4">
                            {[
                                { icon: <Box className="h-5 w-5 text-blue-400" />, label: "Cálculo de Volumen (m³)" },
                                { icon: <Trash2 className="h-5 w-5 text-orange-400" />, label: "Contenedores Exactos" },
                                { icon: <Clock className="h-5 w-5 text-green-400" />, label: "Horas de Bajada" },
                                { icon: <BarChart3 className="h-5 w-5 text-purple-400" />, label: "Densidad por Material" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                    <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                                        {item.icon}
                                    </div>
                                    <span className="text-sm font-medium text-gray-300">{item.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-4">
                            <Info className="h-6 w-6 text-amber-500 shrink-0" />
                            <p className="text-xs text-amber-200/70 leading-relaxed">
                                <strong>¿Sabías que...?</strong> Un mal cálculo en el número de contenedores puede incrementar el coste de tu reforma en más de 600€. Con Presupuestalo, lo controlas al milímetro.
                            </p>
                        </div>
                    </div>

                    {/* Video / Mockup Side */}
                    <div className="flex-1 w-full animate-in fade-in slide-in-from-right duration-1000 delay-200">
                        <div className="relative group">
                            {/* Visual Glow */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 blur-3xl opacity-50 rounded-[2rem] -z-10" />

                            <Card className="bg-[#1a1c1e] border-white/10 p-2 shadow-2xl overflow-hidden rounded-[2.5rem] relative">
                                <div className="aspect-video bg-black rounded-[2rem] overflow-hidden relative">
                                    {/* Once the user moves the file, they can replace this src */}
                                    <video
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        poster="/debris-poster.jpg"
                                    >
                                        <source src="/videos/debris-calculation.mp4" type="video/mp4" />
                                    </video>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
