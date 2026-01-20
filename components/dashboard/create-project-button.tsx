"use client"

import React from "react"
import { useState, useEffect, type ChangeEvent, type FormEvent } from "react"
import { Plus, Loader2, Sparkles, Lock, Crown, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { createProject } from "@/lib/services/project-service"
import { canCreateProject } from "@/lib/services/subscription-limits-service"
import { useToast } from "@/components/ui/use-toast"
import type { ProjectFormData } from "@/types/project"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSupabase } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatDecimalInput, parseDecimalInput, sanitizeDecimalInput } from "@/lib/utils/format"
import { SUPPORTED_COUNTRIES, type UserProfile } from "@/types/user"
import { getCountryFieldLabels, getProvincesForCountry } from "@/lib/utils/country-fields"

const PROVINCIAS_ESPANA = [
  "Álava",
  "Albacete",
  "Alicante",
  "Almería",
  "Asturias",
  "Ávila",
  "Badajoz",
  "Barcelona",
  "Burgos",
  "Cáceres",
  "Cádiz",
  "Cantabria",
  "Castellón",
  "Ciudad Real",
  "Córdoba",
  "Cuenca",
  "Girona",
  "Granada",
  "Guadalajara",
  "Guipúzcoa",
  "Huelva",
  "Huesca",
  "Islas Baleares",
  "Jaén",
  "La Coruña",
  "La Rioja",
  "Las Palmas",
  "León",
  "Lérida",
  "Lugo",
  "Madrid",
  "Málaga",
  "Murcia",
  "Navarra",
  "Orense",
  "Palencia",
  "Pontevedra",
  "Salamanca",
  "Santa Cruz de Tenerife",
  "Segovia",
  "Sevilla",
  "Soria",
  "Tarragona",
  "Teruel",
  "Toledo",
  "Valencia",
  "Valladolid",
  "Vizcaya",
  "Zamora",
  "Zaragoza",
]

const TIPOS_ESTRUCTURA = ["Hormigón", "Ladrillo", "Acero", "Mixta", "Madera", "Piedra", "Otro"]

export function CreateProjectButton() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [creationMode, setCreationMode] = useState<"select" | "manual" | "ai">("select")
  const [activeTab, setActiveTab] = useState<string>("project")
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: boolean }>({})
  const [isCheckingLimits, setIsCheckingLimits] = useState(false)
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [limitMessage, setLimitMessage] = useState("")

  const router = useRouter()
  const { toast } = useToast()

  const [userType, setUserType] = useState<string>("")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [alturaInput, setAlturaInput] = useState("")
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>("free")

  useEffect(() => {
    const getUserData = async () => {
      try {
        const supabase = await getSupabase()
        if (!supabase) return

        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*, subscription_plan")
            .eq("id", session.user.id)
            .single()

          if (profile) {
            setUserType(profile.user_type)
            setUserProfile({ ...profile, email: session.user.email })
            setSubscriptionPlan(profile.subscription_plan || "free")

            if (profile.user_type === "homeowner") {
              setFormData((prev) => ({
                ...prev,
                client: profile.full_name || session.user.email?.split("@")[0] || "",
                clientEmail: session.user.email || "",
                clientPhone: profile.phone || "",
                client_address: profile.address_street
                  ? `${profile.address_street}${profile.address_city ? ", " + profile.address_city : ""}${profile.address_province ? ", " + profile.address_province : ""}`
                  : "",
                client_dni: profile.dni_nif || "",
              }))
            }
          }
        }
      } catch (error) {
        console.error("Error getting user data:", error)
      }
    }

    getUserData()
  }, [])

  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
    client: "",
    clientEmail: "",
    clientPhone: "",
    client_address: "",
    clientNotes: "",
    client_dni: "",
    project_address: "",
    street: "",
    project_floor: "",
    door: "",
    city: "",
    province: "",
    country: "España",
    country_code: "ES",
    structure_type: "",
    ceiling_height: "",
    has_elevator: "",
    status: "Borrador",
    budget: 0,
    dueDate: new Date().toISOString().split("T")[0],
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [id]: checked,
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    console.log("[v0] 🚀 Iniciando creación de proyecto...", formData)

    setValidationErrors({})

    console.log("[v0] Verificando límites de suscripción...")
    const limitCheck = await canCreateProject()
    console.log("[v0] Resultado de verificación de límites:", limitCheck)

    if (!limitCheck.allowed) {
      console.log("[v0] ❌ Límite alcanzado:", limitCheck.reason)
      toast({
        title: "Límite alcanzado",
        description: limitCheck.reason,
        variant: "destructive",
      })
      return
    }
    console.log("[v0] ✅ Límites OK, continuando...")

    if (!formData.title.trim()) {
      console.log("[v0] ❌ Error: Título requerido")
      toast({
        title: "Título requerido",
        description: "Por favor, introduce el título del proyecto",
        variant: "destructive",
      })
      setActiveTab("project")
      return
    }

    if (!String(formData.ceiling_height).trim()) {
      console.log("[v0] ❌ Error: Altura requerida")
      toast({
        title: "Altura requerida",
        description: "Por favor, introduce la altura máxima al techo",
        variant: "destructive",
      })
      setActiveTab("project")
      return
    }

    if (!formData.structure_type || !String(formData.structure_type).trim()) {
      console.log("[v0] ❌ Error: Tipo de estructura requerido")
      toast({
        title: "Tipo de estructura requerido",
        description: "Por favor, selecciona el tipo de estructura del edificio",
        variant: "destructive",
      })
      setActiveTab("project")
      return
    }

    if (!formData.street?.trim() || !formData.city?.trim() || !formData.province?.trim()) {
      console.log("[v0] ❌ Error: Ubicación requerida")
      toast({
        title: "Ubicación requerida",
        description: "Por favor, completa todos los campos obligatorios de ubicación",
        variant: "destructive",
      })
      setActiveTab("location")
      return
    }

    if (!String(formData.project_floor).trim()) {
      console.log("[v0] ❌ Error: Planta requerida")
      toast({
        title: "Planta requerida",
        description: "Por favor, indica en qué planta se encuentra el proyecto",
        variant: "destructive",
      })
      setActiveTab("location")
      return
    }

    if (!formData.has_elevator) {
      console.log("[v0] ❌ Error: Ascensor requerido")
      setValidationErrors({ has_elevator: true })
      toast({
        title: "⚠️ Información de ascensor obligatoria",
        description:
          "Debes seleccionar si el edificio tiene ascensor o no. Esta información es necesaria para los cálculos.",
        variant: "destructive",
      })
      setActiveTab("location")
      return
    }

    if (userType !== "homeowner" && !formData.client.trim()) {
      console.log("[v0] ❌ Error: Cliente requerido")
      toast({
        title: "Cliente requerido",
        description: "Por favor, introduce el nombre del cliente",
        variant: "destructive",
      })
      setActiveTab("client")
      return
    }

    setIsLoading(true)
    console.log("[v0] 📝 Datos a enviar:", formData)

    try {
      const dataToSubmit = {
        ...formData,
        ceiling_height: parseDecimalInput(String(formData.ceiling_height || "0")),
      }
      console.log("[v0] 📝 Datos procesados para enviar:", dataToSubmit)

      console.log("[v0] 🔄 Llamando a createProject...")
      const newProject = await createProject(dataToSubmit, userProfile || undefined)
      console.log("[v0] ✅ Proyecto creado exitosamente:", newProject)

      const projectId = newProject.id

      toast({
        title: "Proyecto creado",
        description: "El proyecto se ha creado correctamente",
      })

      setOpen(false)
      console.log("[v0] 🔄 Redirigiendo a:", `/dashboard/projects/${projectId}`)

      if (creationMode === "ai") {
        router.push(`/dashboard/projects/${projectId}?openFloorPlanAnalyzer=true`)
      } else {
        router.push(`/dashboard/projects/${projectId}`)
      }

      setFormData({
        title: "",
        description: "",
        client: "",
        clientEmail: "",
        clientPhone: "",
        client_address: "",
        clientNotes: "",
        client_dni: "",
        project_address: "",
        street: "",
        project_floor: "",
        door: "",
        city: "",
        province: "",
        country: "España",
        country_code: "ES",
        structure_type: "",
        ceiling_height: "",
        has_elevator: "",
        status: "Borrador",
        budget: 0,
        dueDate: new Date().toISOString().split("T")[0],
      })
      setAlturaInput("")
      setCreationMode("select")
      setActiveTab("project")
    } catch (error: any) {
      console.error("[v0] ❌ Error completo al crear el proyecto:", error)
      console.error("[v0] ❌ Error message:", error?.message)
      console.error("[v0] ❌ Error stack:", error?.stack)
      console.error("[v0] ❌ Error details:", JSON.stringify(error, null, 2))

      toast({
        title: "Error",
        description: error?.message || "No se pudo crear el proyecto. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = async () => {
    console.log("[v0] Verificando límites antes de abrir modal...")
    setIsCheckingLimits(true)

    try {
      const limitCheck = await canCreateProject()

      if (!limitCheck.allowed) {
        console.log("[v0] Límite alcanzado, mostrando diálogo:", limitCheck.reason)
        setLimitMessage(limitCheck.reason || "Has alcanzado el límite de proyectos de tu plan.")
        setShowLimitDialog(true)
        setIsCheckingLimits(false)
        return
      }

      console.log("[v0] Límites OK, abriendo modal...")
      setOpen(true)
    } catch (error) {
      console.error("[v0] Error al verificar límites:", error)
      toast({
        title: "Error",
        description: "No se pudo verificar los límites de tu plan. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsCheckingLimits(false)
    }
  }

  const fieldLabels = getCountryFieldLabels(formData.country_code || "ES")
  const availableProvinces = getProvincesForCountry(formData.country_code || "ES")

  const plan = (subscriptionPlan || "free").toLowerCase()
  const isProUser = ["pro", "premium", "enterprise", "business"].includes(plan)

  const handleAIOptionClick = () => {
    if (isProUser) {
      setCreationMode("ai")
    } else {
      toast({
        title: "Característica Pro",
        description: "La creación de proyectos con IA solo está disponible en el plan Pro. ¡Actualiza para empezar!",
      })
      router.push("/dashboard/planes")
      setOpen(false)
    }
  }

  return (
    <>
      <AlertDialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Límite de plan alcanzado</AlertDialogTitle>
            <AlertDialogDescription className="text-base">{limitMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/dashboard/planes")}>
              Ver planes disponibles
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className="gap-2"
            onClick={(e) => {
              e.preventDefault()
              handleOpenDialog()
            }}
            disabled={isCheckingLimits}
          >
            {isCheckingLimits ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Nuevo Proyecto
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {creationMode === "select" && (
            <>
              <DialogHeader>
                <DialogTitle>¿Cómo quieres crear el proyecto?</DialogTitle>
                <DialogDescription>Elige si quieres crear el proyecto manualmente o con ayuda de IA</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 py-6">
                <button
                  onClick={handleAIOptionClick}
                  className={`relative flex flex-col items-center gap-4 p-8 border-2 rounded-lg transition-all ${isProUser
                    ? "border-border hover:border-orange-300 hover:bg-orange-50"
                    : "border-gray-200 bg-gray-50/50 cursor-pointer group"
                    }`}
                >
                  {/* PRO badge removed */}

                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center ${isProUser ? "bg-orange-100" : "bg-gray-100"
                      }`}
                  >
                    {isProUser ? (
                      <Sparkles className="w-8 h-8 text-orange-600" />
                    ) : (
                      <div className="relative">
                        <Sparkles className="w-8 h-8 text-gray-400" />
                        <Lock className="w-4 h-4 text-gray-500 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" />
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <h3 className={`font-semibold text-lg mb-2 ${!isProUser && "text-gray-600"}`}>Crear con IA</h3>
                    <p className={`text-sm ${isProUser ? "text-muted-foreground" : "text-gray-400"}`}>
                      Completa los datos y luego analiza el plano automáticamente
                    </p>
                  </div>

                  {!isProUser && (
                    <div className="mt-2 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg group-hover:shadow-md transition-shadow">
                      <span>Desbloquear con Plan Pro</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setCreationMode("manual")}
                  className="flex flex-col items-center gap-4 p-8 border-2 border-border rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg mb-2">Crear en blanco</h3>
                    <p className="text-sm text-muted-foreground">Introduce la información del proyecto manualmente</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {(creationMode === "manual" || creationMode === "ai") && (
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{creationMode === "ai" ? "Crear proyecto con IA" : "Crear nuevo proyecto"}</DialogTitle>
                <DialogDescription>
                  {creationMode === "ai"
                    ? "Completa los datos del proyecto. Después podrás analizar el plano automáticamente."
                    : "Completa la información detallada para crear un nuevo proyecto de reforma."}
                </DialogDescription>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className={`grid w-full ${userType === "homeowner" ? "grid-cols-2" : "grid-cols-3"}`}>
                  <TabsTrigger value="project">Proyecto</TabsTrigger>
                  <TabsTrigger value="location">Ubicación</TabsTrigger>
                  {userType !== "homeowner" && <TabsTrigger value="client">Cliente</TabsTrigger>}
                </TabsList>

                <TabsContent value="project" className="space-y-4 pt-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Nombre del proyecto *</Label>
                      <Input
                        id="title"
                        placeholder="Reforma integral"
                        value={formData.title}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        placeholder="Descripción del proyecto"
                        className="min-h-[80px]"
                        value={formData.description}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="ceiling_height">Altura máxima al techo (m) *</Label>
                        <Input
                          id="ceiling_height"
                          type="text"
                          inputMode="decimal"
                          value={alturaInput}
                          onChange={(e) => {
                            const sanitized = sanitizeDecimalInput(e.target.value)
                            setAlturaInput(sanitized)
                            setFormData((prev) => ({ ...prev, ceiling_height: sanitized }))
                          }}
                          onBlur={() => {
                            const parsed = parseDecimalInput(alturaInput || "0")
                            const formatted = formatDecimalInput(parsed)
                            setAlturaInput(formatted)
                            setFormData((prev) => ({ ...prev, ceiling_height: formatted }))
                          }}
                          placeholder="2,60"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Sin falsos techos</p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="structure_type">Tipo de estructura *</Label>
                        <Select
                          value={formData.structure_type}
                          onValueChange={(value) => handleSelectChange("structure_type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="⚠️ Selecciona el tipo de estructura" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_ESTRUCTURA.map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>
                                {tipo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="location" className="space-y-4 pt-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="country_code">País de la reforma *</Label>
                      <Select
                        value={formData.country_code}
                        onValueChange={(value) => {
                          handleSelectChange("country_code", value)
                          const countryName = SUPPORTED_COUNTRIES.find((c) => c.code === value)?.name || "España"
                          handleSelectChange("project_country", countryName)
                          handleSelectChange("province", "")
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el país" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {SUPPORTED_COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.country_code !== "ES" && (
                        <p className="text-xs text-orange-600 font-medium">
                          Los precios se adaptarán al país seleccionado
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="street">Calle y número *</Label>
                      <Input
                        id="street"
                        placeholder="Calle Mayor, 123"
                        value={formData.street}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="project_floor">Planta *</Label>
                        <Input
                          id="project_floor"
                          type="number"
                          min="0"
                          max="50"
                          placeholder="0 (Bajo), 1, 2, 3..."
                          value={formData.project_floor}
                          onChange={handleChange}
                          required
                        />
                        <p className="text-xs text-muted-foreground">0 = Bajo, 1 = 1º, 2 = 2º...</p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="door">Puerta/Mano</Label>
                        <Input
                          id="door"
                          placeholder="A, B, Izq, Dcha..."
                          value={formData.door}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="city">Ciudad *</Label>
                        <Input
                          id="city"
                          placeholder={
                            formData.country_code === "US"
                              ? "New York"
                              : formData.country_code === "FR"
                                ? "Paris"
                                : formData.country_code === "IT"
                                  ? "Roma"
                                  : formData.country_code === "PT"
                                    ? "Lisboa"
                                    : "Madrid"
                          }
                          value={formData.city}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="province">{fieldLabels.province} *</Label>
                        {availableProvinces ? (
                          <Select
                            value={formData.province}
                            onValueChange={(value) => handleSelectChange("province", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Selecciona ${fieldLabels.province.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {availableProvinces.map((province) => (
                                <SelectItem key={province} value={province}>
                                  {province}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id="province"
                            placeholder={fieldLabels.province}
                            value={formData.province}
                            onChange={handleChange}
                            required
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="has_elevator" className={validationErrors.has_elevator ? "text-destructive" : ""}>
                        ¿Tiene ascensor? *
                      </Label>
                      <Select
                        value={formData.has_elevator}
                        onValueChange={(value) => {
                          handleSelectChange("has_elevator", value)
                          if (validationErrors.has_elevator) {
                            setValidationErrors((prev) => ({ ...prev, has_elevator: false }))
                          }
                        }}
                      >
                        <SelectTrigger className={validationErrors.has_elevator ? "border-destructive" : ""}>
                          <SelectValue placeholder="⚠️ Selecciona una opción obligatoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sí">Sí</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                      {validationErrors.has_elevator && (
                        <p className="text-xs text-destructive font-medium">
                          ⚠️ Debes seleccionar si tiene ascensor o no
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Esta información es necesaria para calcular costes de transporte de materiales
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {userType !== "homeowner" && (
                  <TabsContent value="client" className="space-y-4 pt-4">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="client">Nombre del cliente *</Label>
                        <Input
                          id="client"
                          placeholder="Nombre del cliente"
                          value={formData.client}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="client_dni">DNI/NIF del cliente</Label>
                        <Input
                          id="client_dni"
                          placeholder="12345678A"
                          value={formData.client_dni}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="clientEmail">Correo electrónico</Label>
                        <Input
                          id="clientEmail"
                          type="email"
                          placeholder="cliente@ejemplo.com"
                          value={formData.clientEmail}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="clientPhone">Teléfono</Label>
                        <Input
                          id="clientPhone"
                          placeholder="Número de teléfono"
                          value={formData.clientPhone}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="client_address">Dirección del cliente</Label>
                        <Input
                          id="client_address"
                          placeholder="Dirección del cliente"
                          value={formData.client_address}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="clientNotes">Notas</Label>
                        <Textarea
                          id="clientNotes"
                          placeholder="Notas adicionales sobre el cliente"
                          className="min-h-[80px]"
                          value={formData.clientNotes}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>

              <DialogFooter className="mt-6">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear proyecto"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
