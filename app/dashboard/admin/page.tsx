"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ShieldCheck, Users, CreditCard, Crown, AlertTriangle, ArrowRight } from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  email: string
  full_name: string | null
  user_type: string
  subscription_plan_id: string | null
  is_admin: boolean
  created_at: string
  subscription_plans: {
    id: string
    name: string
    display_name: string
  } | null
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
  const [plans, setPlans] = useState<Plan[]>([])
  const [claimStats, setClaimStats] = useState<ClaimStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
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
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios de Pago</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.subscription_plans?.name !== "free").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.is_admin).length}</div>
          </CardContent>
        </Card>

        <Link href="/dashboard/admin/reclamaciones">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reclamaciones</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{claimStats?.total_pending || 0}</div>
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
            {users.map((user) => (
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
                  </div>
                  {user.full_name && <p className="text-sm text-muted-foreground">{user.full_name}</p>}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{user.user_type}</span>
                    <span>•</span>
                    <span>Registrado: {new Date(user.created_at).toLocaleDateString()}</span>
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
