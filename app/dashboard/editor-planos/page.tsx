"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PencilRuler, Upload, Plus, FileText, ArrowRight, Trash2, Eye, Maximize2, FolderOpen, Link as LinkIcon } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { LinkToProjectDialog } from "@/components/floor-plan-editor/link-to-project-dialog"

interface FloorPlan {
  id: string
  name: string
  created_at: string
  thumbnail?: string
  projectId?: string | null
  projectName?: string | null
  variant?: string | null
}

export default function EditorPlanosPage() {
  const [recentPlans, setRecentPlans] = useState<FloorPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [planToDelete, setPlanToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedPlanForLinking, setSelectedPlanForLinking] = useState<FloorPlan | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchRecentPlans()
    // Limpieza de datos temporales antiguos para asegurar sesión limpia
    if (typeof window !== "undefined") {
      localStorage.removeItem("pending_guest_plan")
      localStorage.removeItem("pendingSaveData")
    }
  }, [])

  const handleDeletePlan = async () => {
    if (!planToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/editor-planos/delete?id=${planToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar el plano")
      }

      setRecentPlans(prev => prev.filter(p => p.id !== planToDelete))
      toast({
        title: "Plano eliminado",
        description: "El plano ha sido eliminado correctamente.",
      })
    } catch (error) {
      console.error("Error deleting plan:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el plano.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setPlanToDelete(null)
    }
  }

  const fetchRecentPlans = async () => {
    try {
      const response = await fetch("/api/editor-planos/list")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setRecentPlans(data.plans || [])
    } catch (error: any) {
      console.error("Error fetching plans:", error)
      toast({
        title: "Error al cargar planos",
        description: error.message || "No se pudieron cargar tus planos guardados.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Editor de Planos 2D</h1>
          <p className="text-gray-600">Gestiona tus planos, detecta habitaciones y calcula reformas</p>
        </div>

        <div className="grid md:grid-cols-1 gap-6 max-w-4xl mb-12">
          <Link href="/dashboard/editor-planos/nuevo">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer h-full border-blue-100 hover:border-blue-300 group">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-blue-100/50 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Crear Plano Nuevo</h3>
                <p className="text-gray-600 mb-4">Dibuja tu plano desde cero con herramientas profesionales</p>
                <Button className="bg-blue-600 hover:bg-blue-700 w-full">Empezar a dibujar</Button>
              </div>
            </Card>
          </Link>
        </div>

        {/* Saved Plans List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Mis Planos Guardados</h2>
            <Button onClick={fetchRecentPlans} variant="ghost" size="sm" className="text-gray-500">
              Actualizar lista
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : recentPlans.length > 0 ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recentPlans.map((plan) => (
                <Link key={plan.id} href={`/dashboard/editor-planos/editar/${plan.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer h-full flex flex-col group">
                    <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative border-b">
                      {plan.thumbnail ? (
                        <img
                          src={plan.thumbnail}
                          alt={plan.name}
                          className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
                        />
                      ) : (
                        <FileText className="h-12 w-12 text-gray-300" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

                      {/* Actions Overlay */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        {plan.thumbnail && (
                          <Button
                            variant="secondary" size="icon" className="h-8 w-8 bg-white/90 hover:bg-white text-gray-700 shadow-sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setPreviewImage(plan.thumbnail || null)
                            }}
                            title="Ver imagen completa"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="destructive" size="icon" className="h-8 w-8 shadow-sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setPlanToDelete(plan.id)
                          }}
                          title="Eliminar plano"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="absolute top-2 left-2 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary" size="icon" className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm border-none"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setSelectedPlanForLinking(plan)
                          }}
                          title="Vincular a proyecto"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1 truncate text-lg" title={plan.name}>{plan.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          📅 {new Date(plan.created_at).toLocaleDateString("es-ES", { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        {/* Project & Variant Badges */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {plan.projectName ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                              <FolderOpen className="h-2.5 w-2.5" />
                              {plan.projectName}
                            </span>
                          ) : null}
                          {plan.variant && plan.projectName ? (
                            <span className={`inline-flex items-center text-[10px] font-medium rounded-full px-2 py-0.5 ${plan.variant === 'current'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                              {plan.variant === 'current' ? '📐 Antes' : '🏗️ Después'}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t flex justify-end">
                        <span className="text-xs font-medium text-blue-600 group-hover:underline">Abrir editor →</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                <FileText className="h-full w-full" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No tienes planos guardados</h3>
              <p className="text-gray-500 max-w-sm mx-auto mt-1">
                Comienza creando uno nuevo. Los planos que guardes aparecerán aquí.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El plano se eliminará permanentemente de tu cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeletePlan()
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Full Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-black/95 border-none">
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full h-10 w-10"
              onClick={() => setPreviewImage(null)}
            >
              <Maximize2 className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            {previewImage && (
              <img
                src={previewImage}
                alt="Vista previa"
                className="max-full max-h-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Link to Project Dialog */}
      {selectedPlanForLinking && (
        <LinkToProjectDialog
          open={!!selectedPlanForLinking}
          onOpenChange={(open) => !open && setSelectedPlanForLinking(null)}
          planId={selectedPlanForLinking.id}
          currentProjectId={selectedPlanForLinking.projectId}
          currentVariant={selectedPlanForLinking.variant}
          onSuccess={() => {
            fetchRecentPlans()
            setSelectedPlanForLinking(null)
          }}
        />
      )}
    </div>
  )
}
