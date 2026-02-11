"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { ArrowRight, Sparkles, Calculator, Euro, CheckCircle2 } from "lucide-react"
import { spanishProvinces } from "@/lib/data/spain-locations"

const REFORM_TYPES = [
    { value: "integral", label: "Reforma Integral" },
    { value: "cocina", label: "Reforma de Cocina" },
    { value: "baño", label: "Reforma de Baño" },
    { value: "pintura", label: "Pintura y Alisado" },
    { value: "suelos", label: "Suelos y Parquet" },
    { value: "ventanas", label: "Ventanas y Cerramientos" },
]

export function HeroV2() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        reformType: "integral",
        squareMeters: "",
        province: "",
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Guardar en sessionStorage para recuperarlo tras el registro si fuera necesario
        if (typeof window !== "undefined") {
            sessionStorage.setItem("pending_estimate", JSON.stringify(formData))
        }
        router.push("/auth/login?source=hero_calculator")
    }

    return (
        <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-[#0a0a0a] py-20">
            {/* Background with subtle gradient and pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-orange-600/10 via-transparent to-transparent opacity-50" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-orange-600/10 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-orange-600/5 blur-[120px] rounded-full" />
            </div>

            <div className="container relative z-10 mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Text Content */}
                    <div className="text-left space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-md">
                            <Sparkles className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-semibold tracking-wide text-orange-400 uppercase">
                                Calculadora Inteligente de Reformas
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[1.1]">
                            Tu Presupuesto <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-600 to-orange-800">
                                100% Personalizado
                            </span>
                            <br />y Gratis.
                        </h1>

                        <p className="max-w-xl text-lg md:text-xl text-gray-400 text-pretty">
                            Olvida los Excel complicados. Obtén una valoración profesional de tu reforma en segundos con nuestra IA entrenada con miles de presupuestos reales.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-300">
                                <CheckCircle2 className="h-5 w-5 text-orange-500" />
                                <span>Precios de mercado actualizados 2026</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <CheckCircle2 className="h-5 w-5 text-orange-500" />
                                <span>Desglose detallado por partidas</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <CheckCircle2 className="h-5 w-5 text-orange-500" />
                                <span>Exportable a PDF profesional</span>
                            </div>
                        </div>
                    </div>

                    {/* Calculator Card */}
                    <div className="animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
                        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl relative overflow-hidden group">
                            {/* Subtle light effect */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-orange-600/30 transition-colors" />

                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-orange-600 rounded-lg shadow-[0_0_15px_rgba(234,88,12,0.4)]">
                                        <Calculator className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white tracking-tight">Configura tu Cálculo</h3>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-gray-300 font-medium">¿Qué quieres reformar?</Label>
                                            <Select
                                                value={formData.reformType}
                                                onValueChange={(value) => setFormData({ ...formData, reformType: value })}
                                            >
                                                <SelectTrigger className="bg-white/5 border-white/10 text-white h-12">
                                                    <SelectValue placeholder="Tipo de reforma" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                                    {REFORM_TYPES.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-gray-300 font-medium">Metros cuadrados (m²)</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="Ej: 75"
                                                    className="bg-white/5 border-white/10 text-white h-12"
                                                    value={formData.squareMeters}
                                                    onChange={(e) => setFormData({ ...formData, squareMeters: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-gray-300 font-medium">Provincia</Label>
                                                <Select
                                                    value={formData.province}
                                                    onValueChange={(value) => setFormData({ ...formData, province: value })}
                                                >
                                                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-12">
                                                        <SelectValue placeholder="Selecciona" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white max-h-[250px]">
                                                        {spanishProvinces.map((prov) => (
                                                            <SelectItem key={prov} value={prov}>
                                                                {prov}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <Button
                                            type="submit"
                                            className="w-full h-14 bg-orange-600 hover:bg-orange-500 text-white text-lg font-bold rounded-xl transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(234,88,12,0.4)] flex items-center justify-center gap-3 group"
                                        >
                                            Calcular Mi Presupuesto
                                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                        <p className="text-center text-sm text-gray-500">
                                            Sin compromiso • Acceso inmediato • 100% Online
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </Card>

                        {/* Price badge/card floating */}
                        <div className="mt-8 flex justify-center lg:justify-end">
                            <div className="bg-orange-500/10 border border-orange-500/20 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-[#0a0a0a]" />
                                    <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-[#0a0a0a]" />
                                    <div className="w-8 h-8 rounded-full bg-orange-600 border-2 border-[#0a0a0a] flex items-center justify-center text-[10px] font-bold text-white">+5k</div>
                                </div>
                                <p className="text-sm text-gray-300">
                                    <span className="text-white font-bold">5.000+</span> profesionales ya confían en nosotros
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
