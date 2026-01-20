import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Construction, ArrowLeft, Calculator } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "En Construcción | Presupuéstalo",
  description: "Esta funcionalidad está en desarrollo",
}

export default function EnConstruccionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calculator className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">Presupuéstalo</span>
          </Link>
        </div>

        <Card className="text-center">
          <CardContent className="p-12 space-y-8">
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <Construction className="w-12 h-12 text-yellow-600" />
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">¡Estamos trabajando en esto!</h1>
              <p className="text-xl text-gray-600">
                La funcionalidad de presupuesto orientativo estará disponible muy pronto.
              </p>
              <p className="text-gray-500">
                Mientras tanto, puedes usar nuestro presupuesto detallado que ya está disponible.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Ir al Dashboard
                </Link>
              </Button>

              <Button asChild>
                <Link href="/auth/user-type">Volver a seleccionar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
