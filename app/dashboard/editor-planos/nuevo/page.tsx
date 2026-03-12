"use client"

import React, { useRef, useState } from "react"
import { EditorContainer } from "@/components/floor-plan-editor/EditorContainer"
import { useRouter, useSearchParams } from "next/navigation"
import { SimpleSaveDialog } from "@/components/dashboard/simple-save-dialog"
import { useToast } from "@/hooks/use-toast"

export default function NuevoPlanoPage() {
  const editorRef = useRef<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [pendingPlanData, setPendingPlanData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [createdPlanId, setCreatedPlanId] = useState<string | null>(null)
  const { toast } = useToast()

  // URL-based pre-linking (from "Con Plano" project creation flow)
  const urlProjectId = searchParams.get("projectId")
  const urlVariant = searchParams.get("variant") || "current"
  const urlHeight = searchParams.get("height")

  // 1. Intercept save request from Editor
  const handleEditorSave = (data: any, image: string) => {
    // If we've already created it, we don't need the prompt again unless we want to change project link.
    // For simplicity, we just prompt again or we could auto-save.
    // Actually, on auto-save (subsequent saves), we should skip the modal.
    // Let's check `data.isManual` or similar? EditorContainer doesn't pass it here easily.
    // If createdPlanId exists, we can just do a silent save! But EditorContainer expects us to handle everything if onSave is provided.
    if (createdPlanId) {
       handleSilentUpdate(data, image, createdPlanId)
       return
    }
    
    setPendingPlanData({ ...data, image })
    // Close contextual menus so they don't show above the save dialog
    editorRef.current?.closeMenus?.()
    setShowSaveDialog(true)
  }

  // Handle subsequent auto-saves or manual saves after the first creation
  const handleSilentUpdate = async (data: any, image: string, planId: string) => {
    // To update, we just send the data with the ID. We don't change the name/project here 
    // since those are set. We could just call the save API.
    try {
      const response = await fetch("/api/editor-planos/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          id: planId,
          image
        }),
      })

      if (response.ok) {
        toast({ title: "Guardado", description: "El plano se ha actualizado correctamente." })
      } else {
        console.error("Error updating plan")
      }
    } catch (e) {
      console.error("Exception updating plan", e)
    }
  }

  // 2. Handle save with optional project and variant for NEW plan
  const handleDialogSave = async (planName: string, projectId: string | null, variant: string) => {
    if (!pendingPlanData) return
    setIsSaving(true)

    // URL params take precedence when coming from project creation flow
    const finalProjectId = urlProjectId || projectId || null
    const finalVariant = urlProjectId ? urlVariant : (variant || "current")

    try {
      const response = await fetch("/api/editor-planos/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: planName,
          ...pendingPlanData,
          projectId: finalProjectId,
          variant: finalVariant,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setShowSaveDialog(false)
        setCreatedPlanId(result.id)
        toast({ title: "Plano creado", description: "El nuevo plano se ha guardado correctamente." })

        // If linked to a project, it's fine to navigate away (user is done with the editor for now)
        if (urlProjectId) {
          router.push(`/dashboard/projects/${urlProjectId}`)
        } else {
          // KEY FIX: Instead of router.push which unmounts the DOM and breaks Fullscreen,
          // we use replaceState to just update the URL so the user can keep working seamlessly.
          // EditorContainer already handles subsequent saves gracefully.
          window.history.replaceState(null, '', `/dashboard/editor-planos/editar/${result.id}`)
        }
      } else {
        const errorText = await response.text()
        console.error("Error saving plan:", errorText)
        alert(`Error al guardar: ${errorText}`)
      }
    } catch (error) {
      console.error("Exception saving plan", error)
      alert("Error crítico al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  const initialData = urlHeight ? { ceilingHeight: Number(urlHeight) } : undefined

  return (
    <div className="h-[calc(100vh-4rem+2rem)] md:h-[calc(100vh-4rem+3rem)] -mx-4 -my-4 md:-mx-6 md:-my-6 bg-slate-50 overflow-hidden">
      <EditorContainer
        ref={editorRef}
        onSave={handleEditorSave}
        initialData={initialData}
        planId={createdPlanId || undefined}
      />

      <SimpleSaveDialog
        container={editorRef.current?.fullscreenContainer}
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleDialogSave}
        isLoading={isSaving}
        initialProjectId={urlProjectId || undefined}
        initialVariant={urlProjectId ? urlVariant : undefined}
      />
    </div>
  )
}

