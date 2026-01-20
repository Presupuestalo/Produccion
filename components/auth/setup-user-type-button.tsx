"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"

export function SetupUserTypeButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSetup = async () => {
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/setup-user-type-column")
      const data = await response.json()

      if (data.success) {
        setMessage("✅ Columna configurada correctamente")
      } else {
        setMessage(`❌ Error: ${data.error || "Desconocido"}`)
      }
    } catch (error) {
      console.error("Error:", error)
      setMessage("❌ Error al configurar la columna")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-4">
      <Button variant="outline" onClick={handleSetup} disabled={isLoading} className="w-full">
        {isLoading ? "Configurando..." : "Configurar Base de Datos"}
      </Button>
      {message && <p className="text-sm mt-2 text-center">{message}</p>}
    </div>
  )
}
