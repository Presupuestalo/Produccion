"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Download,
  Users,
  Phone,
  Mail,
  Building2,
  Upload,
  Eye,
  X,
  AlertCircle,
  MoreVertical,
} from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu" // Added for DropdownMenu

interface Project {
  id: string
  coordinator_id: string
  project_name: string
  description: string
  client_name: string
  client_phone: string
  client_email: string
  client_address: string
  client_city: string
  status: string
  total_original: number
  total_with_margins: number
  total_final: number
  coordination_fee: number
  coordination_fee_type: string
  created_at: string
}

interface Trade {
  id: string
  project_id: string
  trade_type_id: string
  trade_types: { name: string; icon: string } | null
  supplier_name: string
  supplier_phone: string
  supplier_email: string
  supplier_cif: string
  original_budget: number
  margin_type: string
  margin_value: number
  final_budget: number
  includes_margin: boolean
  margin_percentage_included: number | string
  budget_pdf_url: string
  notes: string
  status: string
}

interface TradeType {
  id: string
  name: string
  icon: string
}

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "bg-gray-100 text-gray-700" },
  quoting: { label: "Recopilando", color: "bg-blue-100 text-blue-700" },
  quoted: { label: "Presupuestado", color: "bg-purple-100 text-purple-700" },
  accepted: { label: "Aceptado", color: "bg-green-100 text-green-700" },
  in_progress: { label: "En ejecución", color: "bg-orange-100 text-orange-700" },
  completed: { label: "Finalizado", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserClient()
  const id = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [tradeTypes, setTradeTypes] = useState<TradeType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showAddTradeDialog, setShowAddTradeDialog] = useState(false)
  const [showEditTradeDialog, setShowEditTradeDialog] = useState(false)
  const [showDeleteTradeDialog, setShowDeleteTradeDialog] = useState(false)
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  const [isUploadingPdf, setIsUploadingPdf] = useState(false)
  const [showEditProjectDialog, setShowEditProjectDialog] = useState(false) // estado para dialog de editar proyecto
  const [editingProject, setEditingProject] = useState<{
    project_name: string
    client_name: string
    client_phone: string
    client_email: string
    address: string // Changed from client_address
    city: string // Changed from client_city
    description: string
    coordination_fee: number
    coordination_fee_type: string
  } | null>(null)

  const [newTrade, setNewTrade] = useState({
    trade_type_id: "",
    supplier_name: "",
    supplier_phone: "",
    supplier_email: "",
    supplier_cif: "",
    original_budget: 0,
    margin_type: "percentage",
    margin_value: 10,
    includes_margin: false,
    budget_pdf_url: "",
    notes: "",
    margin_percentage_included: "",
  })

  const fetchProject = useCallback(async () => {
    try {
      // 1. Obtener datos del proyecto
      const { data: projectData, error: projectError } = await supabase
        .from("coordinator_projects")
        .select("*")
        .eq("id", id)
        .single()

      if (projectError) throw projectError
      setProject(projectData)

      // 2. Obtener gremios del proyecto (sin el select anidado que puede fallar)
      const { data: tradesData, error: tradesError } = await supabase
        .from("coordinator_project_trades")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: true })

      if (tradesError) throw tradesError

      // 3. Obtener tipos de gremio para mapeo manual (más robusto)
      const { data: typesData, error: typesError } = await supabase
        .from("trade_types")
        .select("id, name, icon")

      if (typesError) {
        console.error("Error fetching trade types for mapping:", typesError)
      }

      const typesMap = new Map<string, { name: string; icon: string }>()
      if (typesData) {
        typesData.forEach(t => typesMap.set(t.id, { name: t.name, icon: t.icon }))
      }

      // 4. Combinar datos
      const formattedTrades = (tradesData || []).map(trade => ({
        ...trade,
        trade_types: typesMap.get(trade.trade_type_id) || null
      }))

      setTrades(formattedTrades)
    } catch (error) {
      console.error("Error fetching project:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el proyecto",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [id, supabase, toast])

  const fetchTradeTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("trade_types").select("*").order("name")

      if (error) throw error
      setTradeTypes(data || [])
    } catch (error) {
      console.error("Error fetching trade types:", error)
    }
  }, [supabase])

  useEffect(() => {
    fetchProject()
    fetchTradeTypes()
  }, [fetchProject, fetchTradeTypes])

  const calculateClientPrice = (
    originalBudget: number,
    marginType: string,
    marginValue: number,
    includesMargin: boolean,
  ) => {
    // Si el margen YA está incluido, el precio cliente ES el presupuesto del gremio
    if (includesMargin) {
      return originalBudget
    }

    // Si el margen NO está incluido, lo añadimos
    if (marginType === "percentage") {
      return originalBudget * (1 + marginValue / 100)
    } else {
      return originalBudget + marginValue
    }
  }

  const calculateProfit = (trade: Trade) => {
    if (trade.includes_margin) {
      // Si el margen está incluido: beneficio = presupuesto * porcentaje / 100
      const percentageIncluded = Number(trade.margin_percentage_included) || 0
      return trade.original_budget * (percentageIncluded / 100)
    } else {
      // Si no está incluido, el margen es lo que añadimos
      if (trade.margin_type === "percentage") {
        return trade.original_budget * (trade.margin_value / 100)
      } else {
        return trade.margin_value
      }
    }
  }

  const handleAddTrade = async () => {
    if (!newTrade.trade_type_id || newTrade.original_budget <= 0) {
      toast({
        title: "Error",
        description: "Selecciona un gremio e indica el presupuesto",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const clientPrice = calculateClientPrice(
        newTrade.original_budget,
        newTrade.margin_type,
        newTrade.margin_value,
        newTrade.includes_margin,
      )

      const marginPercentage = newTrade.includes_margin
        ? Number(newTrade.margin_percentage_included)
        : newTrade.margin_value

      const { error } = await supabase.from("coordinator_project_trades").insert({
        project_id: id,
        trade_type_id: newTrade.trade_type_id,
        supplier_name: newTrade.supplier_name,
        supplier_phone: newTrade.supplier_phone,
        supplier_email: newTrade.supplier_email,
        supplier_cif: newTrade.supplier_cif,
        original_budget: newTrade.original_budget,
        margin_type: newTrade.includes_margin ? "percentage" : newTrade.margin_type,
        margin_value: newTrade.includes_margin ? Number(newTrade.margin_percentage_included) : newTrade.margin_value,
        final_budget: clientPrice,
        includes_margin: newTrade.includes_margin,
        budget_pdf_url: newTrade.budget_pdf_url,
        notes: newTrade.notes,
        margin_percentage_included: Number(newTrade.margin_percentage_included) || 0,
        client_price: clientPrice,
        status: "received",
      })

      if (error) throw error

      toast({
        title: "Gremio añadido",
        description: "El presupuesto del gremio se ha añadido correctamente",
      })

      setShowAddTradeDialog(false)
      resetNewTrade()
      fetchProject()
    } catch (error: any) {
      console.error("Error adding trade:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir el gremio",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateTrade = async () => {
    if (!selectedTrade) return

    setIsSaving(true)
    try {
      const clientPrice = calculateClientPrice(
        selectedTrade.original_budget,
        selectedTrade.margin_type,
        selectedTrade.margin_value,
        selectedTrade.includes_margin,
      )

      const { error } = await supabase
        .from("coordinator_project_trades")
        .update({
          trade_type_id: selectedTrade.trade_type_id,
          supplier_name: selectedTrade.supplier_name,
          supplier_phone: selectedTrade.supplier_phone,
          supplier_email: selectedTrade.supplier_email,
          supplier_cif: selectedTrade.supplier_cif,
          original_budget: selectedTrade.original_budget,
          margin_type: selectedTrade.includes_margin ? "percentage" : selectedTrade.margin_type,
          margin_value: selectedTrade.includes_margin
            ? Number(selectedTrade.margin_percentage_included)
            : selectedTrade.margin_value,
          final_budget: clientPrice,
          includes_margin: selectedTrade.includes_margin,
          budget_pdf_url: selectedTrade.budget_pdf_url,
          notes: selectedTrade.notes,
          margin_percentage_included: Number(selectedTrade.margin_percentage_included) || 0,
          client_price: clientPrice,
        })
        .eq("id", selectedTrade.id)

      if (error) throw error

      // Fetch updated trade (without nested select)
      const { data: updatedTrade, error: fetchError } = await supabase
        .from("coordinator_project_trades")
        .select("*")
        .eq("id", selectedTrade.id)
        .single()

      if (fetchError) throw fetchError

      // Fetch trade type detail if needed for state update
      const { data: typeData } = await supabase
        .from("trade_types")
        .select("name, icon")
        .eq("id", updatedTrade.trade_type_id)
        .single()

      const tradeWithRelation = {
        ...updatedTrade,
        trade_types: typeData || null
      }

      // Update the trades state with the updated trade
      setTrades(trades.map((t) => (t.id === selectedTrade.id ? tradeWithRelation : t)))

      toast({
        title: "Gremio actualizado",
        description: "Los datos del gremio se han actualizado correctamente",
      })

      setShowEditTradeDialog(false)
      setSelectedTrade(null)
      fetchProject()
    } catch (error: any) {
      console.error("Error updating trade:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el gremio",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTrade = async () => {
    if (!selectedTrade) return

    setIsSaving(true)
    try {
      const { error } = await supabase.from("coordinator_project_trades").delete().eq("id", selectedTrade.id)

      if (error) throw error

      toast({
        title: "Gremio eliminado",
        description: "El presupuesto del gremio se ha eliminado correctamente",
      })

      setShowDeleteTradeDialog(false)
      setSelectedTrade(null)
      fetchProject()
    } catch (error: any) {
      console.error("Error deleting trade:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el gremio",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase.from("coordinator_projects").update({ status: newStatus }).eq("id", id)

      if (error) throw error

      setProject((prev) => (prev ? { ...prev, status: newStatus } : null))

      toast({
        title: "Estado actualizado",
        description: `El proyecto ahora está "${statusLabels[newStatus]?.label || newStatus}"`,
      })
    } catch (error: any) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      })
    }
  }

  const handleUpdateProject = async () => {
    if (!editingProject) return

    console.log("[v0] Actualizando proyecto con datos:", editingProject)

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("coordinator_projects")
        .update({
          project_name: editingProject.project_name,
          client_name: editingProject.client_name,
          client_phone: editingProject.client_phone,
          client_email: editingProject.client_email,
          address: editingProject.address, // Changed from client_address
          city: editingProject.city, // Changed from client_city
          description: editingProject.description,
          coordination_fee: editingProject.coordination_fee,
          coordination_fee_type: editingProject.coordination_fee_type,
        })
        .eq("id", id)

      if (error) throw error

      console.log("[v0] Proyecto actualizado exitosamente")

      toast({
        title: "Proyecto actualizado",
        description: "Los datos del proyecto se han actualizado correctamente",
      })

      setShowEditProjectDialog(false)
      fetchProject()
    } catch (error: any) {
      console.error("[v0] Error updating project:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el proyecto",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const resetNewTrade = () => {
    setNewTrade({
      trade_type_id: "",
      supplier_name: "",
      supplier_phone: "",
      supplier_email: "",
      supplier_cif: "",
      original_budget: 0,
      margin_type: "percentage",
      margin_value: 10,
      includes_margin: false,
      budget_pdf_url: "",
      notes: "",
      margin_percentage_included: "",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      useGrouping: true,
    }).format(amount)
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast({
        title: "Error",
        description: "Solo se permiten archivos PDF",
        variant: "destructive",
      })
      return
    }

    setIsUploadingPdf(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload/pdf", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Error al subir el archivo")

      const { url } = await response.json()

      if (isEdit && selectedTrade) {
        setSelectedTrade({ ...selectedTrade, budget_pdf_url: url })
      } else {
        setNewTrade({ ...newTrade, budget_pdf_url: url })
      }

      toast({
        title: "PDF subido",
        description: "El archivo se ha subido correctamente",
      })
    } catch (error: any) {
      console.error("Error uploading PDF:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo subir el archivo",
        variant: "destructive",
      })
    } finally {
      setIsUploadingPdf(false)
    }
  }

  const totalCost = trades.reduce((acc, t) => acc + t.original_budget, 0)

  const totalMargins = trades.reduce((acc, t) => {
    return acc + calculateProfit(t)
  }, 0)

  const totalClientPrice = trades.reduce((acc, t) => {
    return acc + calculateClientPrice(t.original_budget, t.margin_type, t.margin_value, t.includes_margin)
  }, 0)

  const coordinationFeeAmount =
    project?.coordination_fee_type === "percentage"
      ? totalClientPrice * ((project?.coordination_fee || 0) / 100)
      : project?.coordination_fee || 0

  const totalFinalClient = totalClientPrice + coordinationFeeAmount

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Proyecto no encontrado</p>
            <Link href="/dashboard/coordinacion">
              <Button className="mt-4">Volver a proyectos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {" "}
      {/* Adjusted padding */}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/coordinacion">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{project.project_name}</h1>
            <p className="text-muted-foreground">{project.client_name}</p>
          </div>
          <Badge className={statusLabels[project.status]?.color}>{statusLabels[project.status]?.label}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  console.log("[v0] Abriendo dialog de edición de proyecto")
                  setEditingProject({
                    project_name: project.project_name,
                    client_name: project.client_name,
                    client_phone: project.client_phone || "",
                    client_email: project.client_email || "",
                    address: project.client_address || "", // Changed from project.client_address
                    city: project.client_city || "", // Changed from project.client_city
                    description: project.description || "",
                    coordination_fee: project.coordination_fee || 0,
                    coordination_fee_type: project.coordination_fee_type || "percentage",
                  })
                  setShowEditProjectDialog(true)
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar proyecto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Select value={project.status} onValueChange={handleUpdateStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Cambiar estado" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusLabels).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Stats - Sin IVA */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Coste gremios</p>
            <p className="text-xl font-bold">{formatCurrency(totalCost)}</p>
            <p className="text-xs text-muted-foreground">Sin impuestos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Tu margen total</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalMargins)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Fee coordinación</p>
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(coordinationFeeAmount)}
              {project?.coordination_fee_type === "percentage" && (
                <span className="text-sm font-normal ml-1">({project.coordination_fee}%)</span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-4">
            <p className="text-sm text-orange-700">Total cliente</p>
            <p className="text-xl font-bold text-orange-700">{formatCurrency(totalFinalClient)}</p>
            <p className="text-xs text-orange-600">Sin impuestos</p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="trades" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trades">Presupuestos de gremios</TabsTrigger>
          <TabsTrigger value="summary">Resumen para cliente</TabsTrigger>
          <TabsTrigger value="details">Datos del proyecto</TabsTrigger>
        </TabsList>

        <TabsContent value="trades" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Presupuestos de gremios</h2>
              <p className="text-sm text-muted-foreground">Todos los precios sin impuestos</p>
            </div>
            <Button onClick={() => setShowAddTradeDialog(true)} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4 mr-2" /> Añadir gremio
            </Button>
          </div>

          {trades.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No hay presupuestos de gremios todavía</p>
                <Button onClick={() => setShowAddTradeDialog(true)} className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 mr-2" /> Añadir primer gremio
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {trades.map((trade) => {
                const profit = calculateProfit(trade)
                const clientPrice = calculateClientPrice(
                  trade.original_budget,
                  trade.margin_type,
                  trade.margin_value,
                  trade.includes_margin,
                )

                return (
                  <Card key={trade.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{trade.trade_types?.name || "Sin tipo"}</h3>
                            {trade.includes_margin && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Margen incluido
                              </Badge>
                            )}
                            {trade.budget_pdf_url && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <FileText className="h-3 w-3 mr-1" /> PDF
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-orange-600">{trade.supplier_name}</p>
                          {trade.supplier_phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" /> {trade.supplier_phone}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Presupuesto gremio</p>
                          <p className="font-medium">{formatCurrency(trade.original_budget)}</p>
                          <p className="text-xs text-green-600">
                            Tu beneficio: {formatCurrency(profit)}
                            {trade.includes_margin
                              ? ` (${trade.margin_percentage_included}% incluido)`
                              : trade.margin_type === "percentage"
                                ? ` (+${trade.margin_value}%)`
                                : ` (+${formatCurrency(trade.margin_value)})`}
                          </p>
                          <p className="text-sm font-bold text-orange-600 mt-1">
                            Cliente: {formatCurrency(clientPrice)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          {trade.budget_pdf_url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={trade.budget_pdf_url} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4 text-blue-600" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedTrade(trade)
                              setShowEditTradeDialog(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedTrade(trade)
                              setShowDeleteTradeDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Presupuesto para el cliente</CardTitle>
              <CardDescription>Vista previa del presupuesto consolidado (precios sin impuestos)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Datos cliente */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Cliente</h3>
                <p>{project.client_name}</p>
                <p className="text-sm text-muted-foreground">{project.client_address}</p>
                <p className="text-sm text-muted-foreground">{project.client_city}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Concepto</th>
                      <th className="text-right p-3">Importe (sin imp.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => {
                      const clientPrice = calculateClientPrice(
                        trade.original_budget,
                        trade.margin_type,
                        trade.margin_value,
                        trade.includes_margin,
                      )

                      return (
                        <tr key={trade.id} className="border-b">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{trade.trade_types?.name}</p>
                              <p className="text-sm text-muted-foreground">{trade.supplier_name}</p>
                            </div>
                          </td>
                          <td className="text-right p-3 font-medium">{formatCurrency(clientPrice)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr className="border-t">
                      <td className="p-3 font-medium">Subtotal gremios</td>
                      <td className="text-right p-3 font-medium">{formatCurrency(totalClientPrice)}</td>
                    </tr>
                    {project.coordination_fee > 0 && (
                      <tr>
                        <td className="p-3">
                          Coordinación y gestión
                          {project.coordination_fee_type === "percentage" && ` (${project.coordination_fee}%)`}
                        </td>
                        <td className="text-right p-3">
                          {formatCurrency(
                            project.coordination_fee_type === "percentage"
                              ? totalClientPrice * (project.coordination_fee / 100)
                              : project.coordination_fee,
                          )}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t-2 font-bold">
                      <td className="p-3">TOTAL (sin impuestos)</td>
                      <td className="text-right p-3 text-orange-600">
                        {formatCurrency(
                          totalClientPrice +
                          (project.coordination_fee_type === "percentage"
                            ? totalClientPrice * (project.coordination_fee / 100)
                            : project.coordination_fee),
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  Todos los precios mostrados son sin impuestos. Los impuestos aplicables se añadirán según la
                  legislación vigente.
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" /> Descargar PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Datos del cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{project.client_name}</span>
                </div>
                {project.client_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{project.client_phone}</span>
                  </div>
                )}
                {project.client_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{project.client_email}</span>
                  </div>
                )}
                {project.client_address && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {project.client_address}, {project.client_city}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fee de coordinación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {project.coordination_fee_type === "percentage"
                    ? `${project.coordination_fee}%`
                    : formatCurrency(project.coordination_fee)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {project.coordination_fee_type === "percentage"
                    ? `= ${formatCurrency(totalClientPrice * (project.coordination_fee / 100))} sobre el total`
                    : "Cantidad fija"}
                </p>
              </CardContent>
            </Card>
          </div>

          {project.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Descripción del proyecto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      {/* Dialog añadir gremio - Simplificado sin IVA */}
      <Dialog open={showAddTradeDialog} onOpenChange={setShowAddTradeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Añadir presupuesto de gremio</DialogTitle>
            <DialogDescription>Todos los precios deben ser sin impuestos incluidos</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de gremio *</Label>
              <Select
                value={newTrade.trade_type_id}
                onValueChange={(value) => setNewTrade({ ...newTrade, trade_type_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {tradeTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nombre del proveedor / empresa *</Label>
              <Input
                value={newTrade.supplier_name}
                onChange={(e) => setNewTrade({ ...newTrade, supplier_name: e.target.value })}
                placeholder="Ej: Construcciones García"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={newTrade.supplier_phone}
                  onChange={(e) => setNewTrade({ ...newTrade, supplier_phone: e.target.value })}
                  placeholder="666 555 444"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newTrade.supplier_email}
                  onChange={(e) => setNewTrade({ ...newTrade, supplier_email: e.target.value })}
                  placeholder="proveedor@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>CIF / NIF</Label>
              <Input
                value={newTrade.supplier_cif}
                onChange={(e) => setNewTrade({ ...newTrade, supplier_cif: e.target.value })}
                placeholder="B12345678"
              />
            </div>

            <Separator />

            {/* Presupuesto - Nota de sin impuestos */}
            <div className="space-y-2">
              <Label>Presupuesto del gremio (€) *</Label>
              <p className="text-xs text-muted-foreground">Introduce el importe SIN impuestos</p>
              <Input
                type="number"
                value={newTrade.original_budget || ""}
                onChange={(e) => setNewTrade({ ...newTrade, original_budget: Number.parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            {/* Margen - Simplificado */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>El presupuesto ya incluye tu margen</Label>
                  <p className="text-xs text-muted-foreground">El gremio ya añadió tu comisión al precio</p>
                </div>
                <Switch
                  checked={newTrade.includes_margin}
                  onCheckedChange={(checked) => setNewTrade({ ...newTrade, includes_margin: checked })}
                />
              </div>

              {newTrade.includes_margin ? (
                <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Label>¿Qué % de margen tienes incluido?</Label>
                  <p className="text-xs text-muted-foreground">El porcentaje de beneficio que ya viene en el precio</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={newTrade.margin_percentage_included}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                          setNewTrade({ ...newTrade, margin_percentage_included: val })
                        }
                      }}
                      className="w-24"
                      placeholder="0"
                    />
                    <span className="text-muted-foreground">%</span>
                    {newTrade.original_budget > 0 && Number(newTrade.margin_percentage_included) > 0 && (
                      <span className="text-green-600 text-sm font-medium">
                        ={" "}
                        {formatCurrency(newTrade.original_budget * (Number(newTrade.margin_percentage_included) / 100))}{" "}
                        de beneficio
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Tipo de margen a añadir</Label>
                    <Select
                      value={newTrade.margin_type}
                      onValueChange={(value) => setNewTrade({ ...newTrade, margin_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                        <SelectItem value="fixed">Cantidad fija (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor del margen</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={newTrade.margin_value}
                        onChange={(e) =>
                          setNewTrade({ ...newTrade, margin_value: Number.parseFloat(e.target.value) || 0 })
                        }
                        className="w-32"
                      />
                      <span className="text-muted-foreground">{newTrade.margin_type === "percentage" ? "%" : "€"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PDF */}
            <div className="space-y-2">
              <Label>Presupuesto PDF</Label>
              {newTrade.budget_pdf_url ? (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-700 flex-1">PDF adjunto</span>
                  <input
                    id="pdf-change-new"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handlePdfUpload(e, false)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => document.getElementById("pdf-change-new")?.click()}
                    disabled={isUploadingPdf}
                  >
                    Cambiar
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={newTrade.budget_pdf_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setNewTrade({ ...newTrade, budget_pdf_url: "" })}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    id="pdf-upload-new"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handlePdfUpload(e, false)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("pdf-upload-new")?.click()}
                    disabled={isUploadingPdf}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploadingPdf ? "Subiendo..." : "Subir PDF del presupuesto"}
                  </Button>
                </div>
              )}
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label>Notas internas</Label>
              <Textarea
                value={newTrade.notes}
                onChange={(e) => setNewTrade({ ...newTrade, notes: e.target.value })}
                placeholder="Notas sobre este gremio..."
                rows={2}
              />
            </div>

            {/* Resumen - Simplificado */}
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 space-y-2">
              <h4 className="font-medium text-orange-800">Resumen (sin impuestos)</h4>
              <div className="flex justify-between text-sm">
                <span>Presupuesto del gremio:</span>
                <span className="font-mono">{formatCurrency(newTrade.original_budget)}</span>
              </div>
              {newTrade.includes_margin ? (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Tu beneficio incluido ({newTrade.margin_percentage_included || 0}%):</span>
                  <span className="font-mono">
                    {formatCurrency(newTrade.original_budget * (Number(newTrade.margin_percentage_included) / 100))}
                  </span>
                </div>
              ) : (
                newTrade.margin_value > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>
                      Tu margen ({newTrade.margin_type === "percentage" ? `${newTrade.margin_value}%` : "fijo"}):
                    </span>
                    <span className="font-mono">
                      +
                      {formatCurrency(
                        newTrade.margin_type === "percentage"
                          ? newTrade.original_budget * (newTrade.margin_value / 100)
                          : newTrade.margin_value,
                      )}
                    </span>
                  </div>
                )
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Precio cliente (sin imp.):</span>
                <span className="font-mono text-orange-600">
                  {formatCurrency(
                    calculateClientPrice(
                      newTrade.original_budget,
                      newTrade.margin_type,
                      newTrade.margin_value,
                      newTrade.includes_margin,
                    ),
                  )}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTradeDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTrade} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">
              {isSaving ? "Guardando..." : "Añadir gremio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog editar gremio - Simplificado sin IVA */}
      <Dialog open={showEditTradeDialog} onOpenChange={setShowEditTradeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar presupuesto de gremio</DialogTitle>
            <DialogDescription>Todos los precios deben ser sin impuestos incluidos</DialogDescription>
          </DialogHeader>

          {selectedTrade && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de gremio *</Label>
                <Select
                  value={selectedTrade.trade_type_id}
                  onValueChange={(value) => setSelectedTrade({ ...selectedTrade, trade_type_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tradeTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nombre del proveedor / empresa *</Label>
                <Input
                  value={selectedTrade.supplier_name}
                  onChange={(e) => setSelectedTrade({ ...selectedTrade, supplier_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={selectedTrade.supplier_phone || ""}
                    onChange={(e) => setSelectedTrade({ ...selectedTrade, supplier_phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={selectedTrade.supplier_email || ""}
                    onChange={(e) => setSelectedTrade({ ...selectedTrade, supplier_email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>CIF / NIF</Label>
                <Input
                  value={selectedTrade.supplier_cif || ""}
                  onChange={(e) => setSelectedTrade({ ...selectedTrade, supplier_cif: e.target.value })}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Presupuesto del gremio (€) *</Label>
                <p className="text-xs text-muted-foreground">Introduce el importe SIN impuestos</p>
                <Input
                  type="number"
                  value={selectedTrade.original_budget || ""}
                  onChange={(e) =>
                    setSelectedTrade({ ...selectedTrade, original_budget: Number.parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              {/* Margen */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>El presupuesto ya incluye tu margen</Label>
                    <p className="text-xs text-muted-foreground">El gremio ya añadió tu comisión al precio</p>
                  </div>
                  <Switch
                    checked={selectedTrade.includes_margin || false}
                    onCheckedChange={(checked) => setSelectedTrade({ ...selectedTrade, includes_margin: checked })}
                  />
                </div>

                {selectedTrade.includes_margin ? (
                  <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Label>¿Qué % de margen tienes incluido?</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={selectedTrade.margin_percentage_included ?? ""}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === "" || /^\d*\.?\d*$/.test(val)) {
                            setSelectedTrade({ ...selectedTrade, margin_percentage_included: val })
                          }
                        }}
                        className="w-24"
                        placeholder="0"
                      />
                      <span className="text-muted-foreground">%</span>
                      {selectedTrade.original_budget > 0 && Number(selectedTrade.margin_percentage_included) > 0 && (
                        <span className="text-green-600 text-sm font-medium">
                          ={" "}
                          {formatCurrency(
                            selectedTrade.original_budget * (Number(selectedTrade.margin_percentage_included) / 100),
                          )}{" "}
                          de beneficio
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Tipo de margen a añadir</Label>
                      <Select
                        value={selectedTrade.margin_type}
                        onValueChange={(value) => setSelectedTrade({ ...selectedTrade, margin_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                          <SelectItem value="fixed">Cantidad fija (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor del margen</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={selectedTrade.margin_value}
                          onChange={(e) =>
                            setSelectedTrade({
                              ...selectedTrade,
                              margin_value: Number.parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-32"
                        />
                        <span className="text-muted-foreground">
                          {selectedTrade.margin_type === "percentage" ? "%" : "€"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PDF */}
              <div className="space-y-2">
                <Label>Presupuesto PDF</Label>
                {selectedTrade.budget_pdf_url ? (
                  <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-700 flex-1">PDF adjunto</span>
                    <input
                      id="pdf-change-edit"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handlePdfUpload(e, true)}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => document.getElementById("pdf-change-edit")?.click()}
                      disabled={isUploadingPdf}
                    >
                      Cambiar
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={selectedTrade.budget_pdf_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedTrade({ ...selectedTrade, budget_pdf_url: "" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      id="pdf-upload-edit"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handlePdfUpload(e, true)}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("pdf-upload-edit")?.click()}
                      disabled={isUploadingPdf}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploadingPdf ? "Subiendo..." : "Subir PDF del presupuesto"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label>Notas internas</Label>
                <Textarea
                  value={selectedTrade.notes || ""}
                  onChange={(e) => setSelectedTrade({ ...selectedTrade, notes: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Resumen */}
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 space-y-2">
                <h4 className="font-medium text-orange-800">Resumen (sin impuestos)</h4>
                <div className="flex justify-between text-sm">
                  <span>Presupuesto del gremio:</span>
                  <span className="font-mono">{formatCurrency(selectedTrade.original_budget)}</span>
                </div>
                {selectedTrade.includes_margin ? (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Tu beneficio incluido ({selectedTrade.margin_percentage_included || 0}%):</span>
                    <span className="font-mono">
                      {formatCurrency(
                        selectedTrade.original_budget * (Number(selectedTrade.margin_percentage_included) / 100),
                      )}
                    </span>
                  </div>
                ) : (
                  selectedTrade.margin_value > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>
                        Tu margen (
                        {selectedTrade.margin_type === "percentage" ? `${selectedTrade.margin_value}%` : "fijo"}):
                      </span>
                      <span className="font-mono">
                        +
                        {formatCurrency(
                          selectedTrade.margin_type === "percentage"
                            ? selectedTrade.original_budget * (selectedTrade.margin_value / 100)
                            : selectedTrade.margin_value,
                        )}
                      </span>
                    </div>
                  )
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Precio cliente (sin imp.):</span>
                  <span className="font-mono text-orange-600">
                    {formatCurrency(
                      calculateClientPrice(
                        selectedTrade.original_budget,
                        selectedTrade.margin_type,
                        selectedTrade.margin_value,
                        selectedTrade.includes_margin,
                      ),
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditTradeDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateTrade} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog confirmar eliminar */}
      <AlertDialog open={showDeleteTradeDialog} onOpenChange={setShowDeleteTradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el presupuesto de {selectedTrade?.supplier_name} (
              {selectedTrade?.trade_types?.name}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTrade} className="bg-red-500 hover:bg-red-600" disabled={isSaving}>
              {isSaving ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={showEditProjectDialog} onOpenChange={setShowEditProjectDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar proyecto</DialogTitle>
            <DialogDescription>Modifica los datos del proyecto de coordinación</DialogDescription>
          </DialogHeader>

          {editingProject && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre del proyecto *</Label>
                <Input
                  value={editingProject.project_name}
                  onChange={(e) => setEditingProject({ ...editingProject, project_name: e.target.value })}
                  placeholder="Ej: Reforma integral Piso Centro"
                />
              </div>

              <Separator />
              <h3 className="font-medium">Datos del cliente</h3>

              <div className="space-y-2">
                <Label>Nombre del cliente *</Label>
                <Input
                  value={editingProject.client_name}
                  onChange={(e) => setEditingProject({ ...editingProject, client_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={editingProject.client_phone}
                    onChange={(e) => setEditingProject({ ...editingProject, client_phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editingProject.client_email}
                    onChange={(e) => setEditingProject({ ...editingProject, client_email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input
                    value={editingProject.address}
                    onChange={(e) => setEditingProject({ ...editingProject, address: e.target.value })}
                    placeholder="Calle, número, piso..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Input
                    value={editingProject.city}
                    onChange={(e) => setEditingProject({ ...editingProject, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción del proyecto</Label>
                <Textarea
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  placeholder="Descripción general de la reforma..."
                  rows={3}
                />
              </div>

              <Separator />
              <h3 className="font-medium">Fee de coordinación</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de fee</Label>
                  <Select
                    value={editingProject.coordination_fee_type}
                    onValueChange={(value) => setEditingProject({ ...editingProject, coordination_fee_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                      <SelectItem value="fixed">Cantidad fija (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor del fee</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={editingProject.coordination_fee}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          coordination_fee: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      className="flex-1"
                    />
                    <span className="text-muted-foreground">
                      {editingProject.coordination_fee_type === "percentage" ? "%" : "€"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProjectDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateProject} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
