"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ref = searchParams?.get("ref")

  useEffect(() => {
    if (ref) {
      sessionStorage.setItem("referral_code", ref)
      // Redirect to login so user can create account, then complete registration
      router.push("/auth/login?ref=" + ref)
    } else {
      router.push("/auth/login")
    }
  }, [ref, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center p-6 bg-white rounded-lg shadow-md">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
        <p>Procesando registro...</p>
      </div>
    </div>
  )
}
