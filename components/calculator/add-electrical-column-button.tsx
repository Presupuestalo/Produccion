"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

export function AddElectricalColumnButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [instructions, setInstructions] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  const handleAddColumn = async () => {
    setIsLoading(true)
    setError(null)
    setInstructions(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/add-electrical-column", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al añadir la columna electrical_config")
        if (data.needsManualCreation && data.instructions) {
          setInstructions(data.instructions)
        }
        toast({
          title: "Error",
          description: "No se pudo añadir la columna electrical_config",
          variant: "destructive",
        })
      } else {
        setSuccess(true)
        toast({
          title: "Éxito",
          description: "Columna electrical_config añadida correctamente",
        })
        // Recargar la página después de 2 segundos
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      setError("Error al conectar con el servidor")
      toast({
        title: "Error",
        description: "Error al conectar con el servidor",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Alert className="mb-4 bg-green-50 border-green-200">
        <AlertTitle className="text-green-800">Columna añadida correctamente</AlertTitle>
        <AlertDescription className="text-green-700">
          La columna electrical_config se ha añadido correctamente. La página se recargará automáticamente.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <p>{error}</p>
            {instructions && (
              <>
                <p className="mt-2 font-semibold">Instrucciones para añadir manualmente:</p>
                <div className="bg-gray-800 text-white p-3 rounded text-xs overflow-auto max-h-60 my-2">
                  <pre>{instructions}</pre>
                </div>
                <p className="text-sm">
                  Copia este código SQL y ejecútalo en el Editor SQL de Supabase. Luego, vuelve a cargar esta página.
                </p>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Button onClick={handleAddColumn} disabled={isLoading} className="mb-4">
        {isLoading ? "Añadiendo columna..." : "Añadir columna electrical_config"}
      </Button>
    </>
  )
}
