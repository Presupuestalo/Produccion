"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Image as ImageIcon } from "lucide-react"
import { getProfessionalWorks, deleteProfessionalWork } from "@/lib/services/professional-work-service"
import type { ProfessionalWork } from "@/types/professional-work"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { WorkFormDialog } from "@/components/professional-gallery/work-form-dialog"
import Image from "next/image"

export default function ProfessionalWorksPage() {
    const [works, setWorks] = useState<ProfessionalWork[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingWork, setEditingWork] = useState<ProfessionalWork | undefined>(undefined)
    const { toast } = useToast()

    const loadWorks = async () => {
        setIsLoading(true)
        try {
            const data = await getProfessionalWorks()
            setWorks(data)
        } catch (error) {
            console.error("Error loading works:", error)
            toast({
                title: "Error",
                description: "No se pudieron cargar los trabajos",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadWorks()
    }, [])

    const handleAddWork = () => {
        setEditingWork(undefined)
        setIsDialogOpen(true)
    }

    const handleEditWork = (work: ProfessionalWork) => {
        setEditingWork(work)
        setIsDialogOpen(true)
    }

    const handleDeleteWork = async (id: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este trabajo?")) return

        try {
            await deleteProfessionalWork(id)
            setWorks(works.filter((w) => w.id !== id))
            toast({
                title: "Trabajo eliminado",
                description: "El trabajo ha sido eliminado correctamente",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo eliminar el trabajo",
                variant: "destructive",
            })
        }
    }

    const handleSuccess = () => {
        setIsDialogOpen(false)
        loadWorks()
    }

    const refreshWorks = () => {
        loadWorks()
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Mi Galería de Trabajos</h1>
                    <p className="text-muted-foreground mt-2">
                        Gestiona los trabajos que muestras en tu perfil profesional
                    </p>
                </div>
                <Button onClick={handleAddWork}>
                    <Plus className="mr-2 h-4 w-4" /> Añadir Trabajo
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : works.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No tienes trabajos en tu galería</h3>
                        <p className="text-muted-foreground mb-6">
                            Añade tu primer trabajo para empezar a mostrar tu experiencia
                        </p>
                        <Button onClick={handleAddWork} variant="outline">
                            <Plus className="mr-2 h-4 w-4" /> Crear primer trabajo
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {works.map((work) => (
                        <Card key={work.id} className="overflow-hidden flex flex-col">
                            <div className="relative h-48 bg-muted">
                                {work.featured_image_url ? (
                                    <Image
                                        src={work.featured_image_url}
                                        alt={work.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        <ImageIcon className="h-12 w-12" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-2">
                                    {work.is_published ? (
                                        <Badge variant="default" className="bg-green-500">Publicado</Badge>
                                    ) : (
                                        <Badge variant="secondary">Borrador</Badge>
                                    )}
                                </div>
                            </div>
                            <CardHeader>
                                <CardTitle className="line-clamp-1">{work.title}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {work.description}
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="mt-auto flex justify-between gap-2 border-t pt-4">
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditWork(work)}>
                                    Editar
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteWork(work.id)}>
                                    Eliminar
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <WorkFormDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={handleSuccess}
                onPhotoUpdate={refreshWorks}
                work={editingWork}
            />
        </div>
    )
}
