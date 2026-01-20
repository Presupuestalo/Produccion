"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"

interface UserProfile {
  id: string
  user_type: "homeowner" | "professional" | "business"
  email?: string
  full_name?: string
  company_name?: string
  phone?: string
}

export function useUserProfile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setUserProfile(null)
          setLoading(false)
          return
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, user_type, full_name, company_name, phone")
          .eq("id", user.id)
          .maybeSingle()

        if (error) {
          console.error("[v0] Error loading user profile:", error)
          setUserProfile(null)
        } else if (profile) {
          setUserProfile({
            id: profile.id,
            user_type: profile.user_type,
            email: user.email,
            full_name: profile.full_name,
            company_name: profile.company_name,
            phone: profile.phone,
          })
        }
      } catch (error) {
        console.error("[v0] Error loading user profile:", error)
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadProfile()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { userProfile, loading }
}
