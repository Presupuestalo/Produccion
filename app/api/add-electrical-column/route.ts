export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createClient()

    const { data, error: queryError } = await supabase.from("calculator_data").select("electrical_config").limit(1)

    if (!queryError) {
      // La columna ya existe
      return NextResponse.json({
        success: true,
        message: "Columna electrical_config ya existe",
      })
    }

    // Intentar crear un registro de prueba para forzar la creaciÃ³n de la columna
    const { error: insertError } = await supabase
      .from("calculator_data")
      .insert({
        project_id: "test-electrical-column",
        electrical_config: {},
      })
      .select()

    if (!insertError) {
      await supabase.from("calculator_data").delete().eq("project_id", "test-electrical-column")

      return NextResponse.json({
        success: true,
        message: "Columna electrical_config verificada correctamente",
      })
    }

    return NextResponse.json(
      {
        error: "La columna electrical_config no existe en la tabla",
        details: queryError?.message || "Columna no encontrada",
        needsManualCreation: true,
        instructions: `
-- Ejecuta este SQL en el Editor SQL de Supabase:
ALTER TABLE public.calculator_data ADD COLUMN IF NOT EXISTS electrical_config JSONB DEFAULT '{}'::jsonb;
        `,
      },
      { status: 500 },
    )
  } catch (error) {
    console.error("Error al verificar la columna electrical_config:", error)
    return NextResponse.json(
      {
        error: "Error al verificar la columna electrical_config",
        details: error.message,
        needsManualCreation: true,
        instructions: `
-- Ejecuta este SQL en el Editor SQL de Supabase:
ALTER TABLE public.calculator_data ADD COLUMN IF NOT EXISTS electrical_config JSONB DEFAULT '{}'::jsonb;
        `,
      },
      { status: 500 },
    )
  }
}

