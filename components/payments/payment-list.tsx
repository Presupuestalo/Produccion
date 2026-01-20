"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Calendar, CreditCard } from "lucide-react"
import type { ClientPayment } from "@/types/payment"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface PaymentListProps {
  payments: ClientPayment[]
  onDelete: (id: string) => void
}

const paymentMethodLabels: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  cheque: "Cheque",
  otro: "Otro",
}

export function PaymentList({ payments, onDelete }: PaymentListProps) {
  if (payments.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No hay pagos registrados</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <Card key={payment.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{payment.concept}</h4>
                {payment.payment_method && (
                  <Badge variant="secondary" className="text-xs">
                    {paymentMethodLabels[payment.payment_method]}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(payment.payment_date), "d 'de' MMMM, yyyy", { locale: es })}
                </div>
                <div className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  <span className="font-semibold text-green-600">{Number(payment.amount).toFixed(2)} €</span>
                </div>
              </div>

              {payment.notes && <p className="text-sm text-muted-foreground">{payment.notes}</p>}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(payment.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
