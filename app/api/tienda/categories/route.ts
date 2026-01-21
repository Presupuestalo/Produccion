export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Obtener categorÃ­as Ãºnicas con conteo de productos
    const { data: categories, error } = await supabase.from("amazon_products").select("category").eq("in_stock", true)

    if (error) {
      console.error("[v0] Error fetching categories:", error)
      return NextResponse.json({ error: "Error al obtener categorÃ­as" }, { status: 500 })
    }

    // Contar productos por categorÃ­a
    const categoryCounts: Record<string, number> = {}
    categories?.forEach((item) => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
    })

    const categoryList = Object.entries(categoryCounts).map(([name, count]) => ({
      id: name,
      name: getCategoryDisplayName(name),
      count,
    }))

    return NextResponse.json({ categories: categoryList })
  } catch (error) {
    console.error("[v0] Error in categories API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

function getCategoryDisplayName(category: string): string {
  const displayNames: Record<string, string> = {
    herramientas: "Herramientas",
    materiales: "Materiales de ConstrucciÃ³n",
    pintura: "Pintura y DecoraciÃ³n",
    fontaneria: "FontanerÃ­a",
    electricidad: "Electricidad",
    carpinteria: "CarpinterÃ­a",
    hogar: "Hogar y DecoraciÃ³n",
    seguridad: "Seguridad",
    jardin: "JardÃ­n y Exterior",
  }
  return displayNames[category] || category
}

