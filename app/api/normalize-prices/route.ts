export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    // Verificar que el usuario es admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("[v0] Iniciando normalización de precios para todos los países")

    // Ejecutar scripts SQL en orden
    const scripts = [
      "normalize-all-country-prices-v1.sql",
      "normalize-all-country-prices-v2-create-tables.sql",
      "normalize-all-country-prices-v3-populate.sql",
    ]

    const results = []

    for (const scriptName of scripts) {
      console.log(`[v0] Ejecutando script: ${scriptName}`)

      // Leer el contenido del script
      const scriptPath = `scripts/${scriptName}`
      let scriptContent: string

      try {
        const fs = await import("fs/promises")
        scriptContent = await fs.readFile(scriptPath, "utf-8")
      } catch (error) {
        console.error(`[v0] Error leyendo script ${scriptName}:`, error)
        return NextResponse.json({ error: `No se pudo leer el script ${scriptName}` }, { status: 500 })
      }

      // Ejecutar el script
      const { error } = await supabase.rpc("exec_sql", { sql_string: scriptContent })

      if (error) {
        console.error(`[v0] Error ejecutando ${scriptName}:`, error)
        results.push({
          script: scriptName,
          success: false,
          error: error.message,
        })
      } else {
        console.log(`[v0] ✅ ${scriptName} ejecutado correctamente`)
        results.push({
          script: scriptName,
          success: true,
        })
      }
    }

    // Verificar resultados
    const allSuccess = results.every((r) => r.success)

    if (!allSuccess) {
      return NextResponse.json(
        {
          success: false,
          message: "Algunos scripts fallaron",
          results,
        },
        { status: 500 },
      )
    }

    // Obtener estadísticas finales
    const { data: stats } = await supabase.rpc("get_price_statistics")

    return NextResponse.json({
      success: true,
      message: "Normalización completada exitosamente",
      results,
      statistics: stats,
    })
  } catch (error) {
    console.error("[v0] Error general en normalización:", error)
    return NextResponse.json(
      {
        error: "Error ejecutando normalización",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

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
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener estadísticas de precios por país
    const countries = [
      { code: "ES", name: "España", table: "price_master" },
      { code: "PE", name: "Perú", table: "price_master_peru" },
      { code: "MX", name: "México", table: "price_master_mexico" },
      { code: "CO", name: "Colombia", table: "price_master_colombia" },
      { code: "AR", name: "Argentina", table: "price_master_argentina" },
      { code: "CL", name: "Chile", table: "price_master_chile" },
      { code: "BO", name: "Bolivia", table: "price_master_bolivia" },
      { code: "VE", name: "Venezuela", table: "price_master_venezuela" },
      { code: "EC", name: "Ecuador", table: "price_master_ecuador" },
      { code: "US", name: "Estados Unidos", table: "price_master_usa" },
    ]

    const statistics = []

    for (const country of countries) {
      const { count, error } = await supabase.from(country.table).select("*", { count: "exact", head: true })

      if (!error) {
        statistics.push({
          country: country.name,
          code: country.code,
          table: country.table,
          total_prices: count || 0,
        })
      }
    }

    return NextResponse.json({
      success: true,
      statistics,
      total_countries: statistics.length,
    })
  } catch (error) {
    console.error("[v0] Error obteniendo estadísticas:", error)
    return NextResponse.json({ error: "Error obteniendo estadísticas" }, { status: 500 })
  }
}

