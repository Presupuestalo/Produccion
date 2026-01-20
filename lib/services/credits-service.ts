import { createClient } from "@/lib/supabase/server"

export async function getUserCreditsBalance(): Promise<number> {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return 0
  }

  const { data, error } = await supabase
    .from("company_credits")
    .select("credits_balance")
    .eq("company_id", user.id)
    .single()

  if (error || !data) {
    return 0
  }

  return data.credits_balance
}

export async function canAccessLead(leadCost: number): Promise<{ allowed: boolean; balance: number }> {
  const balance = await getUserCreditsBalance()
  return {
    allowed: balance >= leadCost,
    balance,
  }
}

export async function initializeCompanyCredits(companyId: string): Promise<void> {
  const supabase = await createClient()
  
  // Crear registro de créditos si no existe
  const { error } = await supabase
    .from("company_credits")
    .upsert({
      company_id: companyId,
      credits_balance: 0,
      credits_purchased_total: 0,
      credits_spent_total: 0,
    }, {
      onConflict: 'company_id'
    })

  if (error) {
    console.error("Error initializing credits:", error)
  }
}
