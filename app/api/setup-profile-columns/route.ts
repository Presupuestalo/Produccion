export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Verificar si el usuario está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // SQL para añadir las columnas currency y tax_rate si no existen
    const sql = `
      -- Verificar si las columnas currency y tax_rate ya existen, si no, añadirlas
      DO $$
      BEGIN
        -- Añadir columna currency si no existe
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'currency'
        ) THEN
          ALTER TABLE public.profiles ADD COLUMN currency TEXT DEFAULT 'EUR';
          -- Añadir comentario a la columna
          COMMENT ON COLUMN public.profiles.currency IS 'Moneda predeterminada para el usuario (EUR, USD, etc.)';
        END IF;

        -- Añadir columna tax_rate si no existe
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'tax_rate'
        ) THEN
          ALTER TABLE public.profiles ADD COLUMN tax_rate NUMERIC(5,2) DEFAULT 21.00;
          -- Añadir comentario a la columna
          COMMENT ON COLUMN public.profiles.tax_rate IS 'Tasa de IVA predeterminada en porcentaje (ej: 21.00 para 21%)';
        END IF;
      END
      $$;
    `

    // Ejecutar el SQL
    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("Error al ejecutar SQL:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Columnas añadidas correctamente" })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
  }
}

