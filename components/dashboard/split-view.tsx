"use client"

import type React from "react"

interface SplitViewProps {
  projectId: string
  children: React.ReactNode
}

export function SplitView({ projectId, children }: SplitViewProps) {
  // Simplemente renderizar los children sin la funcionalidad de vista dividida
  return <>{children}</>
}
