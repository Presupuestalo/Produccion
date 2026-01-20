"use client"

import { useState, useEffect, useRef } from "react"

type SaveFunction<T> = (data: T) => Promise<boolean>

interface AutoSaveOptions {
  onSuccess?: () => void
  onError?: (error: any) => void
  immediate?: boolean // Nueva opción para guardado inmediato
}

/**
 * Hook personalizado para manejar el guardado automático de datos
 * @param saveFunction Función que guarda los datos
 * @param data Datos a guardar
 * @param dependencies Array de dependencias que disparan el guardado
 * @param options Opciones adicionales
 */
export function useAutoSave<T>(
  saveFunction: SaveFunction<T>,
  data: T,
  dependencies: any[],
  options: AutoSaveOptions = {},
) {
  const { onSuccess, onError, immediate = true } = options // Guardado inmediato por defecto
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<any>(null)
  const lastDataRef = useRef<T>(data)
  const saveAttempts = useRef(0)
  const maxRetries = 3

  // Función para guardar los datos
  const saveData = async (retry = 0) => {
    if (!data) return

    try {
      setIsSaving(true)
      setError(null)

      console.log(`[v0] Guardando datos inmediatamente (intento ${retry + 1}/${maxRetries + 1})...`)
      const success = await saveFunction(data)

      if (success) {
        setLastSaved(new Date())
        saveAttempts.current = 0
        if (onSuccess) onSuccess()
        console.log("[v0] Datos guardados correctamente")
      } else {
        throw new Error("Error al guardar los datos")
      }
    } catch (err) {
      console.error(`[v0] Error en el guardado automático (intento ${retry + 1}/${maxRetries + 1}):`, err)

      // Si no hemos alcanzado el máximo de reintentos, intentar de nuevo
      if (retry < maxRetries) {
        console.log(`[v0] Reintentando guardado en ${(retry + 1) * 1000}ms...`)
        setTimeout(() => saveData(retry + 1), (retry + 1) * 1000)
        return
      }

      setError(err)
      saveAttempts.current += 1
      if (onError) onError(err)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    // Verificar si los datos han cambiado realmente
    const hasChanged = JSON.stringify(data) !== JSON.stringify(lastDataRef.current)

    if (hasChanged) {
      console.log("[v0] Datos cambiados, guardando inmediatamente...")

      if (immediate) {
        // Guardar inmediatamente sin debounce
        saveData()
        lastDataRef.current = JSON.parse(JSON.stringify(data))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies])

  // Función para forzar el guardado manualmente
  const forceSave = async () => {
    await saveData()
    lastDataRef.current = JSON.parse(JSON.stringify(data))
  }

  return {
    isSaving,
    lastSaved,
    error,
    forceSave,
  }
}
