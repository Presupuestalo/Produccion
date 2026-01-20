"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CollapsibleHeaderProps {
  title: string
  children: React.ReactNode
  defaultCollapsed?: boolean
  storageKey?: string
}

export function CollapsibleHeader({
  title,
  children,
  defaultCollapsed = true,
  storageKey = "presupuestalo_header_collapsed",
}: CollapsibleHeaderProps) {
  // Cargar estado desde localStorage si está disponible
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined" && storageKey) {
      const saved = localStorage.getItem(storageKey)
      return saved !== null ? JSON.parse(saved) : defaultCollapsed
    }
    return defaultCollapsed
  })

  // Guardar estado en localStorage cuando cambia
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(isCollapsed))
    }
  }, [isCollapsed, storageKey])

  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <h3 className="text-lg font-medium">{title}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
          aria-label={isCollapsed ? "Expandir" : "Colapsar"}
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      <div className={`transition-all duration-300 ${isCollapsed ? "max-h-0 overflow-hidden" : "max-h-[1000px]"}`}>
        {children}
      </div>
    </div>
  )
}
