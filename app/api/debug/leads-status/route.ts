import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Obtener perfil del usuario
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type, is_admin, full_name, email")
      .eq("id", user.id)
      .single()

    // Obtener TODOS los leads sin filtros
    const { data: allLeads, error: leadsError } = await supabase
      .from("lead_requests")
      .select(
        "id, status, selected_company, companies_accessed_count, expires_at, city, province, estimated_budget, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(20)

    // Contar por status
    const statusCounts: Record<string, number> = {}
    allLeads?.forEach((lead) => {
      statusCounts[lead.status || "null"] = (statusCounts[lead.status || "null"] || 0) + 1
    })

    // Filtrar leads "open"
    const openLeads = allLeads?.filter((l) => l.status === "open") || []

    // Verificar cuáles pasarían los filtros
    const now = new Date()
    const passingFilters = openLeads.filter((lead) => {
      const noSelectedCompany = !lead.selected_company || lead.selected_company === ""
      const notExpired = !lead.expires_at || new Date(lead.expires_at) > now
      const underMax = (lead.companies_accessed_count || 0) < 4
      return noSelectedCompany && notExpired && underMax
    })

    return NextResponse.json({
      currentUser: {
        id: user.id,
        email: user.email,
        profile: profile,
      },
      totalLeadsInDB: allLeads?.length || 0,
      statusCounts,
      openLeadsCount: openLeads.length,
      leadsPassingFilters: passingFilters.length,
      allLeads: allLeads?.map((l) => ({
        id: l.id?.substring(0, 8) + "...",
        status: l.status,
        selected_company: l.selected_company === null ? "NULL" : l.selected_company === "" ? "EMPTY" : "HAS_VALUE",
        companies_accessed_count: l.companies_accessed_count,
        expires_at: l.expires_at,
        expired: l.expires_at ? new Date(l.expires_at) < now : false,
        city: l.city,
        province: l.province,
      })),
      openLeadsDetails: openLeads.map((l) => ({
        id: l.id,
        selected_company_value: l.selected_company,
        selected_company_type: typeof l.selected_company,
        companies_accessed_count: l.companies_accessed_count,
        expires_at: l.expires_at,
        wouldPass: {
          noSelectedCompany: !l.selected_company || l.selected_company === "",
          notExpired: !l.expires_at || new Date(l.expires_at) > now,
          underMax: (l.companies_accessed_count || 0) < 4,
        },
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
