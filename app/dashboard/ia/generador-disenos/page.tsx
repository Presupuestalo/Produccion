"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, ArrowLeft, Loader2, Download, RefreshCw, ImageIcon, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Textarea } from "@/components/ui/textarea"

interface GeneratedDesign {
  id: string
  style: string
  imageUrl: string
  prompt: string
}

const ROOM_TYPES = [
  { id: "bedroom", name: "Dormitorio", icon: "🛏️" },
  { id: "living", name: "Salón", icon: "🛋️" },
  { id: "kitchen", name: "Cocina", icon: "🍳" },
  { id: "bathroom", name: "Baño", icon: "🚿" },
  { id: "dining", name: "Comedor", icon: "🍽️" },
  { id: "office", name: "Oficina", icon: "💼" },
]

const DESIGN_STYLES = [
  { id: "modern", name: "Moderno", description: "Líneas limpias y minimalistas" },
  { id: "industrial", name: "Industrial", description: "Estilo urbano con materiales expuestos" },
  { id: "scandinavian", name: "Escandinavo", description: "Luminoso y acogedor" },
  { id: "rustic", name: "Rústico", description: "Cálido y natural" },
  { id: "contemporary", name: "Contemporáneo", description: "Elegante y sofisticado" },
  { id: "minimalist", name: "Minimalista", description: "Simplicidad y funcionalidad" },
]

export default function GeneradorDisenosPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [roomType, setRoomType] = useState<string>("")
  const [selectedStyle, setSelectedStyle] = useState<string>("")
  const [details, setDetails] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDesigns, setGeneratedDesigns] = useState<GeneratedDesign[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setGeneratedDesigns([])
    }
  }

  const handleGenerate = async () => {
    if (!selectedFile || !roomType || !selectedStyle) {
      alert("Por favor, selecciona una imagen, tipo de habitación y estilo")
      return
    }

    setIsGenerating(true)

    try {
      const formData = new FormData()
      formData.append("image", selectedFile)
      formData.append("roomType", roomType)
      formData.append("style", selectedStyle)
      formData.append("details", details)

      const response = await fetch("/api/ia/generate-designs", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al generar diseños")
      }

      const { designs } = await response.json()
      setGeneratedDesigns(designs)
    } catch (error) {
      console.error("Error:", error)
      alert(error instanceof Error ? error.message : "Error al generar diseños. Por favor, inténtalo de nuevo.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (imageUrl: string, style: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `diseno-${style}-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading image:", error)
      alert("Error al descargar la imagen")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Link href="/dashboard/ia">
          <Button variant="ghost" className="text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a IA
          </Button>
        </Link>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Generador de Diseños</h1>
            <p className="text-gray-400 text-lg">
              Sube una imagen de una habitación y obtén propuestas de diseño personalizadas
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="space-y-6">
              <Card className="bg-gray-800/50 border-gray-700 p-6">
                <h3 className="text-white font-semibold mb-4">1. Sube tu imagen</h3>
                {!previewUrl ? (
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-purple-500/50 transition-colors">
                    <input
                      type="file"
                      id="image-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer block">
                      <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <h4 className="text-white font-medium mb-2">Sube una imagen de UNA habitación</h4>
                      <p className="text-gray-400 text-sm mb-3">JPG, PNG o WEBP - Máximo 10MB</p>
                      <span className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors">
                        Seleccionar imagen
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
                      <Image src={previewUrl || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                      onClick={() => {
                        setSelectedFile(null)
                        setPreviewUrl(null)
                        setGeneratedDesigns([])
                      }}
                    >
                      Cambiar imagen
                    </Button>
                  </div>
                )}
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 p-6">
                <h3 className="text-white font-semibold mb-4">2. Tipo de habitación</h3>
                <div className="grid grid-cols-3 gap-3">
                  {ROOM_TYPES.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setRoomType(room.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        roomType === room.id
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-gray-600 hover:border-gray-500 bg-gray-700/30"
                      }`}
                    >
                      <div className="text-2xl mb-1">{room.icon}</div>
                      <div className="text-sm font-semibold text-white">{room.name}</div>
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 p-6">
                <h3 className="text-white font-semibold mb-4">3. Selecciona un estilo</h3>
                <div className="grid grid-cols-2 gap-3">
                  {DESIGN_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedStyle === style.id
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-gray-600 hover:border-gray-500 bg-gray-700/30"
                      }`}
                    >
                      <div className="font-semibold text-white mb-1">{style.name}</div>
                      <div className="text-xs text-gray-400">{style.description}</div>
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 p-6">
                <h3 className="text-white font-semibold mb-4">4. Detalles adicionales (opcional)</h3>
                <Textarea
                  placeholder="Describe detalles específicos que quieras incluir en el diseño: colores preferidos, muebles específicos, ambiente deseado, etc."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 min-h-[100px]"
                />
              </Card>

              <Button
                onClick={handleGenerate}
                disabled={!selectedFile || !roomType || !selectedStyle || isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 h-12"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generando diseño...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Generar diseño
                  </>
                )}
              </Button>
            </div>

            {/* Results Section */}
            <div>
              <Card className="bg-gray-800/50 border-gray-700 p-6">
                <h3 className="text-white font-semibold mb-4">5. Resultado</h3>
                {generatedDesigns.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">El diseño generado aparecerá aquí</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {generatedDesigns.map((design) => (
                      <div key={design.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-white font-medium">
                            Estilo {DESIGN_STYLES.find((s) => s.id === design.style)?.name}
                          </h4>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                            onClick={() => handleDownload(design.imageUrl, design.style)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Descargar
                          </Button>
                        </div>
                        <div
                          className="relative aspect-video rounded-lg overflow-hidden bg-gray-900 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage(design.imageUrl)}
                        >
                          <Image
                            src={design.imageUrl || "/placeholder.svg"}
                            alt={`Diseño ${design.style}`}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <p className="text-sm text-gray-400">{design.prompt}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 grid md:grid-cols-3 gap-4">
            <Card className="bg-gray-800/30 border-gray-700 p-4">
              <h4 className="text-white font-semibold mb-2">Mantiene estructura</h4>
              <p className="text-gray-400 text-sm">Paredes, puertas y ventanas permanecen intactas</p>
            </Card>
            <Card className="bg-gray-800/30 border-gray-700 p-4">
              <h4 className="text-white font-semibold mb-2">Validación automática</h4>
              <p className="text-gray-400 text-sm">Solo acepta imágenes de una habitación individual</p>
            </Card>
            <Card className="bg-gray-800/30 border-gray-700 p-4">
              <h4 className="text-white font-semibold mb-2">Alta calidad</h4>
              <p className="text-gray-400 text-sm">Renders fotorrealistas generados con IA avanzada</p>
            </Card>
          </div>
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="h-8 w-8" />
          </button>
          <div className="relative w-full h-full max-w-7xl max-h-[90vh]">
            <Image
              src={selectedImage || "/placeholder.svg"}
              alt="Diseño ampliado"
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
