"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Loader2, Save, FolderOpen, AlertTriangle } from "lucide-react"

interface ProjectOption {
    id: string
    title: string
    client: string
    usedVariants: string[]
}

interface SimpleSaveDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (name: string, projectId: string | null, variant: string) => void
    isLoading: boolean
    container?: HTMLElement | null
    /** Pre-selected project ID (for plans already linked) */
    initialProjectId?: string | null
    /** Pre-selected variant (for plans already linked) */
    initialVariant?: string | null
}

export function SimpleSaveDialog({
    open,
    onOpenChange,
    onSave,
    isLoading,
    container,
    initialProjectId,
    initialVariant
}: SimpleSaveDialogProps) {
    const [name, setName] = useState(() => {
        const now = new Date()
        return `Plano ${now.toLocaleDateString()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
    })
    const [projects, setProjects] = useState<ProjectOption[]>([])
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId || null)
    const [selectedVariant, setSelectedVariant] = useState<string>(initialVariant || "current")
    const [loadingProjects, setLoadingProjects] = useState(false)
    const [showProjectSelector, setShowProjectSelector] = useState(!!initialProjectId)

    // Fetch projects when dialog opens
    useEffect(() => {
        if (open) {
            fetchProjects()
            // Reset selections if initial values are provided
            if (initialProjectId) {
                setSelectedProjectId(initialProjectId)
                setShowProjectSelector(true)
            }
            if (initialVariant) {
                setSelectedVariant(initialVariant)
            }
        }
    }, [open, initialProjectId, initialVariant])

    const fetchProjects = async () => {
        setLoadingProjects(true)
        try {
            const response = await fetch("/api/projects/list")
            if (response.ok) {
                const data = await response.json()
                setProjects(data.projects || [])
            }
        } catch (e) {
            console.error("Error fetching projects:", e)
        } finally {
            setLoadingProjects(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim()) {
            onSave(
                name,
                showProjectSelector ? selectedProjectId : null,
                showProjectSelector && selectedProjectId ? selectedVariant : "current"
            )
        }
    }

    // Check if the selected variant is already taken for the selected project
    const selectedProject = projects.find(p => p.id === selectedProjectId)
    const isVariantTaken = selectedProject?.usedVariants?.includes(selectedVariant) || false

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                container={container}
                className="!fixed !top-0 !left-0 !translate-x-0 !translate-y-0 !w-full lg:!w-full lg:!max-w-[480px] lg:!left-[50%] lg:!top-[50%] lg:!translate-x-[-50%] lg:!translate-y-[-50%] p-3 gap-2 rounded-none lg:rounded-lg border-x-0 border-t-0 bg-white shadow-lg"
            >
                <div className="hidden lg:block">
                    <DialogHeader>
                        <DialogTitle>Guardar Plano</DialogTitle>
                        <DialogDescription>
                            Dale un nombre y opcionalmente asígnalo a un proyecto.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="mt-0 w-full">
                    <div className="flex flex-col gap-2 w-full">
                        {/* Plan Name */}
                        <label className="block text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Nombre del Plano
                        </label>
                        <div className="flex gap-2 w-full">
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nombre..."
                                className="flex-1 h-10 text-base border-slate-300 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-orange-500"
                            />
                            {/* Mobile Save Button */}
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!name.trim() || isLoading || (showProjectSelector && !!selectedProjectId && isVariantTaken)}
                                className="lg:hidden h-10 w-10 shrink-0 bg-orange-600 hover:bg-orange-700"
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />}
                            </Button>
                        </div>

                        {/* Project Association Toggle */}
                        {!showProjectSelector ? (
                            <button
                                type="button"
                                onClick={() => setShowProjectSelector(true)}
                                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium py-1 self-start"
                            >
                                <FolderOpen className="h-3.5 w-3.5" />
                                Asignar a un proyecto
                            </button>
                        ) : (
                            <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-3 space-y-2.5 mt-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Proyecto</span>
                                    {!initialProjectId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowProjectSelector(false)
                                                setSelectedProjectId(null)
                                            }}
                                            className="text-[10px] text-slate-400 hover:text-slate-600"
                                        >
                                            Quitar
                                        </button>
                                    )}
                                </div>

                                {loadingProjects ? (
                                    <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando proyectos...
                                    </div>
                                ) : projects.length === 0 ? (
                                    <p className="text-xs text-slate-500 py-1">
                                        No tienes proyectos. Crea uno desde la calculadora primero.
                                    </p>
                                ) : (
                                    <>
                                        <select
                                            value={selectedProjectId || ""}
                                            onChange={(e) => setSelectedProjectId(e.target.value || null)}
                                            title="Seleccionar proyecto"
                                            className="w-full h-9 text-sm border border-slate-200 rounded-md px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="">Seleccionar proyecto...</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.title}{p.client ? ` — ${p.client}` : ""}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Variant Selector */}
                                        {selectedProjectId && (
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Tipo de plano</span>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedVariant("current")}
                                                        className={`flex-1 py-2 px-3 rounded-md text-xs font-medium border transition-colors ${selectedVariant === "current"
                                                            ? "bg-amber-50 border-amber-300 text-amber-800"
                                                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                                            }`}
                                                    >
                                                        📐 Antes
                                                        <span className="block text-[10px] font-normal opacity-70 mt-0.5">Estado actual</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedVariant("proposal")}
                                                        className={`flex-1 py-2 px-3 rounded-md text-xs font-medium border transition-colors ${selectedVariant === "proposal"
                                                            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                                            }`}
                                                    >
                                                        🏗️ Después
                                                        <span className="block text-[10px] font-normal opacity-70 mt-0.5">Propuesta reforma</span>
                                                    </button>
                                                </div>

                                                {/* Warning if variant is already taken */}
                                                {isVariantTaken && (
                                                    <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2 mt-1">
                                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                        <span>
                                                            Este proyecto ya tiene un plano &quot;{selectedVariant === "current" ? "Antes" : "Después"}&quot;.
                                                            Se sobreescribirá al guardar.
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Desktop Footer */}
                    <DialogFooter className="hidden lg:flex mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={!name.trim() || isLoading}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>

                    {/* Mobile Cancel */}
                    <div className="lg:hidden mt-2 flex justify-center">
                        <button type="button" onClick={() => onOpenChange(false)} className="text-xs text-slate-400 p-2 font-medium">
                            Cancelar
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
