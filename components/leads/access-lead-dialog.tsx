"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertCircle, CheckCircle2, Unlock } from 'lucide-react'
import { formatCurrency } from "@/lib/utils/format"

interface Lead {
  id: string
  estimated_budget: number
  credits_cost: number
  city: string
  province: string
  postal_code: string
  project_description?: string
}

interface AccessLeadDialogProps {
  lead: Lead
  onAccessed: () => void
  children: React.ReactNode
}

export function AccessLeadDialog({ lead, onAccessed, children }: AccessLeadDialogProps) {
  const [open, setOpen] = useState(false)
  const [isAccessing, setIsAccessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  const handleAccess = async () => {
    try {
      setIsAccessing(true)

      const response = await fetch("/api/leads/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al acceder al lead")
      }

      setSuccess(true)
      toast({
        title: "Acceso concedido",
        description: "Ya puedes ver los datos de contacto del cliente",
      })

      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        onAccessed()
      }, 2000)
    } catch (error: any) {
      console.error("[v0] Error accessing lead:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo acceder al lead",
      })
    } finally {
      setIsAccessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Acceder a Lead</DialogTitle>
          <DialogDescription>
            Confirma que deseas acceder a este proyecto. Se descontarán {lead.credits_cost} créditos de tu balance.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8">
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Has accedido exitosamente al lead. Ahora puedes ver los datos del cliente y contactarlo directamente.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold">Ubicación</p>
                  <p className="text-sm text-muted-foreground">
                    {lead.city}, {lead.province} - CP: {lead.postal_code}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Presupuesto Estimado</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(lead.estimated_budget)}</p>
                </div>
                {lead.project_description && (
                  <div>
                    <p className="text-sm font-semibold">Descripción</p>
                    <p className="text-sm text-muted-foreground">{lead.project_description}</p>
                  </div>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Al acceder verás el nombre completo, teléfono y email del cliente. Podrás contactarlo directamente
                  para enviarle tu presupuesto personalizado.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-semibold">Coste total</span>
                <span className="text-2xl font-bold text-primary">{lead.credits_cost} créditos</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isAccessing}>
                Cancelar
              </Button>
              <Button onClick={handleAccess} disabled={isAccessing}>
                {isAccessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Confirmar Acceso
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
