"use client"

import { HouseCalculatorModal } from "./house-calculator-modal"

interface SimpleCalculatorModalProps {
  isOpen: boolean
  onClose: () => void
  onResult: (result: number) => void
  initialValue?: number
  title?: string
}

export function SimpleCalculatorModal(props: SimpleCalculatorModalProps) {
  return <HouseCalculatorModal {...props} />
}
