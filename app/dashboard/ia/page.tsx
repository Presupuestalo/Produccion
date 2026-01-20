"use client"

import { Card } from "@/components/ui/card"
import { GitCompare as FileCompare, Sparkles, Cable as Cube, ArrowRight, Calculator } from "lucide-react"
import Link from "next/link"
import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Crown, Lock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function IAPage() {
  const [isProUser, setIsProUser] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkPlan = async () => {
      try {
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
      } catch (error) {
        console.error("Error checking plan:", error)
      } finally {
        setIsLoading(false)
      }
    }
    checkPlan()
  }, [])

  const tools = [
    {
      title: "Estimación Rápida",
      description: "Obtén una estimación de presupuesto en segundos con información básica de tu proyecto.",
      icon: Calculator,
      href: "/dashboard/ia/estimacion-rapida",
      gradient: "from-green-500 to-emerald-500",
      requiresPro: false,
    },
    {
      title: "Comparador de Presupuestos",
      description: "Compara hasta 3 presupuestos con IA. Analiza diferencias, valora opciones y revisa empresas.",
      icon: FileCompare,
      href: "/dashboard/ia/comparador",
      gradient: "from-orange-500 to-red-500",
      requiresPro: true,
    },
    {
      title: "Generador de Diseños",
      description: "Sube una imagen y obtén diferentes propuestas de diseño manteniendo puertas y ventanas.",
      icon: Sparkles,
      href: "/dashboard/ia/generador-disenos",
      gradient: "from-purple-500 to-pink-500",
      requiresPro: true,
    },
    {
      title: "Visualizador Pro-Rápido",
      description:
        "Genera renders 3D fotorrealistas desde un plano visto desde arriba con los materiales y estilo que elijas.",
      icon: Cube,
      href: "/dashboard/ia/visualizador-pro",
      gradient: "from-emerald-500 to-teal-500",
      requiresPro: true,
    },
    {
      title: "Distribuciones Optimizadas",
      description: "Genera distribuciones de planos optimizadas con IA según tus necesidades y preferencias.",
      icon: Cube,
      href: "/dashboard/ia/plano-3d",
      gradient: "from-blue-500 to-cyan-500",
      requiresPro: true,
    },
  ]

  const handleToolClick = (e: React.MouseEvent, tool: any) => {
    if (tool.requiresPro && !isProUser) {
      e.preventDefault()
      toast({
        title: "Característica Pro",
        description: "Esta herramienta solo está disponible en el plan Pro. ¡Actualiza para empezar!",
      })
      router.push("/dashboard/planes")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-orange-400" />
            <span className="text-sm text-orange-400 font-medium">Herramientas IA</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">IA para Reformas</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Potencia tus proyectos con inteligencia artificial. Compara presupuestos, genera diseños y visualiza en 3D.
          </p>
        </div>

        {/* Tools Grid - Cambiado a grid de 5 columnas para 5 herramientas */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {tools.map((tool) => (
            <Link key={tool.title} href={tool.href} onClick={(e) => handleToolClick(e, tool)}>
              <Card className={`group relative overflow-hidden bg-gray-800/50 border-gray-700 hover:border-orange-500/50 transition-all duration-300 h-full cursor-pointer ${tool.requiresPro && !isProUser ? 'opacity-90' : ''}`}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${tool.gradient}`}>
                      <tool.icon className="h-6 w-6 text-white" />
                    </div>
                    {tool.requiresPro && !isProUser && (
                      <Badge variant="secondary" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-none gap-1">
                        <Crown className="w-3 h-3" />
                        PRO
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors flex items-center gap-2">
                    {tool.title}
                    {tool.requiresPro && !isProUser && <Lock className="h-4 w-4 text-gray-500" />}
                  </h3>
                  <p className="text-gray-400 mb-4 text-sm leading-relaxed">{tool.description}</p>
                  <div className="flex items-center text-orange-400 text-sm font-medium group-hover:gap-2 transition-all">
                    {tool.requiresPro && !isProUser ? 'Mejorar Plan' : 'Explorar'}
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
                />
              </Card>
            </Link>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-20 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6">
            <div className="text-4xl font-bold text-orange-400 mb-2">3x</div>
            <div className="text-gray-400">Más rápido que métodos tradicionales</div>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl font-bold text-orange-400 mb-2">95%</div>
            <div className="text-gray-400">Precisión en análisis de presupuestos</div>
          </div>
        </div>
      </div>
    </div>
  )
}
