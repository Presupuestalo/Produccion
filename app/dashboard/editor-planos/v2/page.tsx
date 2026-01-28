"use client"
import React, { useRef } from "react"
import { EditorContainer } from "@/components/floor-plan-editor/EditorContainer"

export default function EditorPlanosV2Page() {
    const editorRef = useRef<any>(null)
    return (
        <div className="h-screen bg-slate-50 overflow-hidden">
            <EditorContainer ref={editorRef} />
        </div>
    )
}
