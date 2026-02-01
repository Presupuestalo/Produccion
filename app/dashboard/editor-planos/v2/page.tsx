"use client"
import React, { useRef } from "react"
import { EditorContainer } from "@/components/floor-plan-editor/EditorContainer"

export default function EditorPlanosV2Page() {
    const editorRef = useRef<any>(null)
    return (
        <div className="h-[calc(100vh-4rem+2rem)] md:h-[calc(100vh-4rem+3rem)] -mx-4 -my-4 md:-mx-6 md:-my-6 bg-slate-50 overflow-hidden">
            <EditorContainer ref={editorRef} />
        </div>
    )
}
