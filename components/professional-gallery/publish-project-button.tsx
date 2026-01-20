"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ImageIcon, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createProfessionalWork } from "@/lib/services/professional-work-service"
import { useRouter } from "next/navigation"

interface PublishProjectButtonProps {
    project: any
}

export function PublishProjectButton({ project }: PublishProjectButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const handlePublish = async () => {
        setIsLoading(true)
        try {
            // Crear un trabajo profesional basado en el proyecto
            const work = await createProfessionalWork({
                title: project.title || "Nuevo Proyecto",
                description: project.description || "Proyecto realizado por Presupuéstalo",
                location: project.city || project.province || "",
                project_id: project.id,
                is_published: false, // Empezar como borrador para que añadan fotos
            })

            toast({
                title: "Proyecto enviado a la galería",
                description: "Se ha creado un borrador. Redirigiendo para editar...",
            })

            // Redirigir a la página de edición de trabajos (o abrir el diálogo)
            // Para simplificar, redirigimos a la galería
            router.push("/dashboard/professional/works")
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo enviar el proyecto a la galería",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button variant="outline" size="sm" className="h-9" onClick={handlePublish} disabled={isLoading}>
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <ImageIcon className="mr-2 h-4 w-4" />
            )}
            <span className="hidden sm:inline">Publicar en Galería</span>
            <span className="sm:hidden sr-only">Publicar</span>
        </Button>
    )
}
