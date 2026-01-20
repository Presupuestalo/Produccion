import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Construction, ArrowLeft, Zap } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Cálculo Orientativo | Presupuéstalo",
  description: "Calculadora orientativa para reformas",
}

export default function CalculoOrientativoPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Cálculo Orientativo</h1>
          <p className="text-gray-600 mt-2">Obtén una estimación rápida del coste de tu reforma</p>
        </div>

        {/* En construcción */}
        <Card className="text-center">
          <CardHeader>
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Construction className="w-12 h-12 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl">¡Estamos trabajando en esto!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <p className="text-xl text-gray-600">La calculadora orientativa estará disponible muy pronto.</p>
              <p className="text-gray-500">Esta herramienta te permitirá obtener estimaciones rápidas basadas en:</p>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <Zap className="w-8 h-8 text-orange-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">Cálculo Rápido</h3>
                  <p className="text-sm text-gray-600">Estimaciones en segundos</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <Zap className="w-8 h-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">Parámetros Básicos</h3>
                  <p className="text-sm text-gray-600">Solo los datos esenciales</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline">
                <Link href="/dashboard">Volver al Dashboard</Link>
              </Button>

              <Button asChild>
                <Link href="/dashboard/projects">Ver Proyectos Detallados</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
