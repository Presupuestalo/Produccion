"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calculator, CheckCircle, Euro, Lightbulb, AlertTriangle, Database } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PhoneVerificationModal } from "@/components/leads/phone-verification-modal"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { spanishProvinces, citiesByProvince } from "@/lib/data/spain-locations"

const REFORM_TYPES = [
  { value: "integral", label: "Reforma Integral" },
  { value: "cocina", label: "Reforma de Cocina" },
  { value: "baño", label: "Reforma de Baño" },
  { value: "pintura", label: "Pintura y Alisado de Paredes" },
  { value: "suelos", label: "Cambio de Suelos / Parquet" },
  { value: "ventanas", label: "Cambio de Ventanas / Cerramientos" },
  { value: "other", label: "Otro (Especificar)" },
]

export default function EstimacionPublicaPage() {
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
      console.log("[v0] Datos del formulario antes de enviar:", formData)

      const response = await fetch("/api/ia/quick-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      console.log("[v0] Respuesta status:", response.status)
      const data = await response.json()
      console.log("[v0] Respuesta de estimación:", data)

      if (!response.ok || data.error) {
        throw new Error(data.error || "Error al generar estimación")
      }

      setEstimation(data)
      setShowQuoteForm(false)
      setQuoteSent(false)
    } catch (error) {
      console.error("[v0] Error generando estimación:", error)
      alert(error instanceof Error ? error.message : "Error al generar la estimación. Por favor, intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleLeadCreated = () => {
    setQuoteSent(true)
    setShowQuoteForm(false)
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
      console.log("[v0] Verification successful, creating landing lead...")

      try {
        let minBudget = 0
        let maxBudget = 0

        if (estimation?.priceRange) {
          // priceRange viene como "4.500 € - 7.000 €" o "25.000 € - 35.000 €"
          const priceMatch = estimation.priceRange.match(/[\d.]+/g)
          if (priceMatch && priceMatch.length >= 2) {
            // Eliminar puntos de miles y convertir a número
            minBudget = Number.parseInt(priceMatch[0].replace(/\./g, ""), 10)
            maxBudget = Number.parseInt(priceMatch[1].replace(/\./g, ""), 10)
          }
        }

        console.log("[v0] Parsed budget:", { minBudget, maxBudget, original: estimation?.priceRange })

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

        console.log("[v0] Landing lead created successfully:", data)

        setShowVerificationModal(false)
        setQuoteSent(true)
        setShowQuoteForm(false)
      } catch (error: any) {
        console.error("[v0] Error creating landing lead:", error)
        alert(error.message || "Error al procesar la solicitud")
      }
    }

    createLead()
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo size="lg" />
          </Link>
          <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800 bg-transparent" asChild>
            <Link href="/auth/login">Iniciar Sesión</Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
            <Calculator className="h-4 w-4 text-green-400" />
            <span className="text-sm text-green-400 font-medium">Estimación Rápida</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Estimación de Presupuesto</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Obtén una estimación aproximada de tu reforma en segundos con información básica
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full">
            <Database className="h-4 w-4 text-orange-400" />
            <span className="text-sm text-orange-400">Basado en más de 100.000 presupuestos reales</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card className="bg-gray-800/50 border-gray-700 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reformType" className="text-white">
                  Tipo de Reforma <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={formData.reformType}
                  onValueChange={(value) => {
                    setFormData({ ...formData, reformType: value })
                    setErrors({ ...errors, reformType: "", customReformType: "" })
                  }}
                >
                  <SelectTrigger
                    className={`bg-gray-900/50 border-gray-700 text-white ${errors.reformType ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Selecciona el tipo de reforma" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {REFORM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-800">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.reformType && <p className="text-red-400 text-xs">{errors.reformType}</p>}
              </div>

              {formData.reformType === "other" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label htmlFor="customReformType" className="text-white">
                    Especifica tu tipo de reforma <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="customReformType"
                    placeholder="Ej: Reforma de terraza, piscina, oficina..."
                    value={formData.customReformType}
                    onChange={(e) => setFormData({ ...formData, customReformType: e.target.value })}
                    className={`bg-gray-900/50 border-gray-700 text-white ${errors.customReformType ? "border-red-500" : ""}`}
                  />
                  {errors.customReformType && <p className="text-red-400 text-xs">{errors.customReformType}</p>}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="province" className="text-white">
                    Provincia <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => {
                      setFormData({ ...formData, province: value, city: "" })
                      setErrors({ ...errors, province: "", city: "" })
                    }}
                  >
                    <SelectTrigger
                      className={`bg-gray-900/50 border-gray-700 text-white ${errors.province ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Selecciona provincia" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 max-h-[300px]">
                      {spanishProvinces.map((province) => (
                        <SelectItem key={province} value={province} className="text-white hover:bg-gray-800">
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.province && <p className="text-red-400 text-xs">{errors.province}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-white">
                    Ciudad <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => {
                      const province = findProvinceByCity(value)
                      if (province && !formData.province) {
                        setFormData({ ...formData, city: value, province })
                      } else {
                        setFormData({ ...formData, city: value })
                      }
                      setErrors({ ...errors, city: "" })
                    }}
                    disabled={!formData.province}
                  >
                    <SelectTrigger
                      className={`bg-gray-900/50 border-gray-700 text-white ${errors.city ? "border-red-500" : ""} ${!formData.province ? "opacity-50" : ""}`}
                    >
                      <SelectValue
                        placeholder={formData.province ? "Selecciona ciudad" : "Selecciona provincia primero"}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 max-h-[300px]">
                      {availableCities.map((city) => (
                        <SelectItem key={city} value={city} className="text-white hover:bg-gray-800">
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.city && <p className="text-red-400 text-xs">{errors.city}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="squareMeters" className="text-white">
                    Metros Cuadrados <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={formData.squareMeters}
                    onValueChange={(value) => {
                      setFormData({ ...formData, squareMeters: value })
                      setErrors({ ...errors, squareMeters: "" })
                    }}
                  >
                    <SelectTrigger
                      className={`bg-gray-900/50 border-gray-700 text-white ${errors.squareMeters ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Selecciona los m²" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="40">40 m²</SelectItem>
                      <SelectItem value="50">50 m²</SelectItem>
                      <SelectItem value="60">60 m²</SelectItem>
                      <SelectItem value="70">70 m²</SelectItem>
                      <SelectItem value="80">80 m²</SelectItem>
                      <SelectItem value="90">90 m²</SelectItem>
                      <SelectItem value="100">100 m²</SelectItem>
                      <SelectItem value="120">120 m²</SelectItem>
                      <SelectItem value="150">150 m²</SelectItem>
                      <SelectItem value="200">200 m²</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.squareMeters && <p className="text-red-400 text-xs">{errors.squareMeters}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rooms" className="text-white">
                    Dormitorios <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={formData.rooms}
                    onValueChange={(value) => {
                      setFormData({ ...formData, rooms: value })
                      setErrors({ ...errors, rooms: "" })
                    }}
                  >
                    <SelectTrigger
                      className={`bg-gray-900/50 border-gray-700 text-white ${errors.rooms ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 dormitorio</SelectItem>
                      <SelectItem value="2">2 dormitorios</SelectItem>
                      <SelectItem value="3">3 dormitorios</SelectItem>
                      <SelectItem value="4">4 dormitorios</SelectItem>
                      <SelectItem value="5">5+ dormitorios</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.rooms && <p className="text-red-400 text-xs">{errors.rooms}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms" className="text-white">
                    Baños <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={formData.bathrooms}
                    onValueChange={(value) => {
                      setFormData({ ...formData, bathrooms: value })
                      setErrors({ ...errors, bathrooms: "" })
                    }}
                  >
                    <SelectTrigger
                      className={`bg-gray-900/50 border-gray-700 text-white ${errors.bathrooms ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 baño</SelectItem>
                      <SelectItem value="2">2 baños</SelectItem>
                      <SelectItem value="3">3 baños</SelectItem>
                      <SelectItem value="4">4+ baños</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.bathrooms && <p className="text-red-400 text-xs">{errors.bathrooms}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="heatingType" className="text-white">
                  Tipo de Calefacción <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={formData.heatingType}
                  onValueChange={(value) => {
                    setFormData({ ...formData, heatingType: value })
                    setErrors({ ...errors, heatingType: "" })
                  }}
                >
                  <SelectTrigger
                    className={`bg-gray-900/50 border-gray-700 text-white ${errors.heatingType ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gas">Caldera de gas + radiadores</SelectItem>
                    <SelectItem value="electric">Eléctrica</SelectItem>
                    <SelectItem value="underfloor">Suelo Radiante</SelectItem>
                    <SelectItem value="none">Sin Calefacción</SelectItem>
                  </SelectContent>
                </Select>
                {errors.heatingType && <p className="text-red-400 text-xs">{errors.heatingType}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="availableBudget" className="text-white">
                  Presupuesto Disponible <span className="text-gray-500 text-sm">(Opcional)</span>
                </Label>
                <Input
                  id="availableBudget"
                  type="number"
                  placeholder="30000"
                  value={formData.availableBudget}
                  onChange={(e) => setFormData({ ...formData, availableBudget: e.target.value })}
                  className="bg-gray-900/50 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="features" className="text-white">
                  Describe tu proyecto con detalle
                </Label>
                <Textarea
                  id="features"
                  placeholder="Cuéntanos todo lo que necesitas: cambiar ventanas, reformar baño, pintar habitaciones, cambiar suelos, nueva cocina, etc. Cuanto más detalle, mejor será la estimación."
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="bg-gray-900/50 border-gray-700 text-white min-h-[120px]"
                />
                <p className="text-xs text-gray-500">Cuanto más detalle proporciones, más precisa será la estimación</p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                {loading ? (
                  <>
                    <Calculator className="mr-2 h-4 w-4 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calcular Estimación
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {!estimation ? (
              <Card className="bg-gray-800/50 border-gray-700 p-8">
                <div className="text-center py-12">
                  <Calculator className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">Completa el formulario</h3>
                  <p className="text-gray-500">Ingresa los datos de tu proyecto para obtener una estimación</p>
                </div>
              </Card>
            ) : (
              <>
                {/* Price Range */}
                <Card className="bg-gray-800/50 border-green-500/30 p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Euro className="h-6 w-6 text-green-400" />
                    <h3 className="text-xl font-bold text-white">Estimación de Coste</h3>
                  </div>
                  <div className="text-center py-6">
                    <div className="text-5xl font-bold text-green-400 mb-2">{estimation.priceRange}</div>
                    <p className="text-gray-300">Rango estimado para tu reforma</p>
                  </div>
                  <div className="flex items-start gap-2 mt-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-200">
                      Esta es una estimación aproximada. El precio final puede variar según materiales, acabados y
                      complejidad del proyecto.
                    </p>
                  </div>
                </Card>

                {/* Budget Warning */}
                {estimation.budgetWarning && (
                  <Card className="bg-red-500/10 border-red-500/20 p-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-lg font-bold text-red-400 mb-2">Presupuesto Insuficiente</h3>
                        <p className="text-red-200 text-sm mb-4">{estimation.budgetWarning}</p>
                        {estimation.budgetAdvice && estimation.budgetAdvice.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-red-300 font-semibold text-sm">Consejos para ajustar:</p>
                            {estimation.budgetAdvice.map((advice: string, index: number) => (
                              <div key={index} className="flex items-start gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                                <p className="text-red-200 text-sm">{advice}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Breakdown */}
                <Card className="bg-gray-800/50 border-gray-700 p-8">
                  <h3 className="text-xl font-bold text-white mb-6">Desglose Estimado</h3>
                  <div className="space-y-4">
                    {estimation.breakdown?.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="py-4 border-b border-gray-700 last:border-0"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-gray-200 font-medium">{item.category}</span>
                          <span className="font-semibold text-white">{item.amount}</span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-400 leading-relaxed italic">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Recommendations */}
                <Card className="bg-gray-800/50 border-gray-700 p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="h-6 w-6 text-orange-400" />
                    <h3 className="text-xl font-bold text-white">Recomendaciones para {formData.city}</h3>
                  </div>
                  <div className="space-y-3">
                    {estimation.recommendations?.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                        <p className="text-gray-300 text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {!quoteSent ? (
                  <Card className="bg-gray-800/50 border-orange-500/30 p-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-3">¿Quieres presupuestos reales?</h3>
                      <p className="text-gray-300 mb-6">
                        Conecta con empresas de reformas cercanas y recibe presupuestos personalizados sin compromiso
                      </p>
                      <Button
                        onClick={() => setShowVerificationModal(true)}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                      >
                        <Euro className="mr-2 h-4 w-4" />
                        Solicitar Presupuestos
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card className="bg-green-500/10 border-green-500/20 p-8">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                        <CheckCircle className="h-8 w-8 text-green-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">¡Solicitud Enviada!</h3>
                      <p className="text-gray-300">
                        Hemos recibido tu solicitud. Las empresas de reformas cercanas se pondrán en contacto contigo
                        pronto. Revisa tu email para acceder a tu panel.
                      </p>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <PhoneVerificationModal
        open={showVerificationModal}
        onOpenChange={setShowVerificationModal}
        onSuccess={handleVerificationSuccess}
      />
    </div >
  )
}
