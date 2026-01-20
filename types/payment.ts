export type PaymentMethod = "efectivo" | "transferencia" | "tarjeta" | "cheque" | "otro"

export interface ClientPayment {
  id: string
  project_id: string
  user_id: string
  amount: number
  payment_date: string
  concept: string
  payment_method?: PaymentMethod
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreatePaymentInput {
  project_id: string
  amount: number
  payment_date: string
  concept: string
  payment_method?: PaymentMethod
  notes?: string
}

export interface PaymentSummary {
  total_paid: number
  total_pending: number
  budget_amount: number
  payment_count: number
  payments: ClientPayment[]
}
