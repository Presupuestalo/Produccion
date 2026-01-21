export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }

    // Verificar si el usuario estÃ¡ autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // AÃ±adir las columnas faltantes
    const alterTableSQL = `
      ALTER TABLE public.calculator_data 
      ADD COLUMN IF NOT EXISTS reform_config JSONB,
      ADD COLUMN IF NOT EXISTS demolition_config JSONB,
      ADD COLUMN IF NOT EXISTS partitions JSONB,
      ADD COLUMN IF NOT EXISTS wall_linings JSONB;
    `

    const { error } = await supabase.rpc("exec_sql", { sql: alterTableSQL })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Columnas aÃ±adidas correctamente a calculator_data",
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
  }
}

