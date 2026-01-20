"use client"

import { useEffect, useState } from "react"
import { PaymentSummaryCard } from "./payment-summary-card"
import { PaymentList } from "./payment-list"
import { PaymentFormDialog } from "./payment-form-dialog"
import { paymentService } from "@/lib/services/payment-service"
import type { PaymentSummary } from "@/types/payment"
import { toast } from "sonner"

interface PaymentsSectionProps {
  projectId: string
  budgetAmount: number
}

export function PaymentsSection({ projectId, budgetAmount }: PaymentsSectionProps) {
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const loadPayments = async () => {
    try {
      const data = await paymentService.getPaymentSummary(projectId, budgetAmount)
      setSummary(data)
    } catch (error) {
      toast.error("Error al cargar los cobros")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [projectId, budgetAmount])

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este cobro?")) return

    try {
      await paymentService.deletePayment(id)
      toast.success("Cobro eliminado")
      loadPayments()
    } catch (error) {
      toast.error("Error al eliminar el cobro")
      console.error(error)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando cobros...</div>
  }

  if (!summary) {
    return <div className="p-8 text-center text-muted-foreground">Error al cargar los cobros</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestión de Cobros</h2>
        <PaymentFormDialog projectId={projectId} onPaymentAdded={loadPayments} />
      </div>

      <PaymentSummaryCard summary={summary} />

      <div>
        <h3 className="text-lg font-semibold mb-4">Historial de Cobros</h3>
        <PaymentList payments={summary.payments} onDelete={handleDelete} />
      </div>
    </div>
  )
}
