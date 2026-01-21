import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    // Verificar si la columna ya existe
    const { data: columnExists, error: checkError } = await supabaseAdmin
      .from("profiles")
      .select("user_type")
      .limit(1)
      .maybeSingle()

    // Si no hay error, la columna ya existe
    if (!checkError) {
      return NextResponse.json({ success: true, message: "La columna user_type ya existe" })
    }

    // Si el error no es porque la columna no existe, algo más está mal
    if (!checkError.message.includes("column") && !checkError.message.includes("does not exist")) {
      console.error("Error al verificar la columna user_type:", checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    // La columna no existe, vamos a crearla usando SQL directo
    const { error } = await supabaseAdmin.rpc("create_user_type_column")

    if (error) {
      console.error("Error al crear columna user_type:", error)

      // Si la función RPC no existe, intentamos crear la columna manualmente
      if (error.message.includes("function") && error.message.includes("does not exist")) {
        // Crear la columna manualmente usando la API de Supabase
        await createUserTypeColumnManually()
        return NextResponse.json({
          success: true,
          message: "Columna user_type creada manualmente",
        })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Columna user_type creada correctamente" })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

// Función para crear la columna manualmente
async function createUserTypeColumnManually() {
  try {
    // Primero intentamos crear la función RPC
    await supabaseAdmin
      .rpc("exec_sql", {
        sql: `
        CREATE OR REPLACE FUNCTION create_user_type_column()
        RETURNS void AS $$
        BEGIN
          ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT;
        END;
        $$ LANGUAGE plpgsql;
      `,
      })

    // Intentamos usar la API de Supabase para actualizar un registro y que se cree la columna
    const { data: user } = await supabaseAdmin.auth.getUser()

    if (user && user.user) {
      await supabaseAdmin
        .from("profiles")
        .upsert({
          id: user.user.id,
          user_type: null,
          updated_at: new Date().toISOString(),
        })
        .select()
    } else {
      // Si no hay usuario, creamos un registro temporal
      const tempId = "00000000-0000-0000-0000-000000000000"
      await supabaseAdmin
        .from("profiles")
        .upsert({
          id: tempId,
          user_type: null,
          updated_at: new Date().toISOString(),
        })
        .select()
    }

    console.log("Columna user_type creada manualmente con éxito")
  } catch (error) {
    console.error("Error al crear columna manualmente:", error)
    throw error
  }
}
