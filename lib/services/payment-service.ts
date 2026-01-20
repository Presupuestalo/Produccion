import { createClient } from "@/lib/supabase/client"
import type { ClientPayment, CreatePaymentInput, PaymentSummary } from "@/types/payment"

export class PaymentService {
  private async getClient() {
    const client = await createClient()
    if (!client) throw new Error("No se pudo inicializar el cliente de Supabase")
    return client
  }

  async getPaymentsByProject(projectId: string): Promise<ClientPayment[]> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from("client_payments")
      .select("*")
      .eq("project_id", projectId)
      .order("payment_date", { ascending: false })

    if (error) throw error
    return data || []
  }

  async getPaymentSummary(projectId: string, budgetAmount: number): Promise<PaymentSummary> {
    const payments = await this.getPaymentsByProject(projectId)
    const total_paid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const total_pending = budgetAmount - total_paid

    return {
      total_paid,
      total_pending,
      budget_amount: budgetAmount,
      payment_count: payments.length,
      payments,
    }
  }

  async createPayment(input: CreatePaymentInput): Promise<ClientPayment> {
    const supabase = await this.getClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuario no autenticado")

    const { data, error } = await supabase
      .from("client_payments")
      .insert({
        ...input,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updatePayment(id: string, updates: Partial<CreatePaymentInput>): Promise<ClientPayment> {
    const supabase = await this.getClient()
    const { data, error } = await supabase.from("client_payments").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  }

  async deletePayment(id: string): Promise<void> {
    const supabase = await this.getClient()
    const { error } = await supabase.from("client_payments").delete().eq("id", id)

    if (error) throw error
  }
}

export const paymentService = new PaymentService()
