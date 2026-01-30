"use client"

import React, { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { HeroV2 } from "@/components/landing/hero-v2"
import { FeaturesV2 } from "@/components/landing/features-v2"
import { HowItWorksV2 } from "@/components/landing/how-it-works-v2"
import { ComparisonV2 } from "@/components/landing/comparison-v2"
import { CustomPricesV2 } from "@/components/landing/custom-prices-v2"
import { PricingFree } from "@/components/landing/pricing-free"
import { UserTypes } from "@/components/landing/user-types"
import { Testimonials } from "@/components/landing/testimonials"

import { CTA } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"
import { useAuth } from "@/components/auth/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const [isCheckingProfile, setIsCheckingProfile] = useState(false)
  const hasCheckedProfile = useRef(false)

  useEffect(() => {
    const checkUserProfile = async () => {
      if (isLoading || !user || hasCheckedProfile.current) return

      hasCheckedProfile.current = true
      setIsCheckingProfile(true)

      try {
        const supabase = await createClient()
        if (!supabase) {
          setIsCheckingProfile(false)
          hasCheckedProfile.current = false
          return
        }

        const { data: profile, error } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

        if (error || !profile) {
          setIsCheckingProfile(false)
          hasCheckedProfile.current = false
          return
        }

        if (!profile.user_type) {
          router.push("/auth/select-user-type")
        } else {
          router.push("/dashboard")
        }
      } catch (error) {
        setIsCheckingProfile(false)
        hasCheckedProfile.current = false
      }
    }

    checkUserProfile()
  }, [user, isLoading, router, pathname])

  useEffect(() => {
    if (!user) {
      hasCheckedProfile.current = false
    }
  }, [user])

  if (isLoading || (user && isCheckingProfile)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-600" />
          <p className="text-gray-400">{isLoading ? "Cargando..." : "Verificando perfil..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <main>
        <HeroV2 />
        <FeaturesV2 />
        <HowItWorksV2 />
        <ComparisonV2 />
        <CustomPricesV2 />
        <UserTypes />
        <Testimonials />

        <PricingFree />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
