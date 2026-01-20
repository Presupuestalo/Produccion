"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { AppointmentForm } from "./appointment-form"
import { AppointmentsList } from "./appointments-list"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save, Building2, Mail, Phone, ArrowRight } from "lucide-react"

interface AppointmentsManagerProps {
  userId: string
}

export function AppointmentsManager({ userId }: AppointmentsManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [hasRequiredData, setHasRequiredData] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [missingData, setMissingData] = useState<string[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [quickData, setQuickData] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    checkRequiredData()
  }, [userId])

  const checkRequiredData = async () => {
    try {
      const missing: string[] = []

      const { data: company } = await supabase
        .from("user_company_settings")
        .select("company_name, company_email, company_phone")
        .eq("user_id", userId)
        .maybeSingle()

      if (!company?.company_name) missing.push("nombre de empresa")
      if (!company?.company_email) missing.push("email de empresa")
      if (!company?.company_phone) missing.push("teléfono de empresa")

      setQuickData({
        name: company?.company_name || "",
        email: company?.company_email || "",
        phone: company?.company_phone || "",
      })

      setMissingData(missing)
      setHasRequiredData(missing.length === 0)
    } catch (error) {
      console.error("[v0] Error checking required data:", error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleAppointmentCreated = () => {
    setShowForm(false)
    setRefreshKey((prev) => prev + 1)
  }

  if (isChecking) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  const handleQuickSave = async () => {
    if (!quickData.name || !quickData.email || !quickData.phone) {
      toast({
        title: "Campos incompletos",
        description: "Por favor, rellena todos los campos requeridos.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase.from("user_company_settings").upsert(
        {
          user_id: userId,
          company_name: quickData.name,
          company_email: quickData.email,
          company_phone: quickData.phone,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )

      if (error) throw error

      toast({
        title: "Datos actualizados",
        description: "Ya puedes gestionar tus citas.",
      })

      checkRequiredData()
    } catch (error) {
      console.error("[v0] Error quick saving company data:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los datos.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!hasRequiredData) {
    return (
      <Card className="border-amber-200 bg-amber-50/30 overflow-hidden">
        <div className="bg-amber-500 h-1 w-full" />
        <CardContent className="p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="inline-flex p-3 rounded-2xl bg-amber-100 text-amber-700">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 italic uppercase">Configuración Necesaria</h3>
                <p className="text-slate-600 leading-relaxed">
                  Para poder gestionar citas y enviar invitaciones profesionales, necesitamos completar la información básica de tu empresa.
                </p>
              </div>

              <Alert className="bg-white/50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm font-medium">
                  Estos datos aparecerán en los correos que reciban tus clientes.
                </AlertDescription>
              </Alert>

              <Button asChild variant="link" className="p-0 h-auto text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-2 group">
                <Link href="/dashboard/empresa">
                  Ir a configuración completa de empresa
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            <Card className="shadow-xl shadow-amber-900/5 border-amber-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Datos rápidos</CardTitle>
                <CardDescription>Rellena esto para empezar ahora mismo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quick-name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Nombre de Empresa</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="quick-name"
                      placeholder="Ej: Reformas Vanguardia"
                      className="pl-9 bg-slate-50/50"
                      value={quickData.name}
                      onChange={(e) => setQuickData({ ...quickData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Profesional</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="quick-email"
                      type="email"
                      placeholder="info@reformas.com"
                      className="pl-9 bg-slate-50/50"
                      value={quickData.email}
                      onChange={(e) => setQuickData({ ...quickData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-phone" className="text-xs font-bold uppercase tracking-wider text-slate-500">Teléfono móvil</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="quick-phone"
                      placeholder="+34 600 000 000"
                      className="pl-9 bg-slate-50/50"
                      value={quickData.phone}
                      onChange={(e) => setQuickData({ ...quickData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 shadow-lg shadow-amber-600/20"
                  onClick={handleQuickSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      GUARDAR Y COMENZAR
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {!showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mis Citas</CardTitle>
                <CardDescription>Gestiona tus citas con clientes y recibe recordatorios</CardDescription>
              </div>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Cita
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AppointmentsList userId={userId} refreshKey={refreshKey} />
          </CardContent>
        </Card>
      )}

      {showForm && (
        <AppointmentForm userId={userId} onCancel={() => setShowForm(false)} onSuccess={handleAppointmentCreated} />
      )}
    </div>
  )
}
