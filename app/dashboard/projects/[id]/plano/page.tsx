import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getProjectById } from "@/lib/services/project-service"
import { FloorPlanViewer } from "@/components/calculator/floor-plan-viewer"

export const metadata: Metadata = {
  title: "Plano del Proyecto | Presupuéstalo",
  description: "Visualiza el plano del proyecto",
}

export default async function ProjectPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ embedded?: string }>
}) {
  const { id } = await params
  const { embedded } = await searchParams
  const supabase = await createClient()
  const project = await getProjectById(id, supabase)
  const isEmbedded = embedded === "true"

  if (!project) {
    notFound()
  }

  return (
    <div className={isEmbedded ? "" : "space-y-6 p-4"}>
      {!isEmbedded && (
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plano del Proyecto</h1>
          <p className="text-muted-foreground">{project.title}</p>
        </div>
      )}

      <div className="mt-4">
        <FloorPlanViewer projectId={id} />
      </div>
    </div>
  )
}
