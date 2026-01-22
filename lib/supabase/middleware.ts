import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, skip auth checks
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: request.nextUrl.pathname.startsWith("/auth/callback"),
    },
  })

  if (!request.nextUrl.pathname.startsWith("/auth/callback")) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    let user = null
    if (session?.refresh_token) {
      const {
        data: { user: validatedUser },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        console.log("[v0] Session validation error, attempting refresh:", error.message)
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        if (!refreshError && refreshData.session) {
          user = refreshData.session.user
        }
      } else {
        user = validatedUser
      }
    }

    const isPublicRoute =
      request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname.startsWith("/auth") ||
      request.nextUrl.pathname === "/test-auth" ||
      request.nextUrl.pathname === "/debug" ||
      request.nextUrl.pathname === "/despedida"

    const isProtectedRoute =
      request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/projects")

    if (isProtectedRoute && !user) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
