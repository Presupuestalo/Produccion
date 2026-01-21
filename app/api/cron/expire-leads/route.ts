import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

// GET /api/cron/expire-leads - Expirar leads antiguos y reclamaciones
export async function GET(request: Request) {
  // Verificar autorización
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()
    const results = {
      expiredLeads: 0,
      expiredClaims: 0,
      errors: [] as string[],
    }

    // 1. Expirar leads de más de 30 días
    const { data: expiredLeads, error: errorLeads } = await supabaseAdmin
      .from("lead_requests")
      .update({ status: "expired" })
      .lt("expires_at", now.toISOString())
      .eq("status", "active")
      .select("id")

    if (errorLeads) {
      results.errors.push(`Error expirando leads: ${errorLeads.message}`)
    } else {
      results.expiredLeads = expiredLeads?.length || 0
    }

    // 2. Cerrar reclamaciones pendientes de más de 7 días sin resolver (auto-aprobar)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const { data: oldClaims, error: errorOldClaims } = await supabaseAdmin
      .from("lead_claims")
      .select("id, professional_id, credits_to_refund")
      .eq("status", "pending")
      .lt("created_at", sevenDaysAgo.toISOString())

    if (errorOldClaims) {
      results.errors.push(`Error buscando claims antiguas: ${errorOldClaims.message}`)
    } else if (oldClaims && oldClaims.length > 0) {
      for (const claim of oldClaims) {
        // Auto-aprobar reclamación
        const { error: updateError } = await supabaseAdmin
          .from("lead_claims")
          .update({
            status: "approved",
            resolved_at: now.toISOString(),
            resolution_notes: "Auto-abrobada por timeout de 7 días sin revisión",
          })
          .eq("id", claim.id)

        if (updateError) {
          results.errors.push(`Error actualizando claim ${claim.id}: ${updateError.message}`)
          continue
        }

        // Devolver créditos al profesional
        const { error: creditError } = await supabaseAdmin.rpc("add_credits_to_user", {
          p_user_id: claim.professional_id,
          p_amount: claim.credits_to_refund,
          p_description: "Devolución automática - reclamación sin revisar",
        })

        if (creditError) {
          results.errors.push(`Error devolviendo créditos claim ${claim.id}: ${creditError.message}`)
        } else {
          results.expiredClaims++
        }
      }
    }

    // 3. Marcar interacciones de más de 7 días sin acción como "lost"
    const { error: errorInteractions } = await supabaseAdmin
      .from("lead_interactions")
      .update({ outcome: "lost" })
      .lt("created_at", sevenDaysAgo.toISOString())
      .is("outcome", null)
      .is("contacted_at", null)

    if (errorInteractions) {
      results.errors.push(`Error actualizando interacciones: ${errorInteractions.message}`)
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    console.error("Error en cron expire-leads:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
