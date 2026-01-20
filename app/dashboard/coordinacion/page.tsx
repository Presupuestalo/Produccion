"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import {
  Plus,
  Search,
  Users,
  Euro,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Building2,
  Loader2,
  FolderOpen,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"

interface CoordinatorProject {
  id: string
  project_name: string
  client_name: string
  client_phone: string
  client_email: string
  description: string
  address: string
  city: string
  province: string
  status: string
  coordination_fee: number
  coordination_fee_type: string
  total_original: number
  total_with_margins: number
  total_final: number
  created_at: string
  trades_count?: number
}

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "bg-gray-100 text-gray-700" },
  quoting: { label: "Recopilando", color: "bg-yellow-100 text-yellow-700" },
  quoted: { label: "Presupuestado", color: "bg-blue-100 text-blue-700" },
  accepted: { label: "Aceptado", color: "bg-green-100 text-green-700" },
  in_progress: { label: "En ejecución", color: "bg-purple-100 text-purple-700" },
  completed: { label: "Finalizado", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
}

export default function CoordinacionPage() {
  const [projects, setProjects] = useState<CoordinatorProject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [creating, setCreating] = useState(false)

  const [editProjectDialogOpen, setEditProjectDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<CoordinatorProject | null>(null)
  const [editProjectData, setEditProjectData] = useState({
    name: "",
    client_name: "",
    client_phone: "",
    client_email: "",
    client_address: "",
    client_city: "",
    description: "",
    coordination_fee_type: "percentage" as "percentage" | "fixed",
    coordination_fee_value: 0,
  })
  const [updating, setUpdating] = useState(false)

  const [newProject, setNewProject] = useState({
    project_name: "",
    client_name: "",
    client_phone: "",
    client_email: "",
    address: "",
    city: "",
    province: "",
    description: "",
  })

  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    checkCoordinatorStatus()
  }, [])

  const checkCoordinatorStatus = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("work_mode, is_coordinator")
        .eq("id", session.user.id)
        .single()

      const isCoord = profile?.is_coordinator || profile?.work_mode === "coordinator" || profile?.work_mode === "both"
      if (isCoord) {
        loadProjects()
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error("Error checking coordinator status:", error)
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) return

      const { data, error } = await supabase
        .from("coordinator_projects")
        .select(`
          *,
          coordinator_project_trades(count)
        `)
        .eq("coordinator_id", session.user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      const projectsWithCounts =
        data?.map((project) => ({
          ...project,
          trades_count: project.coordinator_project_trades?.[0]?.count || 0,
        })) || []

      setProjects(projectsWithCounts)
    } catch (error) {
      console.error("Error loading projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!newProject.project_name || !newProject.client_name) {
      console.error("El nombre del proyecto y cliente son obligatorios")
      return
    }

    setCreating(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) return

      const { data, error } = await supabase
        .from("coordinator_projects")
        .insert({
          coordinator_id: session.user.id,
          ...newProject,
          status: "draft",
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/dashboard/coordinacion/${data.id}`)
    } catch (error) {
      console.error("Error creating project:", error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este proyecto?")) return

    try {
      const { error } = await supabase.from("coordinator_projects").delete().eq("id", projectId)

      if (error) throw error

      setProjects(projects.filter((p) => p.id !== projectId))
    } catch (error) {
      console.error("Error deleting project:", error)
    }
  }

  const openEditDialog = (project: CoordinatorProject) => {
    setEditingProject(project)
    setEditProjectData({
      name: project.project_name || "",
      client_name: project.client_name || "",
      client_phone: project.client_phone || "",
      client_email: project.client_email || "",
      client_address: project.address || "",
      client_city: project.city || "",
      description: project.description || "",
      coordination_fee_type: project.coordination_fee_type || "percentage",
      coordination_fee_value: project.coordination_fee || 0,
    })
    setEditProjectDialogOpen(true)
  }

  const handleUpdateProject = async () => {
    if (!editingProject) return

    console.log("[v0] handleUpdateProject - Iniciando actualización")
    console.log("[v0] handleUpdateProject - editingProject:", editingProject)
    console.log("[v0] handleUpdateProject - editProjectData:", editProjectData)

    setUpdating(true)
    try {
      const updateData = {
        project_name: editProjectData.name,
        client_name: editProjectData.client_name,
        client_phone: editProjectData.client_phone,
        client_email: editProjectData.client_email,
        address: editProjectData.client_address,
        city: editProjectData.client_city,
        description: editProjectData.description,
        coordination_fee_type: editProjectData.coordination_fee_type,
        coordination_fee: Number(editProjectData.coordination_fee_value) || 0,
      }

      console.log("[v0] handleUpdateProject - Datos a actualizar:", updateData)

      const { data, error } = await supabase
        .from("coordinator_projects")
        .update(updateData)
        .eq("id", editingProject.id)
        .select()

      console.log("[v0] handleUpdateProject - Respuesta:", { data, error })

      if (error) throw error

      toast({
        title: "Proyecto actualizado",
        description: "Los datos del proyecto se han guardado correctamente",
      })

      await loadProjects()

      setEditProjectDialogOpen(false)
      setEditingProject(null)
    } catch (error) {
      console.error("[v0] handleUpdateProject - Error:", error)
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "No se pudo actualizar el proyecto",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.city?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Proyectos de Coordinación</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona proyectos con múltiples gremios y genera presupuestos consolidados
          </p>
        </div>
        <Button onClick={() => setShowNewProjectDialog(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, cliente o ciudad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{projects.length}</div>
            <div className="text-sm text-muted-foreground">Proyectos totales</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{projects.filter((p) => p.status === "in_progress").length}</div>
            <div className="text-sm text-muted-foreground">En ejecución</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatCurrency(projects.reduce((sum, p) => sum + (p.total_final || 0), 0))}
            </div>
            <div className="text-sm text-muted-foreground">Valor total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatCurrency(projects.reduce((sum, p) => sum + (p.coordination_fee || 0), 0))}
            </div>
            <div className="text-sm text-muted-foreground">Fees coordinación</div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <FolderOpen className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium">No hay proyectos</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No se encontraron proyectos con ese criterio de búsqueda"
                  : "Crea tu primer proyecto de coordinación para empezar"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowNewProjectDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear proyecto
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/coordinacion/${project.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg truncate">{project.project_name}</h3>
                          <Badge className={statusLabels[project.status]?.color || "bg-gray-100"}>
                            {statusLabels[project.status]?.label || project.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {project.client_name} • {project.city || "Sin ubicación"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{project.trades_count || 0} gremios</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatCurrency(project.total_final || 0)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(project.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/coordinacion/${project.id}`)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditDialog(project)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteProject(project.id)
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Proyecto de Coordinación</DialogTitle>
            <DialogDescription>
              Crea un proyecto para coordinar múltiples gremios y generar un presupuesto consolidado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project_name">Nombre del proyecto *</Label>
              <Input
                id="project_name"
                value={newProject.project_name}
                onChange={(e) => setNewProject({ ...newProject, project_name: e.target.value })}
                placeholder="Ej: Reforma integral piso Bilbao"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Cliente *</Label>
                <Input
                  id="client_name"
                  value={newProject.client_name}
                  onChange={(e) => setNewProject({ ...newProject, client_name: e.target.value })}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_phone">Teléfono</Label>
                <Input
                  id="client_phone"
                  value={newProject.client_phone}
                  onChange={(e) => setNewProject({ ...newProject, client_phone: e.target.value })}
                  placeholder="666 555 444"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_email">Email del cliente</Label>
              <Input
                id="client_email"
                type="email"
                value={newProject.client_email}
                onChange={(e) => setNewProject({ ...newProject, client_email: e.target.value })}
                placeholder="cliente@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección de la obra</Label>
              <Input
                id="address"
                value={newProject.address}
                onChange={(e) => setNewProject({ ...newProject, address: e.target.value })}
                placeholder="Calle, número, piso..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={newProject.city}
                  onChange={(e) => setNewProject({ ...newProject, city: e.target.value })}
                  placeholder="Bilbao"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Provincia</Label>
                <Input
                  id="province"
                  value={newProject.province}
                  onChange={(e) => setNewProject({ ...newProject, province: e.target.value })}
                  placeholder="Vizcaya"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Describe brevemente el proyecto..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateProject} disabled={creating} className="bg-orange-600 hover:bg-orange-700">
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear proyecto"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editProjectDialogOpen} onOpenChange={setEditProjectDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar proyecto</DialogTitle>
            <DialogDescription>Modifica los datos del proyecto de coordinación</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre del proyecto *</Label>
              <Input
                id="edit-name"
                value={editProjectData.name}
                onChange={(e) => setEditProjectData({ ...editProjectData, name: e.target.value })}
                placeholder="Reforma integral Calle Mayor"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-client-name">Nombre del cliente</Label>
                <Input
                  id="edit-client-name"
                  value={editProjectData.client_name}
                  onChange={(e) => setEditProjectData({ ...editProjectData, client_name: e.target.value })}
                  placeholder="Juan García"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-client-phone">Teléfono</Label>
                <Input
                  id="edit-client-phone"
                  value={editProjectData.client_phone}
                  onChange={(e) => setEditProjectData({ ...editProjectData, client_phone: e.target.value })}
                  placeholder="+34 600 000 000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-client-email">Email</Label>
                <Input
                  id="edit-client-email"
                  type="email"
                  value={editProjectData.client_email}
                  onChange={(e) => setEditProjectData({ ...editProjectData, client_email: e.target.value })}
                  placeholder="cliente@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-client-city">Ciudad</Label>
                <Input
                  id="edit-client-city"
                  value={editProjectData.client_city}
                  onChange={(e) => setEditProjectData({ ...editProjectData, client_city: e.target.value })}
                  placeholder="Madrid"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-client-address">Dirección</Label>
              <Input
                id="edit-client-address"
                value={editProjectData.client_address}
                onChange={(e) => setEditProjectData({ ...editProjectData, client_address: e.target.value })}
                placeholder="Calle Mayor 123, 1ºA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={editProjectData.description}
                onChange={(e) => setEditProjectData({ ...editProjectData, description: e.target.value })}
                placeholder="Descripción del proyecto..."
                rows={3}
              />
            </div>

            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium mb-3">Fee de coordinación</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de fee</Label>
                  <Select
                    value={editProjectData.coordination_fee_type}
                    onValueChange={(value: "percentage" | "fixed") =>
                      setEditProjectData({ ...editProjectData, coordination_fee_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                      <SelectItem value="fixed">Importe fijo (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{editProjectData.coordination_fee_type === "percentage" ? "Porcentaje" : "Importe"}</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={editProjectData.coordination_fee_value === 0 ? "" : editProjectData.coordination_fee_value}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                          setEditProjectData({
                            ...editProjectData,
                            coordination_fee_value: val === "" ? 0 : Number.parseFloat(val),
                          })
                        }
                      }}
                      className="pr-8"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {editProjectData.coordination_fee_type === "percentage" ? "%" : "€"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProjectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateProject} disabled={updating || !editProjectData.name}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
