"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Camera, Loader2, Trash2, X, ImageIcon, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { compressImage } from "@/lib/utils/image-utils"

interface ProjectGalleryProps {
  projectId: string
}

type Phase = "before" | "during" | "after"

interface Photo {
  id: string
  project_id: string
  room_name: string | null
  phase: Phase
  photo_url: string // Changed from image_url to photo_url to match database schema
  created_at: string
}

export function ProjectGallery({ projectId }: ProjectGalleryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<Phase>("before")
  const [photos, setPhotos] = useState<Record<Phase, Photo[]>>({
    before: [],
    during: [],
    after: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<Photo | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    console.log("[v0] ProjectGallery montado con projectId:", projectId)
  }, [projectId])

  useEffect(() => {
    if (isOpen) {
      console.log("[v0] ProjectGallery - Modal abierto, cargando fotos...")
      loadPhotos()
    }
  }, [isOpen, projectId])

  const loadPhotos = async () => {
    console.log("[v0] ProjectGallery - Iniciando carga de fotos para proyecto:", projectId)
    setIsLoading(true)
    try {
      const url = `/api/room-photos/list?projectId=${projectId}`
      console.log("[v0] ProjectGallery - Llamando a API:", url)

      const response = await fetch(url)
      console.log("[v0] ProjectGallery - Respuesta de API:", response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] ProjectGallery - Error en respuesta:", errorText)
        throw new Error("Error al cargar fotos")
      }

      const data = await response.json()
      console.log("[v0] ProjectGallery - Datos recibidos:", data)

      const groupedPhotos: Record<Phase, Photo[]> = {
        before: [],
        during: [],
        after: [],
      }

      data.allPhotos.forEach((photo: Photo) => {
        if (photo.phase in groupedPhotos) {
          groupedPhotos[photo.phase].push(photo)
        }
      })

      console.log("[v0] ProjectGallery - Fotos agrupadas:", {
        before: groupedPhotos.before.length,
        during: groupedPhotos.during.length,
        after: groupedPhotos.after.length,
      })

      setPhotos(groupedPhotos)
    } catch (error) {
      console.error("[v0] ProjectGallery - Error al cargar fotos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las fotos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const totalPhotos = photos.before.length + photos.during.length + photos.after.length

    if (totalPhotos >= 20) {
      toast({
        title: "Límite alcanzado",
        description: "Has alcanzado el límite de 20 fotos por proyecto",
        variant: "destructive",
      })
      return
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Formato no válido",
        description: "Por favor, selecciona una imagen",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Comprimimos la imagen automáticamente
      const compressedFile = await compressImage(file, 1280, 0.7)

      const formData = new FormData()
      formData.append("file", compressedFile)
      formData.append("projectId", projectId)
      formData.append("phase", currentPhase)

      const response = await fetch("/api/room-photos/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al subir foto")
      }

      toast({
        title: "Foto subida",
        description: "La foto se ha subido y comprimido correctamente",
      })

      await loadPhotos()
    } catch (error) {
      console.error("[v0] Error al subir foto:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo subir la foto",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleUploadClick = () => {
    console.log("[v0] ProjectGallery - handleUploadClick ejecutado")
    console.log("[v0] ProjectGallery - fileInputRef.current:", fileInputRef.current)

    if (fileInputRef.current) {
      console.log("[v0] ProjectGallery - Haciendo click en input")
      fileInputRef.current.click()
    } else {
      console.error("[v0] ProjectGallery - fileInputRef.current es null!")
    }
  }

  const handleDelete = async (photoId: string, photoUrl: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta foto?")) return

    try {
      const response = await fetch("/api/room-photos/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, photoUrl }),
      })

      if (!response.ok) throw new Error("Error al eliminar foto")

      toast({
        title: "Foto eliminada",
        description: "La foto se ha eliminado correctamente",
      })

      await loadPhotos()

      if (selectedImage?.id === photoId) {
        setSelectedImage(null)
      }
    } catch (error) {
      console.error("Error al eliminar foto:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la foto",
        variant: "destructive",
      })
    }
  }

  const handleSyncToPortfolio = async () => {
    const totalPhotos = photos.before.length + photos.during.length + photos.after.length

    if (totalPhotos === 0) {
      toast({
        title: "Sin fotos",
        description: "Primero debes subir algunas fotos al proyecto",
        variant: "destructive",
      })
      return
    }

    if (!confirm("Esto creará o actualizará este proyecto en tu Galería Pública de trabajos. ¿Deseas continuar?")) return

    setIsSyncing(true)
    try {
      const response = await fetch("/api/professional/works/sync-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          // Podríamos pasar título/descripción personalizados aquí si quisiéramos
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al sincronizar")
      }

      const result = await response.json()

      toast({
        title: "¡Publicado!",
        description: `Se han sincronizado las imágenes con tu galería profesional.`,
      })
    } catch (error) {
      console.error("Error al sincronizar con portfolio:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo sincronizar",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const getPhaseLabel = (phase: Phase) => {
    switch (phase) {
      case "before":
        return "Antes"
      case "during":
        return "Durante"
      case "after":
        return "Reformado"
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent h-8"
            onClick={() => {
              console.log("[v0] ProjectGallery - Botón Galería presionado")
            }}
          >
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Galería</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pr-8">
            <DialogTitle>Galería del Proyecto</DialogTitle>
            <Button
              size="sm"
              variant="outline"
              className="text-primary border-primary hover:bg-primary/10 gap-2"
              onClick={handleSyncToPortfolio}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Publicar en Portfolio</span>
            </Button>
          </DialogHeader>

          <Tabs value={currentPhase} onValueChange={(v) => setCurrentPhase(v as Phase)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="before">Antes ({photos.before.length})</TabsTrigger>
              <TabsTrigger value="during">Durante ({photos.during.length})</TabsTrigger>
              <TabsTrigger value="after">Reformado ({photos.after.length})</TabsTrigger>
            </TabsList>

            {(["before", "during", "after"] as Phase[]).map((phase) => (
              <TabsContent key={phase} value={phase} className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={(e) => {
                      console.log("[v0] ProjectGallery - Botón Subir Foto presionado")
                      e.preventDefault()
                      e.stopPropagation()
                      handleUploadClick()
                    }}
                    disabled={isUploading}
                    className="gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4" />
                        Subir Foto
                      </>
                    )}
                  </Button>
                  <div className="text-sm text-muted-foreground flex items-center">
                    {photos.before.length + photos.during.length + photos.after.length} / 20 fotos
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : photos[phase].length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No hay fotos en esta fase. Usa el botón de arriba para agregar fotos.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos[phase].map((photo) => (
                      <div key={photo.id} className="relative group">
                        <div
                          className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                          onClick={() => setSelectedImage(photo)} // Changed from image_url to photo_url
                        >
                          <img
                            src={photo.photo_url || "/placeholder.svg"} // Changed from image_url to photo_url
                            alt={`Foto ${getPhaseLabel(phase)}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(photo.id, photo.photo_url)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {photo.room_name && photo.room_name !== "Proyecto" && (
                          <p className="text-xs text-center mt-1 text-muted-foreground truncate">{photo.room_name}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>

      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-5xl p-0">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-5 w-5" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 left-2 z-10"
                onClick={() => {
                  handleDelete(selectedImage.id, selectedImage.photo_url)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <img
                src={selectedImage.photo_url || "/placeholder.svg"}
                alt="Foto ampliada"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
