"use client"

import { Button } from "@/components/ui/button"
import { Database } from "lucide-react"
import { useRouter } from "next/navigation"

export function FixTableButton() {
  const router = useRouter()

  return (
    <Button
      className="gap-2"
      onClick={() => {
        // Simplemente recargar la página
        router.refresh()
      }}
    >
      <Database className="h-4 w-4" />
      Corregir tabla
    </Button>
  )
}
