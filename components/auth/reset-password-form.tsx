"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { translateAuthError } from "@/lib/utils/error-messages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle } from "lucide-react"

export function ResetPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://presupuestalo.com/auth/update-password",
      })

      if (error) {
        throw error
      }

      setSuccess(true)
    } catch (error: any) {
      const translatedError = translateAuthError(error.message || "Error al enviar el email de recuperación")
      setError(translatedError)
    } finally {
      setIsLoading(false)
    }
  }

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
        <form onSubmit={handleResetPassword} className="space-y-4">
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
