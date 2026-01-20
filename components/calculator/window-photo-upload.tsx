"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Trash2, Camera, AlertCircle } from "lucide-react"
import Image from "next/image"
import { compressImage } from "@/lib/utils/image-utils"

interface WindowPhotoUploadProps {
  projectId: string
  windowId: string
  roomId: string
  onPhotoUploaded?: (photo: any) => void
}

export function WindowPhotoUpload({ projectId, windowId, roomId, onPhotoUploaded }: WindowPhotoUploadProps) {
  const [photos, setPhotos] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("[v0] WindowPhotoUpload - projectId:", projectId, "windowId:", windowId, "roomId:", roomId)
  }, [projectId, windowId, roomId])

  useEffect(() => {
    const loadPhotos = async () => {
      if (!projectId) {
        console.log("[v0] No projectId, skipping photo load")
        setLoading(false)
        return
      }

      try {
        console.log("[v0] Loading photos for project:", projectId, "window:", windowId)
        const res = await fetch(`/api/window-photos/list?projectId=${projectId}&windowId=${windowId}`)
        if (res.ok) {
          const data = await res.json()
          console.log("[v0] Photos loaded:", data.photos?.length || 0)
          setPhotos(data.photos || [])
        } else {
          console.log("[v0] Error loading photos:", res.status)
        }
      } catch (error) {
        console.error("[v0] Error cargando fotos:", error)
      } finally {
        setLoading(false)
      }
    }

    if (windowId) {
      loadPhotos()
    } else {
      setLoading(false)
    }
  }, [projectId, windowId])

  const uploadFile = async (file: File) => {
    if (!projectId) {
      setError("Guarda el proyecto primero para subir fotos")
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Comprimir la imagen antes de subir
      const compressedFile = await compressImage(file, 800, 0.6)

      const formData = new FormData()
      formData.append("file", compressedFile)
      formData.append("projectId", projectId)
      formData.append("windowId", windowId)
      formData.append("roomId", roomId)

      console.log("[v0] Uploading compressed photo - projectId:", projectId, "windowId:", windowId)

      const res = await fetch("/api/window-photos/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      console.log("[v0] Upload response:", data)

      if (res.ok && data.photo) {
        setPhotos((prev) => [...prev, data.photo])
        onPhotoUploaded?.(data.photo)
      } else {
        setError(data.error || "Error al subir la foto")
      }
    } catch (error) {
      console.error("[v0] Error subiendo foto:", error)
      setError("Error al procesar la imagen")
    } finally {
      setUploading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      await uploadFile(file)
    }

    e.currentTarget.value = ""
  }

  const handlePhotoDelete = async (photoId: string) => {
    try {
      const res = await fetch("/api/window-photos/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ photoId }),
      })

      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId))
      }
    } catch (error) {
      console.error("Error eliminando foto:", error)
    }
  }

  if (!projectId) {
    return (
      <Card className="p-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Guarda el proyecto para subir fotos</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-3">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          <span className="text-sm font-medium">Fotos de la Ventana</span>
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <Image
                  src={photo.photo_url || "/placeholder.svg"}
                  alt="Ventana"
                  width={150}
                  height={150}
                  className="rounded w-full h-32 object-cover"
                />
                <button
                  onClick={() => handlePhotoDelete(photo.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          {/* Botón Cámara - Solo visible en móvil */}
          <div className="flex-1 sm:hidden">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="hidden"
              id={`camera-input-${windowId}`}
            />
            <label htmlFor={`camera-input-${windowId}`} className="block">
              <Button
                asChild
                disabled={uploading}
                className="w-full cursor-pointer bg-transparent"
                variant="outline"
                size="sm"
              >
                <span>
                  <Camera className="h-4 w-4 mr-1" />
                  {uploading ? "Subiendo..." : "Hacer Foto"}
                </span>
              </Button>
            </label>
          </div>

          {/* Botón Subir Foto */}
          <div className="flex-1">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="hidden"
              id={`photo-input-${windowId}`}
            />
            <label htmlFor={`photo-input-${windowId}`} className="block">
              <Button
                asChild
                disabled={uploading}
                className="w-full cursor-pointer bg-transparent"
                variant="outline"
                size="sm"
              >
                <span>
                  <Upload className="h-4 w-4 mr-1" />
                  {uploading ? "Subiendo..." : "Subir Foto"}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </div>
    </Card>
  )
}
