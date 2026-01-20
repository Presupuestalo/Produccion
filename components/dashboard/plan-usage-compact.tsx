"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Sparkles } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth/auth-provider"
import { getSubscriptionLimits, getUsageStats } from "@/lib/services/subscription-limits-service"

export function PlanUsageCompact() {
  const { user } = useAuth()
  const [projectsCount, setProjectsCount] = useState(0)
  const [projectsLimit, setProjectsLimit] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUsage()
  }, [user])

  const loadUsage = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      const [limits, usage] = await Promise.all([getSubscriptionLimits(), getUsageStats()])

      if (limits && usage) {
        setProjectsLimit(limits.maxProjects || 0)
        setProjectsCount(usage.currentProjects)
      }
    } catch (error) {
      console.error("[v0] Error loading usage:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !user) return null

  const projectsPercentage = projectsLimit > 0 ? (projectsCount / projectsLimit) * 100 : 0
  const isNearLimit = projectsPercentage >= 80
  const isAtLimit = projectsCount >= projectsLimit && projectsLimit > 0

  // Solo mostrar si está cerca o en el límite
  if (!isNearLimit && !isAtLimit) return null

  return (
    <Alert variant={isAtLimit ? "destructive" : "default"} className="mb-6 border-l-4 p-3 md:p-4">
      <AlertCircle className="h-4 w-4 mt-0.5" />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ml-1">
        <div className="flex-1">
          {isAtLimit ? (
            <span className="text-sm">
              <strong>Límite alcanzado.</strong> Actualiza tu plan para crear más proyectos.
            </span>
          ) : (
            <span className="text-sm">
              <strong>Límite cerca.</strong> Has usado {projectsCount} de {projectsLimit} proyectos.
            </span>
          )}
        </div>
        <Button variant={isAtLimit ? "default" : "outline"} size="xs" className="h-8 w-full sm:w-auto px-3" asChild>
          <Link href="/dashboard/suscripcion">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            <span className="text-xs">{isAtLimit ? "Mejorar Plan" : "Ver Detalles"}</span>
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
