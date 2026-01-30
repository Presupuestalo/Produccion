"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Check, Sparkles } from "lucide-react"

export function PricingFree() {
    return (
        <section id="pricing" className="py-24 bg-[#0a0a0a]">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto rounded-[3rem] p-8 md:p-16 relative overflow-hidden bg-gradient-to-br from-orange-600 to-orange-800 shadow-[0_0_50px_rgba(234,88,12,0.2)]">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 p-8 opacity-20">
                        <Sparkles className="h-40 w-40 text-white" />
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1 text-center lg:text-left text-white">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                                Sin Suscripciones <br />
                                <span className="text-orange-200">Sin Complicaciones</span>
                            </h2>
                            <p className="text-orange-100 text-lg md:text-xl mb-10 text-pretty">
                                Queremos democratizar el acceso a las mejores herramientas de reforma. Disfruta de todas nuestras funcionalidades base sin coste mensual.
                            </p>

                            <div className="grid sm:grid-cols-2 gap-4 mb-10 text-left">
                                {[
                                    "Cálculos Ilimitados",
                                    "Planificación de Obra",
                                    "Gestión de Galería",
                                    "Atención Prioritaria",
                                    "Exportación a PDF",
                                    "Herramientas Pro",
                                ].map((item) => (
                                    <div key={item} className="flex items-center gap-2 text-white/90">
                                        <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                                            <Check className="h-3 w-3 text-white" />
                                        </div>
                                        <span className="font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="w-full lg:w-96 p-8 rounded-[2rem] bg-white border border-white/10 shadow-2xl flex flex-col items-center">
                            <div className="text-orange-600 font-bold tracking-tighter text-6xl mb-2">0€</div>
                            <div className="text-gray-500 font-medium uppercase tracking-widest text-sm mb-8">Acceso Inmediato</div>

                            <p className="text-gray-600 text-center text-sm mb-8">
                                Regístrate y utiliza todas nuestras herramientas profesionales sin cuotas de suscripción.
                            </p>

                            <Button asChild size="lg" className="w-full h-14 text-lg font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-2xl">
                                <Link href="/auth/login">
                                    Empezar Ahora
                                </Link>
                            </Button>

                            <p className="mt-6 text-xs text-gray-400 text-center">
                                Registro instantáneo. Sin tarjeta de crédito.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
