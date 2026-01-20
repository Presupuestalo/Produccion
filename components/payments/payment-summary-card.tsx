"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react"
import type { PaymentSummary } from "@/types/payment"

interface PaymentSummaryCardProps {
  summary: PaymentSummary
}

export function PaymentSummaryCard({ summary }: PaymentSummaryCardProps) {
  const paymentPercentage = summary.budget_amount > 0 ? (summary.total_paid / summary.budget_amount) * 100 : 0

  const isPending = summary.total_pending > 0

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Resumen de Cobros</h3>
          <DollarSign className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">{paymentPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={paymentPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Presupuesto</p>
            <p className="text-2xl font-bold">{summary.budget_amount.toFixed(2)} €</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Cobrado
            </p>
            <p className="text-2xl font-bold text-green-600">{summary.total_paid.toFixed(2)} €</p>
          </div>
        </div>

        {isPending && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-900">Pendiente de cobro</p>
              <p className="text-lg font-bold text-orange-600">{summary.total_pending.toFixed(2)} €</p>
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            {summary.payment_count} {summary.payment_count === 1 ? "pago registrado" : "pagos registrados"}
          </p>
        </div>
      </div>
    </Card>
  )
}
