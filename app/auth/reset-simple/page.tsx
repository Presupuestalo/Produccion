"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

export default function ResetSimplePage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [email, setEmail] = useState("")
  const [mode, setMode] = useState<"request" | "update">("request")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Verificar si hay parámetros de recuperación en la URL
    const type = searchParams?.get("type")
    if (type === "recovery") {
      setMode("update")
    }
  }, [searchParams])

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-simple?type=recovery`,
      })

      if (error) throw error

      setMessage({
        type: "success",
        text: "Se ha enviado un enlace de recuperación a tu correo electrónico.",
      })
    } catch (error: any) {
      console.error("Error requesting password reset:", error)
      setMessage({
        type: "error",
        text: error.message || "Error al solicitar el restablecimiento de contraseña.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    if (password !== confirmPassword) {
      setMessage({
        type: "error",
        text: "Las contraseñas no coinciden.",
      })
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setMessage({
        type: "error",
        text: "La contraseña debe tener al menos 6 caracteres.",
      })
      setIsLoading(false)
      return
    }

    try {
      console.log("Actualizando contraseña...")
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      })

      console.log("Respuesta:", { data, error })

      if (error) throw error

      setMessage({
        type: "success",
        text: "Contraseña actualizada correctamente. Redirigiendo...",
      })

      // Esperar 2 segundos antes de redirigir
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    } catch (error: any) {
      console.error("Error updating password:", error)
      setMessage({
        type: "error",
        text: error.message || "Error al actualizar la contraseña.",
      })
    } finally {
      setIsLoading(false)
    }
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
          <h2 className="text-3xl font-extrabold text-gray-900">
            {mode === "request" ? "Recuperar Contraseña" : "Nueva Contraseña"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === "request"
              ? "Ingresa tu correo electrónico para recibir un enlace de recuperación"
              : "Ingresa tu nueva contraseña para completar el proceso"}
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-md ${
              message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {mode === "request" ? (
          <form onSubmit={handleRequestReset} className="mt-8 space-y-6">
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Correo electrónico
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword} className="mt-8 space-y-6">
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="mb-4">
                <label htmlFor="password" className="sr-only">
                  Nueva contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  Confirmar contraseña
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                {isLoading ? "Actualizando..." : "Actualizar contraseña"}
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-4">
          <a href="/auth/login" className="font-medium text-orange-600 hover:text-orange-500">
            Volver al inicio de sesión
          </a>
        </div>
      </div>
    </div>
  )
}
