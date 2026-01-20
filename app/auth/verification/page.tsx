"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, Calculator, Mail } from "lucide-react"
import Link from "next/link"

export default function VerificationPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "waiting">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        console.log("[v0] Iniciando verificación de email...")

        // Verificar si hay parámetros de confirmación en la URL
        const token_hash = searchParams.get("token_hash")
        const type = searchParams.get("type")
        const access_token = searchParams.get("access_token")
        const refresh_token = searchParams.get("refresh_token")

        console.log("[v0] Parámetros recibidos:", { token_hash, type, access_token, refresh_token })

        // Si hay tokens de acceso, usar esos para establecer la sesión
        if (access_token && refresh_token) {
          console.log("[v0] Estableciendo sesión con tokens...")
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          })

          if (error) {
            console.error("[v0] Error al establecer sesión:", error)
            setStatus("error")
            setMessage("Error al establecer la sesión")
            return
          }

          if (data.user) {
            console.log("[v0] Sesión establecida para:", data.user.email)
            setStatus("success")
            setMessage("¡Email verificado correctamente!")

            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("user_type")
              .eq("id", data.user.id)
              .single()

            if (profileError && profileError.code === "PGRST116") {
              console.log("[v0] Perfil no existe, creando...")
              await supabase.from("profiles").insert({
                id: data.user.id,
                email: data.user.email,
                updated_at: new Date().toISOString(),
              })
            }

            if (!profile || !profile.user_type) {
              console.log("[v0] Usuario sin tipo, redirigiendo a selección en 2 segundos...")
              setMessage("¡Email verificado! Redirigiendo a selección de tipo de usuario...")
              setTimeout(() => {
                router.push("/auth/select-user-type")
              }, 2000)
              return
            }

            console.log("[v0] Usuario con tipo:", profile.user_type, "- Redirigiendo al dashboard")
            setTimeout(() => {
              router.push("/dashboard")
            }, 1500)
            return
          }
        }

        // Si hay token_hash, usar verifyOtp
        if (token_hash && type === "email") {
          console.log("[v0] Verificando OTP con token_hash...")
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: "email",
          })

          if (error) {
            console.error("[v0] Error al verificar OTP:", error)
            setStatus("error")
            setMessage("Error al verificar el email. El enlace puede haber expirado.")
            return
          }

          if (data.user) {
            console.log("[v0] OTP verificado para:", data.user.email)
            setStatus("success")
            setMessage("¡Email verificado correctamente!")

            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("user_type")
              .eq("id", data.user.id)
              .single()

            if (profileError && profileError.code === "PGRST116") {
              console.log("[v0] Perfil no existe, creando...")
              await supabase.from("profiles").insert({
                id: data.user.id,
                email: data.user.email,
                updated_at: new Date().toISOString(),
              })
            }

            if (!profile || !profile.user_type) {
              console.log("[v0] Usuario sin tipo, redirigiendo a selección en 2 segundos...")
              setMessage("¡Email verificado! Redirigiendo a selección de tipo de usuario...")
              setTimeout(() => {
                router.push("/auth/select-user-type")
              }, 2000)
              return
            }

            console.log("[v0] Usuario con tipo:", profile.user_type, "- Redirigiendo al dashboard")
            setTimeout(() => {
              router.push("/dashboard")
            }, 1500)
            return
          }
        }

        // Si no hay parámetros de confirmación, mostrar página de espera
        if (!token_hash && !access_token) {
          console.log("[v0] No hay parámetros de confirmación, mostrando página de espera")
          setStatus("waiting")
          setMessage("Esperando confirmación de email")
          return
        }

        // Si llegamos aquí, algo salió mal
        console.log("[v0] Enlace de verificación inválido")
        setStatus("error")
        setMessage("Enlace de verificación inválido o expirado")
      } catch (error) {
        console.error("[v0] Error durante la verificación:", error)
        setStatus("error")
        setMessage("Error inesperado durante la verificación")
      }
    }

    handleEmailConfirmation()
  }, [searchParams, router])

  // Función para reenviar email de confirmación
  const resendConfirmation = async () => {
    try {
      const email = localStorage.getItem("pendingEmail")
      if (!email) {
        setMessage("No se encontró el email para reenviar")
        return
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      })

      if (error) {
        setMessage("Error al reenviar el email")
      } else {
        setMessage("Email de confirmación reenviado")
      }
    } catch (error) {
      setMessage("Error al reenviar el email")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calculator className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Presupuéstalo</span>
          </Link>
        </div>

        <Card>
          <CardContent className="p-6 text-center space-y-4">
            {status === "loading" && (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto" />
                <h1 className="text-xl font-semibold">Verificando tu email...</h1>
                <p className="text-gray-600">
                  Por favor espera mientras confirmamos tu dirección de correo electrónico.
                </p>
              </>
            )}

            {status === "waiting" && (
              <>
                <Mail className="w-12 h-12 text-blue-600 mx-auto" />
                <h1 className="text-xl font-semibold">Verifica tu correo electrónico</h1>
                <p className="text-gray-600">
                  Hemos enviado un enlace de verificación a tu correo electrónico. Por favor, revisa tu bandeja de
                  entrada y haz clic en el enlace para verificar tu cuenta.
                </p>
                <p className="text-sm text-gray-500">Si no has recibido el correo, revisa tu carpeta de spam.</p>
                <div className="space-y-2">
                  <Button onClick={resendConfirmation} variant="outline" className="w-full bg-transparent">
                    Reenviar email de confirmación
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/auth/login">Ir al Login</Link>
                  </Button>
                </div>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                <h1 className="text-xl font-semibold text-green-800">¡Email verificado!</h1>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500">Redirigiendo automáticamente...</p>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="w-12 h-12 text-red-600 mx-auto" />
                <h1 className="text-xl font-semibold text-red-800">Error de verificación</h1>
                <Alert variant="destructive">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Button onClick={resendConfirmation} variant="outline" className="w-full bg-transparent">
                    Reenviar email de confirmación
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/auth/login">Ir al Login</Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full bg-transparent">
                    <Link href="/auth/register">Registrarse de nuevo</Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {status === "success" && (
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Si no eres redirigido automáticamente,{" "}
              <Link href="/dashboard" className="text-orange-600 hover:underline">
                haz clic aquí
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
