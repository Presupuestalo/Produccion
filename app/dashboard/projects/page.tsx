import type { Metadata } from "next"
import { CreateProjectButton } from "@/components/dashboard/create-project-button"
import { ProjectsList } from "./projects-list"
import { ProjectsProvider } from "@/lib/contexts/projects-context"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { PlanUsageCompact } from "@/components/dashboard/plan-usage-compact"

export const metadata: Metadata = {
  title: "Mis Proyectos | Presupuéstalo",
  description: "Gestiona tus proyectos de reformas",
}

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function ProjectsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 mb-2">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 leading-tight">Mis Proyectos</h1>
          <p className="text-sm md:text-base text-slate-600 max-w-md">Gestiona todos tus proyectos de reformas en un solo lugar</p>
        </div>
        <CreateProjectButton className="w-full sm:w-auto shadow-sm" />
      </div>

      <PlanUsageCompact />

      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        }
      >
        <ProjectsProvider>
          <ProjectsList />
        </ProjectsProvider>
      </Suspense>
    </div>
  )
}
