"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem("cookie_consent")
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "accepted")
    setShowBanner(false)
    // Enable analytics cookies
    if (typeof window !== "undefined" && (window as any).gtag) {
      ; (window as any).gtag("consent", "update", {
        analytics_storage: "granted",
      })
    }
  }

  const rejectCookies = () => {
    localStorage.setItem("cookie_consent", "rejected")
    setShowBanner(false)
    // Disable analytics cookies
    if (typeof window !== "undefined" && (window as any).gtag) {
      ; (window as any).gtag("consent", "update", {
        analytics_storage: "denied",
      })
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 md:bottom-4 left-0 md:left-4 right-0 md:right-auto md:max-w-md z-[100] bg-background md:rounded-xl border md:border-border shadow-2xl p-4 md:p-6 mx-0 md:mx-4 mb-0 md:mb-4">
      <div className="flex flex-col gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground mb-1">
            Uso de cookies
          </p>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Utilizamos cookies para analizar nuestros servicios y ofrecerte una mejor experiencia.
            Consulta nuestra{" "}
            <Link href="/politica-cookies" className="text-orange-600 hover:underline font-medium">
              Política de Cookies
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={acceptCookies} size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white border-none">
            Aceptar
          </Button>
          <Button onClick={rejectCookies} variant="outline" size="sm" className="flex-1">
            Rechazar
          </Button>
        </div>
      </div>
    </div>
  )
}
