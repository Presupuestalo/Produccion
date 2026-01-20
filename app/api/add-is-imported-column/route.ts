import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createClient()

    // Verificar si la columna ya existe
    const { data, error: queryError } = await supabase.from("price_master").select("is_imported").limit(1)

    if (!queryError) {
      // La columna ya existe
      return NextResponse.json({
        success: true,
        message: "Columna is_imported ya existe",
      })
    }

    // La columna no existe, proporcionar instrucciones
    return NextResponse.json(
      {
        error: "La columna is_imported no existe en la tabla price_master",
        details: queryError?.message || "Columna no encontrada",
        needsManualCreation: true,
        instructions: `
-- Ejecuta este SQL en el Editor SQL de Supabase:
ALTER TABLE public.price_master 
ADD COLUMN IF NOT EXISTS is_imported BOOLEAN DEFAULT false;

-- Actualizar la política RLS si es necesario
COMMENT ON COLUMN public.price_master.is_imported IS 'Indica si el precio fue importado desde un PDF';
        `,
      },
      { status: 500 },
    )
  } catch (error) {
    console.error("Error al verificar la columna is_imported:", error)
    return NextResponse.json(
      {
        error: "Error al verificar la columna is_imported",
        details: error instanceof Error ? error.message : "Error desconocido",
        needsManualCreation: true,
        instructions: `
-- Ejecuta este SQL en el Editor SQL de Supabase:
ALTER TABLE public.price_master 
ADD COLUMN IF NOT EXISTS is_imported BOOLEAN DEFAULT false;

-- Actualizar la política RLS si es necesario
COMMENT ON COLUMN public.price_master.is_imported IS 'Indica si el precio fue importado desde un PDF';
        `,
      },
      { status: 500 },
    )
  }
}
