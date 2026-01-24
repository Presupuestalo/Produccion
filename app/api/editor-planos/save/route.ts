export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { name, walls, doors, windows, rooms } = await request.json()

    const { data, error } = await supabase
      .from("floor_plans")
      .insert({
        user_id: session.user.id,
        name,
        walls,
        doors,
        windows,
        rooms,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving plan:", error)
      return NextResponse.json({ error: "Error al guardar plano" }, { status: 500 })
    }

    return NextResponse.json({ id: data.id })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error al guardar plano" }, { status: 500 })
  }
}

