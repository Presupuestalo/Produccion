"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import type { Client, ClientFormData } from "@/types/client"
import { createClient, updateClient } from "@/lib/services/client-service"

interface ClientFormProps {
  client?: Client
  onSuccess?: () => void
  onCancel?: () => void
  onError?: (error: any) => void
}

export function ClientForm({ client, onSuccess, onCancel, onError }: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    name: client?.name || "",
    email: client?.email || "",
    phone: client?.phone || "",
    address: client?.address || "",
    notes: client?.notes || "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (client) {
        // Actualizar cliente existente
        await updateClient(client.id, formData)
        toast({
          title: "Cliente actualizado",
          description: "El cliente se ha actualizado correctamente",
        })
      } else {
        // Crear nuevo cliente
        await createClient(formData)
        toast({
          title: "Cliente creado",
          description: "El cliente se ha creado correctamente",
        })
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard/clients")
        router.refresh()
      }
    } catch (error: any) {
      // Usar el manejador de errores personalizado si está disponible
      if (onError) {
        onError(error)
      } else {
        toast({
          title: "Error",
          description: error.message || "No se pudo guardar el cliente. Inténtalo de nuevo.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" placeholder="Nombre del cliente" value={formData.name} onChange={handleChange} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          placeholder="correo@ejemplo.com"
          value={formData.email}
          onChange={handleChange}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" placeholder="Número de teléfono" value={formData.phone} onChange={handleChange} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" placeholder="Dirección" value={formData.address} onChange={handleChange} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          placeholder="Notas adicionales"
          className="min-h-[100px]"
          value={formData.notes}
          onChange={handleChange}
        />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {client ? "Actualizando..." : "Creando..."}
            </>
          ) : client ? (
            "Actualizar cliente"
          ) : (
            "Crear cliente"
          )}
        </Button>
      </div>
    </form>
  )
}
