"use client"

import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export function SchemaUpdateAlert() {
  const [visible, setVisible] = useState(false)

  // No mostrar nada, ya que estamos simplificando
  if (!visible) return null

  return (
    <Alert className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Actualización disponible</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>Hay una actualización disponible para la estructura de datos.</p>
        <Button variant="outline" size="sm" className="w-fit" onClick={() => setVisible(false)}>
          Actualizar ahora
        </Button>
      </AlertDescription>
    </Alert>
  )
}
