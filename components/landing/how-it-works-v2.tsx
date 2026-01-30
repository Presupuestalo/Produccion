"use client"

import Image from "next/image"
import { CheckCircle2, ClipboardList, Ruler, Settings2, PartyPopper } from "lucide-react"

const steps = [
    {
        icon: ClipboardList,
        title: "1. Comienza un proyecto",
        description: "Crea tu espacio de trabajo en segundos y define el tipo de reforma.",
        color: "bg-orange-500",
    },
    {
        icon: Ruler,
        title: "2. Introduce las medidas",
        description: "Añade las dimensiones de las estancias de forma intuitiva y rápida.",
        color: "bg-blue-500",
    },
    {
        icon: Settings2,
        title: "3. Ajusta detalles",
        description: "Personaliza calidades y partidas específicas según las necesidades.",
        color: "bg-purple-500",
    },
    {
        icon: PartyPopper,
        title: "4. Tachan! Presupuesto listo",
        description: "Obtén tu presupuesto profesional detallado al instante.",
        color: "bg-green-500",
    },
]

export function HowItWorksV2() {
    return (
        <section className="py-24 bg-[#0a0a0a] overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    {/* Steps Side */}
                    <div className="flex-1 space-y-12">
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold tracking-widest text-orange-500 uppercase">Propietarios y Expertos</h2>
                            <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Presupuestos en <br /> <span className="text-orange-600">4 simples pasos</span></h3>
                            <p className="text-gray-400 text-lg max-w-lg">
                                ¿No sabes cuánto cuesta tu reforma? Obtén un valor estimado muy próximo a tus necesidades reales con información técnica precisa.
                            </p>
                        </div>

                        <div className="grid gap-8">
                            {steps.map((step, index) => (
                                <div
                                    key={index}
                                    className="group flex gap-6 items-start animate-in fade-in slide-in-from-left duration-700"
                                    style={{ animationDelay: `${index * 150}ms` }}
                                >
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${step.color} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
                                        <step.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                                        <p className="text-gray-400 leading-relaxed">{step.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Image Side */}
                    <div className="flex-1 relative">
                        <div className="absolute inset-0 bg-orange-600/20 rounded-[3rem] blur-[80px] -z-10 animate-pulse" />
                        <div className="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
                            <img
                                src="/images/budget-man.png"
                                alt="Presupuesto generado al instante"
                                className="w-full h-auto object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-40" />

                            {/* Floating Badge */}
                            <div className="absolute bottom-8 left-8 right-8 p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 animate-bounce">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                        <CheckCircle2 className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">¡Presupuesto Generado!</p>
                                        <p className="text-white/60 text-sm">Tiempo estimado: 45 segundos</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
