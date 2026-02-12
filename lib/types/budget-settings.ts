import type { BudgetAdjustment } from "./budget-adjustment"

export interface BudgetSettings {
  id: string
  project_id: string
  introduction_text: string | null
  additional_notes: string | null
  show_vat: boolean
  vat_percentage: number
  status: "draft" | "delivered" | "accepted" | "rejected"
  adjustments: BudgetAdjustment[]
  created_at: string
  updated_at: string
}

export interface BudgetSettingsFormData {
  introduction_text: string
  additional_notes: string
  show_vat: boolean
  vat_percentage: number
}
