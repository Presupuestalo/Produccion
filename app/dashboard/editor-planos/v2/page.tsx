"use client"
import React from "react"
import { EditorContainer } from "@/components/floor-plan-editor/EditorContainer"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditorPlanosV2Page() {
    return (
        <div className="h-screen flex flex-col bg-slate-50">
            {/* Header Estrecho */}
            <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/editor-planos">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span>Volver</span>
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-slate-200" />
                    <h1 className="text-lg font-bold text-slate-900 leading-none">Editor 2D <span className="text-orange-600">Beta</span></h1>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm">Limpiar</Button>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">Guardar Plano</Button>
                </div>
            </header>

            <main className="flex-1 p-4 md:p-6 overflow-hidden">
                <EditorContainer />
            </main>
        </div>
    )
}
