"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, FolderOpen, Link2Off } from "lucide-react"
import { getSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface Project {
    id: string
    title: string
}

interface LinkToProjectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    planId: string
    /** Current linked project (if any) */
    currentProjectId?: string | null
    currentVariant?: string | null
    /** Callback after successful link/unlink */
    onSuccess?: () => void
}

export function LinkToProjectDialog({
    open,
    onOpenChange,
    planId,
    currentProjectId,
    currentVariant,
    onSuccess,
}: LinkToProjectDialogProps) {
    const [projects, setProjects] = useState<Project[]>([])
    const [selectedProjectId, setSelectedProjectId] = useState<string>("")
    const [variant, setVariant] = useState<"current" | "proposal">("current")
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const { toast } = useToast()

    // Load projects when dialog opens
    useEffect(() => {
        if (!open) return
        const fetchProjects = async () => {
            setIsFetching(true)
            try {
                const supabase = await getSupabase()
                if (!supabase) return
                const { data } = await supabase
                    .from("projects")
                    .select("id, title")
                    .order("created_at", { ascending: false })
                    .limit(50)
                setProjects(data || [])
            } finally {
                setIsFetching(false)
            }
        }
        fetchProjects()
        // Pre-fill with current values
        setSelectedProjectId(currentProjectId || "")
        setVariant((currentVariant as "current" | "proposal") || "current")
    }, [open, currentProjectId, currentVariant])

    const handleLink = async () => {
        if (!selectedProjectId) {
            toast({ title: "Selecciona un proyecto", variant: "destructive" })
            return
        }
        setIsLoading(true)
        try {
            const res = await fetch("/api/editor-planos/link", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId, projectId: selectedProjectId, variant }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast({ title: "Error", description: data.error, variant: "destructive" })
                return
            }
            toast({ title: "Plano vinculado", description: "El plano se ha asociado al proyecto correctamente." })
            onOpenChange(false)
            onSuccess?.()
        } finally {
            setIsLoading(false)
        }
    }

    const handleUnlink = async () => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/editor-planos/link", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId, projectId: null, variant: null }),
            })
            if (!res.ok) {
                toast({ title: "Error al desvincular", variant: "destructive" })
                return
            }
            toast({ title: "Plano desvinculado" })
            onOpenChange(false)
            onSuccess?.()
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle>Vincular a proyecto</DialogTitle>
                    <DialogDescription>
                        Asocia este plano a un proyecto como estado actual (antes) o reformado (después).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Project selector */}
                    <div className="space-y-2">
                        <Label>Proyecto</Label>
                        {isFetching ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cargando proyectos...
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                <FolderOpen className="h-4 w-4" />
                                No tienes proyectos. Crea uno primero.
                            </div>
                        ) : (
                            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un proyecto..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Variant radio replacement */}
                    <div className="space-y-2">
                        <Label>Rol del plano</Label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setVariant("current")}
                                className={`flex-1 flex flex-col items-start gap-1 rounded-lg border p-3 cursor-pointer transition-all ${variant === "current" ? "border-amber-400 bg-amber-50 ring-1 ring-amber-400" : "border-border hover:bg-muted/50"}`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${variant === "current" ? "border-amber-600 bg-amber-600" : "border-slate-300"}`}>
                                        {variant === "current" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                    <p className="font-medium text-sm">📐 Estado actual</p>
                                </div>
                                <p className="text-xs text-muted-foreground ml-5">El plano de cómo está el espacio ahora</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setVariant("proposal")}
                                className={`flex-1 flex flex-col items-start gap-1 rounded-lg border p-3 cursor-pointer transition-all ${variant === "proposal" ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-400" : "border-border hover:bg-muted/50"}`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${variant === "proposal" ? "border-emerald-600 bg-emerald-600" : "border-slate-300"}`}>
                                        {variant === "proposal" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                    <p className="font-medium text-sm">🏗️ Reformado</p>
                                </div>
                                <p className="text-xs text-muted-foreground ml-5">El plano del resultado final</p>
                            </button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                    {currentProjectId && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleUnlink}
                            disabled={isLoading}
                            className="text-muted-foreground hover:text-destructive sm:mr-auto"
                        >
                            <Link2Off className="h-4 w-4 mr-1.5" />
                            Desvincular
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleLink} disabled={isLoading || !selectedProjectId || isFetching}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Vincular
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
