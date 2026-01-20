"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ClientForm } from "./client-form"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export function CreateClientButton() {
  const [open, setOpen] = useState(false)
  const [isCreatingTable, setIsCreatingTable] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSuccess = () => {
    setOpen(false)
    router.refresh()
  }

  const handleError = (error: any) => {
    // Si el error es de tipo NetworkError, mostrar un mensaje más amigable
    if (error.message && error.message.includes("NetworkError")) {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con la base de datos. Verifica tu conexión a internet.",
        variant: "destructive",
      })
    } else if (error.message && error.message.includes("does not exist")) {
      // Si el error es porque la tabla no existe, ofrecer crearla
      toast({
        title: "Tabla no encontrada",
        description: "La tabla de clientes no existe. Usa la herramienta de diagnóstico para crearla.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el cliente. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear nuevo cliente</DialogTitle>
          <DialogDescription>Añade un nuevo cliente a tu agenda de contactos.</DialogDescription>
        </DialogHeader>
        <ClientForm onSuccess={handleSuccess} onCancel={() => setOpen(false)} onError={handleError} />
      </DialogContent>
    </Dialog>
  )
}
