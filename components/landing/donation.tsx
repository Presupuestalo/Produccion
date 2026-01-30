"use client"

import { Heart, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Donation() {
    return (
        <section className="py-24 bg-[#050505] relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto p-8 md:p-12 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 mb-8 shadow-lg shadow-red-500/20">
                        <Heart className="h-8 w-8 text-white fill-white/20" />
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                        ¿Te gusta el proyecto?
                    </h2>

                    <p className="text-gray-400 text-lg md:text-xl mb-6 leading-relaxed max-w-2xl mx-auto">
                        Si quieres ser el primero en estar al día de todas las novedades, puedes suscribirte por una sencilla <span className="text-orange-500 font-bold text-2xl mx-1">donación de 2€ al mes</span>.
                    </p>

                    <p className="text-gray-500 text-base mb-10 max-w-2xl mx-auto leading-relaxed">
                        Tenemos un <strong>plan de ruta muy completo</strong> que iremos enseñando a medida que vayamos creciendo. Todo el que se suscriba tendrá <strong>grandes beneficios exclusivos</strong> por ayudarnos a hacer mejor este proyecto diseñado por y para profesionales.
                    </p>

                    <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 mb-10 inline-block">
                        <p className="text-orange-200 font-medium italic">
                            A cambio podrás ver la evolución de nuestra herramienta <br className="hidden md:block" />
                            creada por y para profesionales de la reforma.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            asChild
                            size="lg"
                            className="h-14 px-10 text-lg font-bold bg-white text-black hover:bg-gray-200 rounded-2xl transition-all hover:scale-105"
                        >
                            <Link href="https://buy.stripe.com/test_9B69ATaZW3se6BJ51rdby00" className="flex items-center gap-2">
                                Apoyar el Proyecto
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                        </Button>
                    </div>

                    <p className="mt-8 text-sm text-gray-500">
                        Tu apoyo nos ayuda a seguir innovando y mejorando para todos.
                    </p>
                </div>
            </div>

            {/* Decorative effect */}
            <div className="absolute -bottom-[20%] -left-[10%] w-[40%] h-[40%] bg-red-600/5 rounded-full blur-[120px]" />
        </section>
    )
}
