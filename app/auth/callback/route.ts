import { createServerClient } from "@supabase/ssr"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

// Persistent log for production debugging (DB based)
async function logAuth(msg: string, data: any = {}) {
  console.log(`[AuthDebug] ${msg}`, data)
  try {
    await supabaseAdmin.from("debug_logs").insert({
      message: `AUTH: ${msg}`,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (e) {
    console.error("Failed to write to debug_logs:", e)
  }
}

export async function GET(request: Request) {
  console.log("[AuthCallback] Request URL:", request.url)
  await logAuth("START", { url: request.url })

  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  // Determinar el origen correcto de forma robusta
  const forwardedHost = request.headers.get("x-forwarded-host")
  const host = request.headers.get("host")
  const forwardedProto = forwardedHost ? request.headers.get("x-forwarded-proto") || "https" : null
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : requestUrl.origin

  await logAuth("PARSED_URL", { origin, host, forwardedHost, codePresent: !!code, next })

  const pendingPlan = searchParams.get("pendingPlan")
  const billingType = searchParams.get("billingType") || "monthly"

  const errorParam = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  if (errorParam) {
    await logAuth("OAUTH_ERROR", { errorParam, errorDescription })
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errorDescription || errorParam)}`)
  }

  if (code) {
    await logAuth("INITIALIZING_CLIENTS")
    const cookieStore = await cookies()

    try {
      // Usar NEXT_PUBLIC_SUPABASE_URL para Auth (dominio personalizado)
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

      // Usar SUPABASE_URL para Base de Datos (URL del proyecto)
      const supabaseAdminClient = createServiceClient(
        process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )

      const syncOAuthDataToProfile = async (userId: string, userMetadata: Record<string, unknown>, email: string) => {
        try {
          await logAuth("SYNC_START", { userId, email })
          const googleName = (userMetadata?.name as string) || (userMetadata?.full_name as string) || null
          const googleAvatar = (userMetadata?.picture as string) || (userMetadata?.avatar_url as string) || null

          const { data: currentProfile } = await supabaseAdminClient
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
            const { error: updateError } = await supabaseAdminClient.from("profiles").update(updates).eq("id", userId)
            if (updateError) throw updateError
            await logAuth("SYNC_SUCCESS")
          } else {
            await logAuth("SYNC_NO_UPDATES")
          }
        } catch (error: any) {
          await logAuth("SYNC_ERROR", { error: error.message })
        }
      }

      const buildRedirectUrl = (path: string) => {
        const url = new URL(path, origin)
        if (pendingPlan) {
          url.searchParams.set("pendingPlan", pendingPlan)
          url.searchParams.set("billingType", billingType)
        }
        return url.toString()
      }

      await logAuth("EXCHANGE_START")
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error && data?.user) {
        await logAuth("EXCHANGE_SUCCESS", { userEmail: data.user.email })
        await syncOAuthDataToProfile(data.user.id, data.user.user_metadata || {}, data.user.email || "")

        const { data: profile } = await supabaseAdminClient
          .from("profiles")
          .select("user_type, full_name")
          .eq("id", data.user.id)
          .single()

        const isNewUser = !profile?.user_type
        await logAuth("PROFILE_CHECK", { isNewUser })

        if (isNewUser) {
          try {
            await logAuth("NOTIFY_REGISTRATION_START")
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
          } catch (notifyError: any) {
            await logAuth("NOTIFY_REGISTRATION_ERROR", { error: notifyError.message })
          }

          const redirectUrl = buildRedirectUrl("/auth/select-user-type")
          await logAuth("REDIRECTING_NEW_USER", { redirectUrl })
          return NextResponse.redirect(redirectUrl)
        }

        const redirectUrl = buildRedirectUrl(next)
        await logAuth("REDIRECTING_EXISTING_USER", { redirectUrl })
        return NextResponse.redirect(redirectUrl)
      }

      if (error) {
        await logAuth("EXCHANGE_ERROR_CATCHED", { message: error.message, code: error.code })

        // Attempt to see if we already have a session despite the code exchange error
        const { data: { session: existingSession } } = await supabase.auth.getSession()

        if (existingSession?.user) {
          await logAuth("EXCHANGE_ERROR_EXISTING_SESSION_FOUND", { userEmail: existingSession.user.email })
          await syncOAuthDataToProfile(
            existingSession.user.id,
            existingSession.user.user_metadata || {},
            existingSession.user.email || "",
          )

          const { data: profile } = await supabaseAdminClient
            .from("profiles")
            .select("user_type")
            .eq("id", existingSession.user.id)
            .single()

          if (!profile?.user_type) {
            return NextResponse.redirect(buildRedirectUrl("/auth/select-user-type"))
          }

          return NextResponse.redirect(buildRedirectUrl(next))
        }

        // Si realmente no hay sesión, volver al login con el error
        const loginUrl = new URL(`${origin}/auth/login`)
        loginUrl.searchParams.set("error", error.message)
        loginUrl.searchParams.set("code", error.code || "unknown")
        loginUrl.searchParams.set("source", "exchange_failure")
        await logAuth("REDIRECTING_TO_LOGIN_WITH_ERROR", { loginUrl: loginUrl.toString() })
        return NextResponse.redirect(loginUrl.toString())
      }
    } catch (fatal: any) {
      await logAuth("FATAL_ERROR", { message: fatal.message, stack: fatal.stack })
      console.error("[AuthCallback] Fatal error:", fatal)
      return NextResponse.redirect(`${origin}/auth/login?error=callback_fatal_error`)
    }
  }

  await logAuth("NO_CODE_PROVIDED")
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
