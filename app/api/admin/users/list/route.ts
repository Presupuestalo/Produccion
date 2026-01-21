import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// Lista de emails con acceso admin
const ADMIN_EMAILS = ["mikelfedz@gmail.com", "mikelfedzmcc@gmail.com"]

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const userEmail = session.user.email
    const userId = session.user.id

    const isAdminEmail = userEmail && ADMIN_EMAILS.includes(userEmail)

    if (!isAdminEmail) {
      const { data: profile } = await supabaseAdmin.from("profiles").select("is_admin").eq("id", userId).single()

      if (!profile?.is_admin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    }

    console.log("[v0 API] Usuario autorizado, obteniendo perfiles...")

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, user_type, full_name, stripe_customer_id, stripe_subscription_id, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.log("[v0 API] Error al obtener perfiles:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0 API] Perfiles obtenidos:", profiles?.length)

    const usersFormatted = await Promise.all(
      (profiles || []).map(async (profile) => {
        let email = profile.full_name || `Usuario ${profile.id.substring(0, 8)}`

        try {
          const {
            data: { user },
            error,
          } = await supabaseAdmin.auth.admin.getUserById(profile.id)
          if (!error && user?.email) {
            email = user.email
          }
        } catch (err) {
          console.log("[v0 API] No se pudo obtener email para usuario:", profile.id)
        }

        return {
          id: profile.id,
          email,
          user_type: profile.user_type || "propietario",
          stripe_customer_id: profile.stripe_customer_id,
          stripe_subscription_id: profile.stripe_subscription_id,
          created_at: profile.created_at,
        }
      }),
    )

    console.log("[v0 API] Usuarios formateados:", usersFormatted.length)
    console.log("[v0 API] Primer usuario ejemplo:", usersFormatted[0])

    return NextResponse.json(usersFormatted)
  } catch (error) {
    console.error("[v0 API] Error general:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
