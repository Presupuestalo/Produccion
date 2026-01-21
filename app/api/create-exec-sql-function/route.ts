import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Usar una consulta SQL directa para crear la función
    const { data, error } = await supabaseAdmin.rpc("sql", {
      query: `
        CREATE OR REPLACE FUNCTION exec_sql(sql text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$;
      `,
    })

    if (error) {
      // Si falla el método anterior, intentar con un enfoque diferente
      console.error("Error creating exec_sql function:", error)

      return NextResponse.json(
        {
          success: false,
          error: "No se pudo crear la función exec_sql automáticamente",
          message: "Por favor, ejecuta este comando en el SQL Editor de Supabase:",
          sqlCommand: `
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
        `,
          needsManualCreation: true,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Función exec_sql creada exitosamente",
    })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "Por favor, ejecuta este comando en el SQL Editor de Supabase:",
        sqlCommand: `
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
      `,
        needsManualCreation: true,
      },
      { status: 500 },
    )
  }
}
