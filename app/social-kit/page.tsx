"use client"

import Image from "next/image"
import { ArrowUp, Heart, MessageCircle, Share2, Zap, Clock, ShieldCheck, BadgeCheck, FileText } from "lucide-react"

export default function SocialKitPage() {
    return (
        <div className="min-h-screen bg-neutral-900 p-8 text-white">
            <h1 className="text-4xl font-bold mb-8 text-center">Social Media Kit - Presupuéstalo</h1>
            <p className="text-center mb-12 text-gray-400">Captura estas pantallas para tus redes</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 items-start justify-items-center">

                {/* 1. INSTAGRAM STORY (9:16) */}
                <div className="flex flex-col items-center gap-4">
                    <span className="text-orange-500 font-bold uppercase tracking-widest">Instagram Story (1080x1920)</span>
                    <div className="relative w-[360px] h-[640px] bg-black overflow-hidden shadow-2xl border border-gray-800 group">
                        <Image
                            src="/hero-man.jpg"
                            alt="Background"
                            fill
                            className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />

                        {/* Logo Top */}
                        <div className="absolute top-12 left-0 right-0 flex justify-center">
                            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                <div className="h-6 w-6 bg-orange-600 rounded-sm flex items-center justify-center font-bold text-xs">P</div>
                                <span className="font-bold tracking-tight">Presupuéstalo</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pt-20">
                            <h2 className="text-5xl font-black mb-2 animate-in slide-in-from-bottom-4 duration-700">
                                ¡YA<br /><span className="text-orange-500">EMPEZAMOS!</span>
                            </h2>

                            <div className="w-16 h-1 bg-orange-500 my-6 rounded-full" />

                            <p className="text-2xl font-bold leading-tight mb-2">Presupuestos<br />Profesionales</p>
                            <div className="bg-orange-600 text-white px-4 py-1 font-black text-xl italic -rotate-2 transform">100% GRATIS</div>

                            <p className="mt-6 text-lg text-gray-300">En solo <span className="text-white font-bold text-xl">4 Pasos</span></p>
                        </div>

                        {/* Bottom */}
                        <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-2 animate-pulse">
                            <div className="flex gap-4 mb-2">
                                <Heart className="text-red-500 fill-red-500 h-6 w-6" />
                                <MessageCircle className="h-6 w-6" />
                                <Share2 className="h-6 w-6" />
                            </div>
                            <ArrowUp className="text-orange-500 h-6 w-6" />
                            <span className="text-xs font-bold tracking-widest uppercase">Dale Like y Síguenos</span>
                        </div>
                    </div>
                </div>


                {/* 2. FACEBOOK POST (1:1) */}
                <div className="flex flex-col items-center gap-4">
                    <span className="text-blue-500 font-bold uppercase tracking-widest">Facebook Post (1080x1080)</span>
                    <div className="relative w-[500px] h-[500px] bg-[#1a1a1a] flex overflow-hidden shadow-2xl border border-gray-800">
                        {/* Left Image */}
                        <div className="w-1/2 relative bg-gray-800">
                            <Image src="/hero-man.jpg" alt="Contractor" fill className="object-cover" />
                            <div className="absolute inset-0 bg-orange-600/10 mix-blend-overlay" />
                        </div>

                        {/* Right Content */}
                        <div className="w-1/2 p-8 flex flex-col justify-center bg-gradient-to-br from-neutral-900 to-neutral-800 relative">
                            <div className="absolute top-6 right-6">
                                <img src="/presupuestalo-logo.svg" className="h-8 w-auto opacity-50" alt="Logo" />
                            </div>

                            <h3 className="text-2xl font-black leading-tight text-white mb-4">
                                ¿Eres Profesional o Propietario?
                            </h3>
                            <p className="text-orange-500 font-bold mb-6">Deja de perder días haciendo números.</p>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="bg-green-500/20 p-2 rounded-full"><BadgeCheck className="w-4 h-4 text-green-500" /></div>
                                    <span>Precios Reales</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="bg-orange-500/20 p-2 rounded-full"><Clock className="w-4 h-4 text-orange-500" /></div>
                                    <span>Ahorra tiempo de verdad</span>
                                </div>
                            </div>

                            <div className="mt-8">
                                <button className="bg-orange-600 text-white text-xs font-bold py-2 px-4 rounded hover:bg-orange-500 transition">
                                    PROBAR GRATIS AHORA
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


                {/* 3. TIKTOK (9:16) */}
                <div className="flex flex-col items-center gap-4">
                    <span className="text-pink-500 font-bold uppercase tracking-widest">TikTok / Reels (1080x1920)</span>
                    <div className="relative w-[360px] h-[640px] bg-neutral-900 overflow-hidden shadow-2xl border border-gray-800">
                        {/* Dynamic BG */}
                        <div className="absolute inset-0 opacity-40">
                            <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[150%] bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#ea580c_10px,#ea580c_20px)] opacity-10 animate-spin-slow" />
                        </div>
                        <Image src="/hero-man.jpg" alt="BG" fill className="object-cover grayscale mix-blend-overlay opacity-30" />

                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                            <div className="bg-white text-black px-6 py-2 font-black text-3xl -rotate-3 mb-8 shadow-[4px_4px_0px_#ea580c]">
                                ¡BOMBAZO! 💣
                            </div>

                            <h2 className="text-white font-black text-6xl leading-none mb-4">
                                PRESU<br /><span className="text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-orange-600">PUESTOS</span>
                            </h2>

                            <div className="text-4xl font-bold text-white mb-12">
                                GRATIS 💸
                            </div>

                            <div className="absolute bottom-32 flex flex-col items-center animate-bounce">
                                <span className="text-sm font-bold mb-2">¡Entra al Link!</span>
                                <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center">
                                    <ArrowUp className="w-6 h-6 rotate-180" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* 4. X / TWITTER (16:9) */}
                <div className="flex flex-col items-center gap-4">
                    <span className="text-gray-400 font-bold uppercase tracking-widest">X / Twitter (1200x675)</span>
                    <div className="relative w-[600px] h-[337px] bg-[#000000] flex overflow-hidden shadow-2xl border border-gray-800">
                        <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 to-black" />
                        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-orange-600/10 skew-x-[-12deg] mr-[-50px]" />

                        <div className="relative z-10 p-12 flex flex-col justify-center max-w-[65%]">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="h-8 w-8 bg-orange-600 rounded flex items-center justify-center font-bold">P</div>
                                <span className="font-bold text-xl tracking-tight">Presupuéstalo</span>
                            </div>

                            <h3 className="text-3xl font-bold text-white leading-tight mb-4">
                                La herramienta definitiva para la construcción ha llegado.
                            </h3>

                            <p className="text-gray-400 text-lg mb-0 text-pretty">
                                Profesionaliza tus presupuestos y entregas. Sin costes ocultos.
                            </p>
                        </div>

                        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-[180px] h-[220px] bg-neutral-800 rounded-lg border border-neutral-700 shadow-2xl p-2 rotate-3">
                            {/* Mini Mockup */}
                            <div className="w-full h-full bg-neutral-900 rounded overflow-hidden relative">
                                <div className="absolute top-2 left-2 right-2 h-2 bg-neutral-800 rounded-full" />
                                <div className="mt-8 space-y-2 p-2">
                                    <div className="h-2 w-3/4 bg-gray-700 rounded" />
                                    <div className="h-2 w-1/2 bg-gray-700 rounded" />
                                    <div className="h-20 w-full bg-orange-900/20 rounded border border-orange-500/20 mt-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* 5. YOUTUBE THUMBNAIL (16:9) */}
                <div className="flex flex-col items-center gap-4">
                    <span className="text-red-500 font-bold uppercase tracking-widest">YouTube Thumbnail (1280x720)</span>
                    <div className="relative w-[640px] h-[360px] bg-neutral-900 flex overflow-hidden shadow-2xl border border-gray-800">
                        {/* Split */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-white z-20 skew-x-[-10deg]" />

                        {/* Left: Problem */}
                        <div className="w-1/2 relative bg-gray-800 overflow-hidden flex items-center justify-center grayscale contrast-125">
                            <Image src="/hero-man.jpg" alt="Sad" fill className="object-cover opacity-20" />
                            <div className="relative z-10 flex flex-col items-center">
                                <span className="text-6xl mb-2">😫</span>
                                <h3 className="text-3xl font-black text-gray-300 bg-black/50 px-2">LENTO</h3>
                                <p className="text-red-400 font-bold mt-2">DÍAS...</p>
                            </div>
                        </div>

                        {/* Right: Solution */}
                        <div className="w-1/2 relative bg-orange-600/20 overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-tr from-orange-900/50 to-orange-500/20" />
                            <div className="relative z-10 flex flex-col items-center transform scale-110">
                                <span className="text-6xl mb-2">🚀</span>
                                <h3 className="text-3xl font-black text-white drop-shadow-lg shadow-orange-500">RÁPIDO</h3>
                                <p className="text-green-400 font-bold bg-black/80 px-2 py-1 rounded mt-2">5 MINUTOS</p>
                            </div>
                        </div>

                        {/* VS Badge */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-yellow-500 text-black font-black text-xl w-12 h-12 rounded-full flex items-center justify-center border-4 border-black skew-x-[-10deg]">
                            VS
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
