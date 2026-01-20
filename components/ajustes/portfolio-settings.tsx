"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Eye, EyeOff, Star, Trash2, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface PortfolioSettingsProps {
  userId: string
}

export function PortfolioSettings({ userId }: PortfolioSettingsProps) {
  const [portfolioItems, setPortfolioItems] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    try {
      // Cargar proyectos del usuario
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (projectsError) throw projectsError

      // Cargar items del portafolio
      const { data: portfolioData, error: portfolioError } = await supabase
        .from("professional_portfolio")
        .select("*, projects(*)")
        .eq("user_id", userId)
        .order("display_order", { ascending: true })

      if (portfolioError) throw portfolioError

      setProjects(projectsData || [])
      setPortfolioItems(portfolioData || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar el portafolio",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePublic = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("professional_portfolio")
        .update({ is_public: !currentStatus })
        .eq("id", itemId)

      if (error) throw error

      toast({
        title: "Actualizado",
        description: `Proyecto ${!currentStatus ? "publicado" : "ocultado"} correctamente`,
      })

      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const toggleFeatured = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("professional_portfolio")
        .update({ is_featured: !currentStatus })
        .eq("id", itemId)

      if (error) throw error

      toast({
        title: "Actualizado",
        description: `Proyecto ${!currentStatus ? "destacado" : "no destacado"}`,
      })

      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const removeFromPortfolio = async (itemId: string) => {
    try {
      const { error } = await supabase.from("professional_portfolio").delete().eq("id", itemId)

      if (error) throw error

      toast({
        title: "Eliminado",
        description: "Proyecto eliminado del portafolio",
      })

      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const addToPortfolio = async (projectId: string) => {
    try {
      const project = projects.find((p) => p.id === projectId)
      if (!project) return

      const { error } = await supabase.from("professional_portfolio").insert({
        user_id: userId,
        project_id: projectId,
        title: project.title,
        description: project.description,
        is_public: false,
        is_featured: false,
      })

      if (error) throw error

      toast({
        title: "Añadido",
        description: "Proyecto añadido al portafolio",
      })

      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  const portfolioProjectIds = portfolioItems.map((item) => item.project_id)
  const availableProjects = projects.filter((p) => !portfolioProjectIds.includes(p.id))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tu Portafolio Profesional</CardTitle>
          <CardDescription>
            Gestiona los proyectos que aparecen en tu portafolio público. Los proyectos destacados aparecerán primero.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {portfolioItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tienes proyectos en tu portafolio aún.</p>
              <p className="text-sm mt-2">Añade proyectos completados para mostrar tu trabajo.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {portfolioItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      {item.is_featured && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Destacado
                        </Badge>
                      )}
                      {item.is_public ? (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Público
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <EyeOff className="h-3 w-3" />
                          Privado
                        </Badge>
                      )}
                    </div>
                    {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFeatured(item.id, item.is_featured)}
                      title={item.is_featured ? "Quitar destacado" : "Destacar"}
                    >
                      <Star className={`h-4 w-4 ${item.is_featured ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePublic(item.id, item.is_public)}
                      title={item.is_public ? "Ocultar" : "Publicar"}
                    >
                      {item.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromPortfolio(item.id)}
                      title="Eliminar del portafolio"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {availableProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Añadir Proyectos al Portafolio</CardTitle>
            <CardDescription>Selecciona proyectos completados para añadir a tu portafolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availableProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{project.title}</h4>
                    <p className="text-sm text-muted-foreground">{project.client}</p>
                  </div>
                  <Button size="sm" onClick={() => addToPortfolio(project.id)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Añadir
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Vista Pública</CardTitle>
          <CardDescription>Así es como otros usuarios verán tu portafolio</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={`/portafolio/${userId}`} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver mi portafolio público
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
