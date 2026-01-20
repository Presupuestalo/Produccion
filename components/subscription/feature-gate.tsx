"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, ExternalLink } from "lucide-react"
import Link from "next/link"

interface FeatureGateProps {
  feature: string
  featureName: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function FeatureGate({ feature, featureName, children, fallback }: FeatureGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  useEffect(() => {
    checkAccess()
  }, [feature])

  const checkAccess = async () => {
    try {
      const response = await fetch(`/api/subscription/check-feature?feature=${feature}`)
      const data = await response.json()
      setHasAccess(data.hasAccess)
    } catch (error) {
      console.error("[v0] Error checking feature access:", error)
      setHasAccess(false)
    }
  }

  if (hasAccess === null) {
    return null // Loading
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <Card className="border-orange-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-600" />
            <CardTitle>Función Premium</CardTitle>
          </div>
          <CardDescription>{featureName} está disponible en planes superiores</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Actualiza tu plan para desbloquear esta característica y muchas más.
          </p>
          <Button asChild className="w-full">
            <Link href="/dashboard/ajustes">
              Ver Planes
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}
