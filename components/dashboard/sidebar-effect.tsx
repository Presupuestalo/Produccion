"use client"

import { useEffect } from "react"
import { useSidebar } from "./sidebar"

export function SidebarEffect() {
  const sidebarContext = useSidebar()

  useEffect(() => {
    // Verificar si el contexto está disponible
    if (!sidebarContext) return

    const { collapsed } = sidebarContext

    // Usar setTimeout para asegurar que el DOM esté listo
    const timeoutId = setTimeout(() => {
      try {
        const content = document.querySelector(".sidebar-content")
        if (content) {
          if (collapsed) {
            content.classList.remove("ml-64")
            content.classList.add("ml-16")
          } else {
            content.classList.remove("ml-16")
            content.classList.add("ml-64")
          }
        }
      } catch (error) {
        // Eliminar la línea `console.error("Error al manipular clases del sidebar:", error)`
      }
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [sidebarContext])

  return null
}
