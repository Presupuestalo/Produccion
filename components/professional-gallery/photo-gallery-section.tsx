"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, X, Upload, CheckCircle2, ImageIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { ProfessionalWork, ProfessionalWorkPhoto } from "@/types/professional-work"
import { deleteWorkPhoto } from "@/lib/services/professional-work-service"
import { compressImage } from "@/lib/utils/image-utils"
import Image from "next/image"

interface PhotoGallerySectionProps {
    work: ProfessionalWork
    onUpdate: () => void
}

export function PhotoGallerySection({ work, onUpdate }: PhotoGallerySectionProps) {
    const [isUploading, setIsUploading] = useState<string | null>(null) // null, 'featured', 'before', 'during', 'after'
    const { toast } = useToast()

    const MAX_FILES_PER_PHASE = 20
    const MAX_FILE_SIZE_MB = 10 // Aumentamos el límite de entrada porque vamos a comprimir
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, phase: string) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        // 1. Validar límite de fotos por sección (si no es 'featured')
        if (phase !== "featured") {
            const currentPhotosCount = work.photos?.filter(p => p.phase === phase).length || 0
            if (currentPhotosCount + files.length > MAX_FILES_PER_PHASE) {
                toast({
                    title: "Límite alcanzado",
                    description: `Solo puedes subir hasta ${MAX_FILES_PER_PHASE} fotos por sección. Actualmente tienes ${currentPhotosCount}.`,
                    variant: "destructive",
                })
                e.target.value = ""
                return
            }
        }

        setIsUploading(phase)
        let successCount = 0
        let errorCount = 0
        let tooLargeCount = 0

        try {
            for (let i = 0; i < files.length; i++) {
                let file = files[i]

                // 2. Si es demasiado grande (>10MB), descartar incluso antes de comprimir por rendimiento
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    tooLargeCount++
                    continue
                }

                // 3. Comprimir siempre si es posible
                try {
                    file = await compressImage(file, 1280, 0.7)
                } catch (compressError) {
                    console.error("[v0] Error comprimiendo:", compressError)
                    // Continuamos con el archivo original si falla la compresión
                }

                const formData = new FormData()
                formData.append("file", file)
                formData.append("workId", work.id)
                formData.append("phase", phase)

                const response = await fetch("/api/professional/works/upload-photo", {
                    method: "POST",
                    body: formData,
                })

                if (response.ok) {
                    successCount++
                } else {
                    errorCount++
                }
            }

            if (successCount > 0) {
                toast({
                    title: successCount > 1 ? `${successCount} fotos subidas` : "Foto subida",
                    description: successCount > 1
                        ? "Las imágenes se han guardado y comprimido correctamente"
                        : "La imagen se ha guardado y comprimido correctamente",
                })
                onUpdate()
            }

            if (tooLargeCount > 0) {
                toast({
                    title: "Archivos demasiado grandes",
                    description: `${tooLargeCount} archivos superan los ${MAX_FILE_SIZE_MB}MB. Por favor, intenta con archivos menos pesados.`,
                    variant: "destructive",
                })
            }

            if (errorCount > 0) {
                toast({
                    title: "Error parcial",
                    description: `No se pudieron subir ${errorCount} fotos`,
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error al procesar la subida",
                variant: "destructive",
            })
        } finally {
            setIsUploading(null)
            e.target.value = ""
        }
    }

    const handleDelete = async (photoId: string) => {
        try {
            await deleteWorkPhoto(photoId)
            toast({ title: "Foto eliminada" })
            onUpdate()
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" })
        }
    }

    const photosByPhase = (phase: "before" | "during" | "after") => {
        return work.photos?.filter((p) => p.phase === phase) || []
    }

    return (
        <div className="space-y-8">
            {/* Imagen Destacada */}
            <div className="space-y-4">
                <Label className="text-lg font-semibold">Imagen Destacada</Label>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="relative w-full md:w-64 h-40 bg-muted rounded-lg overflow-hidden border-2 border-dashed flex items-center justify-center">
                        {work.featured_image_url ? (
                            <Image src={work.featured_image_url} alt="Portada" fill className="object-cover" />
                        ) : (
                            <div className="text-center p-4">
                                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                <span className="text-xs text-muted-foreground">Sin portada</span>
                            </div>
                        )}
                        {isUploading === "featured" && (
                            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Esta es la imagen principal que se mostrará en el listado de la galería.
                        </p>
                        <div className="flex items-center gap-2">
                            <Input
                                type="file"
                                id="featured-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleUpload(e, "featured")}
                            />
                            <Button asChild variant="outline" size="sm" disabled={!!isUploading}>
                                <label htmlFor="featured-upload" className="cursor-pointer">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Cambiar Portada
                                </label>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <hr />

            {/* Fases del Proyecto */}
            <div className="space-y-8">
                <PhaseSection
                    title="Antes"
                    phase="before"
                    photos={photosByPhase("before")}
                    onUpload={(e) => handleUpload(e, "before")}
                    onDelete={handleDelete}
                    isUploading={isUploading === "before"}
                />
                <PhaseSection
                    title="Durante"
                    phase="during"
                    photos={photosByPhase("during")}
                    onUpload={(e) => handleUpload(e, "during")}
                    onDelete={handleDelete}
                    isUploading={isUploading === "during"}
                />
                <PhaseSection
                    title="Después"
                    phase="after"
                    photos={photosByPhase("after")}
                    onUpload={(e) => handleUpload(e, "after")}
                    onDelete={handleDelete}
                    isUploading={isUploading === "after"}
                />
            </div>
        </div>
    )
}

interface PhaseSectionProps {
    title: string
    phase: string
    photos: ProfessionalWorkPhoto[]
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    onDelete: (id: string) => void
    isUploading: boolean
}

function PhaseSection({ title, phase, photos, onUpload, onDelete, isUploading }: PhaseSectionProps) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2">
                    {title}
                    <Badge variant="outline" className="font-normal">{photos.length} fotos</Badge>
                </h3>
                <div className="flex flex-col items-end gap-1">
                    <Input
                        type="file"
                        id={`${phase}-upload`}
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={onUpload}
                    />
                    <Button asChild variant="ghost" size="sm" disabled={isUploading}>
                        <label htmlFor={`${phase}-upload`} className="cursor-pointer">
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Añadir fotos
                        </label>
                    </Button>
                    <span className="text-[10px] text-muted-foreground">Se comprimirán automáticamente</span>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {photos.map((photo) => (
                    <div key={photo.id} className="group relative aspect-square bg-muted rounded-md overflow-hidden border">
                        <Image src={photo.photo_url} alt={title} fill className="object-cover" />
                        <button
                            onClick={() => onDelete(photo.id)}
                            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
                {photos.length === 0 && !isUploading && (
                    <div className="aspect-square border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                        No hay fotos
                    </div>
                )}
                {isUploading && (
                    <div className="aspect-square border-2 border-dashed rounded-md flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}
            </div>
        </div>
    )
}
