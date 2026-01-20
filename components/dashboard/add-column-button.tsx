"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { addProjectAddressColumn } from "@/lib/supabase/migrations"

export function AddColumnButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingProfileColumns, setIsAddingProfileColumns] = useState(false)
  const { toast } = useToast()

  const handleAddColumn = async () => {
    setIsLoading(true)
    try {
      const success = await addProjectAddressColumn()

      if (success) {
        toast({
          title: "Columna añadida",
          description: "La columna de dirección del proyecto se ha añadido correctamente.",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo añadir la columna. Revisa la consola para más detalles.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado. Revisa la consola para más detalles.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProfileColumns = async () => {
    setIsAddingProfileColumns(true)
    try {
      const response = await fetch("/api/setup-profile-columns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al añadir columnas de perfil")
      }

      toast({
        title: "Columnas añadidas",
        description: "Las columnas de moneda e IVA se han añadido correctamente al perfil.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error inesperado al añadir columnas de perfil.",
        variant: "destructive",
      })
    } finally {
      setIsAddingProfileColumns(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleAddColumn} disabled={isLoading} variant="outline">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Añadiendo columna...
          </>
        ) : (
          "Añadir columna de dirección del proyecto"
        )}
      </Button>

      <Button onClick={handleAddProfileColumns} disabled={isAddingProfileColumns} variant="outline">
        {isAddingProfileColumns ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Añadiendo columnas de perfil...
          </>
        ) : (
          "Añadir columnas de moneda e IVA al perfil"
        )}
      </Button>
    </div>
  )
}
