import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/send-email"
import { emailClaimResolved } from "@/lib/email/templates/presmarket-emails"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: claimId } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Verificar que es admin
    const { data: adminProfile } = await supabase.from("profiles").select("role, email").eq("id", user.id).single()

    const isAdmin =
      adminProfile?.role === "admin" ||
      adminProfile?.email === "pascualmollar@gmail.com" ||
      adminProfile?.email === "admin@presupuestalo.es"

    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const { approved, resolutionNotes } = body

    // Obtener la reclamación
    const { data: claim, error: claimError } = await supabase
      .from("lead_claims")
      .select(`
        *,
        professional:profiles!lead_claims_professional_id_fkey(
          full_name,
          email
        )
      `)
      .eq("id", claimId)
      .single()

    if (claimError || !claim) {
      return NextResponse.json({ error: "Reclamación no encontrada" }, { status: 404 })
    }

    if (claim.status !== "pending") {
      return NextResponse.json({ error: "Esta reclamación ya ha sido resuelta" }, { status: 400 })
    }

    const newStatus = approved ? "approved" : "rejected"

    // Actualizar la reclamación
    const { error: updateError } = await supabase
      .from("lead_claims")
      .update({
        status: newStatus,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNotes,
      })
      .eq("id", claimId)

    if (updateError) {
      console.error("[v0] Error actualizando reclamación:", updateError)
      return NextResponse.json({ error: "Error al actualizar la reclamación" }, { status: 500 })
    }

    // Si se aprueba, devolver los créditos
    if (approved) {
      const { data: currentCredits } = await supabase
        .from("company_credits")
        .select("credits_balance")
        .eq("company_id", claim.professional_id)
        .single()

      const newBalance = (currentCredits?.credits_balance || 0) + claim.credits_to_refund

      await supabase
        .from("company_credits")
        .update({ credits_balance: newBalance })
        .eq("company_id", claim.professional_id)

      // Registrar la transacción
      await supabase.from("credit_transactions").insert({
        company_id: claim.professional_id,
        type: "refund",
        amount: claim.credits_to_refund,
        description: `Devolución por reclamación aprobada: ${claim.lead_title}`,
        lead_request_id: claim.lead_request_id,
      })
    }

    // Actualizar el estado de la interacción
    await supabase
      .from("lead_interactions")
      .update({
        claim_status: newStatus,
        claim_resolved_by: user.id,
        claim_resolution_notes: resolutionNotes,
      })
      .eq("id", claim.lead_interaction_id)

    // Enviar email al profesional
    const professionalEmail = claim.professional?.email
    if (professionalEmail) {
      await sendEmail({
        to: professionalEmail,
        subject: `Reclamación ${approved ? "aprobada" : "rechazada"} - Presupuéstalo`,
        html: emailClaimResolved({
          professionalName: claim.professional?.full_name || "Profesional",
          leadTitle: claim.lead_title || "Lead",
          approved,
          creditsRefunded: approved ? claim.credits_to_refund : undefined,
          resolutionNotes,
        }),
      })
    }

    return NextResponse.json({
      success: true,
      message: approved
        ? `Reclamación aprobada. Se han devuelto ${claim.credits_to_refund} créditos.`
        : "Reclamación rechazada.",
    })
  } catch (error: any) {
    console.error("[v0] Error en POST /api/leads/claims/[id]/resolve:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
