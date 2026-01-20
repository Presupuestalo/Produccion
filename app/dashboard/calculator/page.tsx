import type { Metadata } from "next"
import { Calculator } from "@/components/calculator/calculator"

export const metadata: Metadata = {
  title: "Calculadora | Presupuéstalo",
  description: "Calcula presupuestos de reformas rápidamente",
}

export default function CalculatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calculadora de Presupuestos</h1>
        <p className="text-muted-foreground">Calcula rápidamente presupuestos para diferentes tipos de reformas</p>
      </div>

      <Calculator />
    </div>
  )
}
