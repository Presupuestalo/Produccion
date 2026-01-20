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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { MARKETPLACE_CONFIG } from "@/types/marketplace"

interface ClaimLeadDialogProps {
  leadId: string
  creditsSpent: number
  onClaimSubmitted: () => void
  children: React.ReactNode
}

export function ClaimLeadDialog({ leadId, creditsSpent, onClaimSubmitted, children }: ClaimLeadDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [refundedCredits, setRefundedCredits] = useState(0)
  const { toast } = useToast()

  const refundAmount = Math.floor(creditsSpent * MARKETPLACE_CONFIG.REFUND_PERCENTAGE)

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      const response = await fetch("/api/leads/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          reason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar reclamación")
      }

      setSuccess(true)
      setRefundedCredits(data.refunded_credits)
      toast({
        title: "Reclamación procesada",
        description: data.message,
      })

      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setReason("")
        onClaimSubmitted()
      }, 3000)
    } catch (error: any) {
      console.error("[v0] Error claiming lead:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo procesar la reclamación",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reclamar Devolución de Créditos</DialogTitle>
          <DialogDescription>
            Si el cliente no ha respondido después de 7 días, puedes solicitar una devolución parcial
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8">
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Reclamación aprobada automáticamente</strong>
                <br />
                Se han devuelto {refundedCredits} créditos a tu cuenta.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Política de devolución:</strong>
                  <br />
                  Se devolverá el {MARKETPLACE_CONFIG.REFUND_PERCENTAGE * 100}% de los créditos gastados
                  ({refundAmount} de {creditsSpent} créditos) si el cliente no ha respondido después de{" "}
                  {MARKETPLACE_CONFIG.CLAIM_WINDOW_DAYS} días.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="reason">
                  Motivo de la reclamación (opcional)
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Describe brevemente por qué el cliente no respondió o cualquier intento de contacto que hayas realizado..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Esta información nos ayuda a mejorar la calidad de los leads
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-semibold">Devolución total</span>
                <span className="text-2xl font-bold text-primary">{refundAmount} créditos</span>
              </div>

              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Solo puedes reclamar una vez por lead. Asegúrate de haber intentado
                  contactar al cliente antes de proceder.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Confirmar Reclamación
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
