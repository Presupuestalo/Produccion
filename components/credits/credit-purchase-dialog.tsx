"use client"

import { type ReactNode, useState, useCallback, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { startCreditPurchaseSession } from "@/app/actions/purchase-credits"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

interface CreditPurchaseDialogProps {
  packageId: string
  children: ReactNode
  onPurchaseComplete?: () => void
}

export function CreditPurchaseDialog({ packageId, children, onPurchaseComplete }: CreditPurchaseDialogProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkoutStarted, setCheckoutStarted] = useState(false)
  const router = useRouter()

  const fetchClientSecret = useCallback(async () => {
    try {
      setError(null)
      setCheckoutStarted(true)
      const secret = await startCreditPurchaseSession(packageId)
      return secret
    } catch (err) {
      console.error("[v0] Error fetching client secret:", err)
      setError(err instanceof Error ? err.message : "Error al iniciar el pago")
      throw err
    }
  }, [packageId])

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && checkoutStarted) {
      // El diálogo se cerró después de iniciar el checkout
      // Asumimos que puede haber sido un pago exitoso
      console.log("[v0] Checkout dialog closed, refreshing credits...")

      toast.info("Verificando estado del pago...")

      // Refrescar créditos varias veces para capturar el webhook
      const refreshCredits = () => {
        console.log("[v0] Triggering credit refresh...")
        onPurchaseComplete?.()
        router.refresh()
      }

      // Refrescar inmediatamente y en intervalos
      setTimeout(refreshCredits, 500)
      setTimeout(refreshCredits, 2000)
      setTimeout(refreshCredits, 4000)
      setTimeout(refreshCredits, 7000)
      setTimeout(refreshCredits, 10000)

      setCheckoutStarted(false)
    }
    setOpen(newOpen)
  }

  // Reset error when dialog opens
  useEffect(() => {
    if (open) {
      setError(null)
    }
  }, [open])

  if (!stripePromise) {
    return (
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error de configuración</DialogTitle>
            <DialogDescription>
              Stripe no está configurado correctamente. Contacta con el administrador.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comprar Créditos</DialogTitle>
          <DialogDescription>Completa el pago de forma segura con Stripe</DialogDescription>
        </DialogHeader>
        {error ? (
          <div className="p-4 text-center text-red-600">
            <p>{error}</p>
          </div>
        ) : (
          <div id="checkout" className="min-h-[400px]">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
