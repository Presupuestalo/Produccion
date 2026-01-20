"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, X, Brain, Wand2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getSubscriptionLimits } from "@/lib/services/subscription-limits-service"
import { AIPriceImportDialog } from "@/components/precios/ai-price-import-dialog"
import { useRouter } from "next/navigation"

type ExtractedPrice = {
  id: string
  code: string | null
  category: string
  subcategory: string
  description: string
  notes: string | null
  unit: string
  labor_cost: number
  material_cost: number
  equipment_cost: number
  other_cost: number
  final_price: number
}

export default function ImportadorPreciosPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedPrices, setExtractedPrices] = useState<ExtractedPrice[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const router = useRouter()
  const [result, setResult] = useState<{
    success: boolean
    message: string
    importedCount?: number
  } | null>(null)

  useEffect(() => {
    async function checkAccess() {
      const limits = await getSubscriptionLimits()
      if (limits && !limits.aiPriceImport) {
        setHasAccess(false)
        setShowUpgradeDialog(true)
      } else {
        setHasAccess(true)
      }
    }
    checkAccess()
  }, [])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile)
      setResult(null)
      setExtractedPrices([])
    } else {
      alert("Por favor, selecciona un archivo PDF válido")
    }
  }

  const handleExtractPrices = async () => {
    if (!file) return

    setIsProcessing(true)
    setResult(null)
    setExtractedPrices([])

    try {
      // Upload PDF to blob storage
      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Error al subir el archivo")
      }

      const { url } = await uploadResponse.json()

      // Extract prices from PDF (without importing)
      const response = await fetch("/api/ia/extract-prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pdfUrl: url }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Error response:", errorData)

        let errorMessage = errorData.error || "Error al procesar el presupuesto"

        // If there are additional details, show them
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`
        }

        // Log AI response for debugging if available
        if (errorData.aiResponse) {
          console.error("[v0] AI Response snippet:", errorData.aiResponse)
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (!data.prices || !Array.isArray(data.prices)) {
        throw new Error("Respuesta inválida del servidor: no se encontraron precios")
      }

      // Add unique IDs to each price for removal functionality
      const pricesWithIds = data.prices.map((price: any, index: number) => ({
        ...price,
        id: `price-${index}-${Date.now()}`,
      }))

      console.log("[v0] Successfully extracted", pricesWithIds.length, "prices")
      setExtractedPrices(pricesWithIds)
    } catch (error) {
      console.error("[v0] Error:", error)
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Error al extraer precios",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemovePrice = (id: string) => {
    setExtractedPrices((prev) => prev.filter((price) => price.id !== id))
  }

  const handleImportAll = async () => {
    if (extractedPrices.length === 0) return

    setIsImporting(true)
    setResult(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("Usuario no autenticado")
      }

      console.log("[v0] Importing", extractedPrices.length, "prices...")

      // Import prices to database
      const response = await fetch("/api/ia/save-prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prices: extractedPrices }),
      })

      // Check content type to determine how to parse the response
      const contentType = response.headers.get("content-type")
      const isJson = contentType?.includes("application/json")

      if (!response.ok) {
        let errorMessage = "Error al guardar los precios"

        if (isJson) {
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
            console.error("[v0] Server JSON error:", errorData)
          } catch (parseError) {
            console.error("[v0] Failed to parse error JSON:", parseError)
          }
        } else {
          // If not JSON, read as text to see the actual error
          const errorText = await response.text()
          console.error("[v0] Server non-JSON error (status " + response.status + "):", errorText)
          errorMessage = `Error del servidor (${response.status}): ${errorText.substring(0, 200)}`
        }

        throw new Error(errorMessage)
      }

      // Parse successful response
      let data
      if (isJson) {
        data = await response.json()
      } else {
        const text = await response.text()
        console.error("[v0] Expected JSON but got:", text)
        throw new Error("Respuesta inválida del servidor")
      }

      console.log("[v0] Import successful:", data)

      setResult({
        success: true,
        message: `Se importaron ${data.importedCount} precios exitosamente`,
        importedCount: data.importedCount,
      })

      // Clear extracted prices after successful import
      setExtractedPrices([])
      setFile(null)
    } catch (error) {
      console.error("[v0] Import error:", error)
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Error al importar precios",
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
            <Brain className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-purple-400 font-medium tracking-wide uppercase">Motor de Extracción IA</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Importa tus Precios <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 underline decoration-purple-500/30">Automáticamente</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
            Nuestra IA analiza tus presupuestos en PDF, identifica cada concepto y los organiza en tu base de datos personal.
          </p>
        </div>

        {/* Upload Card */}
        <Card className="bg-gray-800/50 border-gray-700 p-8 mb-6">
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-12 hover:border-yellow-500/50 transition-colors">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Sube tu presupuesto en PDF</h3>
              <p className="text-sm text-gray-400 mb-4 text-center">
                La IA analizará el documento y extraerá todos los conceptos, descripciones y precios
              </p>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
                disabled={isProcessing}
              />
              <label htmlFor="pdf-upload">
                <Button
                  variant="outline"
                  className="cursor-pointer bg-gray-700 hover:bg-gray-600 border-gray-600 hover:border-gray-500 text-white"
                  asChild
                  disabled={isProcessing}
                >
                  <span>Seleccionar PDF</span>
                </Button>
              </label>
            </div>

            {file && extractedPrices.length === 0 && (
              <div className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-xl border border-purple-500/20 shadow-lg shadow-purple-500/5">
                <FileText className="h-5 w-5 text-purple-400" />
                <div className="flex-1">
                  <p className="text-white font-semibold">{file.name}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-tighter">{(file.size / 1024).toFixed(2)} KB • LISTO PARA PROCESAR</p>
                </div>
                <Button
                  onClick={handleExtractPrices}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-none shadow-lg shadow-purple-500/20 px-6 font-bold"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Iniciar Análisis IA
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {isProcessing && (
          <Card className="bg-gray-800/50 border-gray-700 p-12 mb-6">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
                <Sparkles className="h-8 w-8 text-yellow-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Analizando tu presupuesto...</h3>
                <p className="text-gray-400">La IA está extrayendo todos los precios del documento</p>
              </div>
            </div>
          </Card>
        )}

        {extractedPrices.length > 0 && (
          <Card className="bg-gray-800/50 border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">Precios Extraídos ({extractedPrices.length})</h3>
                <p className="text-sm text-gray-400">Revisa los precios y elimina los que no quieras importar</p>
              </div>
              <Button
                onClick={handleImportAll}
                disabled={isImporting || extractedPrices.length === 0}
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Importar Todos ({extractedPrices.length})
                  </>
                )}
              </Button>
            </div>

            <div className="border border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-gray-900/50 sticky top-0">
                    <TableRow className="border-gray-700 hover:bg-transparent">
                      <TableHead className="text-gray-300 font-semibold">Categoría</TableHead>
                      <TableHead className="text-gray-300 font-semibold">Concepto</TableHead>
                      <TableHead className="text-gray-300 font-semibold">Descripción</TableHead>
                      <TableHead className="text-gray-300 font-semibold">Notas</TableHead>
                      <TableHead className="text-gray-300 font-semibold">Unidad</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-right">Precio</TableHead>
                      <TableHead className="text-gray-300 font-semibold w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedPrices.map((price) => (
                      <TableRow key={price.id} className="border-gray-700 hover:bg-gray-700/30">
                        <TableCell className="text-gray-300">{price.category}</TableCell>
                        <TableCell className="text-white font-medium">{price.subcategory}</TableCell>
                        <TableCell className="text-gray-400 max-w-xs truncate">{price.description}</TableCell>
                        <TableCell className="text-gray-400">{price.notes || "-"}</TableCell>
                        <TableCell className="text-gray-300">{price.unit}</TableCell>
                        <TableCell className="text-yellow-400 font-semibold text-right">
                          {price.final_price.toFixed(2)} €
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePrice(price.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>
        )}

        {/* Result */}
        {result && (
          <Card
            className={`p-6 ${result.success ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
              }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold mb-2 ${result.success ? "text-green-400" : "text-red-400"}`}>
                  {result.success ? "¡Importación Exitosa!" : "Error en la Importación"}
                </h3>
                <p className="text-gray-300">{result.message}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Info Section */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Card className="bg-gray-800/30 border-gray-700 p-6">
            <div className="text-center">
              <div className="inline-flex p-3 rounded-lg bg-yellow-500/10 mb-3">
                <Sparkles className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Extracción Inteligente</h3>
              <p className="text-sm text-gray-400">
                La IA identifica automáticamente conceptos, descripciones y precios
              </p>
            </div>
          </Card>
          <Card className="bg-gray-800/30 border-gray-700 p-6">
            <div className="text-center">
              <div className="inline-flex p-3 rounded-lg bg-yellow-500/10 mb-3">
                <CheckCircle2 className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Revisión Previa</h3>
              <p className="text-sm text-gray-400">Revisa y elimina precios antes de importar a tu base de datos</p>
            </div>
          </Card>
          <Card className="bg-gray-800/30 border-gray-700 p-6">
            <div className="text-center">
              <div className="inline-flex p-3 rounded-lg bg-yellow-500/10 mb-3">
                <FileText className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Base de Datos Personal</h3>
              <p className="text-sm text-gray-400">
                Los precios se guardan en tu base de datos para usar en presupuestos
              </p>
            </div>
          </Card>
        </div>
      </div>
      <AIPriceImportDialog
        open={showUpgradeDialog}
        onOpenChange={(open) => {
          setShowUpgradeDialog(open)
          if (!open && hasAccess === false) {
            router.push("/dashboard/precios")
          }
        }}
        mode="import"
      />
    </div>
  )
}
