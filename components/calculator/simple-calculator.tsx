"use client"

import { HouseCalculator } from "./house-calculator"

interface SimpleCalculatorProps {
  onResult?: (result: number) => void
}

export function SimpleCalculator({ onResult }: SimpleCalculatorProps) {
  return <HouseCalculator onResult={onResult} />
}
