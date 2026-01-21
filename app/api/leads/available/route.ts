import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"



export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }
    const searchParams = request.nextUrl.searchParams

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("user_type, is_admin")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
    }

    if (profile.user_type === "homeowner" && !profile.is_admin) {
      return NextResponse.json(
        { error: "Solo empresas y profesionales pueden acceder al marketplace" },
        { status: 403 },
      )
    }

    const cityFilter = searchParams.get("city")
    const provinceFilter = searchParams.get("province")
    const minBudget = searchParams.get("min_budget")
    const maxBudget = searchParams.get("max_budget")
    const reformTypes = searchParams.get("reform_types")?.split(",")
    const showOnlyPreferences = searchParams.get("only_preferences") === "true"

    const { data: preferences } = await supabaseAdmin
      .from("company_lead_preferences")
      .select("*")
      .eq("company_id", user.id)
      .maybeSingle()

    console.log("[v0] ========== LEADS AVAILABLE DEBUG ==========")
    console.log("[v0] User ID:", user.id)
    console.log("[v0] User Type:", profile.user_type, "Admin:", profile.is_admin)

    const now = new Date()
    console.log("[v0] Current time:", now.toISOString())

    const { data: openLeads, error: openError } = await supabaseAdmin
      .from("lead_requests")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })

    if (openError) {
      console.log("[v0] Error fetching open leads:", openError.message)
    }
    console.log("[v0] Leads with status='open':", openLeads?.length || 0)

    // Filtrar leads
    let filteredLeads =
      openLeads?.filter((lead) => {
        if (lead.homeowner_id === user.id) {
          console.log(`[v0] Lead ${lead.id?.substring(0, 8)}: EXCLUDED (own lead)`)
          return false
        }

        const hasNoSelectedCompany = !lead.selected_company || lead.selected_company === ""
        const notExpired = lead.expires_at ? new Date(lead.expires_at) > now : true
        const maxCompanies = lead.max_companies || 3
        const underMaxCompanies = (lead.companies_accessed_count || 0) < maxCompanies

        const passes = hasNoSelectedCompany && notExpired && underMaxCompanies
        console.log(
          `[v0] Lead ${lead.id?.substring(0, 8)}: noSelected=${hasNoSelectedCompany}, notExpired=${notExpired}, count=${lead.companies_accessed_count}/${maxCompanies} => ${passes ? "PASS" : "FAIL"}`,
        )

        return passes
      }) || []

    console.log("[v0] After basic filters:", filteredLeads.length)

    // Aplicar filtros adicionales de búsqueda
    if (cityFilter) {
      filteredLeads = filteredLeads.filter((l) => l.city?.toLowerCase().includes(cityFilter.toLowerCase()))
    }
    if (provinceFilter) {
      filteredLeads = filteredLeads.filter((l) => l.province?.toLowerCase().includes(provinceFilter.toLowerCase()))
    }
    if (minBudget) {
      filteredLeads = filteredLeads.filter((l) => (l.estimated_budget || 0) >= Number.parseFloat(minBudget))
    }
    if (maxBudget) {
      filteredLeads = filteredLeads.filter((l) => (l.estimated_budget || 0) <= Number.parseFloat(maxBudget))
    }
    if (reformTypes && reformTypes.length > 0) {
      filteredLeads = filteredLeads.filter((l) => {
        const leadTypes = l.reform_types || []
        return reformTypes.some((t) => leadTypes.includes(t))
      })
    }

    // Aplicar preferencias de la empresa si está activo
    if (!profile.is_admin && showOnlyPreferences && preferences) {
      if (preferences.min_budget) {
        filteredLeads = filteredLeads.filter((l) => (l.estimated_budget || 0) >= preferences.min_budget)
      }
      if (preferences.max_budget) {
        filteredLeads = filteredLeads.filter((l) => (l.estimated_budget || 0) <= preferences.max_budget)
      }
      if (preferences.accepted_reform_types && preferences.accepted_reform_types.length > 0) {
        filteredLeads = filteredLeads.filter((l) => {
          const leadTypes = l.reform_types || []
          return preferences.accepted_reform_types.some((t: string) => leadTypes.includes(t))
        })
      }
    }

    console.log("[v0] After all filters:", filteredLeads.length)

    const { data: interactions } = await supabaseAdmin
      .from("lead_interactions")
      .select("lead_request_id, action")
      .eq("company_id", user.id)

    console.log("[v0] User interactions count:", interactions?.length || 0)

    const interactionsMap = new Map(interactions?.map((i) => [i.lead_request_id, i.action]) || [])

    const leadIds = filteredLeads.map((l) => l.id)
    const proposalCountsMap = new Map<string, number>()

    if (leadIds.length > 0) {
      const { data: proposalCounts } = await supabaseAdmin
        .from("professional_proposals")
        .select("lead_request_id")
        .in("lead_request_id", leadIds)

      proposalCounts?.forEach((p) => {
        const count = proposalCountsMap.get(p.lead_request_id) || 0
        proposalCountsMap.set(p.lead_request_id, count + 1)
      })
    }

    const enrichedLeads = filteredLeads.map((lead) => {
      const hasAccessed = interactionsMap.get(lead.id) === "accessed"

      const firstName = lead.client_name ? lead.client_name.split(" ")[0] : null
      const phonePartial = lead.client_phone ? lead.client_phone.replace(/\D/g, "").slice(0, 3) : null

      return {
        ...lead,
        client_name: hasAccessed || profile.is_admin ? lead.client_name : null,
        client_email: hasAccessed || profile.is_admin ? lead.client_email : null,
        client_phone: hasAccessed || profile.is_admin ? lead.client_phone : null,
        client_name_partial: firstName,
        client_phone_partial: phonePartial,
        has_accessed: hasAccessed,
        has_viewed: interactionsMap.has(lead.id),
        is_admin_view: profile.is_admin,
        proposals_count: proposalCountsMap.get(lead.id) || 0,
        companies_accessed_count: lead.companies_accessed_count || 0,
        max_companies: lead.max_companies || 3,
      }
    })

    // Los profesionales no ven leads que ya han comprado (has_accessed)
    // Los admins ven todos
    const finalLeads = profile.is_admin ? enrichedLeads : enrichedLeads.filter((lead) => !lead.has_accessed)

    console.log("[v0] Final leads to return:", finalLeads.length)
    console.log("[v0] ========== END DEBUG ==========")

    return NextResponse.json({ leads: finalLeads, is_admin: profile.is_admin })
  } catch (error: any) {
    console.error("[v0] Error in available leads:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
