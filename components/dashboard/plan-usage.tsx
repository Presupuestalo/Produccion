"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { getSubscriptionLimits, getUsageStats } from "@/lib/services/subscription-limits-service"
import type { SubscriptionLimits, UsageStats } from "@/lib/services/subscription-limits-service"

export function PlanUsage() {
  const { user } = useAuth()
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [planInfo, setPlanInfo] = useState<{ name: string; displayName: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsageData = async () => {
      if (!user) return

      setLoading(true)
      try {
        const [limitsData, usageData, subscriptionData] = await Promise.all([
          getSubscriptionLimits(),
          getUsageStats(),
          fetch("/api/subscription/status").then((res) => res.json()),
        ])
        setLimits(limitsData)
        setUsage(usageData)
        const planName = subscriptionData.plan || "free"
        setPlanInfo({
          name: planName,
          displayName: getPlanDisplayName(planName),
        })
      } catch (error) {
        console.error("Error al cargar datos de uso:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsageData()
  }, [user])

  if (loading || !limits || !usage) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Cargando información del plan...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const projectsLimit = limits.maxProjects || "∞"
  const projectsUsage = usage.currentProjects
  const projectsPercentage = limits.maxProjects ? (projectsUsage / limits.maxProjects) * 100 : 0

  const isProjectLimitReached = limits.maxProjects !== null && projectsUsage >= limits.maxProjects
  const needsUpgrade = projectsPercentage > 80

  const planName = planInfo?.displayName || "Plan Free"
  const planDescription = getPlanDescription(planInfo?.name || "free")

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">{planName}</CardTitle>
            <CardDescription>{planDescription}</CardDescription>
          </div>
          {limits.maxProjects !== null && (
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => (window.location.href = "/dashboard/planes")}
            >
              Mejorar Plan <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">
                Proyectos ({projectsUsage} de {projectsLimit})
              </span>
              {isProjectLimitReached && (
                <span className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" /> Límite alcanzado
                </span>
              )}
              {projectsPercentage > 80 && !isProjectLimitReached && (
                <span className="text-sm text-orange-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" /> Cerca del límite
                </span>
              )}
            </div>
            <Progress value={Math.min(projectsPercentage, 100)} className="h-2" />
            {isProjectLimitReached && (
              <p className="text-xs text-red-600 mt-1">
                Has alcanzado el límite de proyectos. Actualiza tu plan para crear más proyectos.
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 pb-4">
        <div className="w-full">
          <h4 className="text-sm font-medium mb-2">Características incluidas:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">
                {limits.maxProjects === null ? "Proyectos ilimitados" : `${limits.maxProjects} proyectos`}
              </span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">
                {limits.maxRooms === null ? "Habitaciones ilimitadas" : `${limits.maxRooms} habitaciones por proyecto`}
              </span>
            </div>
            {limits.pdfExport && (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">Exportación a PDF {limits.pdfWatermark && "(con marca de agua)"}</span>
              </div>
            )}
            {limits.quickEstimate && (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">Estimación rápida</span>
              </div>
            )}
            {limits.aiPriceImport && (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">IA para importar precios</span>
              </div>
            )}
            {limits.aiFloorPlanUpload && (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">IA para interpretar planos</span>
              </div>
            )}
          </div>

          {needsUpgrade && limits.maxProjects !== null && (
            <div className="mt-4 p-3 bg-orange-50 rounded-md border border-orange-200">
              <p className="text-sm text-orange-700 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Estás cerca de alcanzar los límites de tu plan. Considera actualizar para evitar restricciones.
              </p>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

function getPlanDisplayName(planName: string): string {
  const displayNames: Record<string, string> = {
    free: "Plan Free",
    basic: "Plan Basic",
    professional: "Plan Pro",
    pro: "Plan Pro",
    enterprise: "Plan Pro",
  }
  return displayNames[planName.toLowerCase()] || "Plan Free"
}

function getPlanDescription(planName: string): string {
  const descriptions: Record<string, string> = {
    free: "Perfecto para probar la plataforma",
    basic: "Para profesionales que empiezan",
    professional: "Todo el poder de la IA",
    pro: "Todo el poder de la IA",
    enterprise: "Todo el poder de la IA",
  }
  return descriptions[planName.toLowerCase()] || "Perfecto para probar la plataforma"
}
