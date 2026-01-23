"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import {
  Loader2,
  Building2,
  User,
  Camera,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CreditCard,
  ArrowUpRight,
  Users,
  Hammer,
  Briefcase,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DeleteAccountSection } from "@/components/ajustes/delete-account-section"
import Link from "next/link"
import type { FormEvent } from "react"
import { CreditPurchaseHistory } from "@/components/credits/credit-purchase-history"
import { getProvincesForCountry, getCountryFieldLabels } from "@/lib/utils/country-fields"

interface UserProfile {
  id: string
  email: string | undefined
  full_name: string
  avatar_url: string
  country: string
  user_type: string
  phone: string
  phone_prefix?: string
  phone_number?: string
  dni_nif: string
  address_street: string
  address_city: string
  address_province: string
  address_postal_code: string
  updated_at: string
  company_name?: string
  cif?: string
  address?: string
  city?: string
  postal_code?: string
  province?: string
  website?: string
  description?: string
  specialties?: string[]
  years_experience?: number
  license_number?: string
  insurance_number?: string
  auth_provider?: string
  work_mode?: string
  is_coordinator?: boolean
  subscription_plan?: string
}

const workModeOptions = [
  {
    value: "executor",
    label: "Ejecutor",
    description: "Realizas los trabajos directamente con tu equipo",
    icon: Hammer,
  },
  {
    value: "coordinator",
    label: "Coordinador",
    description: "Coordinas proyectos con otros profesionales/gremios (también puedes ejecutar)",
    icon: Users,
  },
]

const userTypeOptions = [
  {
    value: "professional",
    label: "Profesional",
    description: "Arquitecto, constructor, reformista",
    icon: Building2,
  },
  {
    value: "homeowner",
    label: "Propietario",
    description: "Propietario de vivienda",
    icon: User,
  },
]

const PAISES = [
  { code: "ES", name: "España", flag: "🇪🇸" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "PA", name: "Panamá", flag: "🇵🇦" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "DO", name: "República Dominicana", flag: "🇩🇴" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "PR", name: "Puerto Rico", flag: "🇵🇷" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "FR", name: "Francia", flag: "🇫🇷" },
  { code: "DE", name: "Alemania", flag: "🇩🇪" },
  { code: "IT", name: "Italia", flag: "🇮🇹" },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧" },
  { code: "OTHER", name: "Otro país", flag: "🌍" },
]

// Provincial lists are now managed in @/lib/utils/country-fields

export default function ProfileFormClient({ userData }: { userData: UserProfile }) {
  const [fullName, setFullName] = useState(userData.full_name || "")
  const [phoneNumber, setPhoneNumber] = useState(userData.phone_number || userData.phone?.replace("+34", "") || "")
  const [avatarUrl, setAvatarUrl] = useState(userData.avatar_url || "")
  const [province, setProvince] = useState(userData.province || userData.address_province || "")
  const rawCountry = userData.country || ""
  const [country, setCountry] = useState(rawCountry === "España" ? "ES" : rawCountry)
  const [workMode, setWorkMode] = useState(userData.work_mode || "executor")

  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Subscription state
  const [subscription, setSubscription] = useState<any>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true)

  const isProfessional = userData.user_type === "professional" || userData.user_type === "company"

  useEffect(() => {
    if (!isProfessional && !userData.country) {
      detectCountryByIP()
    }
  }, [isProfessional, userData.country])

  const countryProvinces = getProvincesForCountry(country) || []
  const hasProvinces = countryProvinces.length > 0
  const fieldLabels = getCountryFieldLabels(country)

  const detectCountryByIP = async () => {
    try {
      const response = await fetch("/api/geo")
      if (response.ok) {
        const data = await response.json()
        if (data.country && !country) {
          setCountry(data.country)
        }
      }
    } catch (error) {
      console.error("[v0] Error detecting country by IP:", error)
      // Fallback a España
      if (!country) setCountry("ES")
    }
  }

  useEffect(() => {
    if (isProfessional) {
      loadSubscription()
    }
  }, [isProfessional])

  useEffect(() => {
    const setupRealtimeListener = async () => {
      const supabase = await createClient()

      const channel = supabase
        .channel("profile-changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${userData.id}`,
          },
          (payload) => {
            console.log("[v0] Profile updated via webhook:", payload)

            if (payload.new.subscription_plan !== userData.subscription_plan) {
              const newPlan = payload.new.subscription_plan
              console.log("[v0] Plan changed to:", newPlan)

              toast({
                title: "Plan actualizado",
                description: `Tu plan ha sido actualizado a ${newPlan === "free" ? "Free" : newPlan === "basic" ? "Basic" : newPlan === "pro" ? "Pro" : "Business"}`,
              })

              // Reload subscription data
              if (isProfessional) {
                loadSubscription()
              }

              // Refresh the page data
              router.refresh()
            }
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    setupRealtimeListener()
  }, [userData.id, userData.subscription_plan, isProfessional, router, toast])

  const loadSubscription = async () => {
    try {
      const response = await fetch("/api/subscription/status")
      const data = await response.json()
      if (response.ok) {
        setSubscription(data)
      }
    } catch (error) {
      console.error("[v0] Error loading subscription:", error)
    } finally {
      setIsLoadingSubscription(false)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getUserTypeInfo = (type: string) => {
    return userTypeOptions.find((option) => option.value === type)
  }

  const getWorkModeInfo = (mode: string) => {
    return workModeOptions.find((option) => option.value === mode)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no puede superar 2MB",
        variant: "destructive",
      })
      return
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "El archivo debe ser una imagen",
        variant: "destructive",
      })
      return
    }

    setIsUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/profile/upload-avatar", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al subir imagen")
      }

      setAvatarUrl(data.avatar_url)
      toast({
        title: "Avatar actualizado",
        description: "Tu foto de perfil ha sido actualizada correctamente",
      })

      router.refresh()
    } catch (error: any) {
      console.error("[v0] Error subiendo avatar:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = await createClient()

      const updates: any = {
        full_name: fullName,
        avatar_url: avatarUrl,
        country: country,
      }

      if (workMode !== userData.work_mode) {
        updates.work_mode = workMode
        updates.is_coordinator = workMode === "coordinator"
      }

      if (isProfessional) {
        updates.address_province = province;
      }

      if (!isProfessional) {
        updates.phone = "+" + country + phoneNumber
        updates.country = country
        updates.address_province = province || "";
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: { name: fullName },
      })

      if (updateError) throw updateError

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userData.id,
        ...updates,
        updated_at: new Date().toISOString(),
      })

      if (profileError) throw profileError

      window.dispatchEvent(new CustomEvent("workModeChanged", { detail: { workMode } }))

      toast({
        title: "Perfil actualizado",
        description: "Tu información de perfil ha sido actualizada correctamente",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La nueva contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)

    try {
      const supabase = await createClient()

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email!,
        password: currentPassword,
      })

      if (signInError) {
        throw new Error("La contraseña actual es incorrecta")
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente",
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setShowPasswordSection(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar la contraseña",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const currentUserTypeInfo = getUserTypeInfo(userData.user_type)
  const currentWorkModeInfo = getWorkModeInfo(workMode)

  if (isProfessional) {
    return (
      <div className="space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
            <CardDescription>Tu imagen se mostrará en tu perfil público y propuestas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={avatarUrl || ""} alt={fullName} />
                  <AvatarFallback className="text-2xl bg-orange-100 text-orange-700">
                    {getInitials(fullName || userData.company_name || "Usuario")}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-10 w-10 rounded-full shadow-lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Haz clic en el icono de cámara para cambiar tu foto (máx. 2MB)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Info Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Información de Suscripción
            </CardTitle>
            <CardDescription>Tu plan actual y créditos disponibles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingSubscription ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">
                      Plan{" "}
                      {subscription?.plan === "free"
                        ? "Free"
                        : subscription?.plan === "basic"
                          ? "Basic"
                          : subscription?.plan === "professional" || subscription?.plan === "pro"
                            ? "Pro"
                            : subscription?.plan === "enterprise" || subscription?.plan === "business"
                              ? "Business"
                              : subscription?.plan || "Free"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {subscription?.credits_remaining !== undefined
                        ? `${subscription.credits_remaining} créditos disponibles`
                        : subscription?.current_period_end
                          ? `Renovación: ${new Date(subscription.current_period_end).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`
                          : "Sin información de créditos"}
                    </p>
                  </div>
                  <Badge
                    variant={subscription?.status === "active" ? "default" : "secondary"}
                    className={`text-sm px-3 py-1 ${subscription?.status === "active" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                  >
                    {subscription?.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </div>

                <div className="p-4 border rounded-lg bg-blue-50">
                  <p className="text-sm text-blue-900 mb-3">
                    Los créditos te permiten acceder a leads de clientes en tu zona.
                  </p>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href="/dashboard/ajustes?tab=subscription" className="flex items-center justify-center gap-2">
                      Gestionar Suscripción
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {userData.user_type === "professional" && <CreditPurchaseHistory />}

        {/* User Type Section */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Usuario</CardTitle>
            <CardDescription>Tu rol en la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
              {currentUserTypeInfo && (
                <>
                  <currentUserTypeInfo.icon className="h-6 w-6 text-orange-600" />
                  <div>
                    <div className="font-medium text-lg">{currentUserTypeInfo.label}</div>
                    <div className="text-sm text-muted-foreground">{currentUserTypeInfo.description}</div>
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              El tipo de usuario no se puede cambiar. Contacta con soporte si necesitas modificarlo.
            </p>
          </CardContent>
        </Card>

        {/* Work Mode Section - Only for professionals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Modo de Trabajo
            </CardTitle>
            <CardDescription>
              Define cómo trabajas: ejecutando obras directamente, coordinando gremios, o ambos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {workModeOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => setWorkMode(option.value)}
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${workMode === option.value
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  <div className={`p-2 rounded-lg ${workMode === option.value ? "bg-orange-100" : "bg-gray-100"}`}>
                    <option.icon
                      className={`h-5 w-5 ${workMode === option.value ? "text-orange-600" : "text-gray-500"}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${workMode === option.value ? "border-orange-500 bg-orange-500" : "border-gray-300"
                      }`}
                  >
                    {workMode === option.value && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              ))}
            </div>

            {workMode === "coordinator" && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Modo Coordinador activo:</strong> Tendrás acceso a la sección "Proyectos de Coordinación"
                  donde podrás gestionar proyectos con múltiples gremios, aplicar márgenes y generar presupuestos
                  consolidados.
                </p>
              </div>
            )}

            {isProfessional && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prof-province">{fieldLabels.province}</Label>
                    {hasProvinces ? (
                      <Select value={province} onValueChange={setProvince}>
                        <SelectTrigger id="prof-province">
                          <SelectValue placeholder="Selecciona tu provincia" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {countryProvinces.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="prof-province"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        placeholder="Escribe tu provincia"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleSubmit} disabled={isLoading} className="w-full bg-orange-600 hover:bg-orange-700">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Modo de Trabajo"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Seguridad
            </CardTitle>
            <CardDescription>Gestiona la seguridad de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Método de autenticación</Label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border">
                {userData.auth_provider === "google" ? (
                  <>
                    <Mail className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-medium">Google</div>
                      <div className="text-xs text-muted-foreground">Tu cuenta usa Google para iniciar sesión</div>
                    </div>
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-medium">Correo electrónico y contraseña</div>
                      <div className="text-xs text-muted-foreground">Usas una contraseña local para iniciar sesión</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {userData.auth_provider === "google" ? (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 font-medium mb-1">Cuenta vinculada con Google</p>
                <p className="text-sm text-blue-700">
                  Tu cuenta usa Google para autenticación. Para cambiar tu contraseña, debes hacerlo en tu cuenta de
                  Google.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {!showPasswordSection ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordSection(true)}
                    className="w-full"
                  >
                    Cambiar contraseña
                  </Button>
                ) : (
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Contraseña actual *</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Tu contraseña actual"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nueva contraseña *</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar nueva contraseña *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repite la nueva contraseña"
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowPasswordSection(false)
                          setCurrentPassword("")
                          setNewPassword("")
                          setConfirmPassword("")
                        }}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isChangingPassword} className="flex-1">
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cambiando...
                          </>
                        ) : (
                          "Cambiar contraseña"
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Account Section */}
        <DeleteAccountSection />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Estos datos se usarán automáticamente al crear proyectos. Tu teléfono se verificará cuando solicites
              presupuestos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || ""} alt={fullName} />
                  <AvatarFallback className="text-lg bg-orange-100 text-orange-700">
                    {getInitials(fullName || "Usuario")}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Haz clic en el icono de cámara para cambiar tu foto
              </p>
              {currentUserTypeInfo && (
                <Badge variant="secondary" className="flex items-center gap-2">
                  <currentUserTypeInfo.icon className="h-4 w-4 mr-2" />
                  {currentUserTypeInfo.label}
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" value={userData.email || ""} disabled className="bg-gray-50" />
                <p className="text-xs text-muted-foreground">
                  El correo electrónico no se puede cambiar y se usa para iniciar sesión
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border rounded-md text-sm">
                    {PAISES.find((pais) => pais.code === country)?.flag}
                    <span className="font-medium">+{country}</span>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
                    placeholder="666555444"
                    maxLength={9}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Tu teléfono se verificará cuando solicites presupuestos</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Selecciona tu país" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {PAISES.map((pais) => (
                      <SelectItem key={pais.code} value={pais.code}>
                        {pais.flag} {pais.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">{fieldLabels.province}</Label>
                {hasProvinces ? (
                  <Select value={province} onValueChange={setProvince}>
                    <SelectTrigger id="province">
                      <SelectValue placeholder="Selecciona tu provincia" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {countryProvinces.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="province"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Escribe tu provincia"
                  />
                )}
              </div>

              {country !== "ES" && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">El Marketplace de Presupuestos está disponible solo en España.</span>
                    <br />
                    <span className="text-blue-700">
                      Puedes usar todas las demás funciones de la plataforma sin restricciones.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Security Section for homeowners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Seguridad
          </CardTitle>
          <CardDescription>Gestiona la seguridad de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Método de autenticación</Label>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border">
              {userData.auth_provider === "google" ? (
                <>
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium">Google</div>
                    <div className="text-xs text-muted-foreground">Tu cuenta usa Google para iniciar sesión</div>
                  </div>
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium">Correo electrónico y contraseña</div>
                    <div className="text-xs text-muted-foreground">Usas una contraseña local para iniciar sesión</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {userData.auth_provider === "google" ? (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900 font-medium mb-1">Cuenta vinculada con Google</p>
              <p className="text-sm text-blue-700">
                Tu cuenta usa Google para autenticación. Para cambiar tu contraseña, debes hacerlo en tu cuenta de
                Google.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {!showPasswordSection ? (
                <Button type="button" variant="outline" onClick={() => setShowPasswordSection(true)} className="w-full">
                  Cambiar contraseña
                </Button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPasswordOwner">Contraseña actual *</Label>
                    <div className="relative">
                      <Input
                        id="currentPasswordOwner"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Tu contraseña actual"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPasswordOwner">Nueva contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="newPasswordOwner"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPasswordOwner">Confirmar nueva contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPasswordOwner"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite la nueva contraseña"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordSection(false)
                        setCurrentPassword("")
                        setNewPassword("")
                        setConfirmPassword("")
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isChangingPassword} className="flex-1">
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cambiando...
                        </>
                      ) : (
                        "Cambiar contraseña"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Account Section */}
      <DeleteAccountSection />
    </div>
  )
}
