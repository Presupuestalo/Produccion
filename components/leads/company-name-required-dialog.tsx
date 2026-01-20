"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { createBrowserClient } from "@supabase/ssr"

interface CompanyNameRequiredDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (companyName: string) => void
}

export function CompanyNameRequiredDialog({ open, onOpenChange, onSuccess }: CompanyNameRequiredDialogProps) {
  const [companyName, setCompanyName] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast.error("El nombre de empresa es obligatorio")
      return
    }

    setSaving(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      const { error } = await supabase.from("profiles").update({ company_name: companyName.trim() }).eq("id", user.id)

      if (error) throw error

      toast.success("Nombre de empresa guardado")
      onSuccess(companyName.trim())
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving company name:", error)
      toast.error("Error al guardar el nombre de empresa")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Nombre de Empresa Requerido
          </DialogTitle>
          <DialogDescription>
            Para acceder a leads y enviar propuestas, necesitas configurar el nombre de tu empresa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Información importante</p>
              <p className="text-xs text-muted-foreground mt-1">
                Este nombre aparecerá en tus propuestas y será visible para los propietarios.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-name">Nombre de la Empresa *</Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ej: Reformas García S.L."
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !companyName.trim()}>
            {saving ? "Guardando..." : "Guardar y Continuar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
