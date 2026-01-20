"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function UpdateStripePricesPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpdatePrices = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/stripe/update-prices", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || "Error desconocido")
      }
    } catch (err) {
      setError("Error al conectar con el servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Actualizar Precios en Stripe</CardTitle>
          <CardDescription>Crea nuevos precios para los planes Basic (59€/mes) y Pro (89€/mes)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleUpdatePrices} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando precios...
              </>
            ) : (
              "Crear nuevos precios"
            )}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="font-medium text-green-800">Precios creados correctamente</p>
              </div>

              <div className="bg-white p-3 rounded border text-sm font-mono overflow-x-auto">
                <p className="font-semibold mb-2">Nuevos Price IDs:</p>
                <ul className="space-y-1 text-xs">
                  <li>
                    <strong>Basic Monthly:</strong> {result.prices?.basic_monthly}
                  </li>
                  <li>
                    <strong>Basic Yearly:</strong> {result.prices?.basic_yearly}
                  </li>
                  <li>
                    <strong>Pro Monthly:</strong> {result.prices?.pro_monthly}
                  </li>
                  <li>
                    <strong>Pro Yearly:</strong> {result.prices?.pro_yearly}
                  </li>
                </ul>
              </div>

              <p className="text-sm text-green-700">Copia estos IDs y pásalos en el chat para actualizar el código.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
