import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

export const dynamic = "force-dynamic"

// Usar service role para bypasear RLS
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    console.log("[v0] API offers/available - userId:", userId)

    const { data: allRequests, error: allError } = await supabaseAdmin
      .from("quote_requests")
      .select(
        "id, status, user_id, reform_type, city, price_range, phone, email, description, square_meters, rooms, bathrooms, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(20)

    console.log("[v0] All requests in DB:", allRequests?.length, "Error:", allError?.message)

    if (allError) {
      console.error("[v0] Error fetching all requests:", allError)
      return NextResponse.json({ error: allError.message }, { status: 500 })
    }

    const filteredRequests = (allRequests || []).filter((r) => r.user_id !== userId)

    console.log("[v0] Filtered requests (not user):", filteredRequests.length)

    // Obtener nombres de los propietarios
    const userIds = [...new Set(filteredRequests.map((r) => r.user_id).filter(Boolean))]
    let profilesMap: Record<string, string> = {}

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds)

      if (profiles) {
        profilesMap = profiles.reduce(
          (acc, p) => {
            acc[p.id] = p.full_name || "Propietario"
            return acc
          },
          {} as Record<string, string>,
        )
      }
    }

    // Obtener conteo de ofertas por solicitud
    const requestIds = filteredRequests.map((r) => r.id)
    let offersCountMap: Record<string, number> = {}

    if (requestIds.length > 0) {
      const { data: offersData } = await supabaseAdmin
        .from("quote_offers")
        .select("quote_request_id")
        .in("quote_request_id", requestIds)

      if (offersData) {
        offersCountMap = offersData.reduce(
          (acc, offer) => {
            acc[offer.quote_request_id] = (acc[offer.quote_request_id] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )
      }
    }

    // y combinar datos con información del propietario
    const enrichedRequests = filteredRequests
      .filter((request) => {
        const count = offersCountMap[request.id] || 0
        return count < 3
      })
      .map((request) => ({
        ...request,
        owner_name: profilesMap[request.user_id] || "Propietario",
        offers_count: offersCountMap[request.id] || 0,
        companies_accessed_count: offersCountMap[request.id] || 0,
        max_companies: 3,
      }))

    console.log("[v0] Enriched requests to return:", enrichedRequests.length)
    console.log(
      "[v0] First request sample:",
      enrichedRequests[0] ? JSON.stringify(enrichedRequests[0], null, 2) : "none",
    )

    return NextResponse.json({ requests: enrichedRequests })
  } catch (error) {
    console.error("[v0] Error in available offers API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
