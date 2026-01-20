"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TrendingUp } from "lucide-react"

interface PriceIncreaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (percentage: number) => void
  title: string
  description: string
}

export function PriceIncreaseDialog({ open, onOpenChange, onConfirm, title, description }: PriceIncreaseDialogProps) {
  const [percentage, setPercentage] = useState<string>("")
  const [error, setError] = useState<string>("")

  const handleConfirm = () => {
    const value = Number.parseFloat(percentage)

    if (isNaN(value)) {
      setError("Por favor ingresa un número válido")
      return
    }

    if (value < -100) {
      setError("El porcentaje no puede ser menor a -100%")
      return
    }

    if (value > 1000) {
      setError("El porcentaje no puede ser mayor a 1000%")
      return
    }

    onConfirm(value)
    setPercentage("")
    setError("")
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPercentage("")
      setError("")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="percentage">Porcentaje de ajuste (%)</Label>
            <Input
              id="percentage"
              type="number"
              step="0.1"
              placeholder="Ej: 10 para aumentar 10%, -5 para reducir 5%"
              value={percentage}
              onChange={(e) => {
                setPercentage(e.target.value)
                setError("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConfirm()
                }
              }}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium text-blue-900">Ejemplos:</p>
            <ul className="text-sm text-blue-700 space-y-0.5">
              <li>• 10% = aumenta los precios un 10%</li>
              <li>• -5% = reduce los precios un 5%</li>
              <li>• 0% = no cambia los precios</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!percentage}>
            Aplicar Ajuste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
