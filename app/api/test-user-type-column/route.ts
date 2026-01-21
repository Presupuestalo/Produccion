export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
)

export async function POST(request: Request) {
  try {
    const { userId, userType } = await request.json()

    if (!userId || !userType) {
      return NextResponse.json({ error: "userId y userType son requeridos" }, { status: 400 })
    }

    // Intentar hacer el upsert real con el usuario actual
    const { error } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      user_type: userType,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error en upsert real:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Tipo de usuario guardado correctamente",
    })
  } catch (error: any) {
    console.error("Error general:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

