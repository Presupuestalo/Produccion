import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Estimación de Presupuesto - Presupuestalo",
  description:
    "Obtén una estimación precisa de tu reforma en segundos con IA. Recibe hasta 3 presupuestos de empresas profesionales.",
}

export default function EstimacionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
