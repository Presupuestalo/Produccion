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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import type { BudgetSettings, BudgetSettingsFormData } from "@/lib/types/budget-settings"

interface BudgetSettingsDialogProps {
  projectId: string
  budgetId?: string // añadido budgetId para poder editar el nombre del presupuesto
  onSettingsSaved?: () => void
}

export function BudgetSettingsDialog({ projectId, budgetId, onSettingsSaved }: BudgetSettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<BudgetSettings | null>(null)
  const [budgetName, setBudgetName] = useState<string>("")
  const [formData, setFormData] = useState<BudgetSettingsFormData>({
    introduction_text: "",
    additional_notes: "",
    show_vat: false,
    vat_percentage: 21,
  })
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadSettings()
    }
  }, [open, projectId])

  const loadSettings = async () => {
    try {
      setLoading(true)

      const supabase = await createClient()
      if (!supabase) {
        console.error("[BudgetSettingsDialog] No se pudo obtener el cliente de Supabase")
        return
      }

      console.log("[v0] Loading budget settings for project:", projectId, "budget:", budgetId)

      if (budgetId) {
        const { data: budgetData, error: budgetError } = await supabase
          .from("budgets")
          .select("name")
          .eq("id", budgetId)
          .single()

        if (budgetError) {
          console.error("[v0] Error loading budget name:", budgetError)
        } else {
          setBudgetName(budgetData.name || "")
          console.log("[v0] Loaded budget name:", budgetData.name)
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error("[BudgetSettingsDialog] No hay usuario autenticado")
        return
      }

      console.log("[v0] Current user ID:", user.id)

      const { data: budgetSettings, error: budgetError } = await supabase
        .from("budget_settings")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .maybeSingle()

      let companyDefaults = {
        presentation: "",
        notes: "",
        showVat: false,
        vatPercentage: 21,
      }

      if (user) {
        const { data: userSettings, error: userError } = await supabase
          .from("user_company_settings")
          .select("default_presentation_text, default_clarification_notes, show_vat, vat_percentage")
          .eq("user_id", user.id)
          .maybeSingle()

        if (userError && userError.code !== "PGRST116") {
          console.error("[v0] Error loading company settings:", userError)
        }

        if (userSettings) {
          companyDefaults = {
            presentation: userSettings.default_presentation_text || "",
            notes: userSettings.default_clarification_notes || "",
            showVat: userSettings.show_vat ?? false,
            vatPercentage: userSettings.vat_percentage ?? 21,
          }
          console.log("[v0] Loaded company defaults:", companyDefaults)
        }
      }

      if (budgetSettings) {
        console.log("[v0] Loading existing budget settings")
        setSettings(budgetSettings)
        setFormData({
          introduction_text: budgetSettings.introduction_text || companyDefaults.presentation,
          additional_notes: budgetSettings.additional_notes || companyDefaults.notes,
          show_vat: budgetSettings.show_vat ?? companyDefaults.showVat,
          vat_percentage: budgetSettings.vat_percentage ?? companyDefaults.vatPercentage,
        })
      } else {
        console.log("[v0] No budget settings found, using company defaults")
        setFormData({
          introduction_text: companyDefaults.presentation,
          additional_notes: companyDefaults.notes,
          show_vat: companyDefaults.showVat,
          vat_percentage: companyDefaults.vatPercentage,
        })
      }
    } catch (error) {
      console.error("[v0] Error loading budget settings:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la configuración del presupuesto",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      const supabase = await createClient()
      if (!supabase) return

      console.log("[v0] Saving budget settings...")

      if (budgetId && budgetName) {
        console.log("[v0] Updating budget name to:", budgetName)
        const { error: budgetUpdateError } = await supabase
          .from("budgets")
          .update({ name: budgetName })
          .eq("id", budgetId)

        if (budgetUpdateError) {
          console.error("[v0] Error updating budget name:", budgetUpdateError)
          throw budgetUpdateError
        }
        console.log("[v0] Budget name updated successfully")
      }

      if (settings) {
        console.log("[v0] Updating existing budget settings")
        const { error } = await supabase
          .from("budget_settings")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", settings.id)

        if (error) {
          console.error("[v0] Error updating budget settings:", error)
          console.error("[v0] Error details:", JSON.stringify(error, null, 2))
          console.error("[v0] Form data sent:", formData)
          throw error
        }
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error("No hay usuario autenticado")
        }

        console.log("[v0] Creating new budget settings for user:", user.id)
        const { error } = await supabase.from("budget_settings").insert({
          project_id: projectId,
          user_id: user.id,
          status: "draft",
          ...formData,
        })

        if (error) {
          console.error("[v0] Error creating budget settings:", error)
          console.error("[v0] Error details:", JSON.stringify(error, null, 2))
          console.error("[v0] Data sent:", { project_id: projectId, user_id: user.id, status: "draft", ...formData })
          throw error
        }
      }

      console.log("[v0] Budget settings saved successfully")
      toast({
        title: "Configuración guardada",
        description: "La configuración del presupuesto se ha guardado correctamente",
      })
      setOpen(false)
      onSettingsSaved?.()
    } catch (error) {
      console.error("[v0] Error saving budget settings:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Configurar Presupuesto</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuración del Presupuesto</DialogTitle>
          <DialogDescription>
            Personaliza la presentación y notas del presupuesto. Estos textos se copian de tu configuración general de
            empresa, pero puedes modificarlos específicamente para este presupuesto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {budgetId && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Nombre del Presupuesto</h3>
              <p className="text-sm text-muted-foreground">
                Personaliza el nombre de este presupuesto para identificarlo fácilmente
              </p>
              <Input
                value={budgetName}
                onChange={(e) => setBudgetName(e.target.value)}
                placeholder="Ej: Presupuesto Reforma Integral"
                className="text-base"
              />
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Texto de Presentación</h3>
            <p className="text-sm text-muted-foreground">
              Este texto aparecerá al inicio del presupuesto, antes de las partidas
            </p>
            <Textarea
              value={formData.introduction_text}
              onChange={(e) => setFormData({ ...formData, introduction_text: e.target.value })}
              placeholder="Ej: Nos permitimos hacerle entrega del presupuesto solicitado..."
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notas Aclaratorias</h3>
            <p className="text-sm text-muted-foreground">Estas notas aparecerán al final del presupuesto</p>
            <Textarea
              value={formData.additional_notes}
              onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
              placeholder="Ej: **Consideraciones Adicionales:**..."
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Puedes usar **texto** para negrita y formato Markdown básico
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configuración de IVA</h3>
            <p className="text-sm text-muted-foreground">
              Configura si deseas mostrar el IVA en el presupuesto y el porcentaje a aplicar
            </p>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="show_vat"
                checked={formData.show_vat}
                onCheckedChange={(checked) => setFormData({ ...formData, show_vat: checked as boolean })}
              />
              <Label htmlFor="show_vat" className="cursor-pointer">
                Mostrar IVA en el presupuesto
              </Label>
            </div>

            {formData.show_vat && (
              <div className="ml-6">
                <Label htmlFor="vat_percentage">Porcentaje de IVA (%)</Label>
                <Input
                  id="vat_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.vat_percentage}
                  onChange={(e) => setFormData({ ...formData, vat_percentage: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="21"
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Por defecto: 21%. Puedes modificarlo según tus necesidades.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
