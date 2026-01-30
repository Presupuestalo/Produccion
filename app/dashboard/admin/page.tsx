"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ShieldCheck, Users, CreditCard, Crown, AlertTriangle, ArrowRight, Home, Building2, Globe, Heart } from "lucide-react"
import Link from "next/link"

import { format, subDays, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

interface User {
  id: string
  email: string
  full_name: string | null
  user_type: string
  professional_role: string | null
  subscription_plan_id: string | null
  is_admin: boolean
  is_donor: boolean
  country: string | null
  created_at: string
  updated_at: string
  subscription_plans: {
    id: string
    name: string
    display_name: string
  } | null
}

interface DeletedUser {
  id: string
  email: string
  full_name: string | null
  user_type: string
  deleted_at: string
  account_created_at: string
  country?: string | null
}

interface Plan {
  id: string
  name: string
  display_name: string
  price_monthly: number
}

interface ClaimStats {
  total_pending: number
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [claimStats, setClaimStats] = useState<ClaimStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string>("all")

  // Date filter state
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))

  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [usersRes, plansRes, claimsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/plans"),
        fetch("/api/admin/claims?status=pending"),
      ])

      if (!usersRes.ok || !plansRes.ok) {
        throw new Error("Error cargando datos")
      }

      const usersData = await usersRes.json()
      const plansData = await plansRes.json()
      const claimsData = claimsRes.ok ? await claimsRes.json() : { stats: { total_pending: 0 } }

      setUsers(usersData.users || [])
      setDeletedUsers(usersData.deletedUsers || [])
      setPlans(plansData.plans || [])
      setClaimStats(claimsData.stats || { total_pending: 0 })
    } catch (error) {
      console.error("[v0] Error cargando datos de admin:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos. Verifica que tienes permisos de administrador.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateUserPlan = async (userId: string, planId: string) => {
    setUpdatingUserId(userId)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planId }),
      })

      if (!res.ok) {
        throw new Error("Error actualizando plan")
      }

      toast({
        title: "Plan actualizado",
        description: "El plan del usuario se ha actualizado correctamente",
      })

      await loadData()
    } catch (error) {
      console.error("[v0] Error actualizando plan:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el plan del usuario",
        variant: "destructive",
      })
    } finally {
      setUpdatingUserId(null)
    }
  }

  const getPlanBadgeColor = (planName: string) => {
    switch (planName) {
      case "free":
        return "secondary"
      case "profesional_esencial":
        return "default"
      case "pro_ia":
        return "default"
      case "empresa":
        return "default"
      default:
        return "secondary"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
        </div>
        <p className="text-muted-foreground">Gestiona usuarios y sus planes de suscripción</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6 bg-slate-50 p-4 rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="start-date" className="text-sm font-medium text-gray-700">Desde</label>
            <input
              id="start-date"
              type="date"
              className="px-3 py-2 border rounded-md text-sm bg-white"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="end-date" className="text-sm font-medium text-gray-700">Hasta</label>
            <input
              id="end-date"
              type="date"
              className="px-3 py-2 border rounded-md text-sm bg-white"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="w-[180px] bg-white">
            <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Filtrar por país" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los países</SelectItem>
            <SelectItem value="ES">🇪🇸 España</SelectItem>
            <SelectItem value="MX">🇲🇽 México</SelectItem>
            <SelectItem value="US">🇺🇸 Estados Unidos</SelectItem>
            <SelectItem value="AR">🇦🇷 Argentina</SelectItem>
            <SelectItem value="CO">🇨🇴 Colombia</SelectItem>
            <SelectItem value="CL">🇨🇱 Chile</SelectItem>
            <SelectItem value="PE">🇵🇪 Perú</SelectItem>
            <SelectItem value="other">Otros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(() => {
        // Filter by country first
        const countryFilteredUsers = selectedCountry === "all"
          ? users
          : selectedCountry === "other"
            ? users.filter(u => !["ES", "MX", "US", "AR", "CO", "CL", "PE"].includes(u.country || ""))
            : users.filter(u => u.country === selectedCountry)

        const countryFilteredDeletedUsers = selectedCountry === "all"
          ? deletedUsers
          : selectedCountry === "other"
            ? deletedUsers.filter(u => !["ES", "MX", "US", "AR", "CO", "CL", "PE"].includes(u.country || ""))
            : deletedUsers.filter(u => u.country === selectedCountry)

        // Filter by date range
        const start = startOfDay(parseISO(startDate))
        const end = endOfDay(parseISO(endDate))

        const newUsers = countryFilteredUsers.filter(u =>
          isWithinInterval(parseISO(u.created_at), { start, end })
        )

        const recurringUsers = countryFilteredUsers.filter(u => {
          // Basic recurring logic: Updated within the range AND created BEFORE the range start
          const updated = u.updated_at ? parseISO(u.updated_at) : null
          const created = parseISO(u.created_at)

          if (!updated) return false
          return isWithinInterval(updated, { start, end }) && created < start
        })

        const deletedInPeriod = countryFilteredDeletedUsers.filter(u =>
          isWithinInterval(parseISO(u.deleted_at), { start, end })
        )
        // Apply country filter to deleted users if needed, but for now assuming global or country-based if column exists. 
        // Let's refine countryFilteredDeletedUsers to actually filter if property exists
        // (The interface DeletedUser doesn't show country in my definition above, but DB has it. I'll add it to interface)

        return (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Nuevos Usuarios</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">{newUsers.length}</div>
                  <p className="text-xs text-muted-foreground">En el periodo seleccionado</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuarios Recurrentes</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700">{recurringUsers.length}</div>
                  <p className="text-xs text-muted-foreground">Activos en el periodo (registrados antes)</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuarios Eliminados</CardTitle>
                  <Users className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700">{deletedInPeriod.length}</div>
                  <p className="text-xs text-muted-foreground">Bajas en el periodo</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Histórico Bajas</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{countryFilteredDeletedUsers.length}</div>
                  <p className="text-xs text-muted-foreground">Total acumulado</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Usuarios Activos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{countryFilteredUsers.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Propietarios</CardTitle>
                  <Home className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{countryFilteredUsers.filter(u => u.user_type === 'homeowner').length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profesionales</CardTitle>
                  <Building2 className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{countryFilteredUsers.filter(u => u.user_type === 'professional').length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Donantes</CardTitle>
                  <Heart className="h-4 w-4 text-pink-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{countryFilteredUsers.filter(u => u.is_donor).length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuarios de Pago</CardTitle>
                  <CreditCard className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {countryFilteredUsers.filter((u) => u.subscription_plans?.name && u.subscription_plans.name !== "free").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Desglose de Profesionales</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-orange-50/50 border-orange-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-orange-700">Empresas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-900">
                      {countryFilteredUsers.filter(u => u.user_type === 'professional' && u.professional_role === 'Empresa').length}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50/50 border-blue-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700">Coordinadores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">
                      {countryFilteredUsers.filter(u => u.user_type === 'professional' && u.professional_role === 'Coordinador de gremios').length}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50/50 border-purple-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-purple-700">Diseñadores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-900">
                      {countryFilteredUsers.filter(u => u.user_type === 'professional' && u.professional_role === 'Diseñador').length}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-emerald-50/50 border-emerald-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-700">Arquitectos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-900">
                      {countryFilteredUsers.filter(u => u.user_type === 'professional' && u.professional_role === 'Arquitecto').length}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {claimStats && claimStats.total_pending > 0 && (
              <Card className="mb-8 border-yellow-200 bg-yellow-50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    <div>
                      <p className="font-semibold text-yellow-800">{claimStats.total_pending} reclamación(es) pendiente(s)</p>
                      <p className="text-sm text-yellow-700">
                        Profesionales esperando revisión de sus solicitudes de devolución
                      </p>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href="/dashboard/admin/reclamaciones">
                      Gestionar reclamaciones
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Administradores</CardTitle>
                  <Crown className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{countryFilteredUsers.filter((u) => u.is_admin).length}</div>
                </CardContent>
              </Card>

              <Link href="/dashboard/admin/reclamaciones">
                <Card className="hover:border-primary transition-colors cursor-pointer h-full border-yellow-200 bg-yellow-50/30">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reclamaciones</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-700">{claimStats?.total_pending || 0}</div>
                    <p className="text-xs text-muted-foreground">pendientes</p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Usuarios del Sistema</CardTitle>
                <CardDescription>Visualiza y gestiona los planes de suscripción de todos los usuarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {countryFilteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.email}</p>
                          {user.is_admin && (
                            <Badge variant="default" className="gap-1">
                              <Crown className="h-3 w-3" />
                              Admin
                            </Badge>
                          )}
                          {user.is_donor && (
                            <Badge variant="secondary" className="gap-1 bg-pink-100 text-pink-700 border-pink-200">
                              <Heart className="h-3 w-3 fill-pink-500" />
                              Donante
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          {user.full_name && <p className="text-sm text-muted-foreground">{user.full_name}</p>}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize font-medium">{user.user_type === 'professional' ? 'Profesional' : 'Propietario'}</span>
                            {user.professional_role && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600">{user.professional_role}</span>
                              </>
                            )}
                            {user.country && (
                              <>
                                <span>•</span>
                                <span>{user.country === 'ES' ? '🇪🇸' : user.country === 'MX' ? '🇲🇽' : user.country}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>Registrado: {new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={getPlanBadgeColor(user.subscription_plans?.name || "free")}>
                          {user.subscription_plans?.display_name || "Free"}
                        </Badge>

                        <Select
                          value={user.subscription_plan_id || ""}
                          onValueChange={(value) => updateUserPlan(user.id, value)}
                          disabled={updatingUserId === user.id}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Cambiar plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {plans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.display_name}
                                {plan.price_monthly > 0 && (
                                  <span className="text-muted-foreground ml-2">({plan.price_monthly}€/mes)</span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )
      })()}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Cuentas de Prueba</CardTitle>
          <CardDescription>Credenciales de las cuentas de testing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono">
            <p>
              <strong>Free:</strong> test-free@presupuestalo.com
            </p>
            <p>
              <strong>Basic:</strong> test-basic@presupuestalo.com
            </p>
            <p>
              <strong>Pro IA:</strong> test-pro@presupuestalo.com
            </p>
            <p>
              <strong>Empresa:</strong> test-empresa@presupuestalo.com
            </p>
            <p className="mt-4">
              <strong>Password para todas:</strong> Test1234!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
