"use client"

import { Clock, Heart, ArrowRight } from "lucide-react"

export function ComparisonV2() {
    return (
        <section className="py-24 bg-[#050505] overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-sm font-bold tracking-widest text-orange-500 uppercase mb-4">El Valor del Tiempo</h2>
                    <h3 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Recupera tu vida personal</h3>
                    <p className="text-gray-400 text-lg">
                        Dejar de hacer presupuestos a mano no es solo eficiencia, es ganar tiempo para lo que de verdad importa.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 items-stretch">
                    {/* Before State */}
                    <div className="group relative rounded-[2.5rem] overflow-hidden bg-[#0d0d0d] border border-white/5 hover:border-red-500/20 transition-all duration-500 shadow-2xl">
                        <div className="aspect-[4/3] relative overflow-hidden">
                            <img
                                src="/images/stress.png"
                                alt="Días de trabajo interminables"
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-black/20 to-transparent" />
                            <div className="absolute top-6 left-6 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-md">
                                <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Lo que haces ahora</span>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <h4 className="text-2xl font-bold text-white">Noches de Estrés</h4>
                            </div>
                            <p className="text-gray-400 leading-relaxed text-lg">
                                Horas después de la obra picando datos, cometiendo errores y restando tiempo a tu descanso y a tu familia.
                            </p>
                        </div>
                    </div>

                    {/* After State */}
                    <div className="group relative rounded-[2.5rem] overflow-hidden bg-[#0d0d0d] border border-orange-500/20 hover:border-orange-500/40 transition-all duration-500 shadow-[0_0_40px_rgba(234,88,12,0.1)]">
                        <div className="aspect-[4/3] relative overflow-hidden">
                            <img
                                src="/images/family.png"
                                alt="Disfrutando con la familia"
                                className="w-full h-full object-cover transition-all duration-700 scale-105 group-hover:scale-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-orange-900/10 to-transparent" />
                            <div className="absolute top-6 left-6 px-4 py-2 rounded-full bg-orange-500 text-white shadow-lg">
                                <span className="text-xs font-bold uppercase tracking-widest">Con Presupuestalo</span>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                    <Heart className="h-5 w-5" />
                                </div>
                                <h4 className="text-2xl font-bold text-white">Tu Domingo te Pertenece</h4>
                            </div>
                            <p className="text-gray-400 leading-relaxed text-lg">
                                Presupuestos listos en 45 segundos. Menos burocracia, más tiempo libre y una vida profesional mucho más rentable.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-16 text-center">
                    <p className="text-white/60 text-sm italic">"Tu tiempo es lo más valioso que tienes. No lo malgastes picando números"</p>
                </div>
            </div>
        </section>
    )
}
