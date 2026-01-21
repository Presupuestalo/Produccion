export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { MARKETPLACE_CONFIG } from "@/types/marketplace"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

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

    // Verificar que la empresa accediÃ³ al lead
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

    // Verificar que ya no haya reclamaciÃ³n pendiente
    const { data: existingClaim } = await supabase
      .from("lead_interactions")
      .select("*")
      .eq("lead_request_id", leadId)
      .eq("company_id", user.id)
      .eq("action", "claim_no_response")
      .single()

    if (existingClaim) {
      return NextResponse.json(
        { error: "Ya has presentado una reclamaciÃ³n para este lead" },
        { status: 400 }
      )
    }

    // Verificar que han pasado al menos 7 dÃ­as desde el acceso
    const accessDate = new Date(interaction.accessed_at!)
    const now = new Date()
    const daysSinceAccess = Math.floor((now.getTime() - accessDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceAccess < MARKETPLACE_CONFIG.CLAIM_WINDOW_DAYS) {
      return NextResponse.json(
        { error: `Debes esperar ${MARKETPLACE_CONFIG.CLAIM_WINDOW_DAYS} dÃ­as desde el acceso para reclamar` },
        { status: 400 }
      )
    }

    // Calcular devoluciÃ³n (50% de los crÃ©ditos gastados)
    const refundAmount = Math.floor(interaction.credits_spent! * MARKETPLACE_CONFIG.REFUND_PERCENTAGE)

    // Crear registro de reclamaciÃ³n
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
      return NextResponse.json({ error: "Error al crear reclamaciÃ³n" }, { status: 500 })
    }

    // Devolver crÃ©ditos automÃ¡ticamente
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

      // Registrar transacciÃ³n de devoluciÃ³n
      await supabase.from("credit_transactions").insert({
        company_id: user.id,
        type: "refund",
        amount: refundAmount,
        description: `DevoluciÃ³n parcial por lead sin respuesta (${MARKETPLACE_CONFIG.REFUND_PERCENTAGE * 100}%)`,
        lead_request_id: leadId,
      })
    }

    return NextResponse.json({
      success: true,
      refunded_credits: refundAmount,
      message: `Se han devuelto ${refundAmount} crÃ©ditos (${MARKETPLACE_CONFIG.REFUND_PERCENTAGE * 100}% del coste)`,
    })
  } catch (error: any) {
    console.error("[v0] Error processing claim:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

