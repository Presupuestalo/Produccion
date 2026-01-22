"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Users, CheckCircle2, Phone, FileText, MapPin, Info } from "lucide-react"
import { PhoneInputWithCountry } from "@/components/shared/phone-input-with-country"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

const DIALOG_VERSION = "V10_DEBUG_LOCATION"

interface RequestQuotesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  budgetId?: string
  estimatedBudget: number
  children?: React.ReactNode
}

type DialogStep = "phone" | "verification" | "confirm" | "success"

const SPANISH_PROVINCES = [
  "Álava",
  "Albacete",
  "Alicante",
  "Almería",
  "Asturias",
  "Ávila",
  "Badajoz",
  "Baleares",
  "Barcelona",
  "Burgos",
  "Cáceres",
  "Cádiz",
  "Cantabria",
  "Castellón",
  "Ciudad Real",
  "Córdoba",
  "Cuenca",
  "Gerona",
  "Granada",
  "Guadalajara",
  "Guipúzcoa",
  "Huelva",
  "Huesca",
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

export function RequestQuotesDialog({
  open,
  onOpenChange,
  projectId,
  budgetId,
  estimatedBudget,
}: RequestQuotesDialogProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState<DialogStep>("confirm")
  const [phone, setPhone] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [additionalDetails, setAdditionalDetails] = useState("")
  const [fullName, setFullName] = useState("")
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [userCountry, setUserCountry] = useState<string>("ES")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [reformCity, setReformCity] = useState("")
  const [reformProvince, setReformProvince] = useState("")
  const [reformStreet, setReformStreet] = useState("")
  const [projectTitle, setProjectTitle] = useState("Proyecto de reforma")
  const [originalProfileName, setOriginalProfileName] = useState("")
  const [userId, setUserId] = useState<string | null>(null)


  useEffect(() => {
    console.log(`[v0] ########## REQUEST-QUOTES-DIALOG ${DIALOG_VERSION} MONTADO ##########`)
  }, [])

  useEffect(() => {
    if (open) {
      console.log(`[v0] DIALOG ABIERTO - ${DIALOG_VERSION}`)
      loadData()
    } else {
      setVerificationCode("")
      setIsLoading(true)
    }
  }, [open, projectId])

  const loadData = async () => {
    setIsLoading(true)
    console.log(`[v0] ${DIALOG_VERSION} - Iniciando carga de datos para proyecto:`, projectId)

    try {
      // 1. Obtener cliente y usuario actual
      const supabase = await createClient()
      if (!supabase) {
        console.error("[v0] No se pudo inicializar el cliente de Supabase")
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log("[v0] No hay usuario, mostrando paso phone")
        setStep("phone")
        setIsLoading(false)
        return
      }

      setUserId(user.id)
      console.log("[v0] Usuario:", user.id)

      // 2. Cargar perfil y proyecto en paralelo
      const [profileRes, projectRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("projects").select("title, street, city, province").eq("id", projectId).single(),
      ])

      console.log("[v0] === PROFILE RESPONSE ===")
      console.log("[v0] Data:", profileRes.data)
      console.log("[v0] Error:", profileRes.error)

      console.log("[v0] === PROJECT RESPONSE ===")
      console.log("[v0] Project data completo:", JSON.stringify(projectRes.data, null, 2))
      console.log("[v0] Project city:", projectRes.data?.city)
      console.log("[v0] Project province:", projectRes.data?.province)
      console.log("[v0] Error:", projectRes.error)

      const profile = profileRes.data
      const project = projectRes.data

      // 3. Cargar datos del proyecto
      if (project) {
        setProjectTitle(project.title || "Proyecto de reforma")

        console.log("[v0] === ANTES DE SETEAR CIUDAD/PROVINCIA ===")
        console.log(
          "[v0] project.city valor:",
          project.city,
          "| tipo:",
          typeof project.city,
          "| truthy:",
          !!project.city,
        )
        console.log(
          "[v0] project.province valor:",
          project.province,
          "| tipo:",
          typeof project.province,
          "| truthy:",
          !!project.province,
        )

        // Setear ciudad y provincia
        const cityValue = project.city || ""
        const provinceValue = project.province || ""
        const streetValue = project.street || ""

        console.log("[v0] Seteando ciudad:", cityValue)
        console.log("[v0] Seteando provincia:", provinceValue)
        console.log("[v0] Seteando calle (interna):", streetValue)

        setReformCity(cityValue)
        setReformProvince(provinceValue)
        setReformStreet(streetValue)

        console.log("[v0] === DESPUÉS DE SETEAR ===")
      } else {
        console.log("[v0] !!! NO HAY DATOS DE PROYECTO !!!")
      }

      // 4. Cargar nombre (prioridad: profile > user_metadata.name > email)
      let nombre = ""
      if (profile?.full_name) {
        nombre = profile.full_name.split(" ")[0] // Solo primer nombre
        console.log("[v0] Nombre desde profile:", nombre)
      } else if (user.user_metadata?.name) {
        nombre = String(user.user_metadata.name).split(" ")[0]
        console.log("[v0] Nombre desde user_metadata.name:", nombre)
      } else if (user.email) {
        nombre = user.email.split("@")[0]
        console.log("[v0] Nombre desde email:", nombre)
      }
      setFullName(nombre)
      setOriginalProfileName(nombre)

      // 5. Cargar teléfono
      if (profile?.phone) {
        console.log("[v0] Teléfono:", profile.phone)
        setPhone(profile.phone)
      }

      // 6. Verificar phone_verified
      const phoneVerifiedValue = profile?.phone_verified
      console.log("[v0] phone_verified valor:", phoneVerifiedValue, "| tipo:", typeof phoneVerifiedValue)

      // Comparar como boolean O como string
      const isVerified = phoneVerifiedValue === true || phoneVerifiedValue === "true" || phoneVerifiedValue === "TRUE"
      console.log("[v0] isVerified:", isVerified)
      setPhoneVerified(isVerified)

      // 7. Decidir paso inicial
      if (isVerified && profile?.phone) {
        console.log("[v0] >>> PASO: confirm (teléfono verificado)")
        setStep("confirm")
      } else {
        console.log("[v0] >>> PASO: phone (teléfono NO verificado)")
        setStep("phone")
      }

      // 8. País
      if (profile?.country) {
        setUserCountry(profile.country)
      }
    } catch (error) {
      console.error("[v0] Error cargando datos:", error)
      setStep("phone")
    } finally {
      setIsLoading(false)
    }
  }

  const sendVerification = async () => {
    if (!phone) {
      toast({ title: "Error", description: "Ingresa un número de teléfono", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const fullPhone = phone.startsWith("+") ? phone : `+${userCountry === "ES" ? "34" : userCountry}${phone}`

      const response = await fetch("/api/sms/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, country: userCountry }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Error al enviar verificación")

      setStep("verification")
      toast({ title: "Código enviado", description: "Te hemos enviado un SMS con el código" })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length < 4) {
      toast({ title: "Error", description: "Ingresa el código de verificación", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const fullPhone = phone.startsWith("+") ? phone : `+${userCountry === "ES" ? "34" : userCountry}${phone}`

      const response = await fetch("/api/sms/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, code: verificationCode }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Código incorrecto")

      setPhoneVerified(true)
      setStep("confirm")
      toast({ title: "Verificado", description: "Tu teléfono ha sido verificado correctamente" })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    console.log("[v0] handleSubmit iniciado")
    if (!reformCity.trim()) {
      console.log("[v0] Error: Ciudad vacía")
      toast({ title: "Error", description: "La ciudad es requerida", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      console.log("[v0] Preparando datos para el envío...")
      const fullPhone = phone.startsWith("+") ? phone : `+${userCountry === "ES" ? "34" : userCountry}${phone}`

      const payload = {
        projectId,
        budgetId,
        estimatedBudget,
        fullName: fullName.trim(),
        phone: fullPhone,
        reformStreet: reformStreet || "No especificada",
        reformCity: reformCity.trim(),
        reformProvince: reformProvince || reformCity,
        reformCountry: "España",
        additionalDetails,
      }

      console.log("[v0] Enviando solicitud a /api/leads/publish:", payload)

      const response = await fetch("/api/leads/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("[v0] Respuesta recibida, status:", response.status)
      const data = await response.json()
      console.log("[v0] Cuerpo de respuesta:", data)

      if (!response.ok) {
        throw new Error(data.error || "Error al publicar")
      }

      console.log("[v0] Publicación exitosa!")
      setStep("success")
      toast({ title: "Publicado", description: "Tu solicitud ha sido publicada" })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    if (step === "success") {
      router.push("/dashboard/mis-solicitudes")
    }
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Cargando...</DialogTitle>
            <DialogDescription className="sr-only">Estamos preparando tu solicitud</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" />
            Solicitar Presupuestos
          </DialogTitle>
          <DialogDescription>
            Hasta 3 empresas verificadas podrán acceder a tu presupuesto y enviarte ofertas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {step === "phone" && (
            <div className="space-y-4 pb-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Necesitamos verificar tu teléfono para que las empresas puedan contactarte.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Teléfono</Label>
                <PhoneInputWithCountry
                  value={phone}
                  onChange={setPhone}
                  defaultCountry={userCountry}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={sendVerification}
                  disabled={isSubmitting}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar código
                </Button>
              </div>
            </div>
          )}

          {step === "verification" && (
            <div className="space-y-4 pb-4">
              <Alert>
                <Phone className="h-4 w-4" />
                <AlertDescription>Hemos enviado un código de verificación al {phone}</AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Código de verificación</Label>
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Introduce el código"
                  maxLength={6}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep("phone")}>
                  Volver
                </Button>
                <Button onClick={verifyCode} disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verificar
                </Button>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-4 pb-4">
              {/* Resumen del proyecto */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4 text-orange-500" />
                  Resumen del proyecto
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Proyecto:</span>
                  <span className="font-medium">{projectTitle}</span>
                </div>
                <div className="flex justify-between items-baseline text-sm">
                  <span className="text-gray-500">Presupuesto estimado:</span>
                  <div className="text-right">
                    <span className="font-medium text-orange-600">
                      {estimatedBudget.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                    </span>
                    <span className="block text-[10px] text-gray-400 font-normal -mt-0.5">
                      (impuestos no incluidos)
                    </span>
                  </div>
                </div>
              </div>

              {/* Datos de contacto */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <Phone className="h-4 w-4 text-orange-500" />
                  Tus datos de contacto
                </div>

                {/* Nombre como solo lectura */}
                <div className="flex items-center justify-between text-sm bg-white rounded p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Nombre:</span>
                    <span className="font-medium">{fullName || "Sin nombre"}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Si necesitas cambiar tu nombre, puedes hacerlo desde tu perfil en Ajustes.
                </p>

                <div className="flex items-center gap-2 text-sm bg-white rounded p-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{phone || "Sin teléfono"}</span>
                  {phoneVerified ? (
                    <span className="flex items-center text-green-600 text-xs ml-auto">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verificado
                    </span>
                  ) : (
                    <Button
                      variant="link"
                      size="sm"
                      className="ml-auto text-orange-500 p-0 h-auto"
                      onClick={() => setStep("phone")}
                    >
                      Verificar teléfono
                    </Button>
                  )}
                </div>
              </div>

              {/* Ubicación */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  Ubicación de la reforma
                </div>

                <div className="flex items-center gap-2 text-sm bg-white rounded p-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">
                    {reformCity && reformProvince
                      ? `${reformCity}, ${reformProvince}`
                      : reformCity || reformProvince || "Sin ubicación definida"}
                  </span>
                </div>

                {!reformCity && !reformProvince && (
                  <p className="text-xs text-gray-500">
                    La ubicación se obtiene de los datos del proyecto. Puedes editarla en la configuración del proyecto.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Comentarios adicionales (opcional)</Label>
                <Textarea
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  placeholder="¿Algo más que quieras que sepan los profesionales?"
                  rows={3}
                  className="resize-none focus-visible:ring-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !reformCity.trim() || !phoneVerified}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Users className="mr-2 h-4 w-4" />
                  Publicar solicitud
                </Button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">¡Solicitud publicada!</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Las empresas verificadas ya pueden ver tu solicitud y enviarte ofertas.
                </p>
              </div>
              <div className="flex justify-center pt-4">
                <Button onClick={handleClose} className="bg-orange-500 hover:bg-orange-600">
                  Ver mis solicitudes
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
