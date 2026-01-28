
"use client"

import { useState, useEffect } from "react"
import { FloorPlanVersion, FloorPlanVariant } from "@/lib/types/floor-plan"
import { getProjectFloorPlans, saveFloorPlan, duplicateFloorPlan, deleteFloorPlan } from "@/lib/services/floor-plan-service"
import { compareFloorPlans } from "@/lib/utils/floor-plan-diff"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Copy, Trash2, ArrowRightLeft, Layout, MousePointer2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// Import Editor dynamically to avoid SSR issues
import dynamic from "next/dynamic"
import { ScrollArea } from "@/components/ui/scroll-area"

const FloorPlanEditor = dynamic(() => import("@/components/floor-plan-editor/EditorContainer").then(mod => mod.EditorContainer), {
    ssr: false,
    loading: () => <div className="h-[600px] flex items-center justify-center bg-muted"><Loader2 className="h-8 w-8 animate-spin" /></div>
})

interface FloorPlanDashboardProps {
    projectId: string
    onApplyChanges?: (diff: any) => void
}

export function FloorPlanDashboard({ projectId, onApplyChanges }: FloorPlanDashboardProps) {
    const [plans, setPlans] = useState<FloorPlanVersion[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<FloorPlanVariant>("current")
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

    // Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [editingPlan, setEditingPlan] = useState<FloorPlanVersion | null>(null)

    // Comparison State
    const [isComparing, setIsComparing] = useState(false)
    const [compareSource, setCompareSource] = useState<string | null>(null)
    const [compareTarget, setCompareTarget] = useState<string | null>(null)
    const [diffResult, setDiffResult] = useState<any | null>(null)

    const { toast } = useToast()

    useEffect(() => {
        loadPlans()
    }, [projectId])

    const loadPlans = async () => {
        setIsLoading(true)
        try {
            const data = await getProjectFloorPlans(projectId)
            setPlans(data)

            // Auto-select first plan if available
            if (data.length > 0 && !selectedPlanId) {
                setSelectedPlanId(data[0].id)
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los planos", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreatePlan = () => {
        setEditingPlan(null) // New plan
        setIsEditorOpen(true)
    }

    const handleEditPlan = (plan: FloorPlanVersion) => {
        setEditingPlan(plan)
        setIsEditorOpen(true)
    }

    const handleDuplicate = async (plan: FloorPlanVersion) => {
        try {
            await duplicateFloorPlan(plan.id, `${plan.name || "Copia"} (Copia)`)
            toast({ title: "Duplicado", description: "Plano duplicado correctamente" })
            loadPlans()
        } catch (e) {
            toast({ title: "Error", description: "Error al duplicar", variant: "destructive" })
        }
    }

    const handleDelete = async (planId: string) => {
        if (!confirm("¿Seguro que quieres eliminar este plano?")) return
        try {
            await deleteFloorPlan(planId)
            toast({ title: "Eliminado", description: "Plano eliminado" })
            loadPlans()
        } catch (e) {
            toast({ title: "Error", description: "Error al eliminar", variant: "destructive" })
        }
    }

    const handleSaveEditor = async (data: any, name: string, image: string) => {
        try {
            const variant = activeTab
            await saveFloorPlan(projectId, variant, name, data, image, editingPlan?.id)
            setIsEditorOpen(false)
            toast({ title: "Guardado", description: "Plano guardado correctamente" })
            loadPlans()
        } catch (e) {
            console.error(e)
            toast({ title: "Error", description: "Error al guardar el plano", variant: "destructive" })
        }
    }

    const runComparison = () => {
        if (!compareSource || !compareTarget) {
            // Auto-select if not selected
            const current = plans.find(p => p.variant === 'current')
            const proposal = plans.find(p => p.variant === 'proposal')

            if (current && proposal) {
                setCompareSource(current.id)
                setCompareTarget(proposal.id)
                calculateDiff(current, proposal)
            } else {
                toast({ title: "Faltan planos", description: "Necesitas al menos un plano de 'Estado Actual' y una 'Propuesta' para comparar.", variant: "destructive" })
            }
            return
        }

        const source = plans.find(p => p.id === compareSource)
        const target = plans.find(p => p.id === compareTarget)
        if (source && target) calculateDiff(source, target)
    }

    const calculateDiff = (source: FloorPlanVersion, target: FloorPlanVersion) => {
        try {
            const result = compareFloorPlans(source.data, target.data)
            setDiffResult(result)
            setIsComparing(true)
        } catch (e) {
            toast({ title: "Error", description: "Error al comparar planos" })
        }
    }

    if (isEditorOpen) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col">
                <div className="border-b p-4 flex justify-between items-center bg-card">
                    <h2 className="text-xl font-bold">{editingPlan ? `Editando: ${editingPlan.name}` : "Nuevo Plano"}</h2>
                    <Button variant="ghost" onClick={() => setIsEditorOpen(false)}>Cancelar</Button>
                </div>
                <div className="flex-1 overflow-hidden">
                    {/* We need to pass initial data to EditorContainer */}
                    <FloorPlanEditor
                        initialData={editingPlan?.data} // Need to update EditorContainer to accept this
                        onSave={(data: any, image: string) => {
                            // Dialog to ask for name
                            const name = prompt("Nombre del plano:", editingPlan?.name || (activeTab === 'current' ? "Estado Actual" : "Propuesta A"))
                            if (name) handleSaveEditor(data, name, image)
                        }}
                        onClose={() => setIsEditorOpen(false)}
                    />
                </div>
            </div>
        )
    }

    const currentPlans = plans.filter(p => p.variant === 'current')
    const proposalPlans = plans.filter(p => p.variant === 'proposal')

    return (
        <div className="space-y-6 p-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Mis Planos 2D</h2>
                    <p className="text-muted-foreground">Gestiona el estado actual y tus propuestas de reforma.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                        // Smart auto-select
                        const current = plans.find(p => p.variant === 'current')
                        const proposal = plans.find(p => p.variant === 'proposal')
                        setCompareSource(current?.id || null)
                        setCompareTarget(proposal?.id || null)
                        setIsComparing(true)
                        if (current && proposal) calculateDiff(current, proposal)
                    }}>
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Comparar
                    </Button>
                    <Button onClick={handleCreatePlan}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Plano
                    </Button>
                </div>
            </div>

            {isComparing && (
                <Card className="bg-slate-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="flex justify-between">
                            <span>Comparador de Cambios</span>
                            <Button variant="ghost" size="sm" onClick={() => setIsComparing(false)}>Cerrar</Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <Label>Origen (Antes)</Label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={compareSource || ""}
                                    onChange={e => setCompareSource(e.target.value)}
                                >
                                    <option value="">Selecciona...</option>
                                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} ({p.variant === 'current' ? 'Actual' : 'Propuesta'})</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Destino (Después)</Label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={compareTarget || ""}
                                    onChange={e => setCompareTarget(e.target.value)}
                                >
                                    <option value="">Selecciona...</option>
                                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} ({p.variant === 'current' ? 'Actual' : 'Propuesta'})</option>)}
                                </select>
                            </div>
                        </div>

                        <Button className="w-full mb-4" onClick={runComparison}>Calcular Diferencias</Button>

                        {diffResult && (
                            <div className="grid grid-cols-2 gap-8">
                                <div className="bg-red-50 p-4 rounded border border-red-100">
                                    <h4 className="font-bold text-red-700 flex items-center gap-2">
                                        <Trash2 className="h-4 w-4" /> A Demoler
                                    </h4>
                                    <div className="text-3xl font-bold mt-2">{diffResult.demolition.areaSqMeters} m²</div>
                                    <p className="text-sm text-red-600 mt-1">{diffResult.demolition.walls.length} tabiques detectados</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded border border-green-100">
                                    <h4 className="font-bold text-green-700 flex items-center gap-2">
                                        <Layout className="h-4 w-4" /> A Construir
                                    </h4>
                                    <div className="text-3xl font-bold mt-2">{diffResult.construction.areaSqMeters} m²</div>
                                    <p className="text-sm text-green-600 mt-1">{diffResult.construction.walls.length} tabiques nuevos</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    {diffResult && showApplyButton()}
                </Card>
            )}

            {!isComparing && (
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="current">Estado Actual (Antes)</TabsTrigger>
                        <TabsTrigger value="proposal">Reformado (Después)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="current" className="space-y-4">
                        {currentPlans.length === 0 ? (
                            <EmptyState onClick={handleCreatePlan} label="Dibujar Estado Actual" />
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {currentPlans.map(p => <PlanCard key={p.id} plan={p} onEdit={handleEditPlan} onDuplicate={handleDuplicate} onDelete={handleDelete} />)}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="proposal" className="space-y-4">
                        {proposalPlans.length === 0 ? (
                            <EmptyState onClick={handleCreatePlan} label="Dibujar Propuesta" />
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {proposalPlans.map(p => <PlanCard key={p.id} plan={p} onEdit={handleEditPlan} onDuplicate={handleDuplicate} onDelete={handleDelete} />)}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    )

    function showApplyButton() {
        return (
            <CardFooter className="bg-slate-100 border-t pt-4">
                <div className="flex w-full justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                        ¿Quieres añadir estas partidas a tu presupuesto automáticamente?
                    </p>
                    <Button onClick={() => onApplyChanges && onApplyChanges(diffResult)}>
                        Sincronizar Presupuesto
                    </Button>
                </div>
            </CardFooter>
        )
    }
}

function PlanCard({ plan, onEdit, onDuplicate, onDelete }: any) {
    return (
        <Card className="overflow-hidden hover:border-primary/50 transition-colors">
            <div className="aspect-video bg-muted relative group cursor-pointer" onClick={() => onEdit(plan)}>
                {plan.image_url ? (
                    <img src={plan.image_url} alt={plan.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Layout className="h-12 w-12 opacity-20" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm" className="gap-2">
                        <MousePointer2 className="h-4 w-4" /> Editar
                    </Button>
                </div>
            </div>
            <CardHeader className="p-4">
                <CardTitle className="text-base truncate" title={plan.name}>{plan.name || "Sin nombre"}</CardTitle>
                <CardDescription className="text-xs">Actualizado: {new Date(plan.created_at).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardFooter className="p-2 bg-muted/50 flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onDuplicate(plan)} title="Duplicar">
                    <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(plan.id)} title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    )
}

function EmptyState({ onClick, label }: any) {
    return (
        <div className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Layout className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No tienes planos en esta sección</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
                Sube o dibuja un plano para empezar a trabajar en tu proyecto.
            </p>
            <Button onClick={onClick}>{label}</Button>
        </div>
    )
}
