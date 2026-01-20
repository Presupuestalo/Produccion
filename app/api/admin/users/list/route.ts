import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Lista de emails con acceso admin
const ADMIN_EMAILS = ["mikelfedz@gmail.com", "mikelfedzmcc@gmail.com"]

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[v0 API] Faltan variables de entorno de Supabase")
      return NextResponse.json(
        {
          error: "Configuración de Supabase incompleta",
        },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[v0 API] Iniciando carga de usuarios...")

    const authHeader = request.headers.get("cookie")
    const token = authHeader?.match(/sb-[^=]+-auth-token=([^;]+)/)?.[1]

    if (!token) {
      console.log("[v0 API] No se encontró token de autenticación")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    let tokenData
    let userEmail
    try {
      tokenData = JSON.parse(decodeURIComponent(token))
      userEmail = tokenData?.user?.email
    } catch (error) {
      console.error("[v0 API] Error al parsear token de autenticación:", error)
      return NextResponse.json(
        {
          error: "Token de autenticación inválido",
        },
        { status: 401 },
      )
    }

    console.log("[v0 API] Usuario autenticado:", userEmail)

    const isAdminEmail = userEmail && ADMIN_EMAILS.includes(userEmail)
    console.log("[v0 API] Es admin por email?:", isAdminEmail)

    if (!isAdminEmail) {
      const userId = tokenData?.user?.id
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userId).single()

      console.log("[v0 API] Profile is_admin:", profile?.is_admin)

      if (!profile?.is_admin) {
        console.log("[v0 API] Usuario no autorizado")
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    }

    console.log("[v0 API] Usuario autorizado, obteniendo perfiles...")

    const { data: profiles, error } = await supabase
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
          } = await supabase.auth.admin.getUserById(profile.id)
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
