import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Obtener categorías únicas con conteo de productos
    const { data: categories, error } = await supabase.from("amazon_products").select("category").eq("in_stock", true)

    if (error) {
      console.error("[v0] Error fetching categories:", error)
      return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 })
    }

    // Contar productos por categoría
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
    materiales: "Materiales de Construcción",
    pintura: "Pintura y Decoración",
    fontaneria: "Fontanería",
    electricidad: "Electricidad",
    carpinteria: "Carpintería",
    hogar: "Hogar y Decoración",
    seguridad: "Seguridad",
    jardin: "Jardín y Exterior",
  }
  return displayNames[category] || category
}
