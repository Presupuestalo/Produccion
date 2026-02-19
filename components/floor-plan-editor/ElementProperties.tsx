import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, ArrowLeftRight, X, Copy } from "lucide-react"
import { useEffect, useState, useRef } from "react"

interface ElementPropertiesProps {
    elementId: string
    type: "door" | "window" | "shunt"
    width: number // cm
    height?: number // cm (for windows/shunts)
    isFixed?: boolean // for windows
    onUpdateWidth: (id: string, width: number) => void
    onUpdateHeight?: (id: string, height: number) => void
    onUpdateFixed?: (id: string, isFixed: boolean) => void
    onClone?: (id: string) => void
    onDelete: (id: string) => void
    onClose: () => void
}

export function ElementProperties({
    elementId,
    type,
    width,
    height,
    isFixed,
    onUpdateWidth,
    onUpdateHeight,
    onUpdateFixed,
    onClone,
    onDelete,
    onClose
}: ElementPropertiesProps) {
    const [localWidth, setLocalWidth] = useState(width.toString())
    const [localHeight, setLocalHeight] = useState((height || 0).toString())

    useEffect(() => {
        setLocalWidth(width.toFixed(1))
    }, [width])

    useEffect(() => {
        if (height !== undefined) setLocalHeight(height.toFixed(1))
    }, [height])

    // Refs for Auto-Save on Unmount
    const stateRef = useRef({
        localWidth,
        localHeight,
        width,
        height,
        onUpdateWidth,
        onUpdateHeight,
        elementId
    })

    // Keep ref in sync
    useEffect(() => {
        stateRef.current = {
            localWidth,
            localHeight,
            width,
            height,
            onUpdateWidth,
            onUpdateHeight,
            elementId
        }
    })

    // Auto-save on Close (Unmount)
    useEffect(() => {
        return () => {
            const state = stateRef.current

            // Save Width
            const finalW = parseFloat(state.localWidth)
            if (!isNaN(finalW) && Math.abs(finalW - state.width) > 0.01) {
                state.onUpdateWidth(state.elementId, finalW)
            }

            // Save Height
            const finalH = parseFloat(state.localHeight)
            if (state.onUpdateHeight && state.height !== undefined && !isNaN(finalH) && Math.abs(finalH - state.height) > 0.01) {
                state.onUpdateHeight(state.elementId, finalH)
            }
        }
    }, [])

    const handleWidthBlur = () => {
        const val = parseFloat(localWidth)
        if (!isNaN(val) && val !== width) {
            onUpdateWidth(elementId, val)
            setLocalWidth(val.toFixed(1))
        } else {
            setLocalWidth(width.toFixed(1))
        }
    }

    const handleHeightBlur = () => {
        const val = parseFloat(localHeight)
        if (onUpdateHeight && height !== undefined && !isNaN(val) && val !== height) {
            onUpdateHeight(elementId, val)
            setLocalHeight(val.toFixed(1))
        } else {
            if (height !== undefined) setLocalHeight(height.toFixed(1))
        }
    }

    return (
        <Card className="p-4 space-y-4 w-full md:w-72 bg-white shadow-lg border-slate-200">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-sm text-slate-800">
                    {type === "door" ? "Propiedades de Puerta" : type === "window" ? "Propiedades de Ventana" : "Propiedades de Columna"}
                </h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-3">
                <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Ancho</Label>
                    <Input
                        type="text"
                        inputMode="decimal"
                        value={localWidth}
                        onChange={(e) => {
                            const val = e.target.value.replace(/,/g, '.')
                            if (/^[\d.]*$/.test(val)) setLocalWidth(val)
                        }}
                        onBlur={handleWidthBlur}
                        className="h-8 text-sm"
                    />
                </div>
                {height !== undefined && onUpdateHeight && (
                    <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Alto/Largo</Label>
                        <Input
                            type="text"
                            inputMode="decimal"
                            value={localHeight}
                            onChange={(e) => {
                                const val = e.target.value.replace(/,/g, '.')
                                if (/^[\d.]*$/.test(val)) setLocalHeight(val)
                            }}
                            onBlur={handleHeightBlur}
                            className="h-8 text-sm"
                        />
                    </div>
                )}
            </div>

            {type === "window" && (
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                    <input
                        type="checkbox"
                        id="isFixed"
                        checked={!!(window as any)?.isFixed} // We need to handle this prop
                        onChange={(e) => {
                            // This component needs to handle generic updates or specific window updates
                            // Implementation will require updating the parent or passing a specific handler
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <Label htmlFor="isFixed" className="text-sm text-slate-700">Ventana Fija (Sin apertura)</Label>
                </div>
            )}

            <div className="space-y-3">

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    {onClone && (
                        <Button variant="outline" size="sm" onClick={() => onClone(elementId)} title="Duplicar">
                            <Copy className="h-3.5 w-3.5 mr-2" />
                            Duplicar
                        </Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => onDelete(elementId)} title="Eliminar Elemento" className={onClone ? "" : "col-span-2"}>
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Eliminar
                    </Button>
                </div>
        </Card>
    )
}
