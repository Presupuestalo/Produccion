export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { calculateCreditCost, type SubscriptionPlan } from "@/lib/utils/credit-calculator"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { leadId } = await req.json()

    if (!leadId) {
      return NextResponse.json({ error: "ID de lead requerido" }, { status: 400 })
    }

    // Obtener el lead
    const { data: lead, error: leadError } = await supabase.from("lead_requests").select("*").eq("id", leadId).single()

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 })
    }

    // Verificar que el lead está disponible
    if (lead.status !== "open") {
      return NextResponse.json({ error: "Lead no disponible" }, { status: 400 })
    }

    if (lead.companies_accessed_count >= lead.max_companies) {
      return NextResponse.json({ error: "Lead completo - máximo de empresas alcanzado" }, { status: 400 })
    }

    // Verificar si ya accedió
    const { data: existingInteraction } = await supabase
      .from("lead_interactions")
      .select("*")
      .eq("lead_request_id", leadId)
      .eq("company_id", user.id)
      .eq("action", "accessed")
      .maybeSingle()

    if (existingInteraction) {
      return NextResponse.json({
        success: true,
        already_accessed: true,
        lead: {
          id: lead.id,
          client_name: lead.client_name,
          client_email: lead.client_email,
          client_phone: lead.client_phone,
        },
      })
    }

    const { data: profile } = await supabase.from("profiles").select("subscription_plan").eq("id", user.id).single()

    const userPlan = (profile?.subscription_plan || "free") as SubscriptionPlan

    const estimatedBudget = Number(lead.estimated_budget) || 0
    const creditResult = calculateCreditCost(estimatedBudget, userPlan)
    const creditsCost = creditResult.credits

    console.log("[v0] Lead access - budget:", estimatedBudget, "plan:", userPlan, "cost:", creditsCost)

    // Verificar balance de créditos
    const { data: credits, error: creditsError } = await supabase
      .from("company_credits")
      .select("credits_balance, credits_spent_total")
      .eq("company_id", user.id)
      .single()

    if (creditsError || !credits) {
      return NextResponse.json({ error: "No tienes créditos disponibles" }, { status: 400 })
    }

    if (credits.credits_balance < creditsCost) {
      return NextResponse.json({ error: `Créditos insuficientes. Necesitas ${creditsCost} créditos` }, { status: 400 })
    }

    // Descontar créditos
    const newBalance = credits.credits_balance - creditsCost
    const newSpentTotal = (credits.credits_spent_total || 0) + creditsCost

    const { error: updateCreditsError } = await supabase
      .from("company_credits")
      .update({
        credits_balance: newBalance,
        credits_spent_total: newSpentTotal,
      })
      .eq("company_id", user.id)

    if (updateCreditsError) {
      console.error("[v0] Error updating credits:", updateCreditsError)
      return NextResponse.json({ error: "Error al procesar créditos" }, { status: 500 })
    }

    // Registrar transacción
    await supabase.from("credit_transactions").insert({
      company_id: user.id,
      type: "spent",
      amount: -creditsCost,
      description: `Acceso a lead #${lead.id.slice(-8)} - ${creditResult.category}`,
      lead_request_id: leadId,
    })

    // Registrar interacción
    await supabase.from("lead_interactions").insert({
      lead_request_id: leadId,
      company_id: user.id,
      action: "accessed",
      credits_spent: creditsCost,
      accessed_at: new Date().toISOString(),
    })

    // Actualizar contador del lead
    const newCompaniesIds = [...(lead.companies_accessed_ids || []), user.id]
    await supabase
      .from("lead_requests")
      .update({
        companies_accessed_count: lead.companies_accessed_count + 1,
        companies_accessed_ids: newCompaniesIds,
      })
      .eq("id", leadId)

    // Devolver el lead con información completa
    return NextResponse.json({
      success: true,
      credits_spent: creditsCost,
      lead: {
        ...lead,
        client_name: lead.client_name,
        client_email: lead.client_email,
        client_phone: lead.client_phone,
      },
    })
  } catch (error: any) {
    console.error("[v0] Error accessing lead:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

