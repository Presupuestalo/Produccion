import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Verificar que el usuario es admin
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const status = request.nextUrl.searchParams.get("status") || "pending"

  try {
    let query = supabase.from("lead_claims").select("*").order("created_at", { ascending: false })

    if (status !== "all") {
      query = query.eq("status", status)
    }

    const { data: claims, error } = await query

    if (error) {
      console.error("Error obteniendo reclamaciones:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const claimsWithContext = await Promise.all(
      (claims || []).map(async (claim) => {
        // Obtener datos del profesional
        const { data: professional } = await supabase
          .from("profiles")
          .select("full_name, email, company_name")
          .eq("id", claim.professional_id)
          .single()

        // Obtener datos del quote_offer y lead_request
        const { data: quoteOffer } = await supabase
          .from("quote_offers")
          .select("id, credits_cost, accessed_at, lead_request_id")
          .eq("id", claim.quote_offer_id)
          .single()

        let leadRequest = null
        let owner = null
        if (quoteOffer?.lead_request_id) {
          const { data: lr } = await supabase
            .from("lead_requests")
            .select("id, work_type, description, city, user_id")
            .eq("id", quoteOffer.lead_request_id)
            .single()
          leadRequest = lr

          if (lr?.user_id) {
            const { data: ownerData } = await supabase
              .from("profiles")
              .select("full_name, email, phone")
              .eq("id", lr.user_id)
              .single()
            owner = ownerData
          }
        }

        // Verificar si otros profesionales contactaron el mismo lead
        let otherContactedCount = 0
        if (leadRequest?.id) {
          const { count } = await supabase
            .from("lead_access_status")
            .select("*", { count: "exact", head: true })
            .eq("lead_request_id", leadRequest.id)
            .eq("status", "contacted")
            .neq("professional_id", claim.professional_id)
          otherContactedCount = count || 0
        }

        return {
          ...claim,
          professional,
          quote_offer: quoteOffer
            ? {
                ...quoteOffer,
                lead_request: leadRequest
                  ? {
                      ...leadRequest,
                      owner,
                    }
                  : null,
              }
            : null,
          other_professionals_contacted: otherContactedCount,
        }
      }),
    )

    // Obtener estadísticas
    const { count: pendingCount } = await supabase
      .from("lead_claims")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")

    const { count: approvedCount } = await supabase
      .from("lead_claims")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")

    const { count: rejectedCount } = await supabase
      .from("lead_claims")
      .select("*", { count: "exact", head: true })
      .eq("status", "rejected")

    const { data: refundedData } = await supabase
      .from("lead_claims")
      .select("credits_to_refund")
      .eq("status", "approved")

    const creditsRefundedTotal = (refundedData || []).reduce((sum, c) => sum + (c.credits_to_refund || 0), 0)

    return NextResponse.json({
      claims: claimsWithContext,
      stats: {
        total_pending: pendingCount || 0,
        total_approved: approvedCount || 0,
        total_rejected: rejectedCount || 0,
        credits_refunded_total: creditsRefundedTotal,
      },
    })
  } catch (error: any) {
    console.error("Error en API admin/claims:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
