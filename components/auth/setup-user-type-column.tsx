"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react"

export function SetupUserTypeColumn() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    error?: string
    needsManualCreation?: boolean
    sqlCommand?: string
    instructions?: string[]
    message?: string
  } | null>(null)

  const handleSetup = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/setup-user-type-column")
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        needsManualCreation: true,
        sqlCommand: "ALTER TABLE public.profiles ADD COLUMN user_type TEXT;",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Configuración de Base de Datos</h3>
        <p className="text-sm text-gray-600">Necesitamos configurar la columna user_type en la tabla profiles</p>
      </div>

      <Button onClick={handleSetup} disabled={isLoading} className="w-full">
        {isLoading ? "Verificando..." : "Verificar Configuración"}
      </Button>

      {result?.success && (
        <Alert className="border-green-500">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">
            {result.message || "¡Configuración completada exitosamente!"}
          </AlertDescription>
        </Alert>
      )}

      {result && !result.success && (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{result.error || "Se requiere configuración manual"}</AlertDescription>
          </Alert>

          {result.needsManualCreation && (
            <>
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-blue-900">Instrucciones paso a paso:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  {result.instructions?.map((instruction, index) => <li key={index}>{instruction}</li>) || [
                    "Ve a tu proyecto en Supabase Dashboard",
                    "Abre el SQL Editor",
                    "Ejecuta el comando SQL que aparece abajo",
                    "Vuelve aquí y haz clic en 'Verificar Configuración'",
                  ]}
                </ol>
              </div>

              {result.sqlCommand && (
                <div className="space-y-2">
                  <h4 className="font-medium">Comando SQL:</h4>
                  <div className="relative">
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto pr-12">{result.sqlCommand}</pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(result.sqlCommand!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir Supabase Dashboard
                  </a>
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
