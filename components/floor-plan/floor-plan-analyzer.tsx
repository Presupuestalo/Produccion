"use client"
import React, { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload, FileText, Check, AlertTriangle } from "lucide-react"
import type { FloorPlanAnalysis } from "@/types/floor-plan-analysis"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FloorPlanVisualizer } from "./floor-plan-visualizer"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { getSupabase } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Crown, Lock } from "lucide-react"

interface FloorPlanAnalyzerProps {
  projectId: string
}

export function FloorPlanAnalyzer({ projectId }: FloorPlanAnalyzerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentPlanType, setCurrentPlanType] = useState<"before" | "after">("before")
  const [floorPlans, setFloorPlans] = useState<Record<string, string | null>>({
    before: null,
    after: null,
  })
  const [analysisResults, setAnalysisResults] = useState<Record<string, FloorPlanAnalysis | null>>({
    before: null,
    after: null,
  })
  const [error, setError] = useState<string | null>(null)
  const [isProUser, setIsProUser] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const checkPlan = async () => {
      const supabase = await getSupabase()
      if (!supabase) return

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_plan")
          .eq("id", session.user.id)
          .single()

        const plan = profile?.subscription_plan?.toLowerCase() || "free"
        const isPro = ["pro", "premium", "enterprise", "business"].includes(plan)
        setIsProUser(isPro)
      }
    }
    checkPlan()
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo - solo imágenes
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato no soportado",
        description: "Por favor, sube una imagen (JPG, PNG, GIF, WEBP).",
        variant: "destructive",
      })
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "El tamaño máximo permitido es 5MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Usar el endpoint /api/upload-floor-plan
      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch("/api/upload-floor-plan", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || "Error al subir el plano")
      }

      const { imageUrl } = await uploadResponse.json()

      // Actualizar el estado con la URL de la imagen
      setFloorPlans((prev) => ({
        ...prev,
        [currentPlanType]: imageUrl,
      }))

      toast({
        title: "Plano subido correctamente",
        description: "El plano se ha subido y está listo para ser analizado.",
      })
    } catch (error: any) {
      console.error("Error al subir el plano:", error)
      setError(error.message || "Ha ocurrido un error al subir el plano.")
      toast({
        title: "Error al subir el plano",
        description: error.message || "Ha ocurrido un error al subir el plano.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  const analyzePlan = async (planType: "before" | "after") => {
    if (!isProUser) {
      toast({
        title: "Característica Pro",
        description: "El análisis de planos con IA solo está disponible en el plan Pro.",
      })
      router.push("/dashboard/planes")
      return
    }

    const imageUrl = floorPlans[planType]
    if (!imageUrl) {
      toast({
        title: "No hay plano para analizar",
        description: "Por favor, sube un plano primero.",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      // Llamar a la API para analizar el plano
      const response = await fetch("/api/analyze-floor-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          planType,
          projectId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al analizar el plano")
      }

      const data = await response.json()

      // Guardar los resultados del análisis
      setAnalysisResults((prev) => ({
        ...prev,
        [planType]: data.analysis,
      }))

      toast({
        title: "Análisis completado",
        description: "El plano ha sido analizado correctamente.",
      })
    } catch (error: any) {
      console.error("Error al analizar el plano:", error)
      setError(error.message || "Ha ocurrido un error al analizar el plano.")
      toast({
        title: "Error al analizar el plano",
        description: error.message || "Ha ocurrido un error al analizar el plano.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const importRoomsToCalculator = (planType: "before" | "after") => {
    const analysis = analysisResults[planType]
    if (!analysis) {
      toast({
        title: "No hay análisis disponible",
        description: "Por favor, analiza el plano primero.",
        variant: "destructive",
      })
      return
    }

    // Aquí iría la lógica para importar las habitaciones a la calculadora
    // Por ejemplo, podríamos enviar los datos a un endpoint que los guarde en la base de datos
    // o actualizar el estado global de la aplicación

    toast({
      title: "Habitaciones importadas",
      description: `Se han importado ${analysis.rooms.length} habitaciones a la calculadora.`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Análisis de Planos con IA</CardTitle>
          {!isProUser && (
            <Badge variant="secondary" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-none gap-1">
              <Crown className="w-3 h-3" />
              PRO
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={currentPlanType} onValueChange={(value) => setCurrentPlanType(value as "before" | "after")}>
          <TabsList className="mb-4">
            <TabsTrigger value="before">Estado Actual</TabsTrigger>
            <TabsTrigger value="after">Reforma</TabsTrigger>
          </TabsList>

          <TabsContent value="before" className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                id="floor-plan-before"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                disabled={isUploading}
                className="flex-1"
              />
              {floorPlans.before && (
                <Button
                  onClick={() => analyzePlan("before")}
                  disabled={isAnalyzing}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Analizar Plano
                    </>
                  )}
                </Button>
              )}
            </div>

            {floorPlans.before ? (
              <div className="border rounded-md overflow-hidden">
                <img
                  src={floorPlans.before || "/placeholder.svg"}
                  alt="Plano estado actual"
                  className="w-full h-auto max-h-[300px] object-contain"
                />
              </div>
            ) : (
              <div className="h-[200px] border rounded-md flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-muted-foreground">Sube un plano del estado actual</p>
                </div>
              </div>
            )}

            {analysisResults.before && (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle>Análisis completado</AlertTitle>
                  <AlertDescription>
                    Se han detectado {analysisResults.before.rooms.length} habitaciones con un nivel de confianza del{" "}
                    {(analysisResults.before.confidence * 100).toFixed(0)}%.
                  </AlertDescription>
                </Alert>

                <FloorPlanVisualizer analysis={analysisResults.before} />

                <Button onClick={() => importRoomsToCalculator("before")} className="w-full">
                  Importar habitaciones a la calculadora
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="after" className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                id="floor-plan-after"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                disabled={isUploading}
                className="flex-1"
              />
              {floorPlans.after && (
                <Button
                  onClick={() => analyzePlan("after")}
                  disabled={isAnalyzing}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Analizar Plano
                    </>
                  )}
                </Button>
              )}
            </div>

            {floorPlans.after ? (
              <div className="border rounded-md overflow-hidden">
                <img
                  src={floorPlans.after || "/placeholder.svg"}
                  alt="Plano reforma"
                  className="w-full h-auto max-h-[300px] object-contain"
                />
              </div>
            ) : (
              <div className="h-[200px] border rounded-md flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-muted-foreground">Sube un plano de la reforma</p>
                </div>
              </div>
            )}

            {analysisResults.after && (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle>Análisis completado</AlertTitle>
                  <AlertDescription>
                    Se han detectado {analysisResults.after.rooms.length} habitaciones con un nivel de confianza del{" "}
                    {(analysisResults.after.confidence * 100).toFixed(0)}%.
                  </AlertDescription>
                </Alert>

                <FloorPlanVisualizer analysis={analysisResults.after} />

                <Button onClick={() => importRoomsToCalculator("after")} className="w-full">
                  Importar habitaciones a la calculadora
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
