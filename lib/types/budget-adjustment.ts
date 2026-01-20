export interface BudgetAdjustment {
  id: string
  budget_id: string
  type: "addition" | "subtraction"
  category: string
  concept_code?: string
  concept: string
  description?: string
  unit: string
  quantity: number
  unit_price: number
  total_price: number
  adjustment_date: string
  notes?: string
  created_at: string
  updated_at: string
}

export type CreateBudgetAdjustment = Omit<BudgetAdjustment, "id" | "created_at" | "updated_at">
