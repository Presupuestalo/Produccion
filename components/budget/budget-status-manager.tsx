"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation" // Añadiendo import de useRouter
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
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { FileText, Send, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSupabase } from "@/lib/supabase/client"
import { BudgetService } from "@/lib/services/budget-service"
import { isMasterUser } from "@/lib/services/auth-service"

interface BudgetStatusManagerProps {
  budgetId: string
  projectId: string
  currentStatus: "draft" | "delivered" | "accepted" | "rejected"
  onStatusChanged: () => void
}

export function BudgetStatusManager({ budgetId, projectId, currentStatus, onStatusChanged }: BudgetStatusManagerProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [targetStatus, setTargetStatus] = useState<"delivered" | "accepted" | "rejected" | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [userType, setUserType] = useState<string | null>(null)
  const [isMaster, setIsMaster] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const getUserData = async () => {
      const supabase = await getSupabase()
      if (!supabase) return

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", session.user.id).single()
        setUserType(profile?.user_type || null)
      }

      const masterStatus = await isMasterUser()
      setIsMaster(masterStatus)
    }
    getUserData()
  }, [])

  const handleStatusChange = async () => {
    if (!targetStatus) return

    try {
      setIsUpdating(true)

      const supabase = await getSupabase()
      if (!supabase) {
        throw new Error("No se pudo conectar con el servidor")
      }

      console.log("[v0] === INICIANDO CAMBIO DE ESTADO ===")
      console.log("[v0] Budget ID:", budgetId)
      console.log("[v0] Estado objetivo:", targetStatus)

      if (targetStatus === "accepted") {
        const { data: acceptedBudgets, error: checkError } = await supabase
          .from("budgets")
          .select("id")
          .eq("project_id", projectId)
          .eq("status", "approved")

        if (checkError) {
          console.error("[v0] Error checking accepted budgets:", checkError)
          throw checkError
        }

        if (acceptedBudgets && acceptedBudgets.length > 0) {
          console.log("[v0] Ya existe un presupuesto aceptado")
          toast({
            variant: "destructive",
            title: "Error",
            description: "Ya existe un presupuesto aceptado para este proyecto. Solo puede haber uno aceptado.",
          })
          setShowDialog(false)
          setTargetStatus(null)
          setIsUpdating(false)
          return
        }
      }

      const componentToDbStatusMap = {
        delivered: "sent",
        accepted: "approved",
        rejected: "rejected",
      } as const

      const dbStatus = componentToDbStatusMap[targetStatus]

      console.log("[v0] Actualizando estado del presupuesto a:", dbStatus)

      await BudgetService.updateBudgetStatus(budgetId, dbStatus, supabase)

      console.log("[v0] Estado del presupuesto actualizado exitosamente")

      const statusLabels = {
        delivered: "entregado",
        accepted: "aceptado",
        rejected: "rechazado",
      }

      toast({
        title: "Estado actualizado",
        description: `El presupuesto ha sido marcado como ${statusLabels[targetStatus]}`,
      })

      setShowDialog(false)
      setTargetStatus(null)

      if (targetStatus === "accepted") {
        window.dispatchEvent(new CustomEvent("budgetApproved"))
      }

      onStatusChanged()
      router.refresh()
    } catch (err) {
      console.error("[v0] ERROR GENERAL:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado del presupuesto",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const openDialog = (status: "delivered" | "accepted" | "rejected") => {
    setTargetStatus(status)
    setShowDialog(true)
  }

  const getStatusBadge = () => {
    switch (currentStatus) {
      case "draft":
        return (
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3 w-3" />
            Borrador
          </Badge>
        )
      case "delivered":
        return (
          <Badge variant="secondary" className="gap-1">
            <Send className="h-3 w-3" />
            Entregado
          </Badge>
        )
      case "accepted":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Aceptado
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rechazado
          </Badge>
        )
    }
  }

  const getDialogContent = () => {
    if (targetStatus === "delivered") {
      return {
        title: "¿Marcar presupuesto como entregado?",
        description:
          "El presupuesto se marcará como entregado al cliente. Podrás seguir editándolo hasta que sea aceptado o rechazado.",
      }
    }
    if (targetStatus === "rejected") {
      return {
        title: "¿Marcar presupuesto como rechazado?",
        description: "El presupuesto se marcará como rechazado. Esta acción no se puede deshacer.",
        warning: true,
      }
    }
    return {
      title: "¿Marcar presupuesto como aceptado?",
      description:
        "Una vez aceptado, el presupuesto original no podrá ser modificado. Sin embargo, podrás añadir ajustes y partidas adicionales que se contabilizarán por separado.",
      warning: true,
    }
  }

  const dialogContent = getDialogContent()

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {getStatusBadge()}

        {(userType === "professional" || userType === "company") && (
          <>
            {currentStatus === "draft" && isMaster && (
              <Button size="sm" variant="outline" onClick={() => openDialog("delivered")}>
                <Send className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Marcar como Entregado</span>
              </Button>
            )}

            {currentStatus === "delivered" && (
              <>
                <Button size="sm" variant="default" onClick={() => openDialog("accepted")}>
                  <CheckCircle2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Marcar como Aceptado</span>
                </Button>
                <Button size="sm" variant="destructive" onClick={() => openDialog("rejected")}>
                  <XCircle className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Rechazar</span>
                </Button>
              </>
            )}
          </>
        )}
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {dialogContent.warning && <AlertTriangle className="h-5 w-5 text-orange-500" />}
              {dialogContent.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div>{dialogContent.description}</div>
              {dialogContent.warning && targetStatus === "accepted" && (
                <div className="text-orange-600 dark:text-orange-400 font-medium">
                  ⚠️ Esta acción bloqueará la edición del presupuesto original.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange} disabled={isUpdating}>
              {isUpdating ? "Actualizando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
