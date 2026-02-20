"use client"

import React, { useRef } from "react"
import { EditorContainer } from "@/components/floor-plan-editor/EditorContainer"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { MobileOrientationGuard } from "@/components/floor-plan-editor/MobileOrientationGuard"

export default function EditPlanClient({
    initialData,
    planId,
    projectId,
    planName,
    variant
}: {
    initialData: any,
    planId: string,
    projectId?: string | null,
    planName?: string,
    variant?: string | null
}) {
    const editorRef = useRef<any>(null)
    const router = useRouter()
    const { toast } = useToast()

    const handleSave = async (data: any, image: string) => {
        try {
            const response = await fetch("/api/editor-planos/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    id: planId,
                    projectId: projectId || undefined,
                    variant: variant || undefined,
                    name: data.name || planName,
                    image
                }),
            })

            if (response.ok) {
                toast({ title: "Plano guardado", description: "Los cambios se han guardado correctamente." })
                router.refresh()
            } else {
                console.error("Error saving plan")
                toast({ title: "Error", description: "No se pudo guardar el plano.", variant: "destructive" })
            }
        } catch (error) {
            console.error("Exception saving plan", error)
            toast({ title: "Error", description: "Error de conexión al guardar.", variant: "destructive" })
        }
    }

    return (
        <div className="h-[calc(100vh-4rem+2rem)] md:h-[calc(100vh-4rem+3rem)] -mx-4 -my-4 md:-mx-6 md:-my-6 bg-slate-50 overflow-hidden">
            <MobileOrientationGuard />
            <EditorContainer
                ref={editorRef}
                initialData={initialData}
                onSave={handleSave}
                planId={planId}
                projectId={projectId}
                planName={planName}
                variant={variant}
            />
        </div>
    )
}
