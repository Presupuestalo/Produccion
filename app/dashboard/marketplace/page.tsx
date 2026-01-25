"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/format"
import {
  MapPin,
  Euro,
  Clock,
  Users,
  Eye,
  Lock,
  Unlock,
  Settings,
  AlertCircle,
  Calendar,
  Briefcase,
  History,
  Filter,
  Search,
  ShieldCheck,
  CreditCard,
} from "lucide-react"
import { LeadPreferencesDialog } from "@/components/leads/lead-preferences-dialog"
import { AccessLeadDialog } from "@/components/leads/access-lead-dialog"
import { MyLeadsManager } from "@/components/leads/my-leads-manager"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"

interface Lead {
  id: string
  homeowner_id: string
  reform_types: string[]
  city: string
  province: string
  postal_code: string
  estimated_budget: number
  credits_cost: number
  proposals_count?: number
  max_companies: number
  companies_accessed_count: number
  project_description?: string
  created_at: string
  has_accessed?: boolean
  has_viewed?: boolean
  is_admin_view?: boolean
  client_name?: string
  client_email?: string
  client_phone?: string
}

export default function MarketplacePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [credits, setCredits] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [marketplaceNotSetup, setMarketplaceNotSetup] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const checkMarketplaceSetup = async () => {
      try {
        console.log("[v0] Marketplace: Verificando si el marketplace está configurado...")
        const response = await fetch("/api/credits/balance")
        const data = await response.json()

        console.log("[v0] Marketplace: Respuesta de balance:", data)

        if (
          data.needsSetup ||
          (!response.ok &&
            (data.error?.includes("does not exist") ||
              data.error?.includes("relation") ||
              data.error?.includes("no configurado")))
        ) {
          console.log("[v0] Marketplace: Tablas no existen, mostrando mensaje de setup")
          setMarketplaceNotSetup(true)
          setCheckingAccess(false)
          return
        }

        // Si llegamos aquí, el marketplace está configurado
        console.log("[v0] Marketplace: Marketplace configurado correctamente, verificando suscripción...")
        checkSubscription()
      } catch (error: any) {
        console.error("[v0] Marketplace: Error en checkMarketplaceSetup:", error)
        if (error.message?.includes("does not exist") || error.message?.includes("relation")) {
          setMarketplaceNotSetup(true)
          setCheckingAccess(false)
          return
        }
        // Si hay otro error, seguir con la verificación de suscripción
        checkSubscription()
      }
    }

    checkMarketplaceSetup()
  }, [])

  const checkSubscription = async () => {
    try {
      console.log("[v0] Marketplace: Verificando suscripción...")
      const response = await fetch("/api/subscription/status")
      const data = await response.json()

      console.log("[v0] Marketplace: Datos de suscripción recibidos:", data)

      const planName = data.plan?.name || "free"
      const hasActiveSub = data.status === "active" && planName !== "free"
      const userIsAdmin = data.is_admin || false

      setSubscriptionPlan(planName)
      setIsAdmin(userIsAdmin)

      console.log("[v0] Marketplace: Plan establecido:", planName)
      console.log("[v0] Marketplace: Status:", data.status)
      console.log("[v0] Marketplace: Suscripción activa:", hasActiveSub)
      console.log("[v0] Marketplace: Es admin:", userIsAdmin)

      if (!hasActiveSub && !userIsAdmin) {
        console.log("[v0] Marketplace: Usuario sin plan de pago activo, mostrando bloqueo")
        setCheckingAccess(false)
        return
      }

      console.log("[v0] Marketplace: Usuario tiene acceso, cargando leads...")
      setCheckingAccess(false)
    } catch (error) {
      console.error("[v0] Marketplace: Error checking subscription:", error)
      setCheckingAccess(false)
    }
  }

  useEffect(() => {
    const hasActiveSub = subscriptionPlan !== null && subscriptionPlan !== "free"
    if (!checkingAccess && (hasActiveSub || isAdmin) && !marketplaceNotSetup) {
      loadLeads()
      loadCredits()
    }
  }, [checkingAccess, subscriptionPlan, isAdmin, marketplaceNotSetup])

  const loadLeads = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (cityFilter) params.append("city", cityFilter)
      if (provinceFilter) params.append("province", provinceFilter)
      if (minBudget) params.append("min_budget", minBudget)
      if (maxBudget) params.append("max_budget", maxBudget)
      if (onlyPreferences) params.append("only_preferences", "true")

      const url = `/api/leads/available${params.toString() ? `?${params.toString()}` : ""}`
      console.log("[v0] Loading leads from:", url)

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        if (data.error?.includes("does not exist") || data.error?.includes("relation")) {
          setMarketplaceNotSetup(true)
          return
        }
        throw new Error(data.error)
      }

      setLeads(data.leads || [])
      setIsAdmin(data.is_admin || false)

      console.log("[v0] Loaded leads:", data.leads?.length, "Is admin:", data.is_admin)
    } catch (error: any) {
      console.error("[v0] Error loading leads:", error)
      if (error.message?.includes("does not exist") || error.message?.includes("relation")) {
        setMarketplaceNotSetup(true)
        return
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudieron cargar los leads",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCredits = async () => {
    try {
      const response = await fetch("/api/credits/balance")
      const data = await response.json()

      if (response.ok) {
        setCredits(data.credits_balance || 0)
      } else {
        if (data.error?.includes("does not exist") || data.error?.includes("relation")) {
          setMarketplaceNotSetup(true)
        }
      }
    } catch (error) {
      console.error("[v0] Error loading credits:", error)
    }
  }

  const [showFilters, setShowFilters] = useState(false)
  const [cityFilter, setCityFilter] = useState("")
  const [provinceFilter, setProvinceFilter] = useState("")
  const [minBudget, setMinBudget] = useState("")
  const [maxBudget, setMaxBudget] = useState("")
  const [onlyPreferences, setOnlyPreferences] = useState(false)

  const handleApplyFilters = () => {
    loadLeads()
  }

  const handleClearFilters = () => {
    setCityFilter("")
    setProvinceFilter("")
    setMinBudget("")
    setMaxBudget("")
    setOnlyPreferences(false)
    setTimeout(loadLeads, 100)
  }

  const handleLeadAccessed = () => {
    loadLeads()
    loadCredits()
    setSelectedLead(null)
  }

  const handleSetupMarketplace = async () => {
    try {
      toast({
        title: "Ejecutando setup...",
        description: "Creando tablas del marketplace, por favor espera",
      })

      const response = await fetch("/api/setup-marketplace", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Error al ejecutar el setup")
      }

      const data = await response.json()

      toast({
        title: "Setup completado",
        description: "Las tablas del marketplace se han creado correctamente. Recargando...",
      })

      // Recargar la página después de 2 segundos
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error("[v0] Error ejecutando setup:", error)
      toast({
        title: "Error",
        description: "No se pudo completar el setup del marketplace. Intenta ejecutarlo manualmente.",
        variant: "destructive",
      })
    }
  }

  console.log(
    "[v0] Marketplace: Renderizando - checkingAccess:",
    checkingAccess,
    "subscriptionPlan:",
    subscriptionPlan,
    "isAdmin:",
    isAdmin,
  )

  if (marketplaceNotSetup) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <Card className="max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Presmarket - Configuración Requerida</CardTitle>
            <CardDescription className="text-base">
              El marketplace necesita ser configurado antes de poder usarse
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Las tablas del marketplace no existen en la base de datos. Por favor, ejecuta el script de
                configuración.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 rounded-lg bg-muted p-4">
              <h4 className="font-semibold">Pasos para configurar:</h4>
              <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                <li>Haz clic en el botón "Ejecutar Setup" abajo</li>
                <li>Espera a que se creen todas las tablas necesarias</li>
                <li>La página se recargará automáticamente</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSetupMarketplace} variant="default">
                Ejecutar Setup
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => window.location.reload()}>
                Recargar Página
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (checkingAccess) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const hasActiveSub = subscriptionPlan !== null && subscriptionPlan !== "free"
  if (!hasActiveSub && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <Card className="max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <Lock className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Presmarket - Encuentra Proyectos</CardTitle>
            <CardDescription className="text-base">
              Accede a proyectos de reforma en tu zona y conecta con clientes potenciales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertDescription>
                El acceso al Presmarket requiere un plan <strong>Basic</strong> o superior activo. Actualiza tu
                suscripción para empezar a recibir leads de clientes en tu zona.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 rounded-lg bg-muted p-4">
              <h4 className="font-semibold">Ventajas del Presmarket:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ Accede a solicitudes de reforma verificadas</li>
                <li>✓ Cada reforma se asigna a máximo 3 empresas</li>
                <li>✓ Presupuestos pre-calculados listos para ajustar</li>
                <li>✓ Paga solo por los leads que te interesan</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => router.push("/dashboard/suscripcion")}>
                Ver Planes
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => router.push("/dashboard/projects")}
              >
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  console.log("[v0] Marketplace: Mostrando marketplace completo con", leads.length, "leads")

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Presmarket</h1>
            {isAdmin && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Admin
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Vista de administrador - Puedes ver todos los leads y datos de contacto"
              : "Encuentra proyectos de reforma en tu zona"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2">
                <Euro className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Créditos disponibles</p>
                <p className="text-2xl font-bold">{credits}</p>
              </div>
            </div>
          </Card>
          <LeadPreferencesDialog onSaved={loadLeads}>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </LeadPreferencesDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filtros de Búsqueda</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  placeholder="Madrid, Barcelona..."
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Provincia</Label>
                <Input
                  id="province"
                  placeholder="Madrid, Vizcaya..."
                  value={provinceFilter}
                  onChange={(e) => setProvinceFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-budget">Presupuesto mínimo (€)</Label>
                <Input
                  id="min-budget"
                  type="number"
                  placeholder="10000"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-budget">Presupuesto máximo (€)</Label>
                <Input
                  id="max-budget"
                  type="number"
                  placeholder="50000"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                />
              </div>
            </div>

            {!isAdmin && (
              <div className="flex items-center space-x-2">
                <Switch id="only-preferences" checked={onlyPreferences} onCheckedChange={setOnlyPreferences} />
                <Label htmlFor="only-preferences" className="cursor-pointer">
                  Solo mostrar leads que coincidan con mis preferencias
                </Label>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Todos los Leads ({leads.length})
          </TabsTrigger>
          <TabsTrigger value="my-leads" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Mis Leads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {leads.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-semibold">No hay leads disponibles</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    No hay proyectos nuevos que coincidan con tus filtros. Intenta ajustar los criterios de búsqueda.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {leads.map((lead) => (
                <Card key={lead.id} className={lead.has_accessed ? "border-green-500" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{lead.reform_types.join(", ")}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {lead.city}, {lead.province}
                        </CardDescription>
                      </div>
                      {lead.has_accessed ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Unlock className="h-3 w-3" />
                          Accedido
                        </Badge>
                      ) : lead.has_viewed ? (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Visto
                        </Badge>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Presupuesto estimado</span>
                        <span className="font-semibold">{formatCurrency(lead.estimated_budget)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Coste en créditos</span>
                        <span className="font-bold text-primary">{lead.credits_cost} créditos</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Empresas interesadas
                        </span>
                        <span className={lead.companies_accessed_count >= 3 ? "text-red-600" : ""}>
                          {lead.companies_accessed_count} / {3}
                        </span>
                      </div>
                      {lead.proposals_count !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Propuestas recibidas
                          </span>
                          <span>{lead.proposals_count}</span>
                        </div>
                      )}
                    </div>

                    {lead.project_description && (
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-xs text-muted-foreground line-clamp-3">{lead.project_description}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Publicado {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: es })}
                    </div>

                    {(lead.has_accessed || lead.is_admin_view) && lead.client_name && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="text-sm">
                          <p className="font-semibold">Datos del cliente:</p>
                          <p className="text-muted-foreground">{lead.client_name}</p>
                          {lead.client_email && <p className="text-muted-foreground">{lead.client_email}</p>}
                          {lead.client_phone && <p className="text-muted-foreground">{lead.client_phone}</p>}
                          {lead.is_admin_view && !lead.has_accessed && (
                            <Badge variant="outline" className="mt-2">
                              Vista de Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {!lead.has_accessed && !isAdmin && (
                      <AccessLeadDialog lead={lead} onAccessed={handleLeadAccessed}>
                        <Button className="w-full" disabled={lead.companies_accessed_count >= 3}>
                          {lead.companies_accessed_count >= 3 ? (
                            <>
                              <Lock className="mr-2 h-4 w-4" />
                              Lead Completo
                            </>
                          ) : (
                            <>
                              <Unlock className="mr-2 h-4 w-4" />
                              Acceder ({lead.credits_cost} créditos)
                            </>
                          )}
                        </Button>
                      </AccessLeadDialog>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Cada reforma será asignada a un máximo de 3 empresas.</AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="my-leads">
          <MyLeadsManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
