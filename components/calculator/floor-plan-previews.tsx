"use client"

import { useState, useEffect } from "react"
import { ImageIcon, Maximize2, Loader2, Ruler, ExternalLink } from "lucide-react"
import { getSupabase } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { CanvasEngine } from "@/components/floor-plan-editor/CanvasEngine"
import { getProjectFloorPlanData } from "@/lib/services/floor-plan-sync-service"

interface FloorPlanPreviewsProps {
    projectId: string;
}

export function FloorPlanPreviews({ projectId }: FloorPlanPreviewsProps) {
    const [plans, setPlans] = useState<{
        before: { id: string; thumbnail?: string; name: string } | null
        after: { id: string; thumbnail?: string; name: string } | null
    }>({ before: null, after: null })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadPlans() {
            if (!projectId) {
                console.warn("[FloorPlanPreviews] No projectId provided")
                return
            }
            setLoading(true)
            try {
                const supabase = await getSupabase()
                if (!supabase) return

                // Fetch all plans for this project to see what we have
                let { data, error } = await supabase
                    .from("project_floor_plans")
                    .select("id, name, variant, image_url, plan_type")
                    .eq("project_id", projectId)


                if (error) {
                    console.error("[FloorPlanPreviews] Supabase error:", error)
                }

                const result: {
                    before: { id: string; thumbnail?: string; name: string } | null;
                    after: { id: string; thumbnail?: string; name: string } | null;
                } = {
                    before: null,
                    after: null
                }

                if (data && data.length > 0) {
                    data.forEach((plan: any) => {
                        const planName = (plan.name || "").toLowerCase()
                        const planType = (plan.plan_type || "").toLowerCase()
                        const variant = (plan.variant || "").toLowerCase()

                        // Heurística para ANTES
                        const isBefore =
                            variant === "current" ||
                            (planType === "before" && variant !== "proposal") ||
                            ((planName.includes("antes") ||
                                planName.includes("actual") ||
                                planName.includes("original") ||
                                planName.includes("existente") ||
                                planName.includes("estado actual")) &&
                                !planName.includes("reforma") &&
                                !planName.includes("propuesta") &&
                                variant !== "proposal")

                        // Heurística para DESPUÉS
                        const isAfter =
                            variant === "proposal" ||
                            (planType === "after" && variant !== "current") ||
                            planName.includes("despues") ||
                            planName.includes("después") ||
                            planName.includes("reforma") ||
                            planName.includes("propuesta") ||
                            planName.includes("nuevo") ||
                            planName.includes("opcion") ||
                            planName.includes("opción") ||
                            planName.includes("proyecto") ||
                            planName.includes("americana") ||
                            planName.includes("modificado")

                        if (isBefore && !result.before) {
                            result.before = { id: plan.id, thumbnail: plan.image_url || undefined, name: plan.name || "Plano Antes" }
                        } else if (isAfter && !result.after) {
                            result.after = { id: plan.id, thumbnail: plan.image_url || undefined, name: plan.name || "Plano Después" }
                        }
                    })

                    // Heurística final: si tenemos al menos uno y no hemos asignado 'before', asignamos el primero
                    if (data.length > 0 && !result.before && !result.after) {
                        result.before = { id: data[0].id, thumbnail: data[0].image_url || undefined, name: data[0].name || "Plano" }
                    }
                }

                setPlans(result)
            } catch (err: any) {
                console.error("Error loading floor plan previews:", {
                    message: err.message,
                    details: err.details,
                    hint: err.hint,
                    code: err.code,
                    projectId
                })
            } finally {
                setLoading(false)
            }
        }

        loadPlans()
    }, [projectId])

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 h-24">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
        )
    }

    if (!plans.before && !plans.after) return null

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
                <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Planos del Proyecto</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {/* Antes */}
                <PlanThumbnail
                    plan={plans.before}
                    label="Antes"
                    projectId={projectId}
                    type="before"
                />

                {/* Después */}
                <PlanThumbnail
                    plan={plans.after}
                    label="Después"
                    projectId={projectId}
                    type="after"
                />
            </div>
        </div>
    )
}

function PlanThumbnail({
    plan,
    label,
    projectId,
    type
}: {
    plan: { id: string; thumbnail?: string; name: string } | null;
    label: string;
    projectId: string;
    type: "before" | "after";
}) {
    // We don't need loadSmartData or smartData anymore since we use window.open
    if (!plan) {
        return (
            <div className="aspect-square rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center p-2 opacity-50">
                <span className="text-[9px] font-bold text-slate-400 uppercase">{label}</span>
                <span className="text-[8px] text-slate-300">No disponible</span>
            </div>
        )
    }

    return (
        <button
            onClick={() => {
                const url = `/dashboard/editor-planos/visor/${plan.id}`;

                // Calculate half screen dimensions
                const width = window.screen.availWidth / 2;
                const height = window.screen.availHeight;
                const left = window.screen.availWidth / 2;
                const top = 0;

                // Try to resize current window to the left half (best effort, might be blocked by browser)
                try {
                    window.resizeTo(width, height);
                    window.moveTo(0, 0);
                } catch (e) {
                    console.warn("Browser blocked resizing current window");
                }

                // Open new window on the right half
                window.open(
                    url,
                    `viewer-${plan.id}`,
                    `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
                );
            }}
            className="group relative aspect-square rounded-lg bg-white border border-slate-200 overflow-hidden hover:border-orange-200 hover:shadow-md transition-all text-left"
            title={`Abrir plano ${label} en ventana independiente`}
        >
            {plan.thumbnail ? (
                <img
                    src={plan.thumbnail}
                    alt={plan.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                    <ImageIcon className="h-6 w-6" />
                </div>
            )}

            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm border border-slate-100 rounded text-[8px] font-black uppercase text-slate-700 shadow-sm leading-none">
                {label}
            </div>

            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors flex items-center justify-center">
                <ExternalLink className="h-5 w-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </button>
    )
}

function PlusIcon({ className }: { className?: string }) {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
}

function MinusIcon({ className }: { className?: string }) {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
}

function RotateCcwIcon({ className }: { className?: string }) {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
}
