export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { projectId, dataType, data } = await request.json()

    if (!projectId || !dataType || !data) {
      return NextResponse.json({ success: false, error: "Faltan datos requeridos" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    // Verificar si ya existe una configuraciÃ³n para este proyecto
    const { data: existingData, error: checkError } = await supabase
      .from("calculator_data")
      .select("id")
      .eq("project_id", projectId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // Si hay un error que no sea "no se encontraron resultados"
      console.error("Error al verificar configuraciÃ³n existente:", checkError)
      return NextResponse.json({ success: false, error: checkError.message }, { status: 500 })
    }

    // Preparar los datos para guardar
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Mapear el tipo de datos al nombre de columna en Supabase
    const columnMap: Record<string, string> = {
      rooms: "rooms",
      reformRooms: "reform_rooms",
      demolitionConfig: "global_config",
      demolitionSettings: "demolition_settings",
    }

    // AÃ±adir los datos al objeto de actualizaciÃ³n
    updateData[columnMap[dataType]] = data

    let result
    if (existingData) {
      // Actualizar configuraciÃ³n existente
      result = await supabase.from("calculator_data").update(updateData).eq("id", existingData.id)
    } else {
      // Crear nueva configuraciÃ³n
      updateData.project_id = projectId
      updateData.created_at = new Date().toISOString()
      result = await supabase.from("calculator_data").insert(updateData)
    }

    if (result.error) {
      console.error("Error al guardar datos de emergencia:", result.error)
      return NextResponse.json({ success: false, error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error en guardado de emergencia:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

