"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CollapsibleSectionProps {
  title: string
  defaultCollapsed?: boolean
  storageKey?: string
  children: React.ReactNode
  summary?: React.ReactNode
}

export function CollapsibleSection({
  title,
  defaultCollapsed = false,
  storageKey,
  children,
  summary,
}: CollapsibleSectionProps) {
  // Intentar cargar el estado desde localStorage si se proporciona una clave
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined" && storageKey) {
      const saved = localStorage.getItem(storageKey)
      return saved !== null ? JSON.parse(saved) : defaultCollapsed
    }
    return defaultCollapsed
  })

  // Guardar el estado en localStorage cuando cambia
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(isCollapsed))
    }
  }, [isCollapsed, storageKey])

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <h3 className="text-lg font-medium">{title}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? "Expandir" : "Colapsar"}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {isCollapsed && summary && <div className="p-3 bg-gray-50 border-b text-sm text-gray-500">{summary}</div>}

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
        }`}
      >
        <div className="p-3">{children}</div>
      </div>
    </div>
  )
}
