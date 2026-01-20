"use client"

import { useState, useEffect, useRef } from "react"
import { saveAllProjectData } from "@/lib/services/calculator-service"

interface DirectSaveOptions {
  onSuccess?: () => void
  onError?: (error: any) => void
  immediate?: boolean // Nueva opción para guardado inmediato
  debounceTime?: number
}

/**
 * Hook para guardar datos directamente en Supabase
 */
export function useDirectSave<T>(
  projectId: string | undefined,
  dataType: "rooms" | "reformRooms" | "demolitionConfig" | "demolitionSettings",
  data: T,
  deps: any[] = [],
  options: DirectSaveOptions = {},
) {
  const { onSuccess, onError, immediate = true, debounceTime = 500 } = options // Guardado inmediato por defecto
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  // Función para guardar los datos
  const saveData = async () => {
    if (!projectId) return

    try {
      setIsSaving(true)
      setError(null)

      console.log(`[v0] Guardando ${dataType} inmediatamente...`)

      // Preparar los datos para guardar
      const saveData: any = {}
      saveData[dataType] = data

      // Guardar en Supabase
      const success = await saveAllProjectData(projectId, saveData)

      if (success) {
        setLastSaved(new Date())
        retryCountRef.current = 0
        if (onSuccess) onSuccess()
        console.log(`[v0] ${dataType} guardado correctamente`)
      } else {
        throw new Error("Error al guardar datos")
      }
    } catch (err) {
      setError(err)
      console.error(`[v0] Error al guardar ${dataType}:`, err)

      // Reintentar si no se ha alcanzado el máximo de reintentos
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++
        console.log(`[v0] Reintentando guardar ${dataType} (intento ${retryCountRef.current})...`)

        // Reintentar después de un tiempo (aumentando con cada intento)
        const retryDelay = 1000 * Math.pow(2, retryCountRef.current - 1)
        setTimeout(() => saveData(), retryDelay)
      } else {
        if (onError) onError(err)
      }
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (!projectId) return

    if (immediate) {
      console.log(`[v0] Cambios detectados en ${dataType}, guardando inmediatamente...`)
      saveData() // Guardado inmediato sin setTimeout
    } else {
      // Limpiar el timeout anterior si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Configurar un nuevo timeout para guardar los datos
      timeoutRef.current = setTimeout(() => {
        saveData()
      }, debounceTime)

      // Limpiar el timeout al desmontar
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }
  }, [projectId, ...deps])

  // Guardar datos antes de cerrar la ventana
  useEffect(() => {
    if (!projectId) return

    const handleBeforeUnload = () => {
      // Intentar guardar de forma síncrona antes de cerrar
      try {
        const saveData: any = {}
        saveData[dataType] = data

        // Usar fetch síncrono para intentar guardar
        const xhr = new XMLHttpRequest()
        xhr.open("POST", "/api/emergency-save", false) // false = síncrono
        xhr.setRequestHeader("Content-Type", "application/json")
        xhr.send(
          JSON.stringify({
            projectId,
            dataType,
            data,
          }),
        )
      } catch (e) {
        console.error("Error al guardar datos antes de cerrar:", e)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [projectId, data, dataType])

  // Función para forzar el guardado
  const forceSave = () => {
    saveData()
  }

  return { isSaving, lastSaved, error, forceSave }
}
