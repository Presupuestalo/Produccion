"use client"

import { MousePointer2, Ruler, Square, Check, Undo2, Trash2, Smartphone, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"

export function IrregularRoomEditor() {
    return (
        <section className="py-24 bg-[#0a0a0a] relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
                    {/* Text Side */}
                    <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-right duration-1000">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
                            <Sparkles className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-semibold tracking-wide text-orange-400 uppercase">
                                Magia en tus Dedos
                            </span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                            Habitaciones Irregulares <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                                Resueltas en Segundos
                            </span>
                        </h2>

                        <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
                            ¿Paredes en ángulo? ¿Formas extrañas? Ningún problema. Dibuja el contorno de tu estancia con <strong>un solo dedo</strong> desde tu smartphone. Olvida las fórmulas matemáticas complejas: nosotros calculamos el área y el perímetro por ti.
                        </p>

                        <ul className="space-y-4 pt-4">
                            {[
                                "Dibuja a mano alzada desde tu móvil",
                                "Cálculo instantáneo de m² y metros lineales",
                                "Precisión milimétrica con rejilla inteligente",
                                "Traslada las medidas a tu presupuesto con un clic"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-300">
                                    <div className="h-6 w-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                                        <Check className="h-4 w-4 text-orange-500" />
                                    </div>
                                    <span className="font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Mobile UI Mockup Side */}
                    <div className="flex-1 w-full max-w-[400px] lg:max-w-none animate-in fade-in slide-in-from-left duration-1000 delay-200">
                        <div className="relative mx-auto w-full max-w-[320px] aspect-[9/19] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden ring-4 ring-slate-800/50">
                            {/* Screen Content */}
                            <div className="absolute inset-0 bg-[#f8fafc] flex flex-col">
                                {/* Editor Header */}
                                <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white">
                                    <div className="flex gap-2">
                                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                            <Undo2 className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                            <Trash2 className="h-4 w-4 text-slate-400" />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex items-center gap-1">
                                            <div className="w-8 h-4 bg-orange-500 rounded-full relative">
                                                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                                            </div>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase">Rejilla</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Drawing Area */}
                                <div className="flex-1 relative bg-slate-50/50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden">
                                    {/* The drawn shape */}
                                    <svg className="absolute inset-0 w-full h-full p-6" viewBox="0 0 200 350">
                                        <path
                                            d="M 30 20 L 170 20 L 170 140 L 130 140 L 130 190 L 30 190 Z"
                                            fill="transparent"
                                            stroke="#1e293b"
                                            strokeWidth="3"
                                            strokeLinejoin="round"
                                        />
                                        {/* Points */}
                                        <circle cx="30" cy="20" r="4" fill="#22c55e" />
                                        <circle cx="170" cy="20" r="3" fill="#1e293b" />
                                        <circle cx="170" cy="140" r="3" fill="#1e293b" />
                                        <circle cx="130" cy="140" r="3" fill="#1e293b" />
                                        <circle cx="130" cy="190" r="3" fill="#1e293b" />
                                        <circle cx="30" cy="190" r="3" fill="#1e293b" />

                                        {/* Fake labels */}
                                        <text x="85" y="15" fontSize="8" fontWeight="bold" fill="#64748b">1395 cm</text>
                                        <text x="175" y="80" fontSize="8" fontWeight="bold" fill="#64748b" transform="rotate(90, 175, 80)">701 cm</text>
                                    </svg>

                                    {/* Finger Cursor */}
                                    <div className="absolute top-[25%] left-[65%] animate-bounce">
                                        <MousePointer2 className="h-8 w-8 text-orange-600 fill-orange-600/20 rotate-12 drop-shadow-lg" />
                                    </div>
                                </div>


                                {/* Completion Modal (Overlay) */}
                                <div className="absolute inset-x-2 bottom-4 p-4 rounded-3xl bg-white shadow-2xl border border-slate-100 space-y-4 animate-in slide-in-from-bottom-8 duration-700 delay-500">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">¡Figura completada!</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center">
                                            <span className="text-[8px] font-bold text-blue-400 uppercase">Área</span>
                                            <span className="text-sm font-black text-blue-700 tracking-tight">84,80 m²</span>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-green-50 border border-green-100 flex flex-col items-center">
                                            <span className="text-[8px] font-bold text-green-400 uppercase">Perímetro</span>
                                            <span className="text-sm font-black text-green-700 tracking-tight">54,46 m</span>
                                        </div>
                                    </div>

                                    <button className="w-full py-3 bg-green-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-green-200 flex items-center justify-center gap-2">
                                        <Check className="h-4 w-4" />
                                        Aplicar Medidas
                                    </button>
                                </div>
                            </div>

                            {/* Speaker/Camera notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20" />
                        </div>

                        {/* Floating shadow decoration */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-600/10 blur-[100px] -z-10 rounded-full" />
                    </div>
                </div>
            </div>
        </section>
    )
}
