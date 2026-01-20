import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Crear un cliente de Supabase con la clave de servicio para tener permisos completos
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
)

export async function GET() {
  try {
    // Primero, verificar que podemos acceder a la tabla profiles
    const { data: profilesCheck, error: profilesCheckError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .limit(1)

    if (profilesCheckError) {
      console.error("Error accediendo a la tabla profiles:", profilesCheckError)
      return NextResponse.json({ error: profilesCheckError.message }, { status: 500 })
    }

    // Intentar hacer una consulta que incluya la columna user_type
    const { data: userTypeCheck, error: userTypeError } = await supabaseAdmin
      .from("profiles")
      .select("user_type")
      .limit(1)

    if (userTypeError) {
      // Si hay un error, probablemente la columna no existe
      console.error("Error verificando columna user_type:", userTypeError)

      // Verificar si el error es específicamente porque la columna no existe
      if (
        userTypeError.message.includes("column") &&
        userTypeError.message.includes("user_type") &&
        userTypeError.message.includes("does not exist")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "La columna user_type no existe en la tabla profiles.",
            sqlCommand: "ALTER TABLE public.profiles ADD COLUMN user_type TEXT;",
            needsManualCreation: true,
            instructions: [
              "Ve a tu proyecto en Supabase Dashboard",
              "Abre el SQL Editor",
              "Ejecuta el comando: ALTER TABLE public.profiles ADD COLUMN user_type TEXT;",
              "Vuelve a esta página y haz clic en 'Verificar Configuración'",
            ],
          },
          { status: 200 }, // Cambiamos a 200 porque es un estado esperado
        )
      }

      return NextResponse.json({ error: userTypeError.message }, { status: 500 })
    }

    // Si llegamos aquí, la columna existe
    // En lugar de hacer un upsert de prueba, solo verificamos que la consulta funcionó
    console.log("Columna user_type existe y es accesible")

    // Opcionalmente, si hay perfiles existentes, podemos probar con uno real
    if (profilesCheck && profilesCheck.length > 0) {
      const existingProfileId = profilesCheck[0].id

      // Intentar actualizar un perfil existente solo si existe
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", existingProfileId)

      if (updateError) {
        console.error("Error en actualización de prueba:", updateError)
        // No fallar por esto, la columna existe
      }
    }

    return NextResponse.json({
      success: true,
      message: "Columna user_type existe y funciona correctamente",
    })
  } catch (error: any) {
    console.error("Error general:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error interno del servidor",
        sqlCommand: "ALTER TABLE public.profiles ADD COLUMN user_type TEXT;",
        needsManualCreation: true,
        instructions: [
          "Ve a tu proyecto en Supabase Dashboard",
          "Abre el SQL Editor",
          "Ejecuta el comando: ALTER TABLE public.profiles ADD COLUMN user_type TEXT;",
          "Vuelve a esta página y haz clic en 'Verificar Configuración'",
        ],
      },
      { status: 500 },
    )
  }
}
