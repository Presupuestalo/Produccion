"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<"request" | "update">("request")
  const router = useRouter()
  const searchParams = useSearchParams()

  // Verificar si hay un token en la URL
  useEffect(() => {
    const token = searchParams?.get("token")
    if (token) {
      setMode("update")
    }
  }, [searchParams])

  // Solicitar restablecimiento de contraseña
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://presupuestalo.com/auth/reset",
      })

      if (error) {
        throw error
      }

      setSuccess(true)
    } catch (error: any) {
      setError(error.message || "Error al enviar el email de recuperación")
    } finally {
      setIsLoading(false)
    }
  }

  // Actualizar contraseña
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

      setSuccess(true)
      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error: any) {
      setError(error.message || "Error al actualizar la contraseña")
    } finally {
      setIsLoading(false)
    }
  }

  // Renderizar formulario de solicitud de restablecimiento
  const renderRequestForm = () => {
    if (success) {
      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle className="text-green-700">Email Enviado</CardTitle>
            <CardDescription>Hemos enviado un enlace de recuperación a tu correo electrónico</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              Revisa tu bandeja de entrada y haz clic en el enlace para restablecer tu contraseña.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/auth/login" className="text-primary hover:underline">
              Volver al login
            </Link>
          </CardFooter>
        </Card>
      )
    }

    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Recuperar Contraseña</CardTitle>
          <CardDescription>Ingresa tu email para recibir un enlace de recuperación</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestReset} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
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
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar enlace de recuperación"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            ¿Recordaste tu contraseña?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Volver al login
            </Link>
          </p>
        </CardFooter>
      </Card>
    )
  }

  // Renderizar formulario de actualización de contraseña
  const renderUpdateForm = () => {
    if (success) {
      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle className="text-green-700">¡Contraseña Actualizada!</CardTitle>
            <CardDescription>Tu contraseña ha sido actualizada correctamente</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">Serás redirigido al dashboard en unos segundos...</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Nueva Contraseña</CardTitle>
          <CardDescription>Ingresa tu nueva contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar contraseña"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-orange-600"
              >
                <rect width="16" height="20" x="4" y="2" rx="2"></rect>
                <line x1="8" x2="16" y1="6" y2="6"></line>
                <line x1="16" x2="16" y1="14" y2="18"></line>
                <path d="M16 10h.01"></path>
                <path d="M12 10h.01"></path>
                <path d="M8 10h.01"></path>
                <path d="M12 14h.01"></path>
                <path d="M8 14h.01"></path>
                <path d="M12 18h.01"></path>
                <path d="M8 18h.01"></path>
              </svg>
              <span className="text-2xl font-bold text-gray-900">Presupuéstalo</span>
            </div>
          </div>
        </div>
        {mode === "request" ? renderRequestForm() : renderUpdateForm()}
      </div>
    </div>
  )
}
