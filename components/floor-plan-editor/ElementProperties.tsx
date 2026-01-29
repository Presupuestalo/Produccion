import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, ArrowLeftRight, X } from "lucide-react"
import { useEffect, useState } from "react"

interface ElementPropertiesProps {
    elementId: string
    type: "door" | "window"
    width: number // cm
    onUpdateWidth: (id: string, width: number) => void
    onDelete: (id: string) => void
    onClose: () => void
}

export function ElementProperties({
    elementId,
    type,
    width,
    onUpdateWidth,
    onDelete,
    onClose
}: ElementPropertiesProps) {
    const [localWidth, setLocalWidth] = useState(width)

    useEffect(() => {
        setLocalWidth(width)
    }, [width])

    const handleWidthBlur = () => {
        if (localWidth !== width) {
            onUpdateWidth(elementId, localWidth)
        }
    }

    return (
        <Card className="p-4 space-y-4 w-full md:w-72 bg-white shadow-lg border-slate-200">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-sm text-slate-800">
                    {type === "door" ? "Propiedades de Puerta" : "Propiedades de Ventana"}
                </h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-3">
                <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Ancho (cm)</Label>
                    <Input
                        type="number"
                        value={Math.round(localWidth)}
                        onChange={(e) => setLocalWidth(parseFloat(e.target.value) || 0)}
                        onBlur={handleWidthBlur}
                        className="h-8 text-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-100">
                <Button variant="destructive" size="sm" onClick={() => onDelete(elementId)} title="Eliminar Elemento">
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Eliminar
                </Button>
            </div>
        </Card>
    )
}
