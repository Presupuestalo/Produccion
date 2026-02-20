"use client"

import React, { useRef, useState } from "react"
import { EditorContainer } from "@/components/floor-plan-editor/EditorContainer"
import { useRouter, useSearchParams } from "next/navigation"
import { SimpleSaveDialog } from "@/components/dashboard/simple-save-dialog"

export default function NuevoPlanoPage() {
  const editorRef = useRef<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [pendingPlanData, setPendingPlanData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  // URL-based pre-linking (from "Con Plano" project creation flow)
  const urlProjectId = searchParams.get("projectId")
  const urlVariant = searchParams.get("variant") || "current"

  // 1. Intercept save request from Editor
  const handleEditorSave = (data: any, image: string) => {
    setPendingPlanData({ ...data, image })
    setShowSaveDialog(true)
  }

  // 2. Handle save with optional project and variant
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
        // If linked to a project, go back to the project page after save
        if (urlProjectId) {
          router.push(`/dashboard/projects/${urlProjectId}`)
        } else {
          router.push(`/dashboard/editor-planos/editar/${result.id}`)
        }
        router.refresh()
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

  return (
    <div className="h-[calc(100vh-4rem+2rem)] md:h-[calc(100vh-4rem+3rem)] -mx-4 -my-4 md:-mx-6 md:-my-6 bg-slate-50 overflow-hidden">
      <EditorContainer
        ref={editorRef}
        onSave={handleEditorSave}
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

