"use client"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle2, Phone, AlertCircle } from "lucide-react"
import { PhoneInputWithCountry } from "@/components/shared/phone-input-with-country"

interface LandingPhoneVerificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: (data: {
    email: string
    fullName: string
    phone: string
    acceptedTerms: boolean
    acceptedPrivacy: boolean
    acceptedMarketing: boolean
  }) => void
  defaultEmail?: string
  defaultFullName?: string
}

type ModalStep = "form" | "verification"

export function LandingPhoneVerificationModal({
  open,
  onOpenChange,
  onVerified,
  defaultEmail = "",
  defaultFullName = "",
}: LandingPhoneVerificationModalProps) {
  const [step, setStep] = useState<ModalStep>("form")
  const [email, setEmail] = useState(defaultEmail)
  const [fullName, setFullName] = useState(defaultFullName)
  const [phone, setPhone] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [acceptedMarketing, setAcceptedMarketing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { toast } = useToast()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!email.trim() || !email.includes("@")) {
      newErrors.email = "Email válido es requerido"
    }
    if (!fullName.trim()) {
      newErrors.fullName = "Nombre completo es requerido"
    }
    if (!phone || phone.length < 9) {
      newErrors.phone = "Número de teléfono válido es requerido"
    }
    if (!acceptedTerms) {
      newErrors.terms = "Debes aceptar los términos y condiciones"
    }
    if (!acceptedPrivacy) {
      newErrors.privacy = "Debes aceptar la política de privacidad"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const sendVerification = async () => {
    if (!validateForm()) {
      toast({
        title: "Campos requeridos",
        description: "Completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/sms/send-verification-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (data.success) {
        setStep("verification")
        toast({ title: "Código enviado", description: "Revisa tu teléfono" })
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al enviar código",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al enviar código", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Introduce el código de 6 dígitos",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/sms/verify-code-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: verificationCode }),
      })

      const data = await response.json()

      if (response.ok && data.verified) {
        toast({ title: "Verificado", description: "Tu número ha sido verificado" })
        onVerified({
          email,
          fullName,
          phone,
          acceptedTerms,
          acceptedPrivacy,
          acceptedMarketing,
        })
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: data.error || "Código incorrecto",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al verificar", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep("form")
    setVerificationCode("")
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-orange-500" />
            Solicitar Presupuestos
          </DialogTitle>
          <DialogDescription>
            Verifica tu teléfono para publicar tu solicitud y recibir hasta 3 presupuestos de empresas verificadas.
          </DialogDescription>
        </DialogHeader>

        {/* Form Step */}
        {step === "form" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrors({ ...errors, email: "" })
                }}
                placeholder="tu@email.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label>Nombre completo *</Label>
              <Input
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  setErrors({ ...errors, fullName: "" })
                }}
                placeholder="Juan Pérez"
                className={errors.fullName ? "border-red-500" : ""}
              />
              {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label>Número de teléfono *</Label>
              <PhoneInputWithCountry
                value={phone}
                onChange={(value) => {
                  setPhone(value)
                  setErrors({ ...errors, phone: "" })
                }}
                defaultCountry="ES"
                placeholder="612345678"
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              <p className="text-xs text-muted-foreground">Las empresas te contactarán en las próximas 48 horas</p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => {
                    setAcceptedTerms(checked as boolean)
                    setErrors({ ...errors, terms: "" })
                  }}
                  className={errors.terms ? "border-red-500" : ""}
                />
                <label htmlFor="terms" className="text-sm leading-none cursor-pointer">
                  Acepto los{" "}
                  <a href="/terminos" target="_blank" className="underline text-orange-600" rel="noreferrer">
                    términos y condiciones
                  </a>{" "}
                  *
                </label>
              </div>
              {errors.terms && <p className="text-sm text-red-500 ml-6">{errors.terms}</p>}

              <div className="flex items-start gap-2">
                <Checkbox
                  id="privacy"
                  checked={acceptedPrivacy}
                  onCheckedChange={(checked) => {
                    setAcceptedPrivacy(checked as boolean)
                    setErrors({ ...errors, privacy: "" })
                  }}
                  className={errors.privacy ? "border-red-500" : ""}
                />
                <label htmlFor="privacy" className="text-sm leading-none cursor-pointer">
                  Acepto la{" "}
                  <a href="/privacidad" target="_blank" className="underline text-orange-600" rel="noreferrer">
                    política de privacidad
                  </a>{" "}
                  *
                </label>
              </div>
              {errors.privacy && <p className="text-sm text-red-500 ml-6">{errors.privacy}</p>}

              <div className="flex items-start gap-2">
                <Checkbox
                  id="marketing"
                  checked={acceptedMarketing}
                  onCheckedChange={(checked) => setAcceptedMarketing(checked as boolean)}
                />
                <label htmlFor="marketing" className="text-sm leading-none cursor-pointer">
                  Acepto recibir comunicaciones y ofertas (opcional)
                </label>
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                Al continuar, verificaremos tu número y crearemos una cuenta gratuita para que puedas gestionar tu
                solicitud.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={sendVerification} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                Enviar código
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Verification Step */}
        {step === "verification" && (
          <div className="space-y-4 py-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800">
                Hemos enviado un código de 6 dígitos a <strong>{phone}</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Código de verificación *</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-sm text-muted-foreground text-center">Introduce el código de 6 dígitos</p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("form")} disabled={isSubmitting}>
                Volver
              </Button>
              <Button onClick={verifyCode} disabled={isSubmitting || verificationCode.length !== 6}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Verificar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
