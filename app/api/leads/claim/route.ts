export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { MARKETPLACE_CONFIG } from "@/types/marketplace"

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

    const { leadId, reason } = await req.json()

    if (!leadId) {
      return NextResponse.json({ error: "ID de lead requerido" }, { status: 400 })
    }

    // Verificar que la empresa accedió al lead
    const { data: interaction, error: interactionError } = await supabase
      .from("lead_interactions")
      .select("*")
      .eq("lead_request_id", leadId)
      .eq("company_id", user.id)
      .eq("action", "accessed")
      .single()

    if (interactionError || !interaction) {
      return NextResponse.json(
        { error: "No has accedido a este lead" },
        { status: 400 }
      )
    }

    // Verificar que ya no haya reclamación pendiente
    const { data: existingClaim } = await supabase
      .from("lead_interactions")
      .select("*")
      .eq("lead_request_id", leadId)
      .eq("company_id", user.id)
      .eq("action", "claim_no_response")
      .single()

    if (existingClaim) {
      return NextResponse.json(
        { error: "Ya has presentado una reclamación para este lead" },
        { status: 400 }
      )
    }

    // Verificar que han pasado al menos 7 días desde el acceso
    const accessDate = new Date(interaction.accessed_at!)
    const now = new Date()
    const daysSinceAccess = Math.floor((now.getTime() - accessDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceAccess < MARKETPLACE_CONFIG.MIN_DAYS_BEFORE_CLAIM) {
      return NextResponse.json(
        { error: `Debes esperar ${MARKETPLACE_CONFIG.MIN_DAYS_BEFORE_CLAIM} días desde el acceso para reclamar` },
        { status: 400 }
      )
    }

    // Calcular devolución (50% de los créditos gastados)
    const refundAmount = Math.floor(interaction.credits_spent! * MARKETPLACE_CONFIG.REFUND_PERCENTAGE)

    // Crear registro de reclamación
    const { error: claimError } = await supabase
      .from("lead_interactions")
      .insert({
        lead_request_id: leadId,
        company_id: user.id,
        action: "claim_no_response",
        credits_refunded: refundAmount,
        notes: reason || "Cliente no responde",
        claim_submitted_at: new Date().toISOString(),
        claim_resolved_at: new Date().toISOString(), // Auto-aprobado
      })

    if (claimError) {
      console.error("[v0] Error creating claim:", claimError)
      return NextResponse.json({ error: "Error al crear reclamación" }, { status: 500 })
    }

    // Devolver créditos automáticamente
    const { data: credits } = await supabase
      .from("company_credits")
      .select("credits_balance")
      .eq("company_id", user.id)
      .single()

    if (credits) {
      await supabase
        .from("company_credits")
        .update({
          credits_balance: credits.credits_balance + refundAmount,
        })
        .eq("company_id", user.id)

      // Registrar transacción de devolución
      await supabase.from("credit_transactions").insert({
        company_id: user.id,
        type: "refund",
        amount: refundAmount,
        description: `Devolución parcial por lead sin respuesta (${MARKETPLACE_CONFIG.REFUND_PERCENTAGE * 100}%)`,
        lead_request_id: leadId,
      })
    }

    return NextResponse.json({
      success: true,
      refunded_credits: refundAmount,
      message: `Se han devuelto ${refundAmount} créditos (${MARKETPLACE_CONFIG.REFUND_PERCENTAGE * 100}% del coste)`,
    })
  } catch (error: any) {
    console.error("[v0] Error processing claim:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

