"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { getProjects } from "@/lib/services/project-service"
import type { Project } from "@/types/project"

type ProjectsContextType = {
  projects: Project[] | null
  isLoading: boolean
  error: string | null
  refreshProjects: () => Promise<void>
}

const defaultContextValue: ProjectsContextType = {
  projects: [],
  isLoading: false,
  error: null,
  refreshProjects: async () => {},
}

const ProjectsContext = createContext<ProjectsContextType>(defaultContextValue)

export function useProjects() {
  const context = useContext(ProjectsContext)
  if (!context) {
    throw new Error("useProjects debe ser usado dentro de un ProjectsProvider")
  }
  return context
}

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[] | null>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProjects = useCallback(async () => {
    console.log("[v0] ProjectsContext - Iniciando carga de proyectos...")
    setIsLoading(true)
    setError(null)
    try {
      const data = await getProjects()
      console.log("[v0] ProjectsContext - Proyectos recibidos:", data?.length || 0)
      console.log("[v0] ProjectsContext - Datos:", JSON.stringify(data, null, 2))
      setProjects(data)
      console.log("[v0] ProjectsContext - Estado actualizado con", data?.length || 0, "proyectos")
    } catch (err: any) {
      console.error("[v0] ProjectsContext - Error:", err)
      setError(err.message || "Error al cargar proyectos")
    } finally {
      setIsLoading(false)
      console.log("[v0] ProjectsContext - Carga finalizada")
    }
  }, [])

  useEffect(() => {
    refreshProjects()
  }, [refreshProjects])

  return (
    <ProjectsContext.Provider value={{ projects, isLoading, error, refreshProjects }}>
      {children}
    </ProjectsContext.Provider>
  )
}
