import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Trash2, Divide, EyeOff, X } from "lucide-react"
import { useEffect, useState } from "react"

interface WallPropertiesProps {
    wallId: string
    length: number // cm
    thickness: number // cm
    isInvisible: boolean
    onUpdateLength: (id: string, length: number) => void
    onUpdateThickness: (id: string, thickness: number) => void
    onUpdateInvisible: (id: string, invisible: boolean) => void
    onSplit: (id: string) => void
    onDelete: (id: string) => void
    onClose: () => void
}

export function WallProperties({
    wallId,
    length,
    thickness,
    isInvisible,
    onUpdateLength,
    onUpdateThickness,
    onUpdateInvisible,
    onSplit,
    onDelete,
    onClose
}: WallPropertiesProps) {
    const [localLength, setLocalLength] = useState(length)
    const [lThick, setLThick] = useState(thickness)

    useEffect(() => {
        setLocalLength(length)
    }, [length])

    useEffect(() => {
        setLThick(thickness)
    }, [thickness])

    const handleLengthBlur = () => {
        if (localLength !== length) {
            onUpdateLength(wallId, localLength)
        }
    }

    const handleThicknessBlur = () => {
        if (lThick !== thickness) {
            onUpdateThickness(wallId, lThick)
        }
    }

    return (
        <Card className="p-4 space-y-4 w-full md:w-72 bg-white shadow-lg border-slate-200">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-sm text-slate-800">Propiedades del Muro</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-3">
                <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Longitud (cm)</Label>
                    <Input
                        type="number"
                        value={Math.round(localLength)}
                        onChange={(e) => setLocalLength(parseFloat(e.target.value) || 0)}
                        onBlur={handleLengthBlur}
                        className="h-8 text-sm"
                    />
                </div>

                <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Grosor (cm)</Label>
                    <Input
                        type="number"
                        value={lThick}
                        onChange={(e) => setLThick(parseFloat(e.target.value) || 0)}
                        onBlur={handleThicknessBlur}
                        className="h-8 text-sm"
                    />
                </div>

                <div className="flex items-center justify-between py-1">
                    <Label className="text-xs text-slate-500 flex items-center gap-2">
                        <EyeOff className="h-3 w-3" />
                        Invisible
                    </Label>
                    <Switch
                        checked={isInvisible}
                        onCheckedChange={(checked) => onUpdateInvisible(wallId, checked)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => onSplit(wallId)} title="Dividir Muro">
                    <Divide className="h-3.5 w-3.5 mr-2" />
                    Dividir
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(wallId)} title="Eliminar Muro">
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Eliminar
                </Button>
            </div>
        </Card>
    )
}
