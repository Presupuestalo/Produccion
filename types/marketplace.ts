// Tipos TypeScript para el sistema de marketplace

export type CreditTransactionType = "purchase" | "spent" | "refund"

export type LeadRequestStatus = "open" | "closed" | "expired" | "cancelled"

export type LeadInteractionAction = "viewed" | "accessed" | "contacted" | "claim_no_response" | "won" | "lost"

export type LeadInteractionOutcome = "negotiating" | "won" | "lost"

export type ClaimReason =
  | "phone_off" // Teléfono apagado/fuera de servicio
  | "no_answer" // No contesta tras múltiples intentos
  | "wrong_number" // Número incorrecto/no existe
  | "email_bounced" // Email rebotado
  | "already_hired" // El propietario ya contrató a otro
  | "fake_data" // Datos falsos/spam
  | "other" // Otro motivo

export type ClaimStatus = "pending" | "approved" | "rejected"

export const CLAIM_REASON_LABELS: Record<ClaimReason, string> = {
  phone_off: "Teléfono apagado/fuera de servicio",
  no_answer: "No contesta tras múltiples intentos",
  wrong_number: "Número incorrecto/no existe",
  email_bounced: "Email rebotado",
  already_hired: "El propietario ya contrató a otro",
  fake_data: "Datos falsos/spam",
  other: "Otro motivo",
}

export interface LeadClaim {
  id: string
  lead_interaction_id: string
  lead_request_id: string
  professional_id: string
  reason: ClaimReason
  reason_details?: string
  call_attempts: number
  call_dates?: string[]
  whatsapp_sent: boolean
  sms_sent: boolean
  email_sent: boolean
  credits_spent: number
  credits_to_refund: number
  status: ClaimStatus
  resolved_by?: string
  resolved_at?: string
  resolution_notes?: string
  created_at: string
  updated_at: string
}

export type ReformType =
  | "reforma_integral"
  | "cocina"
  | "bano"
  | "pintura"
  | "electricidad"
  | "fontaneria"
  | "carpinteria"
  | "climatizacion"

export interface CompanyCredits {
  id: string
  company_id: string
  credits_balance: number
  credits_purchased_total: number
  credits_spent_total: number
  last_purchase_at?: string
  created_at: string
  updated_at: string
}

export interface CreditTransaction {
  id: string
  company_id: string
  type: CreditTransactionType
  amount: number
  payment_amount?: number
  description?: string
  lead_request_id?: string
  stripe_payment_id?: string
  created_at: string
}

export interface CompanyLeadPreferences {
  id: string
  company_id: string
  action_radius_km: number
  accepted_reform_types: ReformType[]
  min_budget: number
  max_budget: number
  email_notifications: boolean
  sms_notifications: boolean
  created_at: string
  updated_at: string
}

export interface LeadRequest {
  id: string
  project_id: string
  homeowner_id: string
  status: LeadRequestStatus

  // Información del proyecto
  estimated_budget: number
  credits_cost: number
  reform_types: ReformType[]
  project_description?: string
  surface_m2?: number

  // Ubicación (solo código postal y ciudad visible)
  postal_code: string
  city: string
  province: string
  country_code: string
  location_lat?: number
  location_lng?: number

  // Contacto (oculto hasta acceso)
  client_name?: string
  client_email?: string
  client_phone?: string

  // Control de acceso
  max_companies: number
  companies_accessed_count: number
  companies_accessed_ids: string[]

  // Tiempos
  created_at: string
  expires_at: string
  closed_at?: string
}

export interface LeadInteraction {
  id: string
  lead_request_id: string
  company_id: string
  action: LeadInteractionAction
  credits_spent?: number
  credits_refunded?: number
  notes?: string
  viewed_at?: string
  accessed_at?: string
  contacted_at?: string
  claim_submitted_at?: string
  claim_resolved_at?: string
  created_at: string
  contact_attempts?: number
  last_contact_attempt_at?: string
  contact_confirmed_at?: string
  outcome?: LeadInteractionOutcome
  claim_status?: ClaimStatus
}

// Paquetes de créditos disponibles
export const CREDIT_PACKAGES = [
  { credits: 50, price: 49, pricePerCredit: 0.98 },
  { credits: 100, price: 89, pricePerCredit: 0.89, popular: true },
  { credits: 250, price: 199, pricePerCredit: 0.8 },
  { credits: 500, price: 349, pricePerCredit: 0.7 },
] as const

export const MARKETPLACE_CONFIG = {
  MAX_COMPANIES_PER_LEAD: 3,
  LEAD_EXPIRATION_DAYS: 30, // Cambiado a 30 días
  MIN_DAYS_BEFORE_CLAIM: 2, // Mínimo 2 días antes de poder reclamar
  MAX_DAYS_TO_CLAIM: 7, // Máximo 7 días para reclamar
  REFUND_PERCENTAGE: 0.75, // 75% de devolución
  MIN_CALL_ATTEMPTS: 3, // Mínimo 3 intentos de llamada para reclamar
  MAX_CLAIM_REJECTION_BEFORE_FLAG: 3, // 3 rechazos = flag de abuso
} as const

export function calculateLeadCreditsCost(budget: number): number {
  if (budget < 5000) {
    return 8
  } else if (budget < 15000) {
    return 15
  } else if (budget < 30000) {
    return 25
  } else if (budget < 50000) {
    return 35
  } else {
    return 50
  }
}
