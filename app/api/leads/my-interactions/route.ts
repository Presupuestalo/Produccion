export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    console.log("[v0] my-interactions - User ID:", user.id)

    const { data: interactions, error: interactionsError } = await supabaseAdmin
      .from("lead_interactions")
      .select("*")
      .eq("company_id", user.id)
      .eq("action", "accessed")
      .order("accessed_at", { ascending: false })

    console.log("[v0] my-interactions - Interacciones encontradas:", interactions?.length || 0)

    if (interactionsError) {
      console.error("[v0] Error fetching interactions:", interactionsError)
      return NextResponse.json(
        { error: "Error al obtener interacciones", details: interactionsError.message },
        { status: 500 },
      )
    }

    if (!interactions || interactions.length === 0) {
      return NextResponse.json({ interactions: [] })
    }

    const leadIds = interactions.map((i) => i.lead_request_id).filter(Boolean)

    const { data: leadRequests, error: leadsError } = await supabaseAdmin
      .from("lead_requests")
      .select("*")
      .in("id", leadIds)

    if (leadsError) {
      console.error("[v0] Error fetching lead_requests:", leadsError)
    }

    console.log("[v0] my-interactions - Lead requests encontrados:", leadRequests?.length || 0)

    const enrichedInteractions = interactions.map((interaction) => {
      const leadRequest = leadRequests?.find((l) => l.id === interaction.lead_request_id)

      const daysSinceAccess = Math.floor(
        (new Date().getTime() - new Date(interaction.accessed_at!).getTime()) / (1000 * 60 * 60 * 24),
      )

      return {
        ...interaction,
        lead_requests: leadRequest || null,
        days_since_access: daysSinceAccess,
        can_claim: daysSinceAccess >= 7,
        has_claim: false,
        claim_data: null,
      }
    })

    console.log("[v0] my-interactions - Returning:", enrichedInteractions.length, "interactions")

    return NextResponse.json({ interactions: enrichedInteractions })
  } catch (error: any) {
    console.error("[v0] Error in my-interactions:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

