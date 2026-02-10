import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }

    // Crear función para verificar si una columna existe
    const checkColumnSql = `
      CREATE OR REPLACE FUNCTION check_column_exists(table_name text, column_name text)
      RETURNS boolean
      LANGUAGE plpgsql
      AS $$
      DECLARE
        column_exists boolean;
      BEGIN
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = $1
          AND column_name = $2
        ) INTO column_exists;
        
        RETURN column_exists;
      END;
      $$;
    `

    // Crear función para añadir una columna si no existe
    const addColumnSql = `
      CREATE OR REPLACE FUNCTION add_column_if_not_exists(
        table_name text,
        column_name text,
        column_type text,
        column_default text DEFAULT NULL
      )
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      DECLARE
        column_exists boolean;
        alter_statement text;
      BEGIN
        -- Verificar si la columna ya existe
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = $1
          AND column_name = $2
        ) INTO column_exists;
        
        -- Si la columna no existe, añadirla
        IF NOT column_exists THEN
          alter_statement := 'ALTER TABLE ' || quote_ident(table_name) || ' ADD COLUMN ' || quote_ident(column_name) || ' ' || column_type;
          
          -- Añadir valor por defecto si se proporciona
          IF column_default IS NOT NULL THEN
            alter_statement := alter_statement || ' DEFAULT ' || column_default;
          END IF;
          
          EXECUTE alter_statement;
        END IF;
      END;
      $$;
    `

    // Ejecutar las funciones SQL
    const { error: errorCheck } = await supabase.rpc("exec_sql", { sql: checkColumnSql })
    if (errorCheck) {
      console.error("Error al crear función check_column_exists:", errorCheck)
    }

    const { error: errorAdd } = await supabase.rpc("exec_sql", { sql: addColumnSql })
    if (errorAdd) {
      console.error("Error al crear función add_column_if_not_exists:", errorAdd)
    }

    // Crear función exec_sql si no existe
    const execSqlSql = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `

    // Intentar crear la función exec_sql (puede que ya exista)
    await supabase.rpc("exec_sql", { sql: execSqlSql })

    return NextResponse.json({ success: true, message: "Funciones RPC configuradas correctamente" })
  } catch (error) {
    console.error("Error al configurar funciones RPC:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
