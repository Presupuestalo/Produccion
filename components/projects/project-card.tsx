"use client"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreVertical, Trash2, Edit, Eye, Share2 } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ShareProjectDialog } from "@/components/projects/share-project-dialog"
import { useState } from "react"

// Define ProjectCardProps type
type ProjectCardProps = {
  project: any // Replace 'any' with the actual project type
  onDelete: () => void
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [showShareDialog, setShowShareDialog] = useState(false)

  // Define handleDelete function
  const handleDelete = () => {
    onDelete()
  }

  return (
    <>
      <Card className={`hover:shadow-lg transition-shadow ${project.color}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">{project.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/projects/${project.id}`} className="flex items-center cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalles
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/projects/${project.id}/edit`} className="flex items-center cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                <Share2 className="mr-2 h-4 w-4" />
                Enviar a empresas
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
      </Card>

      {showShareDialog && (
        <ShareProjectDialog
          projectId={project.id}
          projectTitle={project.title}
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
        />
      )}
    </>
  )
}
