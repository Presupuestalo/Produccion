"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calculator, Sparkles, MapPin, TrendingUp, AlertCircle, Phone, Mail, FileText } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PhoneVerificationModal } from "@/components/leads/phone-verification-modal"
import { useUserProfile } from "@/hooks/use-user-profile"

const COUNTRIES = [
  {
    value: "españa",
    label: "España",
    cities: [
      "Madrid",
      "Barcelona",
      "Valencia",
      "Sevilla",
      "Bilbao",
      "Málaga",
      "Zaragoza",
      "Murcia",
      "Palma",
      "Las Palmas",
      "Alicante",
      "Córdoba",
      "Valladolid",
      "Vigo",
      "Gijón",
    ],
  },
  {
    value: "mexico",
    label: "México",
    cities: [
      "Ciudad de México",
      "Guadalajara",
      "Monterrey",
      "Puebla",
      "Tijuana",
      "León",
      "Juárez",
      "Zapopan",
      "Mérida",
      "Cancún",
      "Querétaro",
      "Aguascalientes",
      "Toluca",
      "Chihuahua",
      "San Luis Potosí",
    ],
  },
  {
    value: "argentina",
    label: "Argentina",
    cities: [
      "Buenos Aires",
      "Córdoba",
      "Rosario",
      "Mendoza",
      "La Plata",
      "San Miguel de Tucumán",
      "Mar del Plata",
      "Salta",
      "Santa Fe",
      "San Juan",
      "Resistencia",
      "Neuquén",
      "Posadas",
      "Bahía Blanca",
    ],
  },
  {
    value: "colombia",
    label: "Colombia",
    cities: [
      "Bogotá",
      "Medellín",
      "Cali",
      "Barranquilla",
      "Cartagena",
      "Cúcuta",
      "Bucaramanga",
      "Pereira",
      "Santa Marta",
      "Ibagué",
      "Manizales",
      "Villavicencio",
      "Pasto",
      "Neiva",
    ],
  },
  {
    value: "chile",
    label: "Chile",
    cities: [
      "Santiago",
      "Valparaíso",
      "Concepción",
      "La Serena",
      "Antofagasta",
      "Temuco",
      "Rancagua",
      "Talca",
      "Arica",
      "Puerto Montt",
      "Iquique",
      "Coquimbo",
      "Osorno",
      "Valdivia",
    ],
  },
  {
    value: "peru",
    label: "Perú",
    cities: [
      "Lima",
      "Arequipa",
      "Trujillo",
      "Chiclayo",
      "Piura",
      "Cusco",
      "Iquitos",
      "Huancayo",
      "Tacna",
      "Pucallpa",
      "Juliaca",
      "Cajamarca",
      "Ayacucho",
      "Chimbote",
    ],
  },
  {
    value: "venezuela",
    label: "Venezuela",
    cities: [
      "Caracas",
      "Maracaibo",
      "Valencia",
      "Barquisimeto",
      "Maracay",
      "Ciudad Guayana",
      "Barcelona",
      "Maturín",
      "Puerto La Cruz",
      "Petare",
      "Turmero",
      "Mérida",
      "San Cristóbal",
      "Cumaná",
    ],
  },
  {
    value: "ecuador",
    label: "Ecuador",
    cities: [
      "Quito",
      "Guayaquil",
      "Cuenca",
      "Santo Domingo",
      "Machala",
      "Durán",
      "Manta",
      "Portoviejo",
      "Loja",
      "Ambato",
      "Esmeraldas",
      "Quevedo",
      "Riobamba",
      "Milagro",
    ],
  },
  {
    value: "guatemala",
    label: "Guatemala",
    cities: [
      "Ciudad de Guatemala",
      "Mixco",
      "Villa Nueva",
      "Quetzaltenango",
      "Escuintla",
      "Chinautla",
      "Cobán",
      "Huehuetenango",
      "Chimaltenango",
      "Jalapa",
      "Antigua Guatemala",
      "Retalhuleu",
      "Mazatenango",
    ],
  },
  {
    value: "cuba",
    label: "Cuba",
    cities: [
      "La Habana",
      "Santiago de Cuba",
      "Camagüey",
      "Holguín",
      "Guantánamo",
      "Santa Clara",
      "Las Tunas",
      "Bayamo",
      "Cienfuegos",
      "Pinar del Río",
      "Matanzas",
      "Ciego de Ávila",
      "Sancti Spíritus",
    ],
  },
  {
    value: "bolivia",
    label: "Bolivia",
    cities: [
      "La Paz",
      "Santa Cruz de la Sierra",
      "Cochabamba",
      "Sucre",
      "Oruro",
      "Tarija",
      "Potosí",
      "Sacaba",
      "Montero",
      "Trinidad",
      "El Alto",
      "Quillacollo",
      "Yacuiba",
    ],
  },
  {
    value: "republica-dominicana",
    label: "República Dominicana",
    cities: [
      "Santo Domingo",
      "Santiago de los Caballeros",
      "La Romana",
      "San Pedro de Macorís",
      "San Cristóbal",
      "Puerto Plata",
      "La Vega",
      "San Francisco de Macorís",
      "Higüey",
      "Moca",
      "Boca Chica",
      "Baní",
    ],
  },
  {
    value: "honduras",
    label: "Honduras",
    cities: [
      "Tegucigalpa",
      "San Pedro Sula",
      "Choloma",
      "La Ceiba",
      "El Progreso",
      "Choluteca",
      "Comayagua",
      "Puerto Cortés",
      "La Lima",
      "Danlí",
      "Siguatepeque",
      "Juticalpa",
    ],
  },
  {
    value: "paraguay",
    label: "Paraguay",
    cities: [
      "Asunción",
      "Ciudad del Este",
      "San Lorenzo",
      "Luque",
      "Capiatá",
      "Lambaré",
      "Fernando de la Mora",
      "Limpio",
      "Ñemby",
      "Encarnación",
      "Mariano Roque Alonso",
      "Pedro Juan Caballero",
    ],
  },
  {
    value: "el-salvador",
    label: "El Salvador",
    cities: [
      "San Salvador",
      "Soyapango",
      "Santa Ana",
      "San Miguel",
      "Mejicanos",
      "Apopa",
      "Delgado",
      "Sonsonate",
      "Ilopango",
      "Ahuachapán",
      "La Libertad",
      "Cojutepeque",
    ],
  },
  {
    value: "nicaragua",
    label: "Nicaragua",
    cities: [
      "Managua",
      "León",
      "Masaya",
      "Matagalpa",
      "Chinandega",
      "Estelí",
      "Granada",
      "Jinotega",
      "Juigalpa",
      "Nueva Guinea",
      "Tipitapa",
      "Bluefields",
    ],
  },
  {
    value: "costa-rica",
    label: "Costa Rica",
    cities: [
      "San José",
      "Limón",
      "Alajuela",
      "Heredia",
      "Cartago",
      "Puntarenas",
      "Liberia",
      "Paraíso",
      "Pérez Zeledón",
      "San Isidro",
      "Curridabat",
      "San Vicente",
    ],
  },
  {
    value: "panama",
    label: "Panamá",
    cities: [
      "Ciudad de Panamá",
      "San Miguelito",
      "Tocumen",
      "David",
      "Arraiján",
      "Colón",
      "Las Cumbres",
      "La Chorrera",
      "Pacora",
      "Santiago",
      "Chitré",
      "Penonomé",
    ],
  },
  {
    value: "uruguay",
    label: "Uruguay",
    cities: [
      "Montevideo",
      "Salto",
      "Ciudad de la Costa",
      "Paysandú",
      "Las Piedras",
      "Rivera",
      "Maldonado",
      "Tacuarembó",
      "Melo",
      "Mercedes",
      "Artigas",
      "Minas",
    ],
  },
  {
    value: "puerto-rico",
    label: "Puerto Rico",
    cities: [
      "San Juan",
      "Bayamón",
      "Carolina",
      "Ponce",
      "Caguas",
      "Guaynabo",
      "Mayagüez",
      "Trujillo Alto",
      "Arecibo",
      "Fajardo",
      "Aguadilla",
      "Humacao",
    ],
  },
]

const REFORM_TYPES = [
  { value: "baño", label: "Reforma de Baño" },
  { value: "cocina", label: "Reforma de Cocina" },
  { value: "integral", label: "Reforma Integral" },
  { value: "semi-integral", label: "Reforma Semi-integral" },
]

export default function EstimacionRapidaPage() {
  const [loading, setLoading] = useState(false)
  const [estimation, setEstimation] = useState<any>(null)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [sendingQuote, setSendingQuote] = useState(false)
  const [quoteSent, setQuoteSent] = useState(false)
  const [aiExplanation, setAiExplanation] = useState<string>("")

  const [formData, setFormData] = useState({
    squareMeters: "",
    rooms: "",
    bathrooms: "",
    country: "",
    city: "",
    heatingType: "",
    features: "",
    availableBudget: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const [quoteData, setQuoteData] = useState({
    reformType: "",
    phone: "",
    email: "",
    description: "",
  })

  const selectedCountry = COUNTRIES.find((c) => c.value === formData.country)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.squareMeters) newErrors.squareMeters = "Selecciona los metros cuadrados"
    if (!formData.rooms) newErrors.rooms = "Selecciona el número de dormitorios"
    if (!formData.bathrooms) newErrors.bathrooms = "Selecciona el número de baños"
    if (!formData.country) newErrors.country = "Selecciona un país"
    if (!formData.city) newErrors.city = "Selecciona una ciudad"
    if (!formData.heatingType) newErrors.heatingType = "Selecciona el tipo de calefacción"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/ia/quick-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      setEstimation(data)
      setShowQuoteForm(false)
      setQuoteSent(false)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuoteRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setSendingQuote(true)

    try {
      const response = await fetch("/api/ia/request-quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...quoteData,
          estimationData: formData,
          estimationResult: estimation,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setQuoteSent(true)
        setShowQuoteForm(false)
        if (data.explanation) {
          setAiExplanation(data.explanation)
        }
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setSendingQuote(false)
    }
  }

  const [showVerificationModal, setShowVerificationModal] = useState(false)

  const { userProfile, loading: profileLoading } = useUserProfile()

  const handleVerificationSuccess = async (verificationData: {
    email: string
    phone: string
    fullName: string
    verificationCode?: string
  }) => {
    console.log("[v0] Verification successful, creating lead for logged in user...")
    setSendingQuote(true)

    try {
      const response = await fetch("/api/ia/create-lead-logged-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: verificationData.phone,
          estimationData: {
            ...formData,
            estimated_budget_min: estimation?.estimated_budget_min || 0,
            estimated_budget_max: estimation?.estimated_budget_max || 0,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la solicitud")
      }

      console.log("[v0] Lead created successfully:", data)

      setShowVerificationModal(false)
      setQuoteSent(true)
      setShowQuoteForm(false)
    } catch (error: any) {
      console.error("[v0] Error creating lead:", error)
      alert(error.message || "Error al procesar la solicitud")
    } finally {
      setSendingQuote(false)
    }
  }

  const handleOpenVerificationModal = () => {
    if (profileLoading) {
      console.log("[v0] Profile still loading, waiting...")
      return
    }
    console.log("[v0] Opening verification modal with userProfile:", userProfile)
    setShowVerificationModal(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
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
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card className="bg-gray-800/50 border-gray-700 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                      <SelectValue placeholder="Selecciona m²" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30-40 m²</SelectItem>
                      <SelectItem value="45">40-50 m²</SelectItem>
                      <SelectItem value="55">50-60 m²</SelectItem>
                      <SelectItem value="65">60-70 m²</SelectItem>
                      <SelectItem value="75">70-80 m²</SelectItem>
                      <SelectItem value="85">80-90 m²</SelectItem>
                      <SelectItem value="95">90-100 m²</SelectItem>
                      <SelectItem value="110">100-120 m²</SelectItem>
                      <SelectItem value="130">120-140 m²</SelectItem>
                      <SelectItem value="150">140-160 m²</SelectItem>
                      <SelectItem value="170">160-180 m²</SelectItem>
                      <SelectItem value="190">180-200 m²</SelectItem>
                      <SelectItem value="220">200-250 m²</SelectItem>
                      <SelectItem value="275">250-300 m²</SelectItem>
                      <SelectItem value="350">300+ m²</SelectItem>
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

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-white">
                    País <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => {
                      setFormData({ ...formData, country: value, city: "" })
                      setErrors({ ...errors, country: "", city: "" })
                    }}
                  >
                    <SelectTrigger
                      className={`bg-gray-900/50 border-gray-700 text-white ${errors.country ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Selecciona país" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.country && <p className="text-red-400 text-xs">{errors.country}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-white">
                    Ciudad <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => {
                      setFormData({ ...formData, city: value })
                      setErrors({ ...errors, city: "" })
                    }}
                    disabled={!formData.country}
                  >
                    <SelectTrigger
                      className={`bg-gray-900/50 border-gray-700 text-white ${errors.city ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder={formData.country ? "Selecciona ciudad" : "Primero selecciona país"} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCountry?.cities.map((city) => (
                        <SelectItem key={city} value={city.toLowerCase()}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.city && <p className="text-red-400 text-xs">{errors.city}</p>}
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
                <p className="text-xs text-gray-500">
                  Si indicas tu presupuesto, te daremos consejos si necesitas ajustar el proyecto
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features" className="text-white">
                  Características Adicionales
                </Label>
                <Textarea
                  id="features"
                  placeholder="Describe cualquier característica especial: cocina americana, terraza, balcón, etc."
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="bg-gray-900/50 border-gray-700 text-white min-h-[100px]"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                {loading ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
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
                    <TrendingUp className="h-6 w-6 text-green-400" />
                    <h3 className="text-xl font-bold text-white">Estimación de Coste</h3>
                  </div>
                  <div className="text-center py-6">
                    <div className="text-5xl font-bold text-green-400 mb-2">{estimation.priceRange}</div>
                    <p className="text-gray-300">Rango estimado para tu reforma</p>
                  </div>
                  <div className="flex items-start gap-2 mt-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
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
                      <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
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
                        className="flex justify-between items-center pb-4 border-b border-gray-700 last:border-0"
                      >
                        <span className="text-gray-300">{item.category}</span>
                        <span className="font-semibold text-white">{item.amount}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Recommendations */}
                <Card className="bg-gray-800/50 border-gray-700 p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="h-6 w-6 text-orange-400" />
                    <h3 className="text-xl font-bold text-white">
                      Recomendaciones para {formData.city}, {formData.country}
                    </h3>
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

                {/* CTA para solicitar presupuestos reales */}
                {estimation && !quoteSent && userProfile?.user_type !== "profesional" && (
                  <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
                    <div className="p-6">
                      {!showQuoteForm ? (
                        <div className="text-center">
                          <h3 className="text-2xl font-bold text-white mb-3">¿Quieres presupuestos reales?</h3>
                          <p className="text-gray-300 mb-6">
                            Conecta con empresas de reformas cercanas y recibe presupuestos personalizados sin
                            compromiso
                          </p>
                          <Button
                            onClick={handleOpenVerificationModal}
                            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Solicitar Presupuestos
                          </Button>
                        </div>
                      ) : (
                        <form onSubmit={handleQuoteRequest} className="space-y-4">
                          <h3 className="text-xl font-bold text-white mb-4">Solicitar Presupuestos</h3>

                          <div className="space-y-2">
                            <Label htmlFor="reformType" className="text-white">
                              Tipo de Reforma
                            </Label>
                            <Select
                              value={quoteData.reformType}
                              onValueChange={(value) => setQuoteData({ ...quoteData, reformType: value })}
                            >
                              <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                                <SelectValue placeholder="Selecciona tipo de reforma" />
                              </SelectTrigger>
                              <SelectContent>
                                {REFORM_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-white">
                              Teléfono
                            </Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                id="phone"
                                type="tel"
                                placeholder="+34 600 000 000"
                                value={quoteData.phone}
                                onChange={(e) => setQuoteData({ ...quoteData, phone: e.target.value })}
                                className="bg-gray-900/50 border-gray-700 text-white pl-10"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-white">
                              Email
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                value={quoteData.email}
                                onChange={(e) => setQuoteData({ ...quoteData, email: e.target.value })}
                                className="bg-gray-900/50 border-gray-700 text-white pl-10"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="description" className="text-white">
                              Descripción de tu proyecto
                            </Label>
                            <Textarea
                              id="description"
                              placeholder="Cuéntanos más detalles sobre tu reforma..."
                              value={quoteData.description}
                              onChange={(e) => setQuoteData({ ...quoteData, description: e.target.value })}
                              className="bg-gray-900/50 border-gray-700 text-white min-h-[100px]"
                              required
                            />
                          </div>

                          <div className="flex gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowQuoteForm(false)}
                              className="flex-1 bg-gray-900/50 border-gray-700 text-white hover:bg-gray-800 hover:text-white"
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="submit"
                              disabled={sendingQuote}
                              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                            >
                              {sendingQuote ? (
                                <>
                                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Enviar Solicitud
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  </Card>
                )}

                {!quoteSent ? null : (
                  <>
                    <Card className="bg-green-500/10 border-green-500/20 p-8">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                          <FileText className="h-8 w-8 text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">¡Solicitud Enviada!</h3>
                        <p className="text-gray-300">
                          Hemos recibido tu solicitud. Las empresas de reformas cercanas se pondrán en contacto contigo
                          pronto.
                        </p>
                      </div>
                    </Card>

                    {aiExplanation && (
                      <Card className="bg-blue-500/10 border-blue-500/20 p-8">
                        <div className="flex items-center gap-3 mb-4">
                          <Sparkles className="h-6 w-6 text-blue-400" />
                          <h3 className="text-xl font-bold text-white">Información Adicional para tu Reforma</h3>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{aiExplanation}</p>
                      </Card>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <PhoneVerificationModal
        open={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onSuccess={handleVerificationSuccess}
        isLoggedIn={true}
        userEmail={userProfile?.email || ""}
        userName={userProfile?.full_name || userProfile?.company_name || ""}
        userPhone={userProfile?.phone || ""}
      />
    </div>
  )
}
