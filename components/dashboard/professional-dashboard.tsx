"use client"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Button } from "@/components/ui/button"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyActions } from "@/components/ui/empty"
import { FolderPlus, Plus } from "lucide-react"
import Link from "next/link"

interface ProfessionalDashboardProps {
  data: {
    totalProjects: number
    completedProjects: number
    inProgressProjects: number
    pendingProjects: number
    totalBudget: number
    projects: any[]
  }
}

export function ProfessionalDashboard({ data }: ProfessionalDashboardProps) {
  const { totalProjects, completedProjects, inProgressProjects, pendingProjects, totalBudget } = data

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel Profesional</h1>
        <p className="text-gray-600">Gestiona tus proyectos y clientes de manera eficiente</p>
      </div>

      {totalProjects === 0 ? (
        <Empty className="my-12 border-2 border-dashed border-gray-300 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50">
          <EmptyMedia>
            <div className="p-4 bg-blue-100 rounded-full">
              <FolderPlus className="h-12 w-12 text-blue-600" />
            </div>
          </EmptyMedia>
          <EmptyTitle className="text-2xl">¡Crea tu primer proyecto!</EmptyTitle>
          <EmptyDescription className="max-w-md text-center">
            Para comenzar a trabajar con Presupuéstalo, necesitas crear un proyecto. Podrás gestionar presupuestos,
            clientes y seguimiento de obras.
          </EmptyDescription>
          <EmptyActions>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/dashboard/projects" className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Crear Primer Proyecto
              </Link>
            </Button>
          </EmptyActions>
        </Empty>
      ) : (
        <>
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

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Bienvenido a Presupuéstalo</h2>
            <p className="mb-4">
              Esta es tu plataforma profesional para gestionar proyectos de reformas y crear presupuestos detallados.
            </p>
            <p>
              Utiliza las herramientas disponibles para crear presupuestos precisos y gestionar tus clientes de manera
              eficiente.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
