import type { Metadata } from "next"
import { Suspense } from "react"
import { UnifiedAuthForm } from "@/components/auth/unified-auth-form"
import { Logo } from "@/components/ui/logo"
import { Home, TrendingUp, Clock } from "lucide-react"

export const metadata: Metadata = {
  title: "Iniciar Sesión | Presupuéstalo",
  description: "Inicia sesión en tu cuenta de Presupuéstalo",
}

function UnifiedAuthFormWrapper() {
  return <UnifiedAuthForm />
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-12 flex-col justify-between relative overflow-hidden">
        {/* Patrón de fondo decorativo suave */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-400 rounded-full blur-3xl"></div>
        </div>

        {/* Logo y título */}
        <div className="relative z-10">
          <div className="mb-8">
            <Logo size="lg" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Calcula presupuestos de reforma con precisión profesional
          </h1>
          <p className="text-gray-600 text-lg">
            La herramienta definitiva para profesionales y propietarios que quieren presupuestos detallados y precisos
          </p>
        </div>

        {/* Características destacadas */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Home className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold text-lg mb-1">Proyectos ilimitados</h3>
              <p className="text-gray-600">Crea y gestiona todos los presupuestos que necesites sin límites</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold text-lg mb-1">Cálculos precisos</h3>
              <p className="text-gray-600">Algoritmos especializados para cada tipo de reforma y materiales</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold text-lg mb-1">Ahorra tiempo</h3>
              <p className="text-gray-600">Genera presupuestos profesionales en minutos, no en horas</p>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-orange-200 shadow-sm">
          <p className="text-gray-700 text-sm italic mb-3">
            "Presupuéstalo ha transformado la manera en que calculamos nuestras reformas. Lo que antes tomaba horas,
            ahora lo hacemos en minutos."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold">JM</span>
            </div>
            <div>
              <div className="text-gray-900 font-semibold text-sm">Jorge Martínez</div>
              <div className="text-gray-600 text-xs">Arquitecto en Valencia</div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <Logo size="md" />
          </div>

          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            }
          >
            <UnifiedAuthFormWrapper />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
