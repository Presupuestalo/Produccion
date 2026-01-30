"use client"
import React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calculator, FileText, Home, Zap, ArrowRight, FolderPlus } from "lucide-react"
import Link from "next/link"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyActions } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

interface HomeownerDashboardProps {
  data: {
    totalProjects: number
    completedProjects: number
    inProgressProjects: number
    pendingProjects: number
    totalBudget: number
    projects: any[]
  }
}

export function HomeownerDashboard({ data }: HomeownerDashboardProps) {
  const { totalProjects, completedProjects, inProgressProjects, pendingProjects, totalBudget } = data
  const [isMaster, setIsMaster] = React.useState(false)

  React.useEffect(() => {
    const checkMaster = async () => {
      const { createBrowserClient } = await import("@/lib/supabase/client")
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
        setIsMaster(profile?.role === "master")
      }
    }
    checkMaster()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Hola! Bienvenido a tu espacio</h1>
        <p className="text-gray-600">Gestiona tus proyectos de reforma de manera sencilla</p>
      </div>

      {totalProjects === 0 ? (
        <Empty className="my-12 border-2 border-dashed border-gray-300 rounded-lg bg-gradient-to-br from-orange-50 to-blue-50">
          <EmptyMedia>
            <div className="p-4 bg-orange-100 rounded-full">
              <FolderPlus className="h-12 w-12 text-orange-600" />
            </div>
          </EmptyMedia>
          <EmptyTitle className="text-2xl">¡Comienza tu primer proyecto!</EmptyTitle>
          <EmptyDescription className="max-w-md text-center">
            Para empezar a usar Presupuéstalo, necesitas crear un proyecto. Puedes obtener una estimación rápida o crear
            un presupuesto detallado.
          </EmptyDescription>
          <EmptyActions className="flex-col sm:flex-row gap-3">
            {isMaster && (
              <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700">
                <Link href="/dashboard/ia/estimacion-rapida" className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Estimación Rápida
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline" className="border-blue-300 hover:bg-blue-50 bg-transparent">
              <Link href="/dashboard/projects" className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Proyecto Detallado
              </Link>
            </Button>
          </EmptyActions>
        </Empty>
      ) : (
        <>
          {/* Opciones principales para propietarios */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {isMaster && (
              <Card className="relative overflow-hidden border-2 border-orange-200 hover:border-orange-300 transition-colors">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Zap className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Estimación Rápida</CardTitle>
                      <CardDescription>Obtén un precio orientativo en minutos</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Calcula una estimación aproximada del coste de tu reforma con datos básicos.
                  </p>
                  <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                    <Link href="/dashboard/ia/estimacion-rapida" className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Calcular Estimación
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className={cn(
              "relative overflow-hidden border-2 border-blue-200 hover:border-blue-300 transition-colors",
              !isMaster && "md:col-span-2"
            )}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Presupuesto Detallado</CardTitle>
                    <CardDescription>Análisis completo y profesional</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Crea un presupuesto detallado con medidas exactas y materiales específicos.
                </p>
                <Button asChild variant="outline" className="w-full border-blue-200 hover:bg-blue-50 bg-transparent">
                  <Link href="/dashboard/projects" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Crear Proyecto Detallado
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard title="Proyectos Totales" value={totalProjects} iconType="file" color="bg-blue-500" />
            <StatsCard title="Proyectos Completados" value={completedProjects} iconType="trend" color="bg-green-500" />
            <StatsCard
              title="Proyectos en Progreso"
              value={inProgressProjects}
              iconType="trend"
              color="bg-orange-500"
            />
            <StatsCard title="Proyectos Pendientes" value={pendingProjects} iconType="file" color="bg-purple-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <StatsCard
              title="Presupuesto Total"
              value={`${totalBudget.toLocaleString("es-ES")} €`}
              description="Suma de todos los presupuestos"
              iconType="dollar"
              color="bg-emerald-500"
            />
            <StatsCard
              title="Presupuesto Promedio"
              value={
                totalProjects > 0
                  ? `${(totalBudget / totalProjects).toLocaleString("es-ES", {
                    maximumFractionDigits: 2,
                  })} €`
                  : "0 €"
              }
              description="Presupuesto promedio por proyecto"
              iconType="dollar"
              color="bg-cyan-500"
            />
          </div>

          {/* Proyectos recientes */}
          <Card>
            <CardHeader>
              <CardTitle>Tus Proyectos Recientes</CardTitle>
              <CardDescription>Gestiona y revisa tus proyectos de reforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Button asChild>
                  <Link href="/dashboard/projects">Ver Todos los Proyectos</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
