"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSubscriptionLimits } from "@/lib/services/subscription-limits-service"
import { AIPriceImportDialog } from "@/components/precios/ai-price-import-dialog"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Lock, AlertTriangle } from "lucide-react"

interface AppointmentFormProps {
  userId: string
  onCancel: () => void
  onSuccess: () => void
}

const APPOINTMENT_NAME_PRESETS = [
  "Visita para presupuesto",
  "Entrega de presupuesto",
  "Firma de contrato",
  "Revisión de obra",
  "Reunión inicial",
  "Seguimiento de proyecto",
]

export function AppointmentForm({ userId, onCancel, onSuccess }: AppointmentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    project_id: "",
    appointment_date: "",
    appointment_time: "",
    address: "",
    guest_email: "",
    reminder_enabled: false,
    reminder_days_before: "1",
  })
  const [hasNotificationAccess, setHasNotificationAccess] = useState(true)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadProjects()
    checkLimits()
  }, [userId])

  const checkLimits = async () => {
    const limits = await getSubscriptionLimits()
    if (limits) {
      setHasNotificationAccess(limits.appointmentNotifications)
    }
  }

  useEffect(() => {
    if (formData.project_id && formData.project_id !== "none") {
      const selectedProject = projects.find((p) => p.id === formData.project_id)
      if (selectedProject?.client_email) {
        setFormData((prev) => ({ ...prev, guest_email: selectedProject.client_email }))
      } else {
        // Limpiar el email si el proyecto no tiene email de cliente
        setFormData((prev) => ({ ...prev, guest_email: "" }))
      }
    } else {
      // Limpiar el email si se selecciona "Sin proyecto"
      setFormData((prev) => ({ ...prev, guest_email: "" }))
    }
  }, [formData.project_id, projects])

  const loadProjects = async () => {
    try {
      console.log("[v0] Loading projects for user:", userId)
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, client, client_email")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading projects:", error)
        throw error
      }
      console.log("[v0] Projects loaded:", data?.length || 0)
      setProjects(data || [])
    } catch (error) {
      console.error("[v0] Error loading projects:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`)

      const appointmentData = {
        user_id: userId,
        name: formData.name,
        description: formData.description || null,
        project_id: formData.project_id && formData.project_id !== "none" ? formData.project_id : null,
        appointment_date: appointmentDateTime.toISOString(),
        address: formData.address,
        guest_email: formData.guest_email || null,
        reminder_enabled: formData.reminder_enabled,
        reminder_days_before: formData.reminder_enabled ? Number.parseInt(formData.reminder_days_before) : null,
        reminder_minutes_before: formData.reminder_enabled
          ? Number.parseInt(formData.reminder_days_before) * 1440
          : null,
        status: "scheduled",
      }

      console.log("[v0] Creating appointment with data:", appointmentData)

      const { data: appointment, error } = await supabase.from("appointments").insert(appointmentData).select().single()

      if (error) {
        console.error("[v0] Error creating appointment:", error)
        throw error
      }

      console.log("[v0] ✅ Appointment created successfully:", appointment.id)

      if (formData.guest_email && hasNotificationAccess) {
        console.log("[v0] Sending invitation email...")
        try {
          const emailResponse = await fetch("/api/appointments/send-invitation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              appointmentId: appointment.id,
              guestEmail: formData.guest_email,
              appointmentName: formData.name,
              appointmentDate: appointmentDateTime.toISOString(),
              address: formData.address,
              description: formData.description,
            }),
          })

          const emailResult = await emailResponse.json()
          console.log("[v0] Email API response:", emailResult)

          if (!emailResponse.ok) {
            console.error("[v0] ❌ Error sending invitation email:", emailResult)
            toast({
              title: "Cita creada con advertencia",
              description: "La cita se creó pero hubo un problema al enviar el email de invitación",
              variant: "destructive",
            })
          } else {
            console.log("[v0] ✅ Invitation email sent successfully")
            toast({
              title: "Cita creada",
              description: "La cita ha sido creada y se han enviado los emails de confirmación",
            })
          }
        } catch (emailError) {
          console.error("[v0] ❌ Exception sending invitation email:", emailError)
          toast({
            title: "Cita creada con advertencia",
            description: "La cita se creó pero hubo un problema al enviar el email de invitación",
            variant: "destructive",
          })
        }
      } else {
        console.log("[v0] No guest email provided, skipping invitation")
        toast({
          title: "Cita creada",
          description: "La cita ha sido creada exitosamente",
        })
      }

      onSuccess()
    } catch (error: any) {
      console.error("[v0] Error creating appointment:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la cita",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Nueva Cita</CardTitle>
            <CardDescription>Programa una nueva cita con un cliente</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la cita *</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between font-normal bg-transparent"
                >
                  {formData.name || "Selecciona o escribe un nombre..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Buscar o escribir..."
                    value={formData.name}
                    onValueChange={(value) => setFormData({ ...formData, name: value })}
                  />
                  <CommandList>
                    <CommandEmpty>Presiona Enter para usar este nombre</CommandEmpty>
                    <CommandGroup>
                      {APPOINTMENT_NAME_PRESETS.map((preset) => (
                        <CommandItem
                          key={preset}
                          value={preset}
                          onSelect={(value) => {
                            setFormData({ ...formData, name: value })
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn("mr-2 h-4 w-4", formData.name === preset ? "opacity-100" : "opacity-0")}
                          />
                          {preset}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalles adicionales sobre la cita..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_id">Proyecto (opcional)</Label>
            <Select
              value={formData.project_id}
              onValueChange={(value) => setFormData({ ...formData, project_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin proyecto</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title} {project.client && `- ${project.client}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Si seleccionas un proyecto, se usará el email del cliente automáticamente
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointment_date">Fecha *</Label>
              <Input
                id="appointment_date"
                type="date"
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment_time">Hora *</Label>
              <Input
                id="appointment_time"
                type="time"
                value={formData.appointment_time}
                onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección de la cita *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Calle Principal 123, Madrid"
              required
            />
            <p className="text-xs text-muted-foreground">Ubicación donde se realizará la cita</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="guest_email">Email del invitado</Label>
              {!hasNotificationAccess && (
                <Badge variant="outline" className="text-[10px] font-bold border-purple-500/50 text-purple-600 bg-purple-50">PRO</Badge>
              )}
            </div>
            <Input
              id="guest_email"
              type="email"
              value={formData.guest_email}
              onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
              placeholder="cliente@ejemplo.com"
              disabled={!hasNotificationAccess}
            />
            {hasNotificationAccess ? (
              <p className="text-xs text-muted-foreground">Se enviará una invitación automática por email</p>
            ) : (
              <p className="text-[11px] text-amber-600 flex items-start gap-1 font-medium bg-amber-50 p-2 rounded-lg border border-amber-100">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                Las notificaciones por email no están disponibles en el Plan Free.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="reminder_enabled">Recordatorio</Label>
                  {!hasNotificationAccess && <Lock className="h-3 w-3 text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground">Recibir un recordatorio antes de la cita</p>
              </div>
              <Switch
                id="reminder_enabled"
                checked={formData.reminder_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: checked })}
                disabled={!hasNotificationAccess}
              />
            </div>

            {hasNotificationAccess && formData.reminder_enabled && (
              <div className="space-y-2">
                <Label htmlFor="reminder_days_before">Recordar con antelación</Label>
                <Select
                  value={formData.reminder_days_before}
                  onValueChange={(value) => setFormData({ ...formData, reminder_days_before: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 día antes</SelectItem>
                    <SelectItem value="2">2 días antes</SelectItem>
                    <SelectItem value="3">3 días antes</SelectItem>
                    <SelectItem value="7">1 semana antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {!hasNotificationAccess && (
              <div className="mt-2 p-3 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100/50">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">Notificaciones Premium</p>
                    <p className="text-[10px] text-slate-500 leading-tight">Envía confirmaciones y recordatorios por email a tus clientes.</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold px-3 transition-all shadow-sm"
                    onClick={() => setShowUpgradeDialog(true)}
                  >
                    <Sparkles className="h-3 w-3 mr-1.5" />
                    MEJORAR
                  </Button>
                </div>
              </div>
            )}
          </div>

          <AIPriceImportDialog
            open={showUpgradeDialog}
            onOpenChange={setShowUpgradeDialog}
            mode="appointment"
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Cita"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
