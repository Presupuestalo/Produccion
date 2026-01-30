"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { checkFeature, FeatureFlag } from "@/lib/feature-flags"

export function useFeatureFlags() {
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClientComponentClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setUserEmail(session?.user?.email ?? null)
            setLoading(false)
        }
        getUser()
    }, [supabase])

    const isFeatureEnabled = (feature: FeatureFlag) => {
        if (loading) return false // Seguro por defecto
        return checkFeature(feature, userEmail)
    }

    return {
        isFeatureEnabled,
        userEmail,
        loading
    }
}
