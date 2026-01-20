"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase/client"
import { Building2, User, RefreshCw } from "lucide-react"

const userTypes = [
  {
    id: "professional",
    title: "Profesional",
    description: "Arquitecto, constructor, reformista",
    icon: Building2,
    features: ["Gestión de múltiples proyectos", "Herramientas profesionales", "Reportes avanzados"],
    recommended: true,
  },
  {
    id: "homeowner",
    title: "Propietario",
    description: "Propietario de vivienda",
    icon: User,
    features: ["Calculadora básica", "Gestión personal", "Presupuestos simples"],
    recommended: false,
  },
]

export function UserTypeSelector() {
  const [selectedType, setSelectedType] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string>("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isCheckingExisting, setIsCheckingExisting] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUserType()
  }, [])

  const checkUserType = async () => {
    try {
      console.log("🔍 UserTypeSelector: Verificando usuario...")
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log("❌ No hay usuario, redirigiendo al login")
        router.push("/auth/login")
        return
      }

      setCurrentUser(user)
      console.log("👤 Usuario encontrado:", user.id)

      const { data: profile, error } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

      if (error) {
        console.log("❌ Error al verificar perfil:", error)
        if (error.message.includes("column") && error.message.includes("user_type")) {
          console.log("🔧 Columna user_type no existe, mostrando setup")
          setShowSetup(true)
          setIsCheckingExisting(false)
          return
        }
        console.error("Error inesperado:", error)
        setIsCheckingExisting(false)
        return
      }

      if (profile?.user_type) {
        console.log("✅ Usuario ya tiene tipo:", profile.user_type, "- Redirigiendo al dashboard")
        router.push("/dashboard")
        return
      }

      console.log("🚫 Usuario sin tipo, mostrando selector")
      setIsCheckingExisting(false)
    } catch (error) {
      console.error("💥 Error en checkUserType:", error)
      setShowSetup(true)
      setIsCheckingExisting(false)
    }
  }

  const handleSelectTypeDirectly = async (typeId: string) => {
    if (!currentUser) return

    console.log("💾 Guardando tipo de usuario:", typeId)
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/test-user-type-column", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.id,
          userType: typeId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error && data.error.includes("column") && data.error.includes("user_type")) {
          console.log("🔧 Error de columna, mostrando setup")
          setShowSetup(true)
          return
        }
        throw new Error(data.error || "Error al guardar el tipo de usuario")
      }

      console.log("✅ Tipo de usuario guardado correctamente")
      setIsSuccess(true)

      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error: any) {
      console.error("❌ Error setting user type:", error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">¿Cuál es tu perfil?</CardTitle>
          <CardDescription>
            Selecciona el tipo de usuario que mejor te describa para personalizar tu experiencia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {userTypes.map((type) => {
              const Icon = type.icon
              return (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedType === type.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                  } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={() => {
                    console.log("🎯 Tipo seleccionado:", type.id)
                    setSelectedType(type.id)
                    setError("")
                    handleSelectTypeDirectly(type.id)
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <Icon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{type.title}</h3>
                          {type.recommended && <Badge variant="secondary">Recomendado</Badge>}
                        </div>
                        <p className="text-gray-600 mb-3">{type.description}</p>
                        <ul className="space-y-1">
                          {type.features.map((feature, index) => (
                            <li key={index} className="text-sm text-gray-500 flex items-center">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Separator />

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">Error: {error}</div>}

          {isLoading && (
            <div className="text-center py-4">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">Guardando selección...</p>
            </div>
          )}

          {isSuccess && (
            <div className="text-center py-4">
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                ¡Perfil configurado! Redirigiendo al dashboard...
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
