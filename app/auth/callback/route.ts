import { createServerClient } from "@supabase/ssr"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Memory log for production debugging
let authLogs: string[] = []

function logAuth(msg: string) {
  const entry = `${new Date().toISOString()} - ${msg}`
  authLogs.push(entry)
  if (authLogs.length > 100) authLogs.shift()
  console.log(`[AuthDebug] ${msg}`)
}

export { authLogs }

export async function GET(request: Request) {
  console.log("[AuthCallback] Request URL:", request.url)
  logAuth("========== AUTH CALLBACK START ==========")

  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  // Determinar el origen correcto de forma robusta
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = forwardedHost ? request.headers.get("x-forwarded-proto") || "https" : null
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : requestUrl.origin

  console.log("[AuthCallback] Parsed URL details:", { origin, codePresent: !!code, next })
  logAuth(`Origin: ${origin}, Code present: ${!!code}, Next: ${next}`)

  const pendingPlan = searchParams.get("pendingPlan")
  const billingType = searchParams.get("billingType") || "monthly"

  const errorParam = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  if (errorParam) {
    logAuth(`OAuth error: ${errorParam} - ${errorDescription}`)
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errorDescription || errorParam)}`)
  }

  if (code) {
    logAuth("Initializing clients...")
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
      const supabaseAdmin = createServiceClient(
        process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )

      const syncOAuthDataToProfile = async (userId: string, userMetadata: Record<string, unknown>, email: string) => {
        try {
          logAuth(`Syncing data for user: ${userId}`)
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
            const { error: updateError } = await supabaseAdmin.from("profiles").update(updates).eq("id", userId)
            if (updateError) throw updateError
            logAuth("Profile updated successfully")
          } else {
            logAuth("No profile updates needed")
          }
        } catch (error: any) {
          logAuth(`Error syncing OAuth data: ${error.message}`)
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

      logAuth("Exchanging code for session...")
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error && data?.user) {
        logAuth(`Session exchanged successfully for user: ${data.user.email}`)
        await syncOAuthDataToProfile(data.user.id, data.user.user_metadata || {}, data.user.email || "")

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("user_type, full_name")
          .eq("id", data.user.id)
          .single()

        const isNewUser = !profile?.user_type
        logAuth(`Is new user: ${isNewUser}`)

        if (isNewUser) {
          try {
            logAuth("Notifying registration...")
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
            logAuth(`Error sending notification: ${notifyError.message}`)
          }

          logAuth("Redirecting to select-user-type")
          return NextResponse.redirect(buildRedirectUrl("/auth/select-user-type"))
        }

        logAuth(`Redirecting to ${next}`)
        const redirectResponse = NextResponse.redirect(buildRedirectUrl(next))
        return redirectResponse
      }

      if (error) {
        logAuth(`Error during code exchange: ${error.message} (Code: ${error.code})`)

        // Attempt to see if we already have a session despite the code exchange error
        // (sometimes happens on rapid double-clicks or browser navigation back/forth)
        const { data: { session: existingSession } } = await supabase.auth.getSession()

        if (existingSession?.user) {
          logAuth(`Existing session found after exchange error: ${existingSession.user.email}`)
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

        // Si realmente no hay sesión, volver al login con el error
        const loginUrl = new URL(`${origin}/auth/login`)
        loginUrl.searchParams.set("error", error.message)
        loginUrl.searchParams.set("code", error.code || "unknown")
        loginUrl.searchParams.set("source", "exchange_failure")
        return NextResponse.redirect(loginUrl.toString())
      }
    } catch (fatal: any) {
      logAuth(`FATAL ERROR IN CALLBACK: ${fatal.message}`)
      console.error("[AuthCallback] Fatal error:", fatal)
      return NextResponse.redirect(`${origin}/auth/login?error=callback_fatal_error`)
    }
  }

  logAuth("No code provided, redirecting to login")
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
