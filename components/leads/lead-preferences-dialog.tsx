"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Settings } from 'lucide-react'

interface LeadPreferencesDialogProps {
  onSaved: () => void
  children?: React.ReactNode
}

const REFORM_TYPES = [
  { value: "reforma_integral", label: "Reforma Integral" },
  { value: "cocina", label: "Cocina" },
  { value: "bano", label: "Baño" },
  { value: "pintura", label: "Pintura" },
  { value: "electricidad", label: "Electricidad" },
  { value: "fontaneria", label: "Fontanería" },
  { value: "carpinteria", label: "Carpintería" },
  { value: "climatizacion", label: "Climatización" },
]

export function LeadPreferencesDialog({ onSaved, children }: LeadPreferencesDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [preferences, setPreferences] = useState({
    action_radius_km: 50,
    accepted_reform_types: ["reforma_integral"],
    min_budget: 5000,
    max_budget: 100000,
    email_notifications: true,
    sms_notifications: false,
  })

  useEffect(() => {
    if (open) {
      loadPreferences()
    }
  }, [open])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/leads/preferences")
      const data = await response.json()

      if (data.preferences) {
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error("[v0] Error loading preferences:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await fetch("/api/leads/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al guardar preferencias")
      }

      toast({
        title: "Preferencias guardadas",
        description: "Tus preferencias de leads se han actualizado correctamente",
      })

      setOpen(false)
      onSaved()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudieron guardar las preferencias",
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleReformType = (type: string) => {
    setPreferences((prev) => ({
      ...prev,
      accepted_reform_types: prev.accepted_reform_types.includes(type)
        ? prev.accepted_reform_types.filter((t) => t !== type)
        : [...prev.accepted_reform_types, type],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Preferencias
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preferencias de Leads</DialogTitle>
          <DialogDescription>
            Configura qué tipo de proyectos quieres recibir y en qué zona operas
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="radius">Radio de acción (km)</Label>
              <Input
                id="radius"
                type="number"
                value={preferences.action_radius_km}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    action_radius_km: parseInt(e.target.value) || 0,
                  }))
                }
                min="10"
                max="200"
              />
              <p className="text-xs text-muted-foreground">
                Solo verás leads dentro de este radio desde tu ubicación
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tipos de reforma que aceptas</Label>
              <div className="grid grid-cols-2 gap-3">
                {REFORM_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.value}
                      checked={preferences.accepted_reform_types.includes(type.value)}
                      onCheckedChange={() => toggleReformType(type.value)}
                    />
                    <label
                      htmlFor={type.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_budget">Presupuesto mínimo (€)</Label>
                <Input
                  id="min_budget"
                  type="number"
                  value={preferences.min_budget}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      min_budget: parseInt(e.target.value) || 0,
                    }))
                  }
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_budget">Presupuesto máximo (€)</Label>
                <Input
                  id="max_budget"
                  type="number"
                  value={preferences.max_budget}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      max_budget: parseInt(e.target.value) || 0,
                    }))
                  }
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label>Notificaciones</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email_notifications"
                  checked={preferences.email_notifications}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({
                      ...prev,
                      email_notifications: checked as boolean,
                    }))
                  }
                />
                <label htmlFor="email_notifications" className="text-sm">
                  Recibir notificaciones por email cuando hay nuevos leads
                </label>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Preferencias"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
