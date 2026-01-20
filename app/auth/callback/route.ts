import { createServerClient } from "@supabase/ssr"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  const pendingPlan = searchParams.get("pendingPlan")
  const billingType = searchParams.get("billingType") || "monthly"

  const errorParam = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  if (errorParam) {
    console.error("OAuth error:", errorParam, errorDescription)
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errorDescription || errorParam)}`)
  }

  if (code) {
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
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // Server Component context
            }
          },
        },
      },
    )

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const syncOAuthDataToProfile = async (userId: string, userMetadata: Record<string, unknown>, email: string) => {
      try {
        const googleName = (userMetadata?.name as string) || (userMetadata?.full_name as string) || null
        const googleAvatar = (userMetadata?.picture as string) || (userMetadata?.avatar_url as string) || null

        const { data: currentProfile } = await supabaseAdmin
          .from("profiles")
          .select("full_name, avatar_url, email")
          .eq("id", userId)
          .single()

        const updates: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        }

        if (!currentProfile?.email && email) {
          updates.email = email
        }
        if (!currentProfile?.full_name && googleName) {
          updates.full_name = googleName
        }
        if (!currentProfile?.avatar_url && googleAvatar) {
          updates.avatar_url = googleAvatar
        }

        if (Object.keys(updates).length > 1) {
          await supabaseAdmin.from("profiles").update(updates).eq("id", userId)
        }
      } catch (error) {
        console.error("Error syncing OAuth data:", error)
      }
    }

    const buildRedirectUrl = (path: string) => {
      if (pendingPlan) {
        return `${origin}${path}?pendingPlan=${pendingPlan}&billingType=${billingType}`
      }
      return `${origin}${path}`
    }

    // Esto evita problemas en móvil donde las cookies pueden no estar disponibles inmediatamente
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      // Código intercambiado correctamente
      await syncOAuthDataToProfile(data.user.id, data.user.user_metadata || {}, data.user.email || "")

      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("user_type, full_name")
        .eq("id", data.user.id)
        .single()

      const isNewUser = !profile?.user_type

      if (isNewUser) {
        try {
          await fetch(`${origin}/api/auth/notify-registration`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: data.user.email,
              name:
                data.user.user_metadata?.full_name ||
                data.user.user_metadata?.name ||
                profile?.full_name ||
                "Usuario Google",
            }),
          })
        } catch (notifyError) {
          console.error("Error sending notification:", notifyError)
        }

        return NextResponse.redirect(buildRedirectUrl("/auth/select-user-type"))
      }

      return NextResponse.redirect(buildRedirectUrl(next))
    }

    if (error) {
      // El código puede haber sido ya intercambiado (doble petición en móvil)
      if (
        error.message?.includes("already used") ||
        error.message?.includes("invalid") ||
        error.code === "bad_oauth_state"
      ) {
        // Intentar obtener sesión existente
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession()

        if (existingSession?.user) {
          // Ya hay sesión, sincronizar datos y redirigir
          await syncOAuthDataToProfile(
            existingSession.user.id,
            existingSession.user.user_metadata || {},
            existingSession.user.email || "",
          )

          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("user_type")
            .eq("id", existingSession.user.id)
            .single()

          if (!profile?.user_type) {
            return NextResponse.redirect(buildRedirectUrl("/auth/select-user-type"))
          }

          return NextResponse.redirect(buildRedirectUrl(next))
        }

        // Esto ayuda en móviles donde las cookies pueden perderse
        console.error("Auth callback: code already used and no session found, redirecting to login")
      }

      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
