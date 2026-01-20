"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database } from "lucide-react"
import { useRouter } from "next/navigation"

export function TableSetupGuide() {
  const router = useRouter()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Configuración inicial
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>La tabla necesaria para esta funcionalidad se creará automáticamente cuando sea necesario.</p>
        <Button
          onClick={() => {
            // Simplemente recargar la página
            router.refresh()
          }}
        >
          Continuar
        </Button>
      </CardContent>
    </Card>
  )
}
