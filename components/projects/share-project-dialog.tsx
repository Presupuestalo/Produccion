"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Share2, Loader2, Copy, Check } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface ShareProjectDialogProps {
  projectId: string
  projectTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareProjectDialog({ projectId, projectTitle, open, onOpenChange }: ShareProjectDialogProps) {
  const [emails, setEmails] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleShare = async () => {
    if (!emails.trim()) {
      toast({
        title: "Error",
        description: "Introduce al menos un email",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const emailList = emails.split(",").map((e) => e.trim())
      const { data: session } = await supabase.auth.getSession()

      if (!session.session) throw new Error("No hay sesión activa")

      // Crear registros de compartir para cada email
      const sharePromises = emailList.map((email) =>
        supabase.from("shared_projects").insert({
          project_id: projectId,
          shared_by: session.session!.user.id,
          shared_with_email: email,
          shared_with_company: companyName || null,
          access_level: "view",
          status: "pending",
        }),
      )

      await Promise.all(sharePromises)

      // Generar link de compartir (usando el primer token generado)
      const { data: shareData } = await supabase
        .from("shared_projects")
        .select("share_token")
        .eq("project_id", projectId)
        .eq("shared_by", session.session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (shareData) {
        const link = `${window.location.origin}/proyecto-compartido/${shareData.share_token}`
        setShareLink(link)
      }

      toast({
        title: "Proyecto compartido",
        description: `Se ha enviado la solicitud a ${emailList.length} empresa(s)`,
      })

      // Aquí podrías enviar emails de notificación
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo compartir el proyecto",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Copiado",
      description: "Link copiado al portapapeles",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enviar proyecto a empresas de reforma</DialogTitle>
          <DialogDescription>
            Comparte "{projectTitle}" con empresas para recibir presupuestos rápidamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="emails">Emails de empresas *</Label>
            <Input
              id="emails"
              placeholder="empresa1@ejemplo.com, empresa2@ejemplo.com"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Separa múltiples emails con comas</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Nombre de la empresa (opcional)</Label>
            <Input
              id="company"
              placeholder="Reformas XYZ"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensaje adicional (opcional)</Label>
            <Textarea
              id="message"
              placeholder="Información adicional sobre el proyecto..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {shareLink && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
              <Label>Link de compartir generado</Label>
              <div className="flex gap-2">
                <Input value={shareLink} readOnly className="bg-white" />
                <Button variant="outline" size="icon" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                También puedes compartir este link directamente con las empresas
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleShare} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Enviar solicitud
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
