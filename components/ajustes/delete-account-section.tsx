"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

export function DeleteAccountSection() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const handleDeleteAccount = async () => {
    if (confirmText !== "ELIMINAR") {
      toast({
        title: "Error",
        description: "Debes escribir ELIMINAR para confirmar",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch("/api/delete-account", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.activeOffersCount || data.pendingProposalsCount) {
          toast({
            title: "No se puede eliminar la cuenta",
            description: data.message,
            variant: "destructive",
            duration: 8000,
          })
        } else {
          throw new Error(data.error || "Error al eliminar la cuenta")
        }
        setIsDeleting(false)
        return
      }

      // Redirigir a la página de despedida
      router.push("/despedida")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la cuenta",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <CardTitle className="text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Zona de Peligro
        </CardTitle>
        <CardDescription>Eliminar tu cuenta es una acción permanente y no se puede deshacer</CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar mi cuenta"
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    Esta acción <strong>no se puede deshacer</strong>. Se eliminarán permanentemente:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Todos tus proyectos y presupuestos</li>
                    <li>Todos tus clientes y citas</li>
                    <li>Todos tus planos y diseños</li>
                    <li>Tu configuración y preferencias</li>
                    <li>Tu suscripción activa</li>
                  </ul>
                  <div className="space-y-2 pt-4">
                    <Label htmlFor="confirm-delete">
                      Escribe <strong>ELIMINAR</strong> para confirmar:
                    </Label>
                    <Input
                      id="confirm-delete"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="ELIMINAR"
                      className="font-mono"
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmText("")}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={confirmText !== "ELIMINAR" || isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Sí, eliminar mi cuenta"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
