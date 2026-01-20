"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { HouseCalculator } from "./house-calculator"

interface HouseCalculatorModalProps {
  isOpen: boolean
  onClose: () => void
  onResult: (result: number) => void
  initialValue?: number
  title?: string
}

export function HouseCalculatorModal({
  isOpen,
  onClose,
  onResult,
  initialValue = 0,
  title = "Calculadora",
}: HouseCalculatorModalProps) {
  const handleResult = (result: number) => {
    onResult(result)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <HouseCalculator onResult={handleResult} initialValue={initialValue} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
