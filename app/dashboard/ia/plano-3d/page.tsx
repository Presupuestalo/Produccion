"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, Download, LayoutGrid, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function DistribucionesOptimizadasPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    area: "",
    habitaciones: "",
    banos: "",
    preferencias: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [distributions, setDistributions] = useState<string[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleGenerate = async () => {
    if (!formData.area || !formData.habitaciones || !formData.banos) {
      alert("Por favor, completa todos los campos obligatorios")
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/ia/generate-distributions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }))
        console.error("[Frontend] Server error:", errorData)
        throw new Error(errorData.error || "Error al generar distribuciones")
      }

      const { distributions: generatedDistributions } = await response.json()
      setDistributions(generatedDistributions)
    } catch (error) {
      console.error("[Frontend] Error:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      alert(`Error al generar distribuciones:\n\n${errorMessage}\n\nRevisa la consola para más detalles.`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (url: string, index: number) => {
    try {
      console.log("[v0] Iniciando descarga de imagen", { url: url.substring(0, 50), index })

      const base64Response = await fetch(url)
      const blob = await base64Response.blob()

      console.log("[v0] Blob creado", { size: blob.size, type: blob.type })

      const blobUrl = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `distribucion-opcion-${index + 1}-${Date.now()}.png`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
        console.log("[v0] Descarga completada y URL limpiada")
      }, 100)
    } catch (error) {
      console.error("[v0] Error descargando imagen:", error)
      alert("Error al descargar la imagen. Por favor, inténtalo de nuevo.")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="relative w-full h-full max-w-6xl max-h-[90vh]">
            <Image
              src={selectedImage || "/placeholder.svg"}
              alt="Distribución ampliada"
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <Link href="/dashboard/ia">
          <Button variant="ghost" className="text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a IA
          </Button>
        </Link>

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Distribuciones Generadas por IA</h1>
            <p className="text-gray-400 text-lg">Crea propuestas de planos optimizadas basadas en tus requisitos</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="bg-gray-800/50 border-gray-700 p-6 sticky top-6">
                <h3 className="text-white font-semibold mb-6">Requisitos del espacio</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="area" className="text-gray-300">
                      Área total (m²) *
                    </Label>
                    <Input
                      id="area"
                      name="area"
                      type="number"
                      placeholder="ej: 80"
                      value={formData.area}
                      onChange={handleInputChange}
                      className="bg-gray-700/50 border-gray-600 text-white mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="habitaciones" className="text-gray-300">
                      Número de habitaciones *
                    </Label>
                    <Input
                      id="habitaciones"
                      name="habitaciones"
                      type="number"
                      placeholder="ej: 3"
                      value={formData.habitaciones}
                      onChange={handleInputChange}
                      className="bg-gray-700/50 border-gray-600 text-white mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="banos" className="text-gray-300">
                      Número de baños *
                    </Label>
                    <Input
                      id="banos"
                      name="banos"
                      type="number"
                      placeholder="ej: 2"
                      value={formData.banos}
                      onChange={handleInputChange}
                      className="bg-gray-700/50 border-gray-600 text-white mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="preferencias" className="text-gray-300">
                      Preferencias adicionales
                    </Label>
                    <Textarea
                      id="preferencias"
                      name="preferencias"
                      placeholder="ej: Cocina abierta al salón, mucha luz natural, zona de trabajo..."
                      value={formData.preferencias}
                      onChange={handleInputChange}
                      className="bg-gray-700/50 border-gray-600 text-white mt-1 min-h-[100px]"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 h-12 mt-6"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <LayoutGrid className="h-5 w-5 mr-2" />
                      Generar distribuciones
                    </>
                  )}
                </Button>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="bg-gray-800/50 border-gray-700 p-6">
                <h3 className="text-white font-semibold mb-6">Propuestas de distribución</h3>
                {distributions.length === 0 ? (
                  <div className="h-[600px] flex flex-col items-center justify-center text-center p-8">
                    <LayoutGrid className="h-16 w-16 text-gray-500 mb-4" />
                    <p className="text-gray-400 text-lg mb-2">
                      {isGenerating
                        ? "Generando distribuciones optimizadas..."
                        : "Completa el formulario para generar distribuciones"}
                    </p>
                    <p className="text-gray-500 text-sm">
                      La IA creará 3 propuestas diferentes optimizadas para tu espacio
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {distributions.map((url, index) => (
                      <div key={index} className="space-y-2">
                        <div
                          className="relative aspect-square rounded-lg overflow-hidden bg-gray-900 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                          onClick={() => setSelectedImage(url)}
                        >
                          <Image
                            src={url || "/placeholder.svg"}
                            alt={`Distribución ${index + 1}`}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm font-medium">Opción {index + 1}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(url, index)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <div className="mt-6 grid md:grid-cols-3 gap-4">
                <Card className="bg-gray-800/30 border-gray-700 p-4">
                  <h4 className="text-white font-semibold mb-2 text-sm">Optimización espacial</h4>
                  <p className="text-gray-400 text-xs">Aprovecha al máximo cada metro cuadrado</p>
                </Card>
                <Card className="bg-gray-800/30 border-gray-700 p-4">
                  <h4 className="text-white font-semibold mb-2 text-sm">Múltiples opciones</h4>
                  <p className="text-gray-400 text-xs">3 propuestas diferentes para elegir</p>
                </Card>
                <Card className="bg-gray-800/30 border-gray-700 p-4">
                  <h4 className="text-white font-semibold mb-2 text-sm">Personalización</h4>
                  <p className="text-gray-400 text-xs">Adaptado a tus preferencias específicas</p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
