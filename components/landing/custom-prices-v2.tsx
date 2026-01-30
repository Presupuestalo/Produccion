"use client"

import { Database, Zap, BadgeCheck } from "lucide-react"

export function CustomPricesV2() {
    return (
        <section className="py-24 bg-[#0a0a0a] relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
                    {/* Text Side */}
                    <div className="flex-1 space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold tracking-widest text-orange-500 uppercase">Control Total</h2>
                            <h3 className="text-4xl md:text-5xl font-black text-white leading-tight">Tu propio libro de <br /> <span className="text-orange-600">precios maestro</span></h3>
                            <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
                                Crea tu base de datos personalizada o usa nuestras estimaciones profesionales. Perfecto para quienes necesitan control total sobre márgenes, mano de obra y materiales.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {[
                                {
                                    icon: Database,
                                    title: "Base de Datos Propia",
                                    desc: "Organiza tus precios por categorías: albañilería, fontanería, electricidad y más."
                                },
                                {
                                    icon: Zap,
                                    title: "Actualización Automática",
                                    desc: "Cualquier cambio en tu maestro de precios se aplica al instante en tus nuevos presupuestos."
                                },
                                {
                                    icon: BadgeCheck,
                                    title: "Precisión Absoluta",
                                    desc: "Evita errores de cálculo. Obtén valoraciones realistas y presupuestos 100% fiables."
                                }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start group">
                                    <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white mb-1">{item.title}</h4>
                                        <p className="text-gray-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Image Side */}
                    <div className="flex-1 relative">
                        {/* Glow effect */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-orange-600/10 rounded-full blur-[120px] -z-10" />

                        <div className="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(234,88,12,0.15)] group">
                            <img
                                src="/images/custom-prices-real.png"
                                alt="Gestión de precios reales de obra"
                                className="w-full h-auto object-cover transform scale-105 group-hover:scale-100 transition-transform duration-1000"
                            />

                            {/* Overlay Card */}
                            <div className="absolute top-8 right-8 p-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 animate-in fade-in slide-in-from-right-10 duration-1000 delay-500">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs font-bold text-white uppercase tracking-tighter">Sincronización Activa</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
