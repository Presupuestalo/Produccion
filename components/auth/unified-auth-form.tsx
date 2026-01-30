"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { getSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Gift, CheckCircle } from "lucide-react"
import { translateAuthError } from "@/lib/utils/error-messages"
import { GoogleAuthButton } from "./google-auth-button"
import { Separator } from "@/components/ui/separator"
import { OTPInput } from "@/components/auth/otp-input"

type Mode = "login" | "register"

export function UnifiedAuthForm() {
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [devMode, setDevMode] = useState(false)
  const [devCodeDisplay, setDevCodeDisplay] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [redirectPath, setRedirectPath] = useState("/dashboard")
  const [sessionExpired, setSessionExpired] = useState(false)
  const pendingPlan = searchParams?.get("pendingPlan")
  const billingType = searchParams?.get("billingType") || "monthly"

  const [referralCode, setReferralCode] = useState("")
  const [referralValid, setReferralValid] = useState<boolean | null>(null)
  const [referralReferrer, setReferralReferrer] = useState<string | null>(null)
  const [validatingReferral, setValidatingReferral] = useState(false)

  useEffect(() => {
    const redirect = searchParams?.get("redirect")
    if (redirect) {
      setRedirectPath(redirect)
    }
    const expired = searchParams?.get("session_expired")
    if (expired === "true") {
      setSessionExpired(true)
    }
    const ref = searchParams?.get("ref")
    if (ref) {
      setReferralCode(ref)
      setMode("register")
      validateReferralCode(ref)
    }
  }, [searchParams])

  const validateReferralCode = async (code: string) => {
    if (!code || code.length < 4) {
      setReferralValid(null)
      setReferralReferrer(null)
      return
    }

    setValidatingReferral(true)
    try {
      const response = await fetch("/api/referrals/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (data.valid) {
        setReferralValid(true)
        setReferralReferrer(data.referrerName)
      } else {
        setReferralValid(false)
        setReferralReferrer(null)
      }
    } catch (error) {
      setReferralValid(false)
      setReferralReferrer(null)
    } finally {
      setValidatingReferral(false)
    }
  }

  const getRedirectUrl = (basePath: string) => {
    if (pendingPlan) {
      const separator = basePath.includes("?") ? "&" : "?"
      return `${basePath}${separator}pendingPlan=${pendingPlan}&billingType=${billingType}`
    }
    return basePath
  }

  const isEmailFormat = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(text)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSessionExpired(false)

    try {
      const supabase = await getSupabase()

      if (!supabase) {
        throw new Error("El servicio de autenticación no está disponible en este momento")
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data.session) {
        router.push(getRedirectUrl(redirectPath))
      } else {
        throw new Error("No se pudo crear la sesión")
      }
    } catch (error: any) {
      setError(translateAuthError(error.message) || "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!acceptPrivacy || !acceptTerms) {
      setError("Debes aceptar la Política de Privacidad y el Aviso Legal para continuar")
      setIsLoading(false)
      return
    }

    if (isEmailFormat(name)) {
      setError("Por favor, introduce tu nombre real, no tu email")
      setIsLoading(false)
      return
    }

    if (name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const codeResponse = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      })

      const codeData = await codeResponse.json()

      if (!codeResponse.ok) {
        throw new Error(codeData.error || "Error al enviar código de verificación")
      }

      if (codeData.devMode && codeData.code) {
        setDevMode(true)
        setDevCodeDisplay(codeData.code)
      }

      localStorage.setItem(
        "pendingRegistration",
        JSON.stringify({
          email,
          password,
          name,
          referralCode: referralValid ? referralCode : null,
        }),
      )

      setShowVerification(true)
    } catch (error: any) {
      setError(error.message || "Error al enviar código de verificación")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPComplete = async (code: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const pendingData = localStorage.getItem("pendingRegistration")
      const savedReferralCode = pendingData ? JSON.parse(pendingData).referralCode : null

      const verifyResponse = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          password,
          name,
          referralCode: savedReferralCode, // Enviar código de referido
        }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok) {
        let errorMessage = verifyData.error || "Código inválido o expirado"

        if (errorMessage.includes("already been registered") || errorMessage.includes("already exists")) {
          errorMessage =
            "Este email ya está registrado. Si te registraste con Google, intenta iniciar sesión con tu cuenta de Gmail."
        } else if (errorMessage.includes("Invalid") || errorMessage.includes("invalid")) {
          errorMessage = "Código inválido o expirado"
        } else if (errorMessage.includes("expired")) {
          errorMessage = "El código ha expirado. Por favor, solicita uno nuevo."
        }

        throw new Error(errorMessage)
      }

      const supabase = await getSupabase()

      if (!supabase) {
        throw new Error("El servicio de autenticación no está disponible")
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      localStorage.removeItem("pendingRegistration")

      fetch("/api/auth/notify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      }).catch(console.error)

      router.push(getRedirectUrl("/auth/select-user-type"))
    } catch (error: any) {
      setError(error.message || "Error al verificar código")
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const codeResponse = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      })

      const codeData = await codeResponse.json()

      if (!codeResponse.ok) {
        throw new Error(codeData.error || "Error al reenviar el código")
      }

      if (codeData.devMode && codeData.code) {
        setDevMode(true)
        setDevCodeDisplay(codeData.code)
      }

      setVerificationCode("")
      alert("Código reenviado correctamente")
    } catch (error: any) {
      setError(error.message || "Error al reenviar el código")
    } finally {
      setIsLoading(false)
    }
  }

  if (showVerification) {
    return (
      <Card className="w-full border-gray-200 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Verifica tu email</CardTitle>
          <CardDescription className="text-base">
            {devMode ? (
              <>
                <strong>Modo Desarrollo:</strong> El código se muestra abajo porque el servicio de email tiene
                restricciones.
              </>
            ) : (
              <>
                Hemos enviado un código de 6 dígitos a <strong className="text-gray-900">{email}</strong>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {devMode && devCodeDisplay && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-center">
                <div className="text-sm font-medium text-blue-900 mb-2">Tu código de verificación es:</div>
                <div className="text-3xl font-bold text-blue-600 tracking-widest font-mono">{devCodeDisplay}</div>
                <div className="text-xs text-blue-700 mt-2">
                  Este código se muestra solo en desarrollo. En producción se enviará por email.
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Label className="text-center block text-base">Código de verificación</Label>
            <OTPInput
              value={verificationCode}
              onChange={setVerificationCode}
              onComplete={handleOTPComplete}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground text-center">
              {isLoading
                ? "Verificando código..."
                : `Introduce el código de 6 dígitos${devMode ? " mostrado arriba" : " que te enviamos"}`}
            </p>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleResendCode}
              disabled={isLoading}
            >
              {devMode ? "Generar nuevo código" : "Reenviar código"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setShowVerification(false)
                setVerificationCode("")
                setError(null)
              }}
              disabled={isLoading}
            >
              Volver
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verificando código...</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border-gray-200 shadow-sm">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold">{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</CardTitle>
        <CardDescription className="text-base">
          {pendingPlan ? (
            <>
              Accede para activar el Plan <span className="font-semibold capitalize">{pendingPlan}</span>
            </>
          ) : mode === "login" ? (
            "Accede a tu cuenta para gestionar tus presupuestos"
          ) : (
            "Únete a miles de profesionales que ya usan Presupuéstalo"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessionExpired && mode === "login" && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-900">
              Tu sesión ha expirado porque iniciaste sesión desde otro dispositivo. Por seguridad, solo se permite una
              sesión activa a la vez.
            </AlertDescription>
          </Alert>
        )}

        {mode === "register" && referralValid && referralReferrer && (
          <Alert className="bg-green-50 border-green-200">
            <Gift className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <span className="font-medium">¡Código de referido válido!</span> Referido por{" "}
              <strong>{referralReferrer}</strong>. Recibirás créditos gratis al contratar un plan.
            </AlertDescription>
          </Alert>
        )}

        <GoogleAuthButton mode={mode} redirectPath={getRedirectUrl(redirectPath)} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">O continúa con email</span>
          </div>
        </div>

        <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error}
                {mode === "register" && (error.includes("ya está registrado") || error.includes("Gmail")) && (
                  <div className="mt-2 pt-2 border-t border-red-200">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login")
                        setError(null)
                      }}
                      className="text-sm font-medium underline hover:no-underline"
                    >
                      Ir a iniciar sesión →
                    </button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                placeholder="Ej: Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                className="h-11"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            {mode === "login" && (
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link href="/auth/reset-password" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}
            {mode === "register" && <Label htmlFor="password">Contraseña</Label>}
            <Input
              id="password"
              type="password"
              placeholder={mode === "register" ? "Mínimo 6 caracteres" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "register" ? 6 : undefined}
              className="h-11"
            />
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="referral" className="flex items-center gap-2">
                Código de referido <span className="text-xs text-muted-foreground">(opcional)</span>
              </Label>
              <div className="relative">
                <Input
                  id="referral"
                  placeholder="Ej: REF_ABC123"
                  value={referralCode}
                  onChange={(e) => {
                    setReferralCode(e.target.value.toUpperCase())
                    if (e.target.value.length >= 4) {
                      validateReferralCode(e.target.value)
                    } else {
                      setReferralValid(null)
                    }
                  }}
                  className={`h-11 pr-10 ${referralValid === true
                      ? "border-green-500 focus-visible:ring-green-500"
                      : referralValid === false
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                />
                {validatingReferral && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!validatingReferral && referralValid === true && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
              {referralValid === false && referralCode.length >= 4 && (
                <p className="text-xs text-red-500">Código no válido o expirado</p>
              )}
            </div>
          )}

          {mode === "register" && (
            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="privacy"
                  checked={acceptPrivacy}
                  onCheckedChange={(checked) => setAcceptPrivacy(checked as boolean)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="privacy"
                  className="text-sm leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  He leído y acepto la{" "}
                  <Link
                    href="/politica-privacidad"
                    target="_blank"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Política de Privacidad
                  </Link>
                  <span className="text-red-500 ml-1">*</span>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="terms"
                  className="text-sm leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  He leído y acepto el{" "}
                  <Link href="/aviso-legal" target="_blank" className="text-blue-600 hover:underline font-medium">
                    Aviso Legal
                  </Link>{" "}
                  y la{" "}
                  <Link href="/politica-cookies" target="_blank" className="text-blue-600 hover:underline font-medium">
                    Política de Cookies
                  </Link>
                  <span className="text-red-500 ml-1">*</span>
                </label>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "login" ? "Iniciando sesión..." : "Enviando código..."}
              </>
            ) : mode === "login" ? (
              "Iniciar sesión"
            ) : (
              "Crear cuenta"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-6">
        <p className="text-sm text-muted-foreground">
          {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login")
              setError(null)
            }}
            className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
          >
            {mode === "login" ? "Créala aquí" : "Inicia sesión"}
          </button>
        </p>
      </CardFooter>
    </Card>
  )
}
