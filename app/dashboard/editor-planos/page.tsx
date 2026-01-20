"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PencilRuler, Upload, Plus, FileText } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface FloorPlan {
  id: string
  name: string
  created_at: string
  thumbnail?: string
}

export default function EditorPlanosPage() {
  const [recentPlans, setRecentPlans] = useState<FloorPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRecentPlans()
  }, [])

  const fetchRecentPlans = async () => {
    try {
      const response = await fetch("/api/editor-planos/plans")
      const data = await response.json()
      setRecentPlans(data.plans || [])
    } catch (error) {
      console.error("Error fetching plans:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Editor de Planos 2D</h1>
          <p className="text-gray-600">Crea planos, detecta habitaciones y calcula reformas automáticamente</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mb-12">
          <Link href="/dashboard/editor-planos/nuevo">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-orange-100 rounded-full mb-4">
                  <Plus className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Crear Plano Nuevo</h3>
                <p className="text-gray-600 mb-4">Dibuja tu plano desde cero con herramientas profesionales</p>
                <Button className="bg-orange-600 hover:bg-orange-700">Empezar a dibujar</Button>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/editor-planos/importar">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-blue-100 rounded-full mb-4">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Importar Plano</h3>
                <p className="text-gray-600 mb-4">Sube un plano existente y edítalo con IA</p>
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent">
                  Subir archivo
                </Button>
              </div>
            </Card>
          </Link>
        </div>

        {/* Recent Plans */}
        {!isLoading && recentPlans.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Planos recientes</h2>
            <div className="grid md:grid-cols-4 gap-4">
              {recentPlans.map((plan) => (
                <Link key={plan.id} href={`/dashboard/editor-planos/editar/${plan.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="aspect-video bg-gray-200 flex items-center justify-center">
                      {plan.thumbnail ? (
                        <img
                          src={plan.thumbnail || "/placeholder.svg"}
                          alt={plan.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">{plan.name}</h3>
                      <p className="text-sm text-gray-500">{new Date(plan.created_at).toLocaleDateString("es-ES")}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Características</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <PencilRuler className="h-8 w-8 text-orange-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Detección automática</h3>
              <p className="text-gray-600 text-sm">La IA detecta habitaciones, puertas y ventanas automáticamente</p>
            </Card>
            <Card className="p-6">
              <PencilRuler className="h-8 w-8 text-orange-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Selección de derribos</h3>
              <p className="text-gray-600 text-sm">Marca tabiques a derribar y obtén el plano final</p>
            </Card>
            <Card className="p-6">
              <PencilRuler className="h-8 w-8 text-orange-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Cálculo automático</h3>
              <p className="text-gray-600 text-sm">Genera presupuestos basados en el plano editado</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
