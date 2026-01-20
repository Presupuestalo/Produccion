"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Phone,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Mail,
  Loader2,
  HandshakeIcon,
  Trophy,
  XCircle,
  Clock,
} from "lucide-react"

interface LeadContactManagerProps {
  leadInteractionId: string
  leadRequestId: string
  leadTitle: string
  leadCity: string
  creditsSpent: number
  currentStatus?: string
  purchaseDate: string
  onStatusChange?: () => void
}

const CLAIM_REASONS = [
  { value: "phone_off", label: "Teléfono apagado/fuera de servicio" },
  { value: "no_answer", label: "No contesta tras múltiples intentos" },
  { value: "wrong_number", label: "Número incorrecto/no existe" },
  { value: "email_bounced", label: "Email rebotado" },
  { value: "already_hired", label: "El propietario ya contrató a otro" },
  { value: "fake_data", label: "Datos falsos/spam" },
  { value: "other", label: "Otro motivo" },
]

export function LeadContactManager({
  leadInteractionId,
  leadRequestId,
  leadTitle,
  leadCity,
  creditsSpent,
  currentStatus,
  purchaseDate,
  onStatusChange,
}: LeadContactManagerProps) {
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showClaimDialog, setShowClaimDialog] = useState(false)
  const [showClaimStep2, setShowClaimStep2] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Estado del formulario de reclamación
  const [claimData, setClaimData] = useState({
    reason: "",
    reasonDetails: "",
    callAttempts: 3,
    callDates: "",
    whatsappSent: false,
    smsSent: false,
    emailSent: false,
    confirmed: false,
  })

  // Calcular días desde la compra
  const daysSincePurchase = Math.floor(
    (new Date().getTime() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24),
  )
  const hoursSincePurchase = (new Date().getTime() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60)
  const canClaim = hoursSincePurchase >= 48 && daysSincePurchase <= 7
  const daysLeftToClaim = Math.max(0, 7 - daysSincePurchase)

  const handleMarkContacted = async (outcome: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/leads/contact-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadInteractionId,
          status: outcome,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al actualizar el estado")
      }

      toast({
        title: "Estado actualizado",
        description:
          outcome === "contacted" ? "Has confirmado el contacto con el cliente" : `Estado actualizado a: ${outcome}`,
      })

      setShowContactDialog(false)
      onStatusChange?.()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitClaim = async () => {
    if (!claimData.confirmed) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes confirmar que has realizado los intentos indicados",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/leads/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadInteractionId,
          leadRequestId,
          leadTitle,
          leadCity,
          reason: claimData.reason,
          reasonDetails: claimData.reasonDetails,
          callAttempts: claimData.callAttempts,
          callDates: claimData.callDates.split(",").map((d) => d.trim()),
          whatsappSent: claimData.whatsappSent,
          smsSent: claimData.smsSent,
          emailSent: claimData.emailSent,
          creditsSpent,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al enviar la reclamación")
      }

      toast({
        title: "Reclamación enviada",
        description: "Nuestro equipo revisará tu solicitud en 24-48 horas",
      })

      setShowClaimDialog(false)
      setShowClaimStep2(false)
      onStatusChange?.()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // Si ya hay una reclamación o resultado, mostrar el estado
  if (currentStatus === "claim_requested") {
    return (
      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
        <Clock className="h-3 w-3 mr-1" />
        Reclamación pendiente
      </Badge>
    )
  }

  if (currentStatus === "won") {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        <Trophy className="h-3 w-3 mr-1" />
        Trabajo conseguido
      </Badge>
    )
  }

  if (currentStatus === "lost") {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-600">
        <XCircle className="h-3 w-3 mr-1" />
        No seleccionado
      </Badge>
    )
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {currentStatus === "contacted" || currentStatus === "negotiating" ? (
          <>
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              {currentStatus === "negotiating" ? "En negociación" : "Contactado"}
            </Badge>
            <Button size="sm" variant="outline" onClick={() => setShowContactDialog(true)}>
              Actualizar estado
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setShowContactDialog(true)}>
              <Phone className="h-4 w-4 mr-1" />
              Marcar como contactado
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-orange-600 border-orange-300 hover:bg-orange-50 bg-transparent"
              onClick={() => setShowClaimDialog(true)}
              disabled={!canClaim}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              No puedo contactar
            </Button>
          </>
        )}
      </div>

      {!canClaim && hoursSincePurchase < 48 && (
        <p className="text-xs text-muted-foreground mt-1">
          Podrás solicitar devolución en {Math.ceil(48 - hoursSincePurchase)}h
        </p>
      )}

      {daysLeftToClaim > 0 && daysLeftToClaim <= 3 && canClaim && (
        <p className="text-xs text-orange-600 mt-1">Te quedan {daysLeftToClaim} días para reclamar</p>
      )}

      {/* Dialog de actualizar estado de contacto */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentStatus === "contacted" || currentStatus === "negotiating"
                ? "Actualizar estado"
                : "Confirmar contacto"}
            </DialogTitle>
            <DialogDescription>
              {currentStatus === "contacted" || currentStatus === "negotiating"
                ? "¿Cómo va la negociación con el cliente?"
                : "Confirma que has contactado con el cliente"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            {!(currentStatus === "contacted" || currentStatus === "negotiating") && (
              <Button
                className="justify-start bg-green-600 hover:bg-green-700"
                onClick={() => handleMarkContacted("contacted")}
                disabled={loading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                He contactado con el cliente
              </Button>
            )}
            <Button
              variant="outline"
              className="justify-start bg-transparent"
              onClick={() => handleMarkContacted("negotiating")}
              disabled={loading}
            >
              <HandshakeIcon className="h-4 w-4 mr-2" />
              En negociación
            </Button>
            <Button
              className="justify-start bg-green-100 text-green-700 hover:bg-green-200"
              onClick={() => handleMarkContacted("won")}
              disabled={loading}
            >
              <Trophy className="h-4 w-4 mr-2" />
              He ganado el trabajo
            </Button>
            <Button
              variant="outline"
              className="justify-start text-gray-600 bg-transparent"
              onClick={() => handleMarkContacted("lost")}
              disabled={loading}
            >
              <XCircle className="h-4 w-4 mr-2" />
              No me eligieron
            </Button>
          </div>

          {loading && (
            <div className="flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de reclamación - Paso 1 */}
      <Dialog open={showClaimDialog && !showClaimStep2} onOpenChange={setShowClaimDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Solicitar devolución de créditos
            </DialogTitle>
            <DialogDescription>Para solicitar la devolución necesitas cumplir estos requisitos</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium mb-3">Requisitos para reclamar:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 text-orange-600" />
                  Haber llamado al menos 3 veces en días diferentes
                </li>
                <li className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 mt-0.5 text-orange-600" />
                  Haber enviado al menos 1 WhatsApp o SMS
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 text-orange-600" />
                  Haber enviado 1 email (si disponible)
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-yellow-800">Importante:</p>
              <ul className="mt-2 space-y-1 text-yellow-700">
                <li>
                  Se devolverá el <strong>75%</strong> de los créditos gastados ({Math.floor(creditsSpent * 0.75)} de{" "}
                  {creditsSpent})
                </li>
                <li>Las reclamaciones frecuentes pueden afectar tu cuenta</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClaimDialog(false)}>
              Cancelar
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setShowClaimStep2(true)}>
              Continuar con la reclamación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de reclamación - Paso 2 */}
      <Dialog
        open={showClaimStep2}
        onOpenChange={(open) => {
          setShowClaimStep2(open)
          if (!open) setShowClaimDialog(false)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de la reclamación</DialogTitle>
            <DialogDescription>Proporciona información sobre tus intentos de contacto</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Motivo de la reclamación *</Label>
              <Select value={claimData.reason} onValueChange={(v) => setClaimData((prev) => ({ ...prev, reason: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un motivo" />
                </SelectTrigger>
                <SelectContent>
                  {CLAIM_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Llamadas realizadas *</Label>
                <Input
                  type="number"
                  min={1}
                  value={claimData.callAttempts}
                  onChange={(e) =>
                    setClaimData((prev) => ({
                      ...prev,
                      callAttempts: Number.parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Fechas de las llamadas</Label>
                <Input
                  placeholder="ej: 1/12, 2/12, 3/12"
                  value={claimData.callDates}
                  onChange={(e) => setClaimData((prev) => ({ ...prev, callDates: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Otros intentos de contacto</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="whatsapp"
                  checked={claimData.whatsappSent}
                  onCheckedChange={(c) => setClaimData((prev) => ({ ...prev, whatsappSent: !!c }))}
                />
                <label htmlFor="whatsapp" className="text-sm">
                  Envié WhatsApp
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms"
                  checked={claimData.smsSent}
                  onCheckedChange={(c) => setClaimData((prev) => ({ ...prev, smsSent: !!c }))}
                />
                <label htmlFor="sms" className="text-sm">
                  Envié SMS
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email"
                  checked={claimData.emailSent}
                  onCheckedChange={(c) => setClaimData((prev) => ({ ...prev, emailSent: !!c }))}
                />
                <label htmlFor="email" className="text-sm">
                  Envié email
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Comentarios adicionales</Label>
              <Textarea
                placeholder="Describe brevemente qué ha pasado..."
                value={claimData.reasonDetails}
                onChange={(e) => setClaimData((prev) => ({ ...prev, reasonDetails: e.target.value }))}
              />
            </div>

            <div className="flex items-start space-x-2 bg-gray-50 p-3 rounded-lg">
              <Checkbox
                id="confirm"
                checked={claimData.confirmed}
                onCheckedChange={(c) => setClaimData((prev) => ({ ...prev, confirmed: !!c }))}
              />
              <label htmlFor="confirm" className="text-sm">
                Confirmo que he realizado los intentos de contacto indicados y que la información proporcionada es veraz
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClaimStep2(false)}>
              Volver
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleSubmitClaim}
              disabled={loading || !claimData.reason || !claimData.confirmed}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar reclamación"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
