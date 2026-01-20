"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'
import { Download, Loader2 } from 'lucide-react'

interface ImportBudgetButtonProps {
  leadRequestId: string
  hasAccess: boolean
}

export function ImportBudgetButton({ leadRequestId, hasAccess }: ImportBudgetButtonProps) {
  const [isImporting, setIsImporting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleImport = async () => {
    try {
      setIsImporting(true)
      console.log("[v0] Starting budget import for lead:", leadRequestId)

      const response = await fetch("/api/leads/import-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadRequestId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al importar presupuesto")
      }

      toast({
        title: "Presupuesto importado",
        description: "El presupuesto se ha copiado a tus proyectos. Ahora puedes ajustarlo con tus precios.",
      })

      // Redirigir al proyecto importado
      router.push(`/dashboard/projects/${data.projectId}`)
    } catch (error: any) {
      console.error("[v0] Error importing budget:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo importar el presupuesto",
      })
    } finally {
      setIsImporting(false)
    }
  }

  if (!hasAccess) {
    return null
  }

  return (
    <Button onClick={handleImport} disabled={isImporting} size="sm" variant="outline">
      {isImporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Importando...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Importar Presupuesto
        </>
      )}
    </Button>
  )
}
