"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Sparkles, ArrowLeft, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface UploadedFile {
  file: File
  id: string
  status: "pending" | "uploading" | "uploaded" | "error"
}

export default function ComparadorPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const router = useRouter()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (files.length + selectedFiles.length > 3) {
      alert("Solo puedes subir hasta 3 presupuestos")
      return
    }

    const newFiles: UploadedFile[] = selectedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: "pending",
    }))

    setFiles([...files, ...newFiles])
  }

  const removeFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id))
  }

  const handleAnalyze = async () => {
    if (files.length < 2) {
      alert("Necesitas subir al menos 2 presupuestos para comparar")
      return
    }

    setIsAnalyzing(true)

    try {
      // Subir archivos
      const formData = new FormData()
      files.forEach((f) => {
        formData.append("files", f.file)
      })

      const uploadResponse = await fetch("/api/ia/upload-budgets", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Error al subir archivos")
      }

      const { fileUrls } = await uploadResponse.json()

      // Iniciar análisis con IA
      const analysisResponse = await fetch("/api/ia/compare-budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrls }),
      })

      if (!analysisResponse.ok) {
        throw new Error("Error al analizar presupuestos")
      }

      const { analysisId: newAnalysisId } = await analysisResponse.json()
      setAnalysisId(newAnalysisId)

      // Redirigir a la página de resultados
      router.push(`/dashboard/ia/comparador/resultados/${newAnalysisId}`)
    } catch (error) {
      console.error("Error:", error)
      alert("Error al analizar presupuestos. Por favor, inténtalo de nuevo.")
      setIsAnalyzing(false)
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

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Comparador de Presupuestos</h1>
            <p className="text-gray-400 text-lg">Sube hasta 3 presupuestos y la IA los analizará en detalle</p>
          </div>

          <Card className="bg-gray-800/50 border-gray-700 p-8">
            <label
              htmlFor="file-upload"
              className="block border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-orange-500/50 transition-colors cursor-pointer"
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.docx,.xlsx,.xls,.doc"
                multiple
                onChange={handleFileSelect}
                disabled={files.length >= 3 || isAnalyzing}
              />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Arrastra tus presupuestos aquí</h3>
              <p className="text-gray-400 text-sm mb-4">
                o haz clic para seleccionar archivos (PDF, DOCX, XLSX) - Máximo 3 archivos
              </p>
              <div className="inline-block px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors">
                Seleccionar archivos
              </div>
            </label>

            {files.length > 0 && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Presupuestos cargados ({files.length}/3)</h3>
                </div>
                {files.map((uploadedFile) => (
                  <div key={uploadedFile.id} className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg group">
                    <FileText className="h-5 w-5 text-orange-400 flex-shrink-0" />
                    <span className="text-white flex-1 truncate">{uploadedFile.file.name}</span>
                    <span className="text-sm text-gray-400">
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    {uploadedFile.status === "uploaded" && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                    {uploadedFile.status === "error" && <AlertCircle className="h-5 w-5 text-red-400" />}
                    {!isAnalyzing && (
                      <button
                        onClick={() => removeFile(uploadedFile.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-5 w-5 text-gray-400 hover:text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  onClick={handleAnalyze}
                  disabled={files.length < 2 || isAnalyzing}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analizando con IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analizar con IA
                    </>
                  )}
                </Button>
                {files.length < 2 && (
                  <p className="text-sm text-gray-400 text-center">Necesitas al menos 2 presupuestos para comparar</p>
                )}
              </div>
            )}
          </Card>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <Card className="bg-gray-800/30 border-gray-700 p-4">
              <h4 className="text-white font-semibold mb-2">Análisis de diferencias</h4>
              <p className="text-gray-400 text-sm">Detecta variaciones en partidas, precios y cantidades</p>
            </Card>
            <Card className="bg-gray-800/30 border-gray-700 p-4">
              <h4 className="text-white font-semibold mb-2">Valoración de empresas</h4>
              <p className="text-gray-400 text-sm">Revisa reseñas y páginas web de las empresas</p>
            </Card>
            <Card className="bg-gray-800/30 border-gray-700 p-4">
              <h4 className="text-white font-semibold mb-2">Recomendación final</h4>
              <p className="text-gray-400 text-sm">Obtén una valoración objetiva basada en datos</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
