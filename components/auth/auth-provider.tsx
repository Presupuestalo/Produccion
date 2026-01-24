"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabase } from "@/lib/supabase/client"

type AuthContextType = {
  session: Session | null
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true
    let authListener: any = null

    const initAuth = async () => {
      console.log("CLIENT: AuthProvider initializing...")
      const supabaseClient = await getSupabase()

      if (!mounted) return

      if (!supabaseClient) {
        console.warn("CLIENT: ⚠️ Supabase client not available")
        setSession(null)
        setUser(null)
        setIsLoading(false)
        return
      }

      try {
        console.log("CLIENT: Getting initial session...")
        const { data, error } = await supabaseClient.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error("CLIENT: ❌ Error al obtener la sesión inicial:", error)
        }

        console.log("CLIENT: Initial session:", data.session?.user?.email || "NONE")
        setSession(data.session)
        setUser(data.session?.user || null)
        setIsLoading(false)
      } catch (error) {
        console.error("CLIENT: 💥 Fatal error initial session:", error)
        if (mounted) {
          setSession(null)
          setUser(null)
          setIsLoading(false)
        }
      }

      authListener = supabaseClient.auth.onAuthStateChange(async (event: string, newSession: Session | null) => {
        if (!mounted) return

        console.log(`CLIENT: Auth state changed [${event}]:`, newSession?.user?.email || "NO_USER")

        // Si es un evento de recuperación de contraseña, redirigir a update-password
        if (event === "PASSWORD_RECOVERY") {
          console.log("CLIENT: Password recovery detected")
          router.push("/auth/update-password")
          return
        }

        setSession(newSession)
        setUser(newSession?.user || null)
        setIsLoading(false)

        if (event === "SIGNED_OUT" && pathname?.startsWith("/dashboard")) {
          console.log("CLIENT: User signed out on protected route, redirecting to login")
          router.push("/auth/login")
        } else if (event === "SIGNED_IN") {
          console.log("CLIENT: SIGNED_IN event received")
          if (pathname === "/auth/login" || pathname === "/login" || pathname === "/") {
            const redirect = new URLSearchParams(window.location.search).get("redirect")
            console.log(`CLIENT: Redirecting to: ${redirect || "/dashboard"}`)
            router.push(redirect || "/dashboard")
          }
        }
      })
    }

    initAuth()

    return () => {
      mounted = false
      authListener?.data?.subscription?.unsubscribe()
    }
  }, [router, pathname])

  const signOut = async () => {
    const supabaseClient = await getSupabase()

    if (!supabaseClient) {
      console.warn("⚠️ Cannot sign out - Supabase client not available")
      return
    }

    try {
      await supabaseClient.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error)
    }
  }

  const value = {
    session,
    user,
    isLoading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export default AuthProvider
