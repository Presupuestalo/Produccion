"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"

interface ProjectActionsProps {
  projectId: string
  projectTitle: string
  onProjectPage?: boolean
}

export function ProjectActions({ projectId, onProjectPage = false }: ProjectActionsProps) {
  if (!projectId) {
    console.error("ProjectActions: ID de proyecto no definido")
    return null
  }

  return (
    <div className="flex gap-2">
      {!onProjectPage && (
        <Button asChild className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Link href={`/dashboard/projects/${projectId}`}>Ver proyecto</Link>
        </Button>
      )}
      <Button asChild variant="outline" className="gap-2 bg-transparent">
        <Link href={`/dashboard/projects/${projectId}/edit`}>
          <Edit className="h-4 w-4" />
          Editar
        </Link>
      </Button>
    </div>
  )
}
