"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Pizarra } from "./pizarra"
import { Check, X } from "lucide-react"

interface RoomShapeEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyMeasurements: (area: number, perimeter: number) => void
  roomName: string
}

export function RoomShapeEditorModal({ isOpen, onClose, onApplyMeasurements, roomName }: RoomShapeEditorModalProps) {
  const [calculatedArea, setCalculatedArea] = useState<number | null>(null)
  const [calculatedPerimeter, setCalculatedPerimeter] = useState<number | null>(null)

  const handleMeasurementsCalculated = (area: number, perimeter: number) => {
    setCalculatedArea(area)
    setCalculatedPerimeter(perimeter)
  }

  const handleApply = () => {
    if (calculatedArea !== null && calculatedPerimeter !== null) {
      onApplyMeasurements(calculatedArea, calculatedPerimeter)
      onClose()
      // Resetear valores
      setCalculatedArea(null)
      setCalculatedPerimeter(null)
    }
  }

  const handleCancel = () => {
    onClose()
    // Resetear valores
    setCalculatedArea(null)
    setCalculatedPerimeter(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Editor de Forma - {roomName}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Pizarra onMeasurementsCalculated={handleMeasurementsCalculated} />
        </div>

        <DialogFooter className="flex flex-col gap-4">
          {calculatedArea !== null && calculatedPerimeter !== null && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-green-800 mb-2">¡Figura completada!</h3>
                <p className="text-sm text-green-600">Las medidas están listas para aplicar a la habitación</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleApply}
              disabled={calculatedArea === null || calculatedPerimeter === null}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Aplicar Medidas
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
