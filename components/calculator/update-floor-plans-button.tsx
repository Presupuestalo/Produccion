"use client"

import { Button } from "@/components/ui/button"

export function UpdateFloorPlansButton() {
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => {
        // Simplemente mostrar un mensaje en lugar de realizar la acción
      }}
    >
      Actualizar planos
    </Button>
  )
}
