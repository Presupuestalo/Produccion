"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, Building2, Loader2 } from "lucide-react"

export function UserTypeSelection() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleUserTypeSelection = async (userType: "individual" | "company") => {
    setIsLoading(true)
    setError(null)

    try {
      // Guardar la selección en localStorage temporalmente
      localStorage.setItem("pendingUserType", userType)

      router.push(`/auth/verification?userType=${userType}`)
    } catch (error: any) {
      setError(error.message || "Error al procesar la selección")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Título y descripción */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">¡Bienvenido a Presupuéstalo!</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Para personalizar tu experiencia, cuéntanos qué tipo de usuario eres
        </p>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Opciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Opción Individual */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-orange-300">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center mx-auto">
              <Home className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-gray-900">Persona Individual</h3>
              <p className="text-gray-600">Quiero reformar mi propia casa o piso y necesito calcular presupuestos</p>
            </div>

            <div className="space-y-2 text-sm text-gray-500">
              <p>• Calculadora simplificada</p>
              <p>• Presupuestos básicos</p>
              <p>• Interfaz intuitiva</p>
            </div>

            <Button
              onClick={() => handleUserTypeSelection("individual")}
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Seleccionar
            </Button>
          </CardContent>
        </Card>

        {/* Opción Empresa */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-gray-900">Empresa</h3>
              <p className="text-gray-600">Soy una empresa de reformas y necesito herramientas profesionales</p>
            </div>

            <div className="space-y-2 text-sm text-gray-500">
              <p>• Herramientas avanzadas</p>
              <p>• Gestión de clientes</p>
              <p>• Reportes detallados</p>
            </div>

            <Button
              onClick={() => handleUserTypeSelection("company")}
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Seleccionar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Nota final */}
      <div className="text-center">
        <p className="text-gray-500">Podrás cambiar esta configuración más tarde en tu perfil</p>
      </div>
    </div>
  )
}
