"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, Loader2, Crown, Sparkles } from "lucide-react"
import { toast } from "sonner"

const planDetails: Record<
  string,
  {
    name: string
    icon: React.ReactNode
    priceMonthly: number
    priceAnnually: number
    features: string[]
    color: string
  }
> = {
  basic: {
    name: "Basic",
    icon: <Sparkles className="h-6 w-6" />,
    priceMonthly: 29,
    priceAnnually: 23,
    features: [
      "Proyectos ilimitados",
      "Presupuestos PDF sin marca de agua",
      "Contratos personalizados",
      "Herramientas IA (3 usos/día)",
    ],
    color: "orange",
  },
  pro: {
    name: "Pro",
    icon: <Crown className="h-6 w-6" />,
    priceMonthly: 59,
    priceAnnually: 47,
    features: [
      "Proyectos ilimitados",
      "Añadir Precios con IA",
      "Reconocimiento de planos con IA",
      "Gestión de citas y fotos",
      "Soporte prioritario",
    ],
    color: "blue",
  },
}

export function PendingPlanModal() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const pendingPlan = searchParams.get("pendingPlan")
  const billingType = (searchParams.get("billingType") as "monthly" | "annually") || "monthly"

  useEffect(() => {
    if (pendingPlan && planDetails[pendingPlan]) {
      setOpen(true)
    }
  }, [pendingPlan])

  const handleClose = () => {
    setOpen(false)
    const url = new URL(window.location.href)
    url.searchParams.delete("pendingPlan")
    url.searchParams.delete("billingType")
    router.replace(url.pathname)
  }

  const handleSubscribe = async () => {
    if (!pendingPlan) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/subscription/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey: pendingPlan,
          billingType: billingType,
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || "Error al crear la sesión de pago")
      }
    } catch (error) {
      console.error("Error creating checkout:", error)
      toast.error("Error al procesar el pago. Inténtalo de nuevo.")
      setIsLoading(false)
    }
  }

  if (!pendingPlan || !planDetails[pendingPlan]) {
    return null
  }

  const plan = planDetails[pendingPlan]
  const price = billingType === "monthly" ? plan.priceMonthly : plan.priceAnnually
  const yearlyTotal = plan.priceAnnually * 12
  const monthlySavings = plan.priceMonthly - plan.priceAnnually
  const yearlySavings = monthlySavings * 12

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div
            className={`mx-auto mb-4 p-3 rounded-full bg-${plan.color}-100 dark:bg-${plan.color}-900/30 text-${plan.color}-600 dark:text-${plan.color}-400`}
          >
            {plan.icon}
          </div>
          <DialogTitle className="text-center text-2xl">Activar Plan {plan.name}</DialogTitle>
          <DialogDescription className="text-center">
            Estás a un paso de desbloquear todas las funcionalidades
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <div className="text-4xl font-bold">
              {price}€<span className="text-base font-normal text-muted-foreground">/mes</span>
            </div>
            {billingType === "annually" && (
              <div className="mt-1 space-y-1">
                <p className="text-sm text-muted-foreground">Facturado anualmente ({yearlyTotal}€/año)</p>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Ahorras {yearlySavings}€ al año
                </p>
              </div>
            )}
          </div>

          <div className="border rounded-lg p-4 bg-muted/30">
            <p className="text-sm font-medium mb-3">Incluye:</p>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleSubscribe}
            disabled={isLoading}
            className={`w-full bg-${plan.color}-500 hover:bg-${plan.color}-600`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>Activar Plan {plan.name}</>
            )}
          </Button>
          <Button variant="ghost" onClick={handleClose} disabled={isLoading} className="w-full">
            Quizás más tarde
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
