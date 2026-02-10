"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, MapPin, Euro, Calendar, Phone, Mail, User, FileText } from "lucide-react"
import Link from "next/link"

interface AcquiredLead {
  id: string
  lead_request_id: string
  credits_spent: number
  accessed_at: string
  lead: {
    id: string
    estimated_budget: number
    city: string
    province: string
    project_description: string
    created_at: string
    reform_types: string[]
    client_name: string
    client_email: string
    client_phone: string
  }
}

export default function MisLeadsPage() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<AcquiredLead[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadAcquiredLeads()
    }
  }, [user])

  const loadAcquiredLeads = async () => {
    try {
      setIsLoading(true)
      const supabase = await createClient()
      if (!supabase) {
        setIsLoading(false)
        return
      }

      // Obtener los leads que el profesional ha adquirido (accedido)
      const { data: interactions, error: interactionsError } = await supabase
        .from("lead_interactions")
        .select(`
          id,
          lead_request_id,
          credits_spent,
          created_at,
          lead_requests (
            id,
            estimated_budget,
            city,
            province,
            project_description,
            created_at,
            reform_types,
            client_name,
            client_email,
            client_phone
          )
        `)
        .eq("company_id", user?.id)
        .eq("action", "accessed")
        .order("created_at", { ascending: false })

      if (interactionsError) {
        console.error("[v0] Error loading acquired leads:", interactionsError)
        setIsLoading(false)
        return
      }

      // Mapear los datos
      const acquiredLeads: AcquiredLead[] = (interactions || [])
        .map((interaction: any) => ({
          id: interaction.id,
          lead_request_id: interaction.lead_request_id,
          credits_spent: interaction.credits_spent || 0,
          accessed_at: interaction.created_at,
          lead: interaction.lead_requests,
        }))
        .filter((l: AcquiredLead) => l.lead !== null)

      console.log("[v0] Acquired leads:", acquiredLeads.length)
      setLeads(acquiredLeads)
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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
      <div>
        <h1 className="text-3xl font-bold">Mis Leads Adquiridos</h1>
        <p className="text-muted-foreground mt-2">Contactos de clientes a los que has accedido</p>
      </div>

      {leads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No has adquirido ningún lead</h3>
            <p className="text-muted-foreground mb-4">
              Ve a la sección de Ofertas para ver las solicitudes disponibles
            </p>
            <Link href="/dashboard/solicitudes-disponibles">
              <Button className="bg-primary hover:bg-primary/90">Ver Ofertas Disponibles</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {leads.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">
                      Reforma en {item.lead.city}, {item.lead.province}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Adquirido el {formatDate(item.accessed_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Euro className="h-4 w-4" />
                        {item.credits_spent} créditos
                      </span>
                    </CardDescription>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Lead adquirido</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Información del cliente */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Datos del Cliente
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p className="font-medium">{item.lead.client_name || "No disponible"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <a
                        href={`tel:${item.lead.client_phone}`}
                        className="font-medium flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <Phone className="h-4 w-4 text-green-500" />
                        {item.lead.client_phone || "No disponible"}
                      </a>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a
                        href={`mailto:${item.lead.client_email}`}
                        className="font-medium flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <Mail className="h-4 w-4 text-green-500" />
                        {item.lead.client_email || "No disponible"}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Presupuesto estimado */}
                <div className="flex items-center justify-between py-3 px-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Euro className="h-5 w-5 text-primary" />
                    <span className="font-medium">Presupuesto estimado:</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {item.lead.estimated_budget?.toLocaleString("es-ES")}€
                  </span>
                </div>

                {item.lead.project_description && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Descripción del proyecto:</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {item.lead.project_description}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {item.lead.city}, {item.lead.province}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button asChild variant="outline" className="flex-1 bg-transparent">
                    <a href={`tel:${item.lead.client_phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Llamar
                    </a>
                  </Button>
                  <Button asChild className="flex-1 bg-primary hover:bg-primary/90">
                    <a href={`mailto:${item.lead.client_email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar Email
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
