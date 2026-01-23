import { createServerClient } from "@supabase/ssr"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

function logAuth(msg: string) {
  try {
    const logPath = path.join(process.cwd(), "auth_debug.log")
    const entry = `${new Date().toISOString()} - ${msg}\n`
    fs.appendFileSync(logPath, entry)
    console.log(`[AuthDebug] ${msg}`)
  } catch (e) {
    console.error("Failed to write to auth_debug.log", e)
  }
}

export async function GET(request: Request) {
  console.log("[AuthCallback] Request URL:", request.url)
  logAuth("========== AUTH CALLBACK START ==========")
  const url = new URL(request.url)
  const { searchParams, origin } = url
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

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

  console.log("Auth callback triggered with code:", code ? "exists" : "missing")

  if (code) {
    logAuth("Initializing clients...")
    const cookieStore = await cookies()

    try {
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
            await supabaseAdmin.from("profiles").update(updates).eq("id", userId)
            logAuth("Profile updated successfully")
          }
        } catch (error: any) {
          logAuth(`Error syncing OAuth data: ${error.message}`)
        }
      }

      const buildRedirectUrl = (path: string) => {
        if (pendingPlan) {
          return `${origin}${path}?pendingPlan=${pendingPlan}&billingType=${billingType}`
        }
        return `${origin}${path}`
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
        return NextResponse.redirect(buildRedirectUrl(next))
      }

      if (error) {
        logAuth(`Error during code exchange: ${error.message} (Code: ${error.code})`)
        if (
          error.message?.includes("already used") ||
          error.message?.includes("invalid") ||
          error.code === "bad_oauth_state"
        ) {
          logAuth("Checking for existing session...")
          const {
            data: { session: existingSession },
          } = await supabase.auth.getSession()

          if (existingSession?.user) {
            logAuth(`Existing session found: ${existingSession.user.email}`)
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
          logAuth("No existing session found")
        }

        return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
      }
    } catch (fatal: any) {
      logAuth(`FATAL ERROR IN CALLBACK: ${fatal.message}`)
      return NextResponse.redirect(`${origin}/auth/login?error=callback_fatal_error`)
    }
  }

  logAuth("No code provided, redirecting to login")
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
