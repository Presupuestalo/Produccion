"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, ArrowLeft, Loader2, Download, Sparkles, ImageIcon, X, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RenderResult {
  id: string
  imageUrl: string
  prompt: string
  timestamp: string
}

const MATERIAL_OPTIONS = [
  { id: "parquet", name: "Parquet", category: "Suelo" },
  { id: "porcelanico", name: "Porcelánico", category: "Suelo" },
  { id: "marmol", name: "Mármol", category: "Suelo" },
  { id: "microcemento", name: "Microcemento", category: "Suelo" },
  { id: "pintura-lisa", name: "Pintura Lisa", category: "Paredes" },
  { id: "gotelé", name: "Gotelé", category: "Paredes" },
  { id: "papel-pintado", name: "Papel Pintado", category: "Paredes" },
  { id: "madera", name: "Madera", category: "Carpintería" },
  { id: "lacado", name: "Lacado", category: "Carpintería" },
]

const STYLE_OPTIONS = [
  { id: "modern", name: "Moderno", description: "Líneas limpias y minimalistas" },
  { id: "industrial", name: "Industrial", description: "Estilo urbano con materiales expuestos" },
  { id: "scandinavian", name: "Escandinavo", description: "Luminoso y acogedor" },
  { id: "rustic", name: "Rústico", description: "Cálido y natural" },
  { id: "contemporary", name: "Contemporáneo", description: "Elegante y sofisticado" },
  { id: "minimalist", name: "Minimalista", description: "Simplicidad y funcionalidad" },
]

export default function VisualizadorProPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [selectedStyle, setSelectedStyle] = useState<string>("")
  const [additionalDetails, setAdditionalDetails] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setRenderResult(null)
    }
  }

  const toggleMaterial = (materialId: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(materialId) ? prev.filter((id) => id !== materialId) : [...prev, materialId],
    )
  }

  const handleGenerate = async () => {
    if (!selectedFile) {
      alert("Por favor, sube una imagen")
      return
    }

    setIsGenerating(true)

    try {
      const formData = new FormData()
      formData.append("image", selectedFile)
      formData.append("materials", JSON.stringify(selectedMaterials))
      formData.append("style", selectedStyle)
      formData.append("details", additionalDetails)

      const response = await fetch("/api/ia/generate-render", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al generar render")
      }

      const { render } = await response.json()
      setRenderResult(render)
    } catch (error) {
      console.error("Error:", error)
      alert(error instanceof Error ? error.message : "Error al generar render. Por favor, inténtalo de nuevo.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `render-pro-${Date.now()}.png`
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">Visualizador Pro-Rápido</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Renders 3D Fotorrealistas</h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Sube una imagen de tu espacio y genera un render fotorrealista profesional con los materiales y estilo que
              elijas.
            </p>
          </div>

          {/* Benefits Bar */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <Card className="bg-emerald-500/10 border-emerald-500/20 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <div>
                  <div className="text-2xl font-bold text-white">Fotorrealista</div>
                  <div className="text-sm text-gray-400">Calidad profesional</div>
                </div>
              </div>
            </Card>
            <Card className="bg-emerald-500/10 border-emerald-500/20 p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-emerald-400" />
                <div>
                  <div className="text-2xl font-bold text-white">Render 3D</div>
                  <div className="text-sm text-gray-400">Desde plano superior</div>
                </div>
              </div>
            </Card>
            <Card className="bg-emerald-500/10 border-emerald-500/20 p-4">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-8 w-8 text-emerald-400" />
                <div>
                  <div className="text-2xl font-bold text-white">Personalizable</div>
                  <div className="text-sm text-gray-400">Materiales y estilos</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="bg-gray-800/50 border-gray-700 p-6">
                <h3 className="text-white font-semibold mb-4">1. Sube tu imagen</h3>
                {!previewUrl ? (
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-emerald-500/50 transition-colors">
                    <input
                      type="file"
                      id="image-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer block">
                      <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <h4 className="text-white font-medium mb-2">Sube una imagen del espacio</h4>
                      <p className="text-gray-400 text-sm mb-3">JPG, PNG o WEBP - Máximo 10MB</p>
                      <span className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md transition-colors">
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
                        setRenderResult(null)
                      }}
                    >
                      Cambiar imagen
                    </Button>
                  </div>
                )}
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 p-6">
                <h3 className="text-white font-semibold mb-4">2. Selecciona materiales (opcional)</h3>
                <div className="space-y-3">
                  {["Suelo", "Paredes", "Carpintería"].map((category) => (
                    <div key={category}>
                      <div className="text-sm text-gray-400 mb-2">{category}</div>
                      <div className="flex flex-wrap gap-2">
                        {MATERIAL_OPTIONS.filter((m) => m.category === category).map((material) => (
                          <button
                            key={material.id}
                            onClick={() => toggleMaterial(material.id)}
                            className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                              selectedMaterials.includes(material.id)
                                ? "bg-emerald-600 text-white"
                                : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
                            }`}
                          >
                            {material.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 p-6">
                <h3 className="text-white font-semibold mb-4">3. Estilo de diseño (opcional)</h3>
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                    <SelectValue placeholder="Selecciona un estilo" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {STYLE_OPTIONS.map((style) => (
                      <SelectItem key={style.id} value={style.id} className="text-white hover:bg-gray-700">
                        <div>
                          <div className="font-medium">{style.name}</div>
                          <div className="text-xs text-gray-400">{style.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 p-6">
                <h3 className="text-white font-semibold mb-4">4. Detalles adicionales (opcional)</h3>
                <Textarea
                  placeholder="Describe aspectos específicos: iluminación preferida, mobiliario, colores, ambiente deseado, etc."
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 min-h-[100px]"
                />
              </Card>

              <Button
                onClick={handleGenerate}
                disabled={!selectedFile || isGenerating}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 h-12"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generando render fotorrealista...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generar Render Pro
                  </>
                )}
              </Button>

              {isGenerating && (
                <Card className="bg-emerald-500/10 border-emerald-500/20 p-4">
                  <div className="flex items-start gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-white font-medium mb-2">Generando tu render fotorrealista...</div>
                      <div className="relative h-2 bg-gray-700/50 rounded-full overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse" />
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                          style={{
                            animation: "shimmer 2s infinite",
                            backgroundSize: "200% 100%",
                          }}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        Esto puede tardar unos minutos. La IA está creando una visualización profesional de alta
                        calidad.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Results Section */}
            <div>
              <Card className="bg-gray-800/50 border-gray-700 p-6">
                <h3 className="text-white font-semibold mb-4">5. Resultado</h3>
                {!renderResult ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-emerald-400" />
                    </div>
                    <p className="text-gray-400 mb-2">Tu render fotorrealista aparecerá aquí</p>
                    <p className="text-sm text-gray-500">Sube una imagen y genera tu visualización profesional</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">Render Generado</h4>
                        <p className="text-sm text-gray-400">{renderResult.timestamp}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                        onClick={() => handleDownload(renderResult.imageUrl)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Descargar
                      </Button>
                    </div>
                    <div
                      className="relative aspect-video rounded-lg overflow-hidden bg-gray-900 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedImage(renderResult.imageUrl)}
                    >
                      <Image
                        src={renderResult.imageUrl || "/placeholder.svg"}
                        alt="Render generado"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-white font-medium mb-1">Render fotorrealista completado</div>
                          <p className="text-sm text-gray-400">{renderResult.prompt}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 grid md:grid-cols-3 gap-4">
            <Card className="bg-gray-800/30 border-gray-700 p-4">
              <h4 className="text-white font-semibold mb-2">Calidad profesional</h4>
              <p className="text-gray-400 text-sm">Renders fotorrealistas de alta resolución listos para presentar</p>
            </Card>
            <Card className="bg-gray-800/30 border-gray-700 p-4">
              <h4 className="text-white font-semibold mb-2">Rápido y eficiente</h4>
              <p className="text-gray-400 text-sm">Resultados en minutos, no días</p>
            </Card>
            <Card className="bg-gray-800/30 border-gray-700 p-4">
              <h4 className="text-white font-semibold mb-2">Cierre de ventas</h4>
              <p className="text-gray-400 text-sm">Muestra el resultado exacto antes de iniciar la obra</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Modal */}
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
              alt="Render ampliado"
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
