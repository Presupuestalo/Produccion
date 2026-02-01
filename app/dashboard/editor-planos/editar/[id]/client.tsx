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
    planName
}: {
    initialData: any,
    planId: string,
    projectId?: string | null,
    planName?: string
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
                    // Send the plan ID to update the specific plan
                    id: planId,
                    // If linked to a project, pass it (though API might not change it on update)
                    projectId: projectId || undefined,
                    // Name might come from data? Or use the prop name as fallback?
                    // Usually data.name or we let the user edit it. 
                    // For now, allow API to use provided name or default.
                    name: data.name || planName,
                    image // Include the image in the payload
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
            />
        </div>
    )
}
