"use client"
import React, { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { FileDown, Printer, Eye, Type, Square, FileText } from "lucide-react"

interface ExportOptions {
    showMeasures: boolean
    showRoomNames: boolean
    showAreas: boolean
    showSummary: boolean
    orientation: "portrait" | "landscape"
}

interface FloorPlanExportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onExport: (options: ExportOptions) => void
    isExporting?: boolean
    container?: HTMLElement | null
}

export function FloorPlanExportDialog({
    open,
    onOpenChange,
    onExport,
    isExporting,
    container
}: FloorPlanExportDialogProps) {
    const [options, setOptions] = useState<ExportOptions>({
        showMeasures: true,
        showRoomNames: true,
        showAreas: true,
        showSummary: true,
        orientation: "landscape"
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent container={container} className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileDown className="h-5 w-5 text-blue-600" />
                        Exportar Plano a PDF
                    </DialogTitle>
                    <DialogDescription>
                        Configura las opciones de visualización para tu documento PDF.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="show-measures" className="flex flex-col gap-1 cursor-pointer">
                            <span className="flex items-center gap-2 font-semibold">
                                <Eye className="w-4 h-4" /> Ver medidas
                            </span>
                            <span className="font-normal text-xs text-slate-500">Muestra las cotas de muros y elementos</span>
                        </Label>
                        <Switch
                            id="show-measures"
                            checked={options.showMeasures}
                            onCheckedChange={(val) => setOptions(prev => ({ ...prev, showMeasures: val }))}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="show-names" className="flex flex-col gap-1 cursor-pointer">
                            <span className="flex items-center gap-2 font-semibold">
                                <Type className="w-4 h-4" /> Nombres de estancias
                            </span>
                            <span className="font-normal text-xs text-slate-500">Muestra el nombre de cada habitación</span>
                        </Label>
                        <Switch
                            id="show-names"
                            checked={options.showRoomNames}
                            onCheckedChange={(val) => setOptions(prev => ({ ...prev, showRoomNames: val }))}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="show-areas" className="flex flex-col gap-1 cursor-pointer">
                            <span className="flex items-center gap-2 font-semibold">
                                <Square className="w-4 h-4" /> Superficies
                            </span>
                            <span className="font-normal text-xs text-slate-500">Muestra los m² de cada estancia</span>
                        </Label>
                        <Switch
                            id="show-areas"
                            checked={options.showAreas}
                            onCheckedChange={(val) => setOptions(prev => ({ ...prev, showAreas: val }))}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="show-summary" className="flex flex-col gap-1 cursor-pointer">
                            <span className="flex items-center gap-2 font-semibold">
                                <FileText className="w-4 h-4" /> Incluir resumen
                            </span>
                            <span className="font-normal text-xs text-slate-500">Añade una página con el listado de estancias</span>
                        </Label>
                        <Switch
                            id="show-summary"
                            checked={options.showSummary}
                            onCheckedChange={(val) => setOptions(prev => ({ ...prev, showSummary: val }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <Button
                            variant={options.orientation === "landscape" ? "default" : "outline"}
                            className="flex flex-col h-auto py-3 gap-1"
                            onClick={() => setOptions(prev => ({ ...prev, orientation: "landscape" }))}
                        >
                            <span className="text-xs">Horizontal</span>
                            <div className="w-8 h-5 border-2 border-current rounded-sm opacity-60" />
                        </Button>
                        <Button
                            variant={options.orientation === "portrait" ? "default" : "outline"}
                            className="flex flex-col h-auto py-3 gap-1"
                            onClick={() => setOptions(prev => ({ ...prev, orientation: "portrait" }))}
                        >
                            <span className="text-xs">Vertical</span>
                            <div className="w-5 h-8 border-2 border-current rounded-sm opacity-60" />
                        </Button>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button
                        onClick={() => onExport(options)}
                        disabled={isExporting}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                        {isExporting ? "Generando..." : (
                            <>
                                <Printer className="w-4 h-4" />
                                Generar PDF
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
