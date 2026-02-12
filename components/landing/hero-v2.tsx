"use client"

import Link from "next/link"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    ArrowRight,
    Sparkles,
    Zap,
    BadgeCheck,
    FileText,
    Calculator,
    Euro,
    Lightbulb,
    AlertTriangle,
    Database,
    CheckCircle
} from "lucide-react"
import { spanishProvinces, citiesByProvince } from "@/lib/data/spain-locations"
import { PhoneVerificationModal } from "@/components/leads/phone-verification-modal"

const REFORM_TYPES = [
    { value: "integral", label: "Reforma Integral" },
    { value: "cocina", label: "Reforma de Cocina" },
    { value: "baño", label: "Reforma de Baño" },
    { value: "pintura", label: "Pintura y Alisado de Paredes" },
    { value: "suelos", label: "Cambio de Suelos / Parquet" },
    { value: "ventanas", label: "Cambio de Ventanas / Cerramientos" },
    { value: "other", label: "Otro (Especificar)" },
]

export function HeroV2() {
    const [loading, setLoading] = useState(false)
    const [estimation, setEstimation] = useState<any>(null)
    const [showQuoteForm, setShowQuoteForm] = useState(false)
    const [quoteSent, setQuoteSent] = useState(false)
    const [showVerificationModal, setShowVerificationModal] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const [formData, setFormData] = useState({
        reformType: "integral",
        customReformType: "",
        squareMeters: "",
        rooms: "",
        bathrooms: "",
        country: "españa",
        province: "",
        city: "",
        heatingType: "",
        features: "",
        availableBudget: "",
    })

    const availableCities = useMemo(() => {
        if (!formData.province) return []
        return citiesByProvince[formData.province] || []
    }, [formData.province])

    const findProvinceByCity = (city: string): string | null => {
        for (const [province, cities] of Object.entries(citiesByProvince)) {
            if (cities.includes(city)) {
                return province
            }
        }
        return null
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.reformType) newErrors.reformType = "Campo obligatorio"
        if (formData.reformType === "other" && !formData.customReformType) newErrors.customReformType = "Por favor especifica el tipo de reforma"
        if (!formData.squareMeters) newErrors.squareMeters = "Campo obligatorio"
        if (!formData.rooms) newErrors.rooms = "Campo obligatorio"
        if (!formData.bathrooms) newErrors.bathrooms = "Campo obligatorio"
        if (!formData.province) newErrors.province = "Campo obligatorio"
        if (!formData.city) newErrors.city = "Campo obligatorio"
        if (!formData.heatingType) newErrors.heatingType = "Campo obligatorio"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setLoading(true)
        setEstimation(null)

        try {
            const response = await fetch("/api/ia/quick-estimate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok || data.error) {
                throw new Error(data.error || "Error al generar estimación")
            }

            setEstimation(data)
            setShowQuoteForm(false)
            setQuoteSent(false)
        } catch (error) {
            console.error("Error generando estimación:", error)
            alert(error instanceof Error ? error.message : "Error al generar la estimación. Por favor, intenta de nuevo.")
        } finally {
            setLoading(false)
        }
    }

    const handleVerificationSuccess = (verificationData: {
        email: string
        phone: string
        fullName: string
        verificationCode?: string
        acceptedTerms?: boolean
        acceptedPrivacy?: boolean
        acceptedMarketing?: boolean
    }) => {
        const createLead = async () => {
            try {
                let minBudget = 0
                let maxBudget = 0

                if (estimation?.priceRange) {
                    const priceMatch = estimation.priceRange.match(/[\d.]+/g)
                    if (priceMatch && priceMatch.length >= 2) {
                        minBudget = Number.parseInt(priceMatch[0].replace(/\./g, ""), 10)
                        maxBudget = Number.parseInt(priceMatch[1].replace(/\./g, ""), 10)
                    }
                }

                const response = await fetch("/api/ia/create-landing-lead", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: verificationData.email,
                        fullName: verificationData.fullName,
                        phone: verificationData.phone,
                        acceptedTerms: verificationData.acceptedTerms,
                        acceptedPrivacy: verificationData.acceptedPrivacy,
                        acceptedMarketing: verificationData.acceptedMarketing,
                        estimationData: {
                            ...formData,
                            estimated_budget_min: minBudget,
                            estimated_budget_max: maxBudget,
                        },
                    }),
                })

                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || "Error al crear la solicitud")
                }

                setShowVerificationModal(false)
                setQuoteSent(true)
                setShowQuoteForm(false)
            } catch (error: any) {
                console.error("Error creating landing lead:", error)
                alert(error.message || "Error al procesar la solicitud")
            }
        }

        createLead()
    }

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a] py-20">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/hero-man.jpg')" }}
                />
                <div className="absolute inset-0 bg-black/80" />
            </div>

            <div className="container relative z-10 mx-auto px-4">
                <div className="grid lg:grid-cols-12 gap-12 items-center">
                    {/* Left Content */}
                    <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-md">
                            <Sparkles className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-semibold tracking-wide text-orange-400 uppercase">
                                Acceso Completo • 100% Gratis
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-tight">
                            Presupuesta tu Reforma <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-600 to-orange-800">
                                Con Precisión Profesional
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="max-w-xl text-lg md:text-xl text-gray-400 text-pretty">
                            Genera presupuestos precisos en <span className="text-white font-semibold">minutos</span>, no días. Ahorra cientos de horas de trabajo con la herramienta más rápida del mercado.
                        </p>

                        {/* Features List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            <div className="flex items-center gap-2 text-gray-300">
                                <BadgeCheck className="h-5 w-5 text-orange-500" />
                                <span>Precios de Mercado Reales</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <Zap className="h-5 w-5 text-orange-500" />
                                <span>Cálculo Inmediato con IA</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <FileText className="h-5 w-5 text-orange-500" />
                                <span>Informes Profesionales PDF</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <Database className="h-5 w-5 text-orange-500" />
                                <span>+100.000 Obras de Referencia</span>
                            </div>
                        </div>

                        {/* Mobile CTA (only if form is hidden or scroll down) */}
                        <div className="lg:hidden pt-4">
                            <Button size="lg" className="w-full h-14 text-lg font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-full transition-all" onClick={() => {
                                document.getElementById('estimate-form')?.scrollIntoView({ behavior: 'smooth' })
                            }}>
                                Calcular Presupuesto Gratis
                                <ArrowRight className="h-5 w-5 ml-2" />
                            </Button>
                        </div>
                    </div>

                    {/* Right Form */}
                    <div id="estimate-form" className="lg:col-span-5 animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
                        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6 md:p-8 shadow-2xl overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            {!estimation ? (
                                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                            <Calculator className="h-6 w-6 text-orange-500" />
                                            Calculadora Gratuita
                                        </h3>
                                        <p className="text-sm text-gray-400">Completa los datos y obtén tu estimación al instante</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-200 text-xs uppercase tracking-wider font-bold">Tipo de Reforma</Label>
                                        <Select
                                            value={formData.reformType}
                                            onValueChange={(value) => {
                                                setFormData({ ...formData, reformType: value })
                                                setErrors({ ...errors, reformType: "", customReformType: "" })
                                            }}
                                        >
                                            <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                                                <SelectValue placeholder="Selecciona el tipo" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-900 border-gray-800">
                                                {REFORM_TYPES.map((type) => (
                                                    <SelectItem key={type.value} value={type.value} className="text-white focus:bg-orange-600 focus:text-white">
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.reformType && <p className="text-red-400 text-xs">{errors.reformType}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-gray-200 text-xs uppercase tracking-wider font-bold">Metros Cuadrados</Label>
                                            <Select
                                                value={formData.squareMeters}
                                                onValueChange={(value) => {
                                                    setFormData({ ...formData, squareMeters: value })
                                                    setErrors({ ...errors, squareMeters: "" })
                                                }}
                                            >
                                                <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                                                    <SelectValue placeholder="m²" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-gray-900 border-gray-800">
                                                    {[40, 50, 60, 70, 80, 90, 100, 120, 150, 200].map(m => (
                                                        <SelectItem key={m} value={String(m)}>{m} m²</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-gray-200 text-xs uppercase tracking-wider font-bold">Ubicación</Label>
                                            <Select
                                                value={formData.province}
                                                onValueChange={(value) => {
                                                    setFormData({ ...formData, province: value, city: "" })
                                                    setErrors({ ...errors, province: "", city: "" })
                                                }}
                                            >
                                                <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                                                    <SelectValue placeholder="Provincia" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-gray-900 border-gray-800 max-h-[300px]">
                                                    {spanishProvinces.map((province) => (
                                                        <SelectItem key={province} value={province}>{province}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-200 text-xs uppercase tracking-wider font-bold">Detalles del Proyecto</Label>
                                        <Textarea
                                            placeholder="Ej: Reforma integral piso completo, incluyendo fontanería..."
                                            value={formData.features}
                                            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white min-h-[80px] text-sm resize-none"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 text-white font-bold text-lg shadow-lg shadow-orange-500/20"
                                    >
                                        {loading ? (
                                            <>
                                                <Calculator className="mr-2 h-5 w-5 animate-spin" />
                                                Calculando...
                                            </>
                                        ) : (
                                            <>
                                                Calcular Presupuesto Gratis
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-[10px] text-center text-gray-500 mt-4 leading-relaxed">
                                        * Al hacer clic en el botón aceptas nuestras políticas y condiciones de uso.
                                        Servicio gratuito sin compromiso.
                                    </p>
                                </form>
                            ) : (
                                <div className="space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-500 text-center">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                                        <Euro className="h-8 w-8 text-green-400" />
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">Tu Estimación de Coste</h3>
                                        <div className="text-4xl font-black text-green-400 my-4 tracking-tighter">
                                            {estimation.priceRange}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl space-y-3">
                                        {estimation.breakdown?.slice(0, 3).map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between text-xs">
                                                <span className="text-gray-400">{item.category}</span>
                                                <span className="text-white font-medium">{item.amount}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {!quoteSent ? (
                                        <div className="space-y-3 pt-2">
                                            <Button
                                                onClick={() => setShowVerificationModal(true)}
                                                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold"
                                            >
                                                Recibir Presupuestos Reales
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => setEstimation(null)}
                                                className="w-full text-gray-400 hover:text-white"
                                            >
                                                Volver a calcular
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                                            <p className="text-sm font-medium text-green-400">¡Solicitud Enviada con Éxito!</p>
                                            <p className="text-[10px] text-green-300/70 mt-1">Empresas verificadas te contactarán pronto.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>

            <PhoneVerificationModal
                open={showVerificationModal}
                onOpenChange={setShowVerificationModal}
                onSuccess={handleVerificationSuccess}
            />
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

