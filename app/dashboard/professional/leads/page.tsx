"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, MapPin, Euro, Calendar, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

interface LeadRequest {
  id: string
  estimated_budget: number
  postal_code: string
  city: string
  province: string
  project_description: string
  created_at: string
  expires_at: string
  companies_accessed_count: number
  max_companies: number
  budget_snapshot: any
}

export default function ProfessionalLeadsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [leads, setLeads] = useState<LeadRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAvailableLeads()
  }, [])

  const loadAvailableLeads = async () => {
    try {
      setIsLoading(true)
      console.log("[v0] Loading available leads...")

      const supabase = await createClient()

      if (!supabase) {
        console.error("[v0] Failed to create Supabase client")
        setIsLoading(false)
        return
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        console.log("[v0] No authenticated user")
        setIsLoading(false)
        return
      }

      console.log("[v0] Authenticated user ID:", authUser.id)

      const { data, error } = await supabase
        .from("lead_requests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading leads:", error)
        setIsLoading(false)
        return
      }

      console.log("[v0] Loaded leads:", data?.length || 0)
      console.log("[v0] Leads data:", JSON.stringify(data, null, 2))
      setLeads(data || [])
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptLead = async (leadId: string) => {
    console.log("[v0] Navigating to lead:", leadId)
    router.push(`/dashboard/professional/leads/${leadId}`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Solicitudes de Presupuesto</h1>
          <p className="text-muted-foreground mt-2">Solicitudes de presupuesto disponibles en todas las provincias</p>
        </div>
      </div>

      {leads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay solicitudes disponibles</h3>
            <p className="text-muted-foreground">Te notificaremos cuando haya nuevos proyectos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {leads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">Reforma Integral</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {lead.city}, {lead.province} - CP: {lead.postal_code}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {lead.companies_accessed_count} / {lead.max_companies} empresas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 px-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Euro className="h-5 w-5 text-primary" />
                    <span className="font-medium">Presupuesto estimado:</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {lead.estimated_budget.toLocaleString("es-ES")}€
                  </span>
                </div>

                {lead.project_description && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Descripción:</h4>
                    <p className="text-sm text-muted-foreground">{lead.project_description}</p>
                  </div>
                )}

                {lead.budget_snapshot && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Detalles del presupuesto:</h4>
                    <p className="text-sm text-muted-foreground">
                      {lead.budget_snapshot.line_items?.length || 0} partidas incluidas
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Publicado hace {Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60))}{" "}
                  horas
                </div>

                <Button
                  onClick={() => handleAcceptLead(lead.id)}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  size="lg"
                >
                  Ver Presupuesto Completo y Aceptar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
