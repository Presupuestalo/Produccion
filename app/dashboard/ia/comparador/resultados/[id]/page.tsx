"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Star } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

interface LineItem {
  category: string
  description: string
  unit: string
  quantity?: number
  prices: Array<{
    budgetIndex: number
    unitPrice?: number
    totalPrice: number
    notes?: string
  }>
}

interface BudgetComparison {
  summary: string
  budgets: Array<{
    name: string
    totalPrice: number
    totalPriceWithVAT: number
    company: string
    companyRating?: number
    companyReviews?: number
    presentationScore: number
    detailScore: number
  }>
  lineItemsComparison: LineItem[]
  differences: Array<{
    category: string
    description: string
    impact: "high" | "medium" | "low"
  }>
  recommendation: {
    bestOption: number
    reasoning: string
    pros: string[]
    cons: string[]
    warnings: string[]
    questionsToAsk: string[]
  }
}

export default function ResultadosPage() {
  const params = useParams()
  const [analysis, setAnalysis] = useState<BudgetComparison | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/ia/compare-budgets/${params.id}`)
        if (!response.ok) {
          throw new Error("Error al cargar el análisis")
        }
        const data = await response.json()
        setAnalysis(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalysis()
  }, [params.id])

  const getPriceColor = (prices: LineItem["prices"], currentPrice: number) => {
    const validPrices = prices.filter((p) => p.totalPrice > 0).map((p) => p.totalPrice)
    if (validPrices.length === 0) return ""

    const minPrice = Math.min(...validPrices)
    const maxPrice = Math.max(...validPrices)

    if (currentPrice === minPrice && minPrice !== maxPrice) {
      return "bg-green-500/20 text-green-400 font-semibold"
    }
    if (currentPrice === maxPrice && minPrice !== maxPrice) {
      return "bg-red-500/20 text-red-400 font-semibold"
    }
    return ""
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-orange-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Analizando presupuestos con IA...</p>
          <p className="text-gray-400 text-sm mt-2">Esto puede tardar unos segundos</p>
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800/50 border-gray-700 p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold text-center mb-2">Error al cargar análisis</h2>
          <p className="text-gray-400 text-center mb-4">{error}</p>
          <Link href="/dashboard/ia/comparador">
            <Button className="w-full bg-orange-600 hover:bg-orange-700">Volver al comparador</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-400 bg-red-400/10 border-red-400/20"
      case "medium":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
      case "low":
        return "text-green-400 bg-green-400/10 border-green-400/20"
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Link href="/dashboard/ia/comparador">
          <Button variant="ghost" className="text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Nueva comparación
          </Button>
        </Link>

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-4">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">Análisis completado</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Resultados del Análisis</h1>
            <p className="text-gray-400 text-lg">{analysis.summary}</p>
          </div>

          {/* Budget Comparison Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {analysis.budgets.map((budget, index) => (
              <Card
                key={index}
                className={`bg-gray-800/50 border-gray-700 p-6 ${
                  index === analysis.recommendation.bestOption ? "ring-2 ring-orange-500" : ""
                }`}
              >
                {index === analysis.recommendation.bestOption && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full mb-4">
                    <Star className="h-3 w-3 text-orange-400 fill-orange-400" />
                    <span className="text-xs text-orange-400 font-medium">Recomendado</span>
                  </div>
                )}
                <h3 className="text-white font-bold text-lg mb-2">{budget.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{budget.company}</p>
                {budget.companyRating && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-semibold">{budget.companyRating.toFixed(1)}</span>
                    </div>
                    <span className="text-gray-400 text-sm">({budget.companyReviews} reseñas)</span>
                  </div>
                )}
                <div className="space-y-2 mb-4">
                  <div>
                    <span className="text-gray-400 text-sm">Sin IVA:</span>
                    <div className="text-2xl font-bold text-white">{budget.totalPrice.toLocaleString()}€</div>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Con IVA:</span>
                    <div className="text-xl font-semibold text-orange-400">
                      {budget.totalPriceWithVAT.toLocaleString()}€
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Presentación:</span>
                    <span className="text-white font-semibold ml-1">{budget.presentationScore}/10</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Detalle:</span>
                    <span className="text-white font-semibold ml-1">{budget.detailScore}/10</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {analysis.lineItemsComparison && analysis.lineItemsComparison.length > 0 && (
            <Card className="bg-gray-800/50 border-gray-700 p-8 mb-8 overflow-x-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Comparativa Detallada de Partidas</h2>
              <div className="text-sm text-gray-400 mb-4">
                <span className="inline-block px-2 py-1 bg-green-500/20 text-green-400 rounded mr-2">Verde</span>= Más
                económico
                <span className="inline-block px-2 py-1 bg-red-500/20 text-red-400 rounded ml-4 mr-2">Rojo</span>= Más
                caro
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-white font-semibold p-3">Partida</th>
                    <th className="text-left text-white font-semibold p-3">Unidad</th>
                    <th className="text-left text-white font-semibold p-3">Cantidad</th>
                    {analysis.budgets.map((budget, index) => (
                      <th key={index} className="text-right text-white font-semibold p-3">
                        {budget.company}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analysis.lineItemsComparison.map((item, itemIndex) => (
                    <tr key={itemIndex} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                      <td className="p-3">
                        <div className="text-white font-medium">{item.category}</div>
                        <div className="text-gray-400 text-sm">{item.description}</div>
                      </td>
                      <td className="p-3 text-gray-300">{item.unit}</td>
                      <td className="p-3 text-gray-300">{item.quantity || "-"}</td>
                      {analysis.budgets.map((_, budgetIndex) => {
                        const priceData = item.prices.find((p) => p.budgetIndex === budgetIndex)
                        return (
                          <td key={budgetIndex} className="p-3 text-right">
                            {priceData ? (
                              <div
                                className={`inline-block px-2 py-1 rounded ${getPriceColor(item.prices, priceData.totalPrice)}`}
                              >
                                {priceData.totalPrice > 0 ? `${priceData.totalPrice.toLocaleString()}€` : "No incluido"}
                                {priceData.unitPrice && (
                                  <div className="text-xs opacity-70">
                                    {priceData.unitPrice.toLocaleString()}€/{item.unit}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">No incluido</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* Differences */}
          <Card className="bg-gray-800/50 border-gray-700 p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Diferencias Detectadas</h2>
            <div className="space-y-4">
              {analysis.differences.map((diff, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getImpactColor(diff.impact)}`}>
                    {diff.impact === "high" ? "Alto" : diff.impact === "medium" ? "Medio" : "Bajo"}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">{diff.category}</h4>
                    <p className="text-gray-400 text-sm">{diff.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommendation */}
          <Card className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-500/30 p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Recomendación Final</h2>
            <p className="text-gray-300 mb-6 leading-relaxed">{analysis.recommendation.reasoning}</p>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  Ventajas
                </h3>
                <ul className="space-y-2">
                  {analysis.recommendation.pros.map((pro, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-400" />
                  Consideraciones
                </h3>
                <ul className="space-y-2">
                  {analysis.recommendation.cons.map((con, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300 text-sm">
                      <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {analysis.recommendation.warnings && analysis.recommendation.warnings.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-400" />
                  Advertencias Importantes
                </h3>
                <ul className="space-y-2">
                  {analysis.recommendation.warnings.map((warning, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-orange-300 text-sm bg-orange-500/10 p-3 rounded"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.recommendation.questionsToAsk && analysis.recommendation.questionsToAsk.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-3">Preguntas Sugeridas para las Empresas</h3>
                <ul className="space-y-2">
                  {analysis.recommendation.questionsToAsk.map((question, index) => (
                    <li key={index} className="text-gray-300 text-sm pl-4 border-l-2 border-orange-500/50">
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
