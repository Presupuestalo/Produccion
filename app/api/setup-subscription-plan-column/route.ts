import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createClient()

    // Crear la función para verificar si una columna existe si no existe ya
    await supabase.rpc("create_check_column_exists_function").catch((error) => {
      // Si la función ya existe, ignorar el error
      if (!error.message.includes("already exists")) {
        throw error
      }
    })

    // Crear la función para añadir una columna si no existe ya
    await supabase.rpc("create_add_column_function").catch((error) => {
      // Si la función ya existe, ignorar el error
      if (!error.message.includes("already exists")) {
        throw error
      }
    })

    // Añadir la columna subscription_plan a la tabla profiles
    const { error } = await supabase.rpc("add_column_if_not_exists", {
      table_name: "profiles",
      column_name: "subscription_plan",
      column_type: "text",
      column_default: "'free'",
    })

    if (error) {
      // Si el error es porque la columna ya existe, considerarlo un éxito
      if (error.message.includes("already exists")) {
        return NextResponse.json({ success: true, message: "La columna subscription_plan ya existe" })
      }

      console.error("Error al añadir columna subscription_plan:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Columna subscription_plan configurada correctamente" })
  } catch (error) {
    console.error("Error al configurar columna subscription_plan:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
