"use client"

import type React from "react"

// Modificar el proveedor de toast para evitar mostrar mensajes duplicados

import { ToastProvider as RadixToastProvider } from "@radix-ui/react-toast"
import { useToast } from "@/hooks/use-toast"
import { useRef } from "react"

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts } = useToast()

  // Añadir una referencia para rastrear los últimos mensajes mostrados
  const lastToastsRef = useRef<{ id: string; message: string; timestamp: number }[]>([])

  // Filtrar toasts duplicados o muy frecuentes
  const filteredToasts = toasts.filter((toast) => {
    // Verificar si este toast es similar a uno reciente
    const now = Date.now()
    const isDuplicate = lastToastsRef.current.some(
      (lastToast) => lastToast.message === toast.description && now - lastToast.timestamp < 3000, // 3 segundos
    )

    // Si no es duplicado, añadirlo a la lista de recientes
    if (!isDuplicate) {
      // Mantener solo los últimos 5 toasts
      if (lastToastsRef.current.length >= 5) {
        lastToastsRef.current.shift()
      }

      lastToastsRef.current.push({
        id: toast.id,
        message: toast.description as string,
        timestamp: now,
      })

      return true
    }

    return false
  })

  return (
    <RadixToastProvider>
      {/* Renderizar los toasts filtrados en lugar de todos */}
      {/* Resto del código del componente */}
      {children}
    </RadixToastProvider>
  )
}
