import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const subcategory = searchParams.get("subcategory")
    const search = searchParams.get("search")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const supabase = await createClient()

    // Construir query
    let query = supabase
      .from("amazon_products")
      .select("*", { count: "exact" })
      .eq("in_stock", true)
      .order("created_at", { ascending: false })

    // Filtrar por categoría
    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    // Filtrar por subcategoría
    if (subcategory) {
      query = query.eq("subcategory", subcategory)
    }

    // Búsqueda por texto
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,brand.ilike.%${search}%`)
    }

    // Paginación
    query = query.range(offset, offset + limit - 1)

    const { data: products, error, count } = await query

    if (error) {
      console.error("[v0] Error fetching products:", error)
      return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 })
    }

    return NextResponse.json({
      products: products || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("[v0] Error in products API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
