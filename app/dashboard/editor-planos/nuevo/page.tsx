"use client"

import React, { useRef, useState } from "react"
import { EditorContainer } from "@/components/floor-plan-editor/EditorContainer"
import { useRouter } from "next/navigation"
import { SimpleSaveDialog } from "@/components/dashboard/simple-save-dialog"

export default function NuevoPlanoPage() {
  const editorRef = useRef<any>(null)
  const router = useRouter()
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [pendingPlanData, setPendingPlanData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  // 1. Intercept save request from Editor
  const handleEditorSave = (data: any, image: string) => {
    // Store both data and the image
    setPendingPlanData({ ...data, image })
    setShowSaveDialog(true)
  }

  // 2. Handle save with optional project and variant
  const handleDialogSave = async (planName: string, projectId: string | null, variant: string) => {
    if (!pendingPlanData) return
    setIsSaving(true)

    try {
      const response = await fetch("/api/editor-planos/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: planName,
          ...pendingPlanData,
          projectId: projectId || null,
          variant: variant || 'current'
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setShowSaveDialog(false)
        router.push(`/dashboard/editor-planos/editar/${result.id}`)
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
      />
    </div>
  )
}
