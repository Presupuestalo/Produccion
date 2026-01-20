"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Phone, Send } from "lucide-react"

interface PhoneVerificationModalProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  onSuccess: (data: {
    email: string
    phone: string
    fullName: string
    verificationCode?: string
    acceptedTerms?: boolean
    acceptedPrivacy?: boolean
    acceptedMarketing?: boolean
  }) => void
  estimationData?: any
  userEmail?: string
  userName?: string
  userPhone?: string
  isLoggedIn?: boolean
}

export function PhoneVerificationModal({
  open,
  onOpenChange,
  onClose,
  onSuccess,
  estimationData,
  userEmail = "",
  userName = "",
  userPhone = "",
  isLoggedIn = false,
}: PhoneVerificationModalProps) {
  const [step, setStep] = useState<"info" | "verification">("info")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [fullName, setFullName] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [acceptMarketing, setAcceptMarketing] = useState(false)

  const [verificationCode, setVerificationCode] = useState("")
  const formattedPhoneRef = useRef<string>("")

  useEffect(() => {
    console.log("[v0] PhoneVerificationModal props:", { isLoggedIn, userEmail, userName, userPhone, open })
  }, [isLoggedIn, userEmail, userName, userPhone, open])

  useEffect(() => {
    if (isLoggedIn && userEmail) {
      console.log("[v0] Setting email from prop:", userEmail)
      setEmail(userEmail)
    }
  }, [isLoggedIn, userEmail])

  useEffect(() => {
    if (isLoggedIn && userName) {
      console.log("[v0] Setting fullName from prop:", userName)
      setFullName(userName)
    }
  }, [isLoggedIn, userName])

  useEffect(() => {
    if (isLoggedIn && userPhone) {
      console.log("[v0] Setting phone from prop:", userPhone)
      setPhone(userPhone)
    }
  }, [isLoggedIn, userPhone])

  useEffect(() => {
    if (isLoggedIn) {
      setAcceptTerms(true)
      setAcceptPrivacy(true)
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (open) {
      setStep("info")
      setError("")
      setVerificationCode("")
      formattedPhoneRef.current = ""

      if (!isLoggedIn) {
        setEmail("")
        setFullName("")
        setPhone("")
        setAcceptTerms(false)
        setAcceptPrivacy(false)
        setAcceptMarketing(false)
      }
    }
  }, [open, isLoggedIn])

  const handleSendSMS = async () => {
    setError("")

    console.log("[v0] Validating before sending SMS, isLoggedIn:", isLoggedIn, "email:", email, "phone:", phone)

    if (!email || !phone || !fullName) {
      setError("Por favor completa todos los campos")
      return
    }

    if (!isLoggedIn && (!acceptTerms || !acceptPrivacy)) {
      setError("Debes aceptar los términos y la política de privacidad")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email inválido")
      return
    }

    setLoading(true)

    try {
      if (!isLoggedIn) {
        console.log("[v0] User not logged in, checking if email exists...")
        const emailCheckResponse = await fetch("/api/validate-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), phone: phone.trim() }),
        })

        const emailCheckData = await emailCheckResponse.json()
        console.log("[v0] Validation response:", emailCheckResponse.status, emailCheckData)

        if (!emailCheckResponse.ok || emailCheckData.exists) {
          setError(emailCheckData.error || "Error al validar datos")
          setLoading(false)
          return
        }
      } else {
        console.log("[v0] User is logged in, skipping email validation")
      }

      let formattedPhone = phone.trim()
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+34" + formattedPhone.replace(/^0+/, "")
      }

      formattedPhoneRef.current = formattedPhone
      console.log("[v0] Sending SMS to:", formattedPhone)

      const smsEndpoint = isLoggedIn ? "/api/sms/send-verification" : "/api/sms/send-verification-public"
      console.log("[v0] Using SMS endpoint:", smsEndpoint)

      const response = await fetch(smsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar SMS")
      }

      console.log("[v0] SMS sent successfully")
      setStep("verification")
    } catch (err: any) {
      setError(err.message || "Error al enviar código")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setError("")

    const phoneToVerify = formattedPhoneRef.current
    console.log("[v0] Verifying code:", verificationCode, "for phone:", phoneToVerify)

    if (!verificationCode || verificationCode.length !== 6) {
      setError("Introduce el código de 6 dígitos")
      return
    }

    if (!phoneToVerify) {
      setError("Error: teléfono no encontrado. Vuelve a intentarlo.")
      return
    }

    setLoading(true)

    try {
      const verifyEndpoint = isLoggedIn ? "/api/sms/verify-code" : "/api/sms/verify-code-public"
      console.log("[v0] Using verify endpoint:", verifyEndpoint)

      const verifyResponse = await fetch(verifyEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneToVerify, code: verificationCode }),
      })

      const verifyData = await verifyResponse.json()
      console.log("[v0] Verify response:", verifyResponse.status, verifyData)

      if (!verifyResponse.ok || !verifyData.verified) {
        throw new Error(verifyData.error || "Código incorrecto")
      }

      console.log("[v0] SMS verification successful")

      onSuccess({
        email,
        phone: phoneToVerify,
        fullName,
        verificationCode,
        acceptedTerms: acceptTerms,
        acceptedPrivacy: acceptPrivacy,
        acceptedMarketing: acceptMarketing,
      })

      handleClose()
    } catch (err: any) {
      console.error("[v0] Verification error:", err)
      setError(err.message || "Error en la verificación")
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep("info")
    setVerificationCode("")
    setError("")
    formattedPhoneRef.current = ""

    if (!isLoggedIn) {
      setEmail("")
      setPhone("")
      setFullName("")
      setAcceptTerms(false)
      setAcceptPrivacy(false)
    }
    setAcceptMarketing(false)

    if (onOpenChange) onOpenChange(false)
    if (onClose) onClose()
  }

  const emailDisabled = isLoggedIn && !!userEmail
  const nameDisabled = isLoggedIn && !!userName

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{step === "info" ? "Solicitar Presupuestos" : "Verificar Teléfono"}</DialogTitle>
          <DialogDescription>
            {step === "info"
              ? isLoggedIn
                ? "Verifica tu teléfono para publicar tu solicitud en el Presmarket"
                : "Completa tus datos para publicar tu solicitud en el Presmarket"
              : `Introduce el código de 6 dígitos enviado a ${formattedPhoneRef.current}`}
          </DialogDescription>
        </DialogHeader>

        {step === "info" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Nombre completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan Pérez"
                disabled={nameDisabled}
                className={nameDisabled ? "bg-muted" : ""}
              />
            </div>

            {!emailDisabled ? (
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email de tu cuenta</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">
                Teléfono <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 612345678"
              />
              <p className="text-xs text-muted-foreground">Se enviará un SMS de verificación</p>
            </div>

            {!isLoggedIn && (
              <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  />
                  <label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                    Acepto los{" "}
                    <a href="/terminos" target="_blank" className="text-primary underline" rel="noreferrer">
                      términos y condiciones
                    </a>{" "}
                    <span className="text-red-500">*</span>
                  </label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={acceptPrivacy}
                    onCheckedChange={(checked) => setAcceptPrivacy(checked as boolean)}
                  />
                  <label htmlFor="privacy" className="text-sm leading-tight cursor-pointer">
                    Acepto la{" "}
                    <a href="/privacidad" target="_blank" className="text-primary underline" rel="noreferrer">
                      política de privacidad
                    </a>{" "}
                    <span className="text-red-500">*</span>
                  </label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="marketing"
                    checked={acceptMarketing}
                    onCheckedChange={(checked) => setAcceptMarketing(checked as boolean)}
                  />
                  <label htmlFor="marketing" className="text-sm leading-tight cursor-pointer">
                    Acepto recibir comunicaciones comerciales
                  </label>
                </div>
              </div>
            )}

            {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded">{error}</div>}

            <Button onClick={handleSendSMS} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar código SMS
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de verificación</Label>
              <Input
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
            </div>

            {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded">{error}</div>}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("info")} className="flex-1">
                Volver
              </Button>
              <Button onClick={handleVerify} disabled={loading || verificationCode.length !== 6} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-4 w-4" />
                    Verificar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
