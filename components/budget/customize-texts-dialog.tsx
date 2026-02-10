"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface CustomizeTextsDialogProps {
  budgetId: string
  projectId: string
  currentIntroduction?: string | null
  currentNotes?: string | null
  onSaved?: () => void
}

export function CustomizeTextsDialog({
  budgetId,
  projectId,
  currentIntroduction,
  currentNotes,
  onSaved,
}: CustomizeTextsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)
  const [defaultTexts, setDefaultTexts] = useState<{
    introduction: string
    notes: string
  }>({ introduction: "", notes: "" })
  const [formData, setFormData] = useState({
    introduction: currentIntroduction || "",
    notes: currentNotes || "",
  })
  const { toast } = useToast()

  useEffect(() => {
    async function initSupabase() {
      const client = await createClient()
      setSupabase(client)
    }
    initSupabase()
  }, [])

  useEffect(() => {
    if (open) {
      loadDefaultTexts()
    }
  }, [open])

  const loadDefaultTexts = async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase
        .from("budget_settings")
        .select("introduction_text, additional_notes")
        .eq("project_id", projectId)
        .single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      if (data) {
        setDefaultTexts({
          introduction: data.introduction_text || "",
          notes: data.additional_notes || "",
        })

        // Si no hay textos personalizados, usar los por defecto
        if (!currentIntroduction && !currentNotes) {
          setFormData({
            introduction: data.introduction_text || "",
            notes: data.additional_notes || "",
          })
        }
      }
    } catch (error) {
      console.error("[v0] Error loading default texts:", error)
    }
  }

  const handleSave = async () => {
    if (!supabase) return
    try {
      setLoading(true)

      const { error } = await supabase
        .from("budgets")
        .update({
          custom_introduction_text: formData.introduction || null,
          custom_additional_notes: formData.notes || null,
        })
        .eq("id", budgetId)

      if (error) throw error

      toast({
        title: "Textos personalizados",
        description: "Los textos se han guardado correctamente",
      })
      setOpen(false)
      onSaved?.()
    } catch (error) {
      console.error("[v0] Error saving custom texts:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron guardar los textos",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUseDefaults = () => {
    setFormData({
      introduction: defaultTexts.introduction,
      notes: defaultTexts.notes,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Personalizar Textos</span>
          <span className="sm:hidden">Textos</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personalizar Textos del Presupuesto</DialogTitle>
          <DialogDescription>
            Personaliza la introducción y notas aclaratorias para este presupuesto específico
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleUseDefaults}>
              Usar textos por defecto
            </Button>
          </div>

          {/* Texto de presentación */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="introduction">Texto de Presentación</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Este texto aparecerá al inicio del presupuesto, antes de las partidas
              </p>
            </div>
            <Textarea
              id="introduction"
              value={formData.introduction}
              onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
              placeholder="Ej: Nos permitimos hacerle entrega del presupuesto solicitado..."
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          {/* Notas aclaratorias */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notas Aclaratorias</Label>
              <p className="text-xs text-muted-foreground mt-1">Estas notas aparecerán al final del presupuesto</p>
            </div>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ej: **Consideraciones Adicionales:**..."
              rows={8}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar Textos"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
