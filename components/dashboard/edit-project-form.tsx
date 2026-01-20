"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"

interface ProjectData {
  id: string
  title: string
  description: string
  status: string
  budget: number
  created_at: string
  street: string
  project_floor: number
  door: string
  city: string
  province: string
  country: string
  ceiling_height: number
  structure_type: string
  has_elevator: boolean
}

const SPANISH_PROVINCES = [
  "Álava",
  "Albacete",
  "Alicante",
  "Almería",
  "Asturias",
  "Ávila",
  "Badajoz",
  "Barcelona",
  "Burgos",
  "Cáceres",
  "Cádiz",
  "Cantabria",
  "Castellón",
  "Ciudad Real",
  "Córdoba",
  "Cuenca",
  "Girona",
  "Granada",
  "Guadalajara",
  "Guipúzcoa",
  "Huelva",
  "Huesca",
  "Islas Baleares",
  "Jaén",
  "La Coruña",
  "La Rioja",
  "Las Palmas",
  "León",
  "Lleida",
  "Lugo",
  "Madrid",
  "Málaga",
  "Murcia",
  "Navarra",
  "Ourense",
  "Palencia",
  "Pontevedra",
  "Salamanca",
  "Santa Cruz de Tenerife",
  "Segovia",
  "Sevilla",
  "Soria",
  "Tarragona",
  "Teruel",
  "Toledo",
  "Valencia",
  "Valladolid",
  "Vizcaya",
  "Zamora",
  "Zaragoza",
]

const STRUCTURE_TYPES = ["Hormigón", "Ladrillo", "Acero", "Madera", "Mixta", "Otro"]

export function EditProjectForm({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [projectData, setProjectData] = useState<ProjectData>({
    id: "",
    title: "",
    description: "",
    status: "active",
    budget: 0,
    created_at: "",
    street: "",
    project_floor: 0,
    door: "",
    city: "",
    province: "",
    country: "España",
    ceiling_height: 2.6,
    structure_type: "",
    has_elevator: false,
  })

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  const loadProjectData = async () => {
    try {
      const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single()

      if (error) throw error

      if (data) {
        setProjectData({
          id: data.id,
          title: data.title || "",
          description: data.description || "",
          status: data.status || "active",
          budget: data.budget || 0,
          created_at: data.created_at || "",
          street: data.street || "",
          project_floor: data.project_floor || 0,
          door: data.door || "",
          city: data.city || "",
          province: data.province || "",
          country: data.country || "España",
          ceiling_height: data.ceiling_height || 2.6,
          structure_type: data.structure_type || "",
          has_elevator: data.has_elevator === "si" || data.has_elevator === true,
        })
      }
    } catch (error) {
      console.error("Error loading project:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información del proyecto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.error("[v0] Session error:", sessionError)
        toast({
          title: "Error de sesión",
          description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          variant: "destructive",
        })
        router.push("/auth/login")
        return
      }

      console.log("[v0] handleSave - User ID:", session.user.id)
      console.log("[v0] handleSave - Project ID:", projectId)

      // Verify that the user owns the project before attempting to update
      const { data: projectCheck, error: checkError } = await supabase
        .from("projects")
        .select("id, user_id, title")
        .eq("id", projectId)
        .single()

      if (checkError || !projectCheck) {
        console.error("[v0] Project check error:", checkError)
        toast({
          title: "Error",
          description: "No se pudo verificar el proyecto. Puede que no exista.",
          variant: "destructive",
        })
        return
      }

      if (projectCheck.user_id !== session.user.id) {
        console.error("[v0] User doesn't own this project")
        console.error("[v0] Project user_id:", projectCheck.user_id)
        console.error("[v0] Current user_id:", session.user.id)
        toast({
          title: "Sin permisos",
          description: "No tienes permiso para editar este proyecto. Solo el propietario puede hacerlo.",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Ownership verified - proceeding with update")

      const updateData = {
        title: projectData.title,
        description: projectData.description,
        status: projectData.status,
        budget: projectData.budget,
        street: projectData.street,
        project_floor: projectData.project_floor,
        door: projectData.door,
        city: projectData.city,
        province: projectData.province,
        country: projectData.country,
        ceiling_height: projectData.ceiling_height,
        structure_type: projectData.structure_type,
        has_elevator: projectData.has_elevator ? "si" : "no",
        updated_at: new Date().toISOString(),
      }

      console.log("[v0] Update data:", updateData)

      const { data, error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", projectId)
        .eq("user_id", session.user.id)
        .select()

      console.log("[v0] Update response - data:", data)
      console.log("[v0] Update response - error:", error)

      if (error) {
        console.error("[v0] Update error details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })

        // Show specific error message based on error code
        if (error.code === "42501") {
          toast({
            title: "Error de permisos",
            description: "Las políticas de seguridad no permiten esta operación. Contacta al administrador.",
            variant: "destructive",
          })
        } else if (error.code === "23505") {
          toast({
            title: "Error de duplicado",
            description: "Ya existe un proyecto con estos datos.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error al guardar",
            description: error.message || "No se pudo guardar el proyecto",
            variant: "destructive",
          })
        }
        return
      }

      if (!data || data.length === 0) {
        console.warn("[v0] No data returned after update - RLS may have blocked it")
        toast({
          title: "Error de actualización",
          description: "La actualización fue rechazada por las políticas de seguridad.",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Project updated successfully:", data[0])

      toast({
        title: "Proyecto actualizado",
        description: "Los cambios se han guardado correctamente",
      })

      setTimeout(() => {
        router.push(`/dashboard/projects/${projectId}`)
        router.refresh()
      }, 500)
    } catch (error) {
      console.error("[v0] Unexpected error saving project:", error)
      toast({
        title: "Error inesperado",
        description: error instanceof Error ? error.message : "No se pudo guardar el proyecto",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando proyecto...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/dashboard/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Proyecto</h1>
            <p className="text-muted-foreground">Creado el {formatDate(projectData.created_at)}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>

      {/* Form */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="location">Ubicación</TabsTrigger>
          <TabsTrigger value="technical">Técnico</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Nombre del Proyecto *</Label>
                <Input
                  id="title"
                  value={projectData.title}
                  onChange={(e) => setProjectData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Reforma integral"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={projectData.description}
                  onChange={(e) => setProjectData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del proyecto..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={projectData.status}
                    onValueChange={(value) => setProjectData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="delivered">Entregado</SelectItem>
                      <SelectItem value="accepted">Aceptado</SelectItem>
                      <SelectItem value="in_progress">En Obra</SelectItem>
                      <SelectItem value="rejected">Rechazado</SelectItem>
                      <SelectItem value="completed">Terminada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="budget">Presupuesto (€)</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={projectData.budget}
                    onChange={(e) =>
                      setProjectData((prev) => ({ ...prev, budget: Number.parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ubicación del Proyecto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="country">País</Label>
                <Input id="country" value={projectData.country} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Actualmente solo disponible para España</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="street">Calle y Número *</Label>
                  <Input
                    id="street"
                    value={projectData.street}
                    onChange={(e) => setProjectData((prev) => ({ ...prev, street: e.target.value }))}
                    placeholder="Calle Mayor, 123"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="door">Puerta/Mano</Label>
                  <Input
                    id="door"
                    value={projectData.door}
                    onChange={(e) => setProjectData((prev) => ({ ...prev, door: e.target.value }))}
                    placeholder="A, B, Izq, Dcha..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="project_floor">Planta *</Label>
                  <Input
                    id="project_floor"
                    type="number"
                    min="0"
                    max="50"
                    value={projectData.project_floor}
                    onChange={(e) =>
                      setProjectData((prev) => ({ ...prev, project_floor: Number.parseInt(e.target.value) || 0 }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">0 = Planta baja, 1+ = Plantas superiores</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="city">Ciudad *</Label>
                  <Input
                    id="city"
                    value={projectData.city}
                    onChange={(e) => setProjectData((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="Madrid"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="province">Provincia *</Label>
                <Select
                  value={projectData.province}
                  onValueChange={(value) => setProjectData((prev) => ({ ...prev, province: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una provincia" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPANISH_PROVINCES.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Técnica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ceiling_height">Altura Máxima al Techo (m) *</Label>
                  <Input
                    id="ceiling_height"
                    type="number"
                    min="2"
                    max="6"
                    step="0.1"
                    value={projectData.ceiling_height}
                    onChange={(e) =>
                      setProjectData((prev) => ({ ...prev, ceiling_height: Number.parseFloat(e.target.value) || 2.6 }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">Sin falsos techos</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="structure_type">Tipo de Estructura *</Label>
                  <Select
                    value={projectData.structure_type}
                    onValueChange={(value) => setProjectData((prev) => ({ ...prev, structure_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="⚠️ Selecciona tipo obligatorio" />
                    </SelectTrigger>
                    <SelectContent>
                      {STRUCTURE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="has_elevator">¿Tiene Ascensor? *</Label>
                <Select
                  value={projectData.has_elevator ? "si" : "no"}
                  onValueChange={(value) => setProjectData((prev) => ({ ...prev, has_elevator: value === "si" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="⚠️ Selecciona opción obligatoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Importante para calcular costes de transporte de materiales
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
