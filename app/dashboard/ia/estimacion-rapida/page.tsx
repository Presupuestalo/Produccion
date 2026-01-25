"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calculator, Sparkles, MapPin, TrendingUp, AlertCircle, Phone, Mail, FileText, ExternalLink, Gavel } from "lucide-react"
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
  { value: "integral", label: "Reforma Integral" },
  { value: "cocina", label: "Reforma de Cocina" },
  { value: "baño", label: "Reforma de Baño" },
  { value: "pintura", label: "Pintura y Alisado de Paredes" },
  { value: "suelos", label: "Cambio de Suelos / Parquet" },
  { value: "ventanas", label: "Cambio de Ventanas / Cerramientos" },
  { value: "electricidad", label: "Instalación Eléctrica Completa" },
]

export default function EstimacionRapidaPage() {
  const [loading, setLoading] = useState(false)
  const [estimation, setEstimation] = useState<any>(null)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [sendingQuote, setSendingQuote] = useState(false)
  const [quoteSent, setQuoteSent] = useState(false)
  const [aiExplanation, setAiExplanation] = useState<string>("")

  const [formData, setFormData] = useState({
    reformType: "integral",
    squareMeters: "",
    rooms: "",
    bathrooms: "",
    country: "",
    city: "",
    heatingType: "",
    features: "",
    kitchenOptions: {
      cabinets: false,
      island: false,
      floorType: "tile_to_tile",
      wallType: "tile_to_tile",
      modifyElectricity: false,
      dropCeiling: false,
      replaceWindow: false,
    },
    bathroomOptions: {
      sanitaries: false,
      showerOrTub: "change_tub_to_shower",
      furniture: false,
      floorType: "tile_to_tile",
      wallType: "tile_to_tile",
      modifyPlumbing: false,
      modifyElectricity: false,
      dropCeiling: false,
      replaceWindow: false,
    },
    floorOptions: {
      liftCurrentFloor: true,
      newFloorType: "laminate",
      includeRodapies: true,
    },
    windowOptions: {
      numWindows: "3",
      windowType: "pvc",
    },
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

    if (!formData.reformType) newErrors.reformType = "Selecciona el tipo de reforma"
    if (!formData.squareMeters) newErrors.squareMeters = "Selecciona los metros cuadrados"

    // Solo validar habitaciones y baños si es reforma integral
    if (formData.reformType === "integral") {
      if (!formData.rooms) newErrors.rooms = "Selecciona el número de dormitorios"
      if (!formData.bathrooms) newErrors.bathrooms = "Selecciona el número de baños"
    }

    if (!formData.country) newErrors.country = "Selecciona un país"
    if (!formData.city) newErrors.city = "Selecciona una ciudad"

    // La calefacción no es necesaria para reformas de suelo, pintura o ventanas
    if (formData.reformType !== "suelos" && formData.reformType !== "pintura" && formData.reformType !== "ventanas") {
      if (!formData.heatingType) newErrors.heatingType = "Selecciona el tipo de calefacción"
    }

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
              <div className="space-y-2">
                <Label htmlFor="reformType" className="text-white">
                  Tipo de Reforma <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={formData.reformType}
                  onValueChange={(value) => {
                    setFormData({ ...formData, reformType: value })
                    setErrors({ ...errors, reformType: "" })
                  }}
                >
                  <SelectTrigger
                    className={`bg-gray-900/50 border-gray-700 text-white ${errors.reformType ? "border-red-500" : ""}`}
                  >
                    <SelectValue className="text-white" placeholder="Selecciona el tipo de reforma" />
                  </SelectTrigger>
                  <SelectContent>
                    {REFORM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.reformType && <p className="text-red-400 text-xs">{errors.reformType}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className={`space-y-2 ${formData.reformType === "integral" ? "md:col-span-2" : "md:col-span-2"}`}>
                  <Label htmlFor="squareMeters" className="text-white">
                    {formData.reformType === "integral"
                      ? "Metros Cuadrados Totales"
                      : formData.reformType === "cocina"
                        ? "Superficie de la Cocina"
                        : formData.reformType === "baño"
                          ? "Superficie del Baño"
                          : "Superficie a Reformar"} <span className="text-red-400">*</span>
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
                      <SelectValue className="text-white" placeholder="Selecciona m²" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.reformType === "baño" ? (
                        <>
                          <SelectItem value="1">Hasta 1 m² (Aseo pequeño)</SelectItem>
                          <SelectItem value="1.5">1 - 1.5 m²</SelectItem>
                          <SelectItem value="2">1.5 - 2 m²</SelectItem>
                          <SelectItem value="2.5">2 - 2.5 m²</SelectItem>
                          <SelectItem value="3">2.5 - 3 m²</SelectItem>
                          <SelectItem value="4">3 - 4 m²</SelectItem>
                          <SelectItem value="5">4 - 5 m²</SelectItem>
                          <SelectItem value="6">5 - 6 m²</SelectItem>
                          <SelectItem value="8">6 - 8 m²</SelectItem>
                          <SelectItem value="10">8 - 10 m²</SelectItem>
                          <SelectItem value="12">Más de 10 m²</SelectItem>
                        </>
                      ) : formData.reformType === "cocina" ? (
                        <>
                          <SelectItem value="5">Hasta 5 m²</SelectItem>
                          <SelectItem value="7">5 - 7 m²</SelectItem>
                          <SelectItem value="10">7 - 10 m²</SelectItem>
                          <SelectItem value="12">10 - 12 m²</SelectItem>
                          <SelectItem value="15">12 - 15 m²</SelectItem>
                          <SelectItem value="20">15 - 20 m²</SelectItem>
                          <SelectItem value="25">Más de 20 m²</SelectItem>
                        </>
                      ) : formData.reformType === "suelos" ? (
                        <>
                          <SelectItem value="10">Hasta 10 m²</SelectItem>
                          <SelectItem value="15">10 - 15 m²</SelectItem>
                          <SelectItem value="20">15 - 20 m²</SelectItem>
                          <SelectItem value="25">20 - 25 m²</SelectItem>
                          <SelectItem value="30">25 - 30 m²</SelectItem>
                          <SelectItem value="35">30 - 35 m²</SelectItem>
                          <SelectItem value="40">35 - 40 m²</SelectItem>
                          <SelectItem value="45">40 - 45 m²</SelectItem>
                          <SelectItem value="50">45 - 50 m²</SelectItem>
                          <SelectItem value="60">50 - 60 m²</SelectItem>
                          <SelectItem value="70">60 - 70 m²</SelectItem>
                          <SelectItem value="80">70 - 80 m²</SelectItem>
                          <SelectItem value="90">80 - 90 m²</SelectItem>
                          <SelectItem value="100">90 - 100 m²</SelectItem>
                          <SelectItem value="120">100 - 120 m²</SelectItem>
                          <SelectItem value="150">120 - 150 m²</SelectItem>
                          <SelectItem value="200">Más de 150 m²</SelectItem>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.squareMeters && <p className="text-red-400 text-xs">{errors.squareMeters}</p>}
                </div>

                {formData.reformType === "integral" && (
                  <>
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
                          <SelectValue className="text-white" placeholder="Selecciona" />
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
                          <SelectValue className="text-white" placeholder="Selecciona" />
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
                  </>
                )}

                {formData.reformType === "cocina" && (
                  <div className="md:col-span-2 space-y-4 p-5 bg-gray-950/80 border border-gray-600 rounded-xl shadow-inner">
                    <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Detalles de la Cocina
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="cabinets"
                          checked={formData.kitchenOptions.cabinets}
                          onChange={(e) => setFormData({
                            ...formData,
                            kitchenOptions: { ...formData.kitchenOptions, cabinets: e.target.checked }
                          })}
                          className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-green-500 focus:ring-green-500"
                        />
                        <Label htmlFor="cabinets" className="text-gray-300">Incluir Mobiliario (Armarios)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="island"
                          checked={formData.kitchenOptions.island}
                          onChange={(e) => setFormData({
                            ...formData,
                            kitchenOptions: { ...formData.kitchenOptions, island: e.target.checked }
                          })}
                          className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-green-500 focus:ring-green-500"
                        />
                        <Label htmlFor="island" className="text-gray-300">Isla o Península</Label>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Suelos</Label>
                        <Select
                          value={formData.kitchenOptions.floorType}
                          onValueChange={(val) => setFormData({
                            ...formData,
                            kitchenOptions: { ...formData.kitchenOptions, floorType: val }
                          })}
                        >
                          <SelectTrigger className="bg-gray-900/50 border-gray-700 text-sm h-8 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No renovar el suelo</SelectItem>
                            <SelectItem value="tile_to_tile">Quitar baldosa actual y poner nueva</SelectItem>
                            <SelectItem value="tile_to_vinyl">Quitar baldosa y poner vinílico/laminado</SelectItem>
                            <SelectItem value="vinyl_overlay">Poner vinílico sobre baldosa actual (Sin quitar)</SelectItem>
                            <SelectItem value="wood_to_tile">Quitar madera/parquet y poner baldosa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Paredes</Label>
                        <Select
                          value={formData.kitchenOptions.wallType}
                          onValueChange={(val) => setFormData({
                            ...formData,
                            kitchenOptions: { ...formData.kitchenOptions, wallType: val }
                          })}
                        >
                          <SelectTrigger className="bg-gray-900/50 border-gray-700 text-sm h-8 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No renovar paredes</SelectItem>
                            <SelectItem value="tile_to_tile">Quitar azulejo y poner azulejo nuevo</SelectItem>
                            <SelectItem value="tile_to_paint">Quitar azulejo, alisar y pintar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="electricity"
                          checked={formData.kitchenOptions.modifyElectricity}
                          onChange={(e) => setFormData({
                            ...formData,
                            kitchenOptions: { ...formData.kitchenOptions, modifyElectricity: e.target.checked }
                          })}
                          className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-green-500 focus:ring-green-500"
                        />
                        <Label htmlFor="electricity" className="text-gray-300">Modificar Electricidad</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="ceiling"
                          checked={formData.kitchenOptions.dropCeiling}
                          onChange={(e) => setFormData({
                            ...formData,
                            kitchenOptions: { ...formData.kitchenOptions, dropCeiling: e.target.checked }
                          })}
                          className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-green-500 focus:ring-green-500"
                        />
                        <Label htmlFor="ceiling" className="text-gray-300">Bajar Techos (Pladur)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="kitchenWindow"
                          checked={formData.kitchenOptions.replaceWindow}
                          onChange={(e) => setFormData({
                            ...formData,
                            kitchenOptions: { ...formData.kitchenOptions, replaceWindow: e.target.checked }
                          })}
                          className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-green-500 focus:ring-green-500"
                        />
                        <Label htmlFor="kitchenWindow" className="text-gray-300">Renovar Ventana (PVC/Alum)</Label>
                      </div>
                    </div>
                  </div>
                )}

                {formData.reformType === "baño" && (
                  <div className="md:col-span-2 space-y-4 p-5 bg-gray-950/80 border border-gray-600 rounded-xl shadow-inner text-white">
                    <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Detalles del Baño
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="sanitaries"
                          checked={formData.bathroomOptions.sanitaries}
                          onChange={(e) => setFormData({
                            ...formData,
                            bathroomOptions: { ...formData.bathroomOptions, sanitaries: e.target.checked }
                          })}
                          className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-blue-500 focus:ring-blue-500"
                        />
                        <Label htmlFor="sanitaries" className="text-gray-300">Nuevos Sanitarios (WC/Bidet)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="bathroomFurniture"
                          checked={formData.bathroomOptions.furniture}
                          onChange={(e) => setFormData({
                            ...formData,
                            bathroomOptions: { ...formData.bathroomOptions, furniture: e.target.checked }
                          })}
                          className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-blue-500 focus:ring-blue-500"
                        />
                        <Label htmlFor="bathroomFurniture" className="text-gray-300">Mueble de Lavabo y Espejo</Label>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Ducha o Bañera</Label>
                        <Select
                          value={formData.bathroomOptions.showerOrTub}
                          onValueChange={(val) => setFormData({
                            ...formData,
                            bathroomOptions: { ...formData.bathroomOptions, showerOrTub: val }
                          })}
                        >
                          <SelectTrigger className="bg-gray-900/50 border-gray-700 text-sm h-8 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Mantener actual</SelectItem>
                            <SelectItem value="shower">Poner Plato de Ducha nuevo</SelectItem>
                            <SelectItem value="tub">Poner Bañera nueva</SelectItem>
                            <SelectItem value="change_tub_to_shower">Cambiar Bañera por Plato de Ducha</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Suelos</Label>
                        <Select
                          value={formData.bathroomOptions.floorType}
                          onValueChange={(val) => setFormData({
                            ...formData,
                            bathroomOptions: { ...formData.bathroomOptions, floorType: val }
                          })}
                        >
                          <SelectTrigger className="bg-gray-900/50 border-gray-700 text-sm h-8 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No renovar suelo</SelectItem>
                            <SelectItem value="tile_to_tile">Quitar baldosa y poner nueva</SelectItem>
                            <SelectItem value="tile_to_vinyl">Quitar baldosa y poner vinílico</SelectItem>
                            <SelectItem value="vinyl_overlay">Poner vinílico sobre baldosa actual (Sin quitar)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Paredes</Label>
                        <Select
                          value={formData.bathroomOptions.wallType}
                          onValueChange={(val) => setFormData({
                            ...formData,
                            bathroomOptions: { ...formData.bathroomOptions, wallType: val }
                          })}
                        >
                          <SelectTrigger className="bg-gray-900/50 border-gray-700 text-sm h-8 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No renovar paredes</SelectItem>
                            <SelectItem value="tile_to_tile">Quitar azulejo y poner nuevo</SelectItem>
                            <SelectItem value="tile_to_paint">Quitar azulejo y pintar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="bathroomPlumbing"
                          checked={formData.bathroomOptions.modifyPlumbing}
                          onChange={(e) => setFormData({
                            ...formData,
                            bathroomOptions: { ...formData.bathroomOptions, modifyPlumbing: e.target.checked }
                          })}
                          className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-blue-500 focus:ring-blue-500"
                        />
                        <Label htmlFor="bathroomPlumbing" className="text-gray-300">Renovar Fontanería (Tuberías)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="bathroomElectricity"
                          checked={formData.bathroomOptions.modifyElectricity}
                          onChange={(e) => setFormData({
                            ...formData,
                            bathroomOptions: { ...formData.bathroomOptions, modifyElectricity: e.target.checked }
                          })}
                          className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-blue-500 focus:ring-blue-500"
                        />
                        <Label htmlFor="bathroomElectricity" className="text-gray-300">Modificar Electricidad</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="bathroomCeiling"
                          checked={formData.bathroomOptions.dropCeiling}
                          onChange={(e) => setFormData({
                            ...formData,
                            bathroomOptions: { ...formData.bathroomOptions, dropCeiling: e.target.checked }
                          })}
                          className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-blue-500 focus:ring-blue-500"
                        />
                        <Label htmlFor="bathroomCeiling" className="text-gray-300">Bajar Techos (Pladur)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="bathroomWindow"
                          checked={formData.bathroomOptions.replaceWindow}
                          onChange={(e) => setFormData({
                            ...formData,
                            bathroomOptions: { ...formData.bathroomOptions, replaceWindow: e.target.checked }
                          })}
                          className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-blue-500 focus:ring-blue-500"
                        />
                        <Label htmlFor="bathroomWindow" className="text-gray-300">Renovar Ventana (Básica)</Label>
                      </div>
                    </div>
                  </div>
                )}

                {formData.reformType === "suelos" && (
                  <div className="md:col-span-2 space-y-4 p-5 bg-gray-950/80 border border-gray-600 rounded-xl shadow-inner text-white">
                    <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Detalles del Suelo
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="liftCurrentFloor"
                          checked={formData.floorOptions.liftCurrentFloor}
                          onChange={(e) => setFormData({
                            ...formData,
                            floorOptions: { ...formData.floorOptions, liftCurrentFloor: e.target.checked }
                          })}
                          className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-orange-500 focus:ring-orange-500"
                        />
                        <Label htmlFor="liftCurrentFloor" className="text-gray-300">Levantar suelo actual (Demolición)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="includeRodapies"
                          checked={formData.floorOptions.includeRodapies}
                          onChange={(e) => setFormData({
                            ...formData,
                            floorOptions: { ...formData.floorOptions, includeRodapies: e.target.checked }
                          })}
                          className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-orange-500 focus:ring-orange-500"
                        />
                        <Label htmlFor="includeRodapies" className="text-gray-300">Incluir nuevos Rodapiés</Label>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Tipo de Suelo Nuevo</Label>
                        <Select
                          value={formData.floorOptions.newFloorType}
                          onValueChange={(val) => setFormData({
                            ...formData,
                            floorOptions: { ...formData.floorOptions, newFloorType: val }
                          })}
                        >
                          <SelectTrigger className="bg-gray-900/50 border-gray-700 text-sm h-8 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="laminate">Parquet Laminado / Flotante</SelectItem>
                            <SelectItem value="vinyl">Suelo Vinílico (LVT/SPC)</SelectItem>
                            <SelectItem value="ceramic">Baldosa Cerámica / Porcelánico</SelectItem>
                            <SelectItem value="wood">Madera Natural</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {formData.reformType === "ventanas" && (
                  <div className="md:col-span-2 space-y-4 p-5 bg-gray-950/80 border border-gray-600 rounded-xl shadow-inner text-white">
                    <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Detalles de Ventanas
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Número de Ventanas</Label>
                        <Select
                          value={formData.windowOptions.numWindows}
                          onValueChange={(val) => setFormData({
                            ...formData,
                            windowOptions: { ...formData.windowOptions, numWindows: val }
                          })}
                        >
                          <SelectTrigger className="bg-gray-900/50 border-gray-700 text-sm h-8 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 ventana</SelectItem>
                            <SelectItem value="2">2 ventanas</SelectItem>
                            <SelectItem value="3">3 ventanas</SelectItem>
                            <SelectItem value="4">4 ventanas</SelectItem>
                            <SelectItem value="5">5 ventanas</SelectItem>
                            <SelectItem value="6">6 ventanas</SelectItem>
                            <SelectItem value="8">8 ventanas</SelectItem>
                            <SelectItem value="10">10+ ventanas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Material / Calidad</Label>
                        <Select
                          value={formData.windowOptions.windowType}
                          onValueChange={(val) => setFormData({
                            ...formData,
                            windowOptions: { ...formData.windowOptions, windowType: val }
                          })}
                        >
                          <SelectTrigger className="bg-gray-900/50 border-gray-700 text-sm h-8 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pvc">PVC (Climalit Estándar)</SelectItem>
                            <SelectItem value="pvc_premium">PVC (Triple Vidrio / Passivhaus)</SelectItem>
                            <SelectItem value="alum">Aluminio RPT</SelectItem>
                            <SelectItem value="wood">Madera Natural</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
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
                      <SelectValue className="text-white" placeholder="Selecciona país" />
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
                      <SelectValue className="text-white" placeholder={formData.country ? "Selecciona ciudad" : "Primero selecciona país"} />
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

              {formData.reformType !== "suelos" && formData.reformType !== "pintura" && formData.reformType !== "ventanas" && (
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
                      <SelectValue className="text-white" placeholder="Selecciona situación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep">Mantener la actual (Sin cambios)</SelectItem>
                      <SelectItem value="none">No tiene y No desea poner</SelectItem>
                      <SelectItem value="new_gas">Instalar Gas Natural + Radiadores (Nueva) </SelectItem>
                      <SelectItem value="replace_boiler">Sustituir solo la Caldera (Gas)</SelectItem>
                      <SelectItem value="replace_radiators">Sustituir Radiadores antiguos</SelectItem>
                      <SelectItem value="underfloor">Instalar Suelo Radiante (Toda la casa)</SelectItem>
                      <SelectItem value="aerothermy">Instalar Aerotermia (Máxima eficiencia)</SelectItem>
                      <SelectItem value="electric">Calefacción Eléctrica (Bajo consumo)</SelectItem>
                      <SelectItem value="air_cond">Aire Acondicionado / Bomba de Calor</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.heatingType && <p className="text-red-400 text-xs">{errors.heatingType}</p>}
                </div>
              )}


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
                    {estimation.breakdown
                      ?.filter((item: any) => {
                        // Extraer números del string (quitar símbolos de moneda, puntos de miles y espacios)
                        // y verificar si el valor numérico es mayor que cero
                        const numericValue = parseFloat(item.amount.replace(/[^\d]/g, ""))
                        return numericValue > 0
                      })
                      .map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center pb-4 border-b border-gray-700 last:border-0"
                        >
                          <span className="text-gray-300 pr-4">{item.category}</span>
                          <span className="font-semibold text-white whitespace-nowrap ml-4">
                            {item.amount}
                          </span>
                        </div>
                      ))}
                  </div>
                </Card>
                {/* Legal Info */}
                {estimation.legalInfo && (
                  <Card className="bg-gray-800/50 border-blue-500/30 p-8 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                      <Gavel className="h-6 w-6 text-blue-400" />
                      <h3 className="text-xl font-bold text-white">Trámites y Licencias</h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-blue-400 uppercase font-bold tracking-wider mb-1">Tipo de Permiso</p>
                          <p className="text-white font-medium">{estimation.legalInfo.permitType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-400 uppercase font-bold tracking-wider mb-1">Tasa Estimada (Ayto)</p>
                          <p className="text-white font-medium">{estimation.legalInfo.estimatedFee}</p>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center">
                        <Button
                          variant="outline"
                          className="border-gray-600 bg-gray-900/50 text-white hover:bg-gray-800"
                          onClick={() => window.open(estimation.legalInfo.cityHallUrl, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Web del Ayuntamiento
                        </Button>
                        <p className="text-[10px] text-gray-500 mt-2 text-center">
                          Consulta trámites en la sede oficial de {formData.city}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

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
                {estimation && !quoteSent && userProfile?.user_type !== "professional" && (
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
