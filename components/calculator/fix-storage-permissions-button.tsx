"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function FixStoragePermissionsButton() {
  return (
    <Button
      variant="outline"
      className="w-full gap-2"
      onClick={() => {
        // Simplemente mostrar un mensaje en lugar de realizar la acción
      }}
    >
      <RefreshCw className="h-4 w-4" />
      Corregir permisos de almacenamiento
    </Button>
  )
}
