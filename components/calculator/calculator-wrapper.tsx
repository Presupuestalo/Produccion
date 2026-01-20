"use client"

import Calculator from "./calculator"
import { ProjectSummary } from "./project-summary"

export default function CalculatorWrapper({ projectId }: { projectId?: string }) {
  return (
    <div className="space-y-4">
      {projectId && <ProjectSummary projectId={projectId} />}

      {/* Calculadora principal */}
      <Calculator projectId={projectId} />
    </div>
  )
}
