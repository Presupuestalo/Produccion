"use client"

import { useState } from "react"
import { SimpleCalculatorModal } from "@/components/calculator/simple-calculator-modal"

export function CalculatorButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <SimpleCalculatorModal isOpen={isOpen} onClose={() => setIsOpen(false)} onResult={() => {}} />
    </>
  )
}
