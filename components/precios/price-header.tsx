"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Upload, Sparkles, Brain } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSubscriptionLimits } from "@/lib/services/subscription-limits-service"
import { AIPriceImportDialog } from "./ai-price-import-dialog"
import { Badge } from "@/components/ui/badge"

export function PriceHeader() {
    const [hasAIImport, setHasAIImport] = useState<boolean | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        async function checkLimits() {
            const limits = await getSubscriptionLimits()
            setHasAIImport(limits?.aiPriceImport || false)
        }
        checkLimits()
    }, [])

    const handleImportClick = (e: React.MouseEvent) => {
        if (hasAIImport === false) {
            e.preventDefault()
            setIsDialogOpen(true)
        }
    }

    return (
        <div className="px-3 md:px-0 py-2 md:py-0 border-b md:border-b-0 mb-6">
            <div className="flex items-center justify-between gap-2 md:gap-4">
                <div className="flex items-center gap-2 md:gap-4">
                    <Button asChild variant="ghost" size="icon" className="h-7 w-7 md:h-10 md:w-10">
                        <Link href="/dashboard">
                            <ArrowLeft className="w-3.5 h-3.5 md:w-5 md:h-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-base md:text-3xl font-bold text-gray-900">Gestión de Precios</h1>
                        <p className="hidden md:block text-sm text-gray-600">
                            Consulta y gestiona los precios de materiales y mano de obra
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        asChild
                        variant="outline"
                        className={`
              relative overflow-hidden group transition-all duration-300
              h-8 md:h-10 px-3 md:px-4
              border-purple-200 hover:border-purple-400 bg-white
              shadow-sm hover:shadow-purple-100
            `}
                        onClick={handleImportClick}
                    >
                        <Link href={hasAIImport ? "/dashboard/precios/importador" : "#"} className="flex items-center gap-2">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative flex items-center gap-2">
                                <Brain className={`w-3.5 h-3.5 md:w-4 md:h-4 ${hasAIImport === false ? 'text-purple-500' : 'text-blue-500'}`} />
                                <span className="hidden md:inline font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                                    Importar con IA
                                </span>
                                <span className="md:hidden text-xs font-bold text-purple-600">IA</span>

                                {hasAIImport === false && (
                                    <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700 border-purple-200 text-[10px] h-4 px-1 font-bold animate-pulse">
                                        PRO
                                    </Badge>
                                )}

                                {hasAIImport && (
                                    <Sparkles className="w-3 h-3 text-yellow-500 animate-bounce" />
                                )}
                            </div>
                        </Link>
                    </Button>
                </div>
            </div>

            <AIPriceImportDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </div>
    )
}
