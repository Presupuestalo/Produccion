// Crear un endpoint para verificar el estado de la sesión
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({
      session: data.session
        ? {
            user: {
              id: data.session.user.id,
              email: data.session.user.email,
            },
            expires_at: data.session.expires_at,
          }
        : null,
    })
  } catch (error: any) {
    console.error("Error al verificar sesión:", error)
    return NextResponse.json({ error: error.message || "Error al verificar sesión" }, { status: 500 })
  }
}
